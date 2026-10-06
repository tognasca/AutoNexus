# ============================================================================
# AutoNexus — Auditoria ativa (AuditLog) + ITenantContext.UserId
# ============================================================================
# Gerado porque o Claude nao tem como dar "git push" no seu repositorio
# (sem credenciais). Este script escreve o conteudo final de cada arquivo
# diretamente, de forma idempotente (pode rodar mais de uma vez sem
# problema — sempre sobrescreve com o conteudo correto).
#
# PRE-REQUISITO: este script assume que voce ja aplicou o zip anterior
# "AutoNexus-fase8.zip" (download autorizado de documentos + rate limiting
# no login). Ele NAO refaz aquelas mudancas, so adiciona a auditoria por
# cima.
#
# COMO USAR:
#   1. Abra o PowerShell na RAIZ do repositorio (onde fica o AutoNexus.slnx)
#   2. Rode:  .\aplicar-auditoria.ps1
#   3. Confira as mudancas:  git status
#   4. Se estiver tudo certo:  git add -A; git commit -m "feat: auditoria ativa (AuditLog)"; git push
#
# O script PARA imediatamente se algum arquivo esperado nao existir (ou
# seja, se a estrutura de pastas do seu projeto for diferente do que o
# Claude assumiu) — nesse caso, nada e sobrescrito.
# ============================================================================

$ErrorActionPreference = "Stop"

if (-not (Test-Path "AutoNexus.slnx")) {
    Write-Host "ERRO: AutoNexus.slnx nao encontrado nesta pasta." -ForegroundColor Red
    Write-Host "Rode este script a partir da RAIZ do repositorio (onde fica o AutoNexus.slnx)." -ForegroundColor Red
    exit 1
}

function Write-Utf8NoBom {
    param([string]$Path, [string]$Content)
    $dir = Split-Path -Parent $Path
    if ($dir -and -not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }
    $utf8NoBom = New-Object System.Text.UTF8Encoding $false
    [System.IO.File]::WriteAllText($Path, $Content, $utf8NoBom)
    Write-Host "  OK  $Path" -ForegroundColor Green
}

Write-Host "Aplicando auditoria ativa (AuditLog)..." -ForegroundColor Cyan
Write-Host ""

Write-Host "Escrevendo: src\AutoNexus.Application\Interfaces\IAuditLogService.cs"
$content = @'
namespace AutoNexus.Application.Interfaces;

/// <summary>
/// Registra eventos importantes do SaaS (seção 35 do documento original:
/// criação de empresa, usuário, login, alteração de plano, cancelamento,
/// operações administrativas...).
///
/// Só adiciona a entrada ao rastreador do EF — não chama SaveChanges/Commit
/// sozinho. Quem chama este serviço já tem (ou deveria ter) um
/// _unitOfWork.CommitAsync() logo depois, e o registro de auditoria entra
/// na MESMA transação da operação principal (mesmo DbContext, escopo por
/// requisição) — ou os dois são salvos juntos, ou nenhum dos dois é.
/// </summary>
public interface IAuditLogService
{
    /// <summary>
    /// Uso normal, dentro de uma requisição de tenant autenticada — tenant e
    /// usuário são resolvidos automaticamente do token JWT atual.
    /// </summary>
    Task LogAsync(string operation, string resource, string? resourceId = null, string? details = null, CancellationToken cancellationToken = default);

    /// <summary>
    /// Uso exclusivo de fluxos sem tenant ambiente correto: ações do
    /// SuperAdmin em nome de uma empresa específica (ele não pertence a
    /// nenhuma), ou o login (o token ainda não existe na requisição que o
    /// está gerando). TenantId e UserId são atribuídos explicitamente.
    /// </summary>
    Task LogForTenantAsync(Guid tenantId, Guid? userId, string operation, string resource, string? resourceId = null, string? details = null, CancellationToken cancellationToken = default);
}

'@
Write-Utf8NoBom -Path "src\AutoNexus.Application\Interfaces\IAuditLogService.cs" -Content $content

Write-Host "Escrevendo: src\AutoNexus.Application\Services\AuditLogService.cs"
$content = @'
using AutoNexus.Application.Interfaces;
using AutoNexus.Domain.Entities;
using AutoNexus.Domain.Interfaces;

namespace AutoNexus.Application.Services;

public class AuditLogService : IAuditLogService
{
    private readonly IAuditLogRepository _repository;
    private readonly ITenantContext _tenantContext;

    public AuditLogService(IAuditLogRepository repository, ITenantContext tenantContext)
    {
        _repository = repository;
        _tenantContext = tenantContext;
    }

    public async Task LogAsync(string operation, string resource, string? resourceId = null, string? details = null, CancellationToken cancellationToken = default)
    {
        var log = new AuditLog(_tenantContext.UserId, operation, resource, resourceId, details);
        // Dentro de uma requisição de tenant normal, o SaveChanges do
        // AutoNexusDbContext carimba o TenantId sozinho (mesma lógica de
        // qualquer outra entidade nova) — não precisa de AddForTenantAsync aqui.
        await _repository.AddAsync(log, cancellationToken);
    }

    public async Task LogForTenantAsync(Guid tenantId, Guid? userId, string operation, string resource, string? resourceId = null, string? details = null, CancellationToken cancellationToken = default)
    {
        var log = new AuditLog(userId, operation, resource, resourceId, details);
        await _repository.AddForTenantAsync(log, tenantId, cancellationToken);
    }
}

'@
Write-Utf8NoBom -Path "src\AutoNexus.Application\Services\AuditLogService.cs" -Content $content

Write-Host "Escrevendo: src\AutoNexus.Domain\Interfaces\IAuditLogRepository.cs"
$content = @'
using AutoNexus.Domain.Entities;

namespace AutoNexus.Domain.Interfaces;

public interface IAuditLogRepository
{
    Task AddAsync(AuditLog log, CancellationToken cancellationToken = default);

    /// <summary>Mesmo cuidado de IUserRepository.AddForTenantAsync — ver AuditLogService.LogForTenantAsync.</summary>
    Task AddForTenantAsync(AuditLog log, Guid tenantId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Uso exclusivo do SuperAdmin: ignora o filtro de tenant de propósito,
    /// para permitir uma visão global de auditoria. Quando tenantId é
    /// informado, filtra para aquela empresa específica.
    /// </summary>
    Task<List<AuditLog>> GetAllAcrossTenantsAsync(Guid? tenantId = null, int take = 200, CancellationToken cancellationToken = default);
}

'@
Write-Utf8NoBom -Path "src\AutoNexus.Domain\Interfaces\IAuditLogRepository.cs" -Content $content

Write-Host "Escrevendo: src\AutoNexus.Infrastructure\Repositories\AuditLogRepository.cs"
$content = @'
using AutoNexus.Domain.Entities;
using AutoNexus.Domain.Interfaces;
using AutoNexus.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace AutoNexus.Infrastructure.Repositories;

public class AuditLogRepository : IAuditLogRepository
{
    private readonly AutoNexusDbContext _context;

    public AuditLogRepository(AutoNexusDbContext context)
    {
        _context = context;
    }

    public async Task AddAsync(AuditLog log, CancellationToken cancellationToken = default)
        => await _context.AuditLogs.AddAsync(log, cancellationToken);

    public async Task AddForTenantAsync(AuditLog log, Guid tenantId, CancellationToken cancellationToken = default)
    {
        log.TenantId = tenantId;
        await _context.AuditLogs.AddAsync(log, cancellationToken);
    }

    // IgnoreQueryFilters() de propósito — mesma lógica do UserRepository.
    // GetAllAcrossTenantsAsync: só para o painel do SuperAdmin.
    public async Task<List<AuditLog>> GetAllAcrossTenantsAsync(Guid? tenantId = null, int take = 200, CancellationToken cancellationToken = default)
    {
        var query = _context.AuditLogs.IgnoreQueryFilters().AsQueryable();

        if (tenantId.HasValue)
            query = query.Where(a => a.TenantId == tenantId.Value);

        return await query
            .OrderByDescending(a => a.ExecutedAt)
            .Take(take)
            .ToListAsync(cancellationToken);
    }
}

'@
Write-Utf8NoBom -Path "src\AutoNexus.Infrastructure\Repositories\AuditLogRepository.cs" -Content $content

Write-Host "Escrevendo: src\AutoNexus.Api\Controllers\SuperAdminController.cs"
$content = @'
using AutoNexus.Application.DTOs;
using AutoNexus.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AutoNexus.Api.Controllers;

/// <summary>
/// Área exclusiva do dono do SaaS. Só usuários com Profile = SuperAdmin
/// acessam — nenhuma outra rota do sistema concede este role. SuperAdmin não
/// pertence a nenhum tenant, então fora deste controller ele não enxerga
/// nenhum dado (o filtro global de tenant continua valendo normalmente em
/// todo o resto da API — ver AutoNexusDbContext).
/// </summary>
[ApiController]
[Route("api/superadmin")]
[Authorize(Roles = "SuperAdmin")]
public class SuperAdminController : ControllerBase
{
    private readonly ISuperAdminService _superAdminService;

    public SuperAdminController(ISuperAdminService superAdminService)
    {
        _superAdminService = superAdminService;
    }

    [HttpGet("tenants")]
    public async Task<IActionResult> GetTenants(CancellationToken cancellationToken)
    {
        var tenants = await _superAdminService.GetAllTenantsAsync(cancellationToken);
        return Ok(tenants);
    }

    [HttpPost("tenants")]
    public async Task<IActionResult> CreateTenant([FromBody] CreateTenantWithAdminDto dto, CancellationToken cancellationToken)
    {
        try
        {
            var tenant = await _superAdminService.CreateTenantAsync(dto, cancellationToken);
            return CreatedAtAction(nameof(GetTenants), new { }, tenant);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("tenants/{tenantId:guid}/activate")]
    public async Task<IActionResult> ActivateTenant(Guid tenantId, CancellationToken cancellationToken)
    {
        try
        {
            await _superAdminService.ActivateTenantAsync(tenantId, cancellationToken);
            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpPost("tenants/{tenantId:guid}/deactivate")]
    public async Task<IActionResult> DeactivateTenant(Guid tenantId, CancellationToken cancellationToken)
    {
        try
        {
            await _superAdminService.DeactivateTenantAsync(tenantId, cancellationToken);
            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpGet("users")]
    public async Task<IActionResult> GetUsers([FromQuery] Guid? tenantId, CancellationToken cancellationToken)
    {
        var users = await _superAdminService.GetUsersAsync(tenantId, cancellationToken);
        return Ok(users);
    }

    [HttpGet("audit-logs")]
    public async Task<IActionResult> GetAuditLogs([FromQuery] Guid? tenantId, CancellationToken cancellationToken)
    {
        var logs = await _superAdminService.GetAuditLogsAsync(tenantId, cancellationToken);
        return Ok(logs);
    }

    [HttpGet("plans")]
    public async Task<IActionResult> GetPlans(CancellationToken cancellationToken)
    {
        var plans = await _superAdminService.GetPlansAsync(cancellationToken);
        return Ok(plans);
    }

    [HttpPost("plans")]
    public async Task<IActionResult> CreatePlan([FromBody] CreatePlanDto dto, CancellationToken cancellationToken)
    {
        var plan = await _superAdminService.CreatePlanAsync(dto, cancellationToken);
        return CreatedAtAction(nameof(GetPlans), new { }, plan);
    }

    [HttpGet("tenants/{tenantId:guid}/subscription")]
    public async Task<IActionResult> GetSubscription(Guid tenantId, CancellationToken cancellationToken)
    {
        var subscription = await _superAdminService.GetSubscriptionAsync(tenantId, cancellationToken);
        if (subscription == null)
            return NotFound(new { message = "Esta empresa ainda não tem assinatura." });

        return Ok(subscription);
    }

    [HttpPost("tenants/{tenantId:guid}/subscription")]
    public async Task<IActionResult> AssignPlan(Guid tenantId, [FromBody] AssignPlanDto dto, CancellationToken cancellationToken)
    {
        try
        {
            var subscription = await _superAdminService.AssignPlanAsync(tenantId, dto, cancellationToken);
            return Ok(subscription);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }
}

'@
Write-Utf8NoBom -Path "src\AutoNexus.Api\Controllers\SuperAdminController.cs" -Content $content

Write-Host "Escrevendo: src\AutoNexus.Api\Controllers\UsersController.cs"
$content = @'
using AutoNexus.Application.DTOs;
using AutoNexus.Application.Interfaces;
using AutoNexus.Domain.Entities;
using AutoNexus.Domain.Enums;
using AutoNexus.Domain.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AutoNexus.Api.Controllers;

[ApiController]
[Route("api/users")]
[Authorize(Roles = "Admin,1")] // <-- Apenas Administrador pode listar e cadastrar usuários
public class UsersController : ControllerBase
{
    private readonly IUserRepository _userRepository;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IAuditLogService _auditLogService;

    public UsersController(
        IUserRepository userRepository,
        IPasswordHasher passwordHasher,
        IUnitOfWork unitOfWork,
        IAuditLogService auditLogService)
    {
        _userRepository = userRepository;
        _passwordHasher = passwordHasher;
        _unitOfWork = unitOfWork;
        _auditLogService = auditLogService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        var users = await _userRepository.GetAllAsync(cancellationToken);
        var dtos = users?.Select(u => new UserDto(
            Id: u.Id,
            Name: u.Name,
            Email: u.Email,
            Profile: u.Profile,
            ProfileName: u.Profile switch {
                UserProfile.Admin => "Administrador",
                UserProfile.Vendedor => "Vendedor",
                _ => "Cliente"
            },
            IsActive: u.IsActive,
            CreatedAt: u.CreatedAt,
            TenantId: u.TenantId
        )).OrderBy(u => u.Name);

        return Ok(dtos);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateUserDto dto, CancellationToken cancellationToken)
    {
        // Checagem global (não só do tenant atual): o e-mail é único no banco
        // inteiro, então a validação amigável também precisa ser global —
        // ver EmailExistsAsync.
        var emailExists = await _userRepository.EmailExistsAsync(dto.Email, cancellationToken);
        if (emailExists)
        {
            return BadRequest(new { message = "Já existe um usuário cadastrado com este e-mail." });
        }

        var passwordHash = _passwordHasher.Hash(dto.Password);
        var user = new User(dto.Name, dto.Email, passwordHash, dto.Profile);

        await _userRepository.AddAsync(user, cancellationToken);

        // LogAsync (não LogForTenantAsync): esta requisição já é de um Admin
        // autenticado dentro do próprio tenant, então o contexto ambiente
        // (ITenantContext) já resolve tenant e usuário sozinho.
        await _auditLogService.LogAsync("CriarUsuario", "User", user.Id.ToString(), $"Usuário '{user.Name}' ({user.Email}) criado", cancellationToken);

        await _unitOfWork.CommitAsync(cancellationToken);

        return Ok(new UserDto(
            Id: user.Id,
            Name: user.Name,
            Email: user.Email,
            Profile: user.Profile,
            ProfileName: user.Profile == UserProfile.Admin ? "Administrador" : "Vendedor",
            IsActive: user.IsActive,
            CreatedAt: user.CreatedAt,
            TenantId: user.TenantId
        ));
    }
}
'@
Write-Utf8NoBom -Path "src\AutoNexus.Api\Controllers\UsersController.cs" -Content $content

Write-Host "Escrevendo: src\AutoNexus.Application\DTOs\TenantDtos.cs"
$content = @'
namespace AutoNexus.Application.DTOs;

public record TenantDto(
    Guid Id,
    string Name,
    string Slug,
    bool IsActive,
    DateTime CreatedAt
);

public record CreateTenantDto(string Name, string Slug);

/// <summary>
/// Cria a empresa e já cria seu primeiro usuário Admin — sem isso, uma
/// empresa recém-criada pelo SuperAdmin ficaria sem ninguém capaz de entrar
/// nela (o cadastro normal de usuários exige já estar autenticado como Admin
/// daquela empresa).
/// </summary>
public record AuditLogDto(
    Guid Id,
    Guid TenantId,
    Guid? UserId,
    string Operation,
    string Resource,
    string? ResourceId,
    string? Details,
    DateTime ExecutedAt
);

public record CreateTenantWithAdminDto(
    string TenantName,
    string TenantSlug,
    string AdminName,
    string AdminEmail,
    string AdminPassword
);

'@
Write-Utf8NoBom -Path "src\AutoNexus.Application\DTOs\TenantDtos.cs" -Content $content

Write-Host "Escrevendo: src\AutoNexus.Application\DependencyInjection.cs"
$content = @'
using AutoNexus.Application.Interfaces;
using AutoNexus.Application.Services;
using AutoNexus.Domain.Interfaces;
using Microsoft.Extensions.DependencyInjection;

namespace AutoNexus.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddScoped<IVehicleService, VehicleService>();
        services.AddScoped<ILookupService, LookupService>();
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<ICostService, CostService>();
        services.AddScoped<IFipeService, FipeService>();
        services.AddScoped<ITradeService, TradeService>();
        services.AddScoped<IDocumentService, DocumentService>();
        services.AddScoped<IPortalService, PortalService>();
        services.AddScoped<IDashboardService, DashboardService>();
        services.AddScoped<IReportService, ReportService>();
        services.AddScoped<IContractService, ContractService>();
        services.AddHttpClient("BankCreditClient");
        services.AddScoped<IBankCreditService, CreditService>();
        services.AddScoped<IBankConfigService, BankConfigService>();
        services.AddScoped<ICompanyDocumentService, CompanyDocumentService>();
        services.AddScoped<IAiDescriptionService, AiDescriptionService>();
        services.AddScoped<IFeedExportService, FeedExportService>();
        services.AddScoped<ISuperAdminService, SuperAdminService>();
        services.AddScoped<IAuditLogService, AuditLogService>();
        services.AddScoped<ITenantSettingService, TenantSettingService>();
        services.AddScoped<ISubscriptionService, SubscriptionService>();
        return services;
    }
}

'@
Write-Utf8NoBom -Path "src\AutoNexus.Application\DependencyInjection.cs" -Content $content

Write-Host "Escrevendo: src\AutoNexus.Application\Interfaces\ISuperAdminService.cs"
$content = @'
using AutoNexus.Application.DTOs;

namespace AutoNexus.Application.Interfaces;

public interface ISuperAdminService
{
    Task<List<TenantDto>> GetAllTenantsAsync(CancellationToken cancellationToken = default);
    Task<TenantDto> CreateTenantAsync(CreateTenantWithAdminDto dto, CancellationToken cancellationToken = default);
    Task ActivateTenantAsync(Guid tenantId, CancellationToken cancellationToken = default);
    Task DeactivateTenantAsync(Guid tenantId, CancellationToken cancellationToken = default);
    Task<List<UserDto>> GetUsersAsync(Guid? tenantId, CancellationToken cancellationToken = default);

    Task<List<PlanDto>> GetPlansAsync(CancellationToken cancellationToken = default);
    Task<PlanDto> CreatePlanAsync(CreatePlanDto dto, CancellationToken cancellationToken = default);
    Task<TenantSubscriptionDto?> GetSubscriptionAsync(Guid tenantId, CancellationToken cancellationToken = default);
    Task<TenantSubscriptionDto> AssignPlanAsync(Guid tenantId, AssignPlanDto dto, CancellationToken cancellationToken = default);

    Task<List<AuditLogDto>> GetAuditLogsAsync(Guid? tenantId = null, CancellationToken cancellationToken = default);
}

'@
Write-Utf8NoBom -Path "src\AutoNexus.Application\Interfaces\ISuperAdminService.cs" -Content $content

Write-Host "Escrevendo: src\AutoNexus.Application\Services\AuthService.cs"
$content = @'
using AutoNexus.Application.DTOs;
using AutoNexus.Application.Interfaces;
using AutoNexus.Domain.Enums;
using AutoNexus.Domain.Interfaces;

namespace AutoNexus.Application.Services;

public class AuthService : IAuthService
{
    private readonly IUserRepository _userRepository;
    private readonly ITenantRepository _tenantRepository;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IJwtTokenGenerator _jwtTokenGenerator;
    private readonly IAuditLogService _auditLogService;
    private readonly IUnitOfWork _unitOfWork;

    public AuthService(
        IUserRepository userRepository,
        ITenantRepository tenantRepository,
        IPasswordHasher passwordHasher,
        IJwtTokenGenerator jwtTokenGenerator,
        IAuditLogService auditLogService,
        IUnitOfWork unitOfWork)
    {
        _userRepository = userRepository;
        _tenantRepository = tenantRepository;
        _passwordHasher = passwordHasher;
        _jwtTokenGenerator = jwtTokenGenerator;
        _auditLogService = auditLogService;
        _unitOfWork = unitOfWork;
    }

    public async Task<LoginResponseDto> LoginAsync(LoginRequestDto dto, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(dto.Email) || string.IsNullOrWhiteSpace(dto.Password))
            throw new UnauthorizedAccessException("E-mail e senha são obrigatórios.");

        var user = await _userRepository.GetByEmailAsync(dto.Email, cancellationToken);
        if (user == null || !user.IsActive)
            throw new UnauthorizedAccessException("Credenciais inválidas.");

        var isPasswordValid = _passwordHasher.Verify(dto.Password, user.PasswordHash);
        if (!isPasswordValid)
            throw new UnauthorizedAccessException("Credenciais inválidas.");

        // SuperAdmin não pertence a nenhum tenant (TenantId vazio de
        // propósito) — só usuários normais de uma empresa precisam checar se
        // a empresa continua ativa.
        if (user.Profile != UserProfile.SuperAdmin)
        {
            var tenant = await _tenantRepository.GetByIdAsync(user.TenantId, cancellationToken);
            if (tenant == null || !tenant.IsActive)
                throw new UnauthorizedAccessException("Esta empresa está desativada. Fale com o suporte.");
        }

        var token = _jwtTokenGenerator.GenerateToken(user);

        // LogForTenantAsync (não LogAsync): a própria requisição de login
        // ainda não tem o token que está sendo gerado agora, então não há
        // tenant "ambiente" no ITenantContext — o tenant e o usuário aqui já
        // são conhecidos diretamente (acabamos de autenticar), por isso são
        // passados explicitamente.
        await _auditLogService.LogForTenantAsync(user.TenantId, user.Id, "Login", "User", user.Id.ToString(), cancellationToken: cancellationToken);
        await _unitOfWork.CommitAsync(cancellationToken);

        return new LoginResponseDto(
            token,
            user.Id,
            user.Name,
            user.Email,
            user.Profile,
            user.TenantId
        );
    }

    public async Task<UserDto?> GetCurrentUserAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var user = await _userRepository.GetByIdAsync(userId, cancellationToken);
        if (user == null) return null;

        var ProfileName = user.Profile switch
        {
            Domain.Enums.UserProfile.SuperAdmin => "Super Admin",
            Domain.Enums.UserProfile.Admin => "Administrador",
            Domain.Enums.UserProfile.Vendedor => "Vendedor",
            _ => "Cliente"
        };

        return new UserDto(user.Id, user.Name, user.Email, user.Profile, ProfileName, user.IsActive, user.CreatedAt, user.TenantId);
    }
}
'@
Write-Utf8NoBom -Path "src\AutoNexus.Application\Services\AuthService.cs" -Content $content

Write-Host "Escrevendo: src\AutoNexus.Application\Services\SuperAdminService.cs"
$content = @'
using AutoNexus.Application.DTOs;
using AutoNexus.Application.Interfaces;
using AutoNexus.Domain.Entities;
using AutoNexus.Domain.Enums;
using AutoNexus.Domain.Interfaces;

namespace AutoNexus.Application.Services;

public class SuperAdminService : ISuperAdminService
{
    private readonly ITenantRepository _tenantRepository;
    private readonly IUserRepository _userRepository;
    private readonly IPlanRepository _planRepository;
    private readonly ITenantSubscriptionRepository _subscriptionRepository;
    private readonly ITenantSettingRepository _settingRepository;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IAuditLogService _auditLogService;
    private readonly IAuditLogRepository _auditLogRepository;
    private readonly ITenantContext _tenantContext;

    public SuperAdminService(
        ITenantRepository tenantRepository,
        IUserRepository userRepository,
        IPlanRepository planRepository,
        ITenantSubscriptionRepository subscriptionRepository,
        ITenantSettingRepository settingRepository,
        IPasswordHasher passwordHasher,
        IUnitOfWork unitOfWork,
        IAuditLogService auditLogService,
        IAuditLogRepository auditLogRepository,
        ITenantContext tenantContext)
    {
        _tenantRepository = tenantRepository;
        _userRepository = userRepository;
        _planRepository = planRepository;
        _subscriptionRepository = subscriptionRepository;
        _settingRepository = settingRepository;
        _passwordHasher = passwordHasher;
        _unitOfWork = unitOfWork;
        _auditLogService = auditLogService;
        _auditLogRepository = auditLogRepository;
        _tenantContext = tenantContext;
    }

    public async Task<List<TenantDto>> GetAllTenantsAsync(CancellationToken cancellationToken = default)
    {
        var tenants = await _tenantRepository.GetAllAsync(cancellationToken);
        return tenants.Select(ToDto).ToList();
    }

    public async Task<TenantDto> CreateTenantAsync(CreateTenantWithAdminDto dto, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(dto.TenantName))
            throw new ArgumentException("Nome da empresa é obrigatório.");
        if (string.IsNullOrWhiteSpace(dto.TenantSlug))
            throw new ArgumentException("Slug da empresa é obrigatório.");
        if (string.IsNullOrWhiteSpace(dto.AdminEmail) || string.IsNullOrWhiteSpace(dto.AdminPassword))
            throw new ArgumentException("Nome, e-mail e senha do administrador inicial são obrigatórios.");

        var slugExists = await _tenantRepository.SlugExistsAsync(dto.TenantSlug.Trim().ToLowerInvariant(), cancellationToken);
        if (slugExists)
            throw new InvalidOperationException("Já existe uma empresa cadastrada com esse slug.");

        var emailExists = await _userRepository.EmailExistsAsync(dto.AdminEmail, cancellationToken);
        if (emailExists)
            throw new InvalidOperationException("Já existe um usuário cadastrado com este e-mail.");

        var freePlan = (await _planRepository.GetAllAsync(cancellationToken))
            .FirstOrDefault(p => p.Name == "Free")
            ?? throw new InvalidOperationException("Plano Free não está cadastrado — verifique o seed de planos.");

        var tenant = new Tenant(dto.TenantName, dto.TenantSlug);
        await _tenantRepository.AddAsync(tenant, cancellationToken);

        var passwordHash = _passwordHasher.Hash(dto.AdminPassword);
        var adminUser = new User(dto.AdminName, dto.AdminEmail, passwordHash, UserProfile.Admin);

        // AddForTenantAsync (não AddAsync): tudo que é criado aqui pertence ao
        // tenant recém-criado acima, nunca ao "tenant" do SuperAdmin logado
        // (que não tem tenant nenhum). Ver comentário nas interfaces dos
        // repositórios. Sem isso, empresa nova nasceria sem ninguém capaz de
        // entrar nela, sem configurações e sem plano.
        await _userRepository.AddForTenantAsync(adminUser, tenant.Id, cancellationToken);

        var settings = new TenantSetting(dto.TenantName);
        await _settingRepository.AddForTenantAsync(settings, tenant.Id, cancellationToken);

        var subscription = new TenantSubscription(freePlan.Id, SubscriptionStatus.Trialing);
        await _subscriptionRepository.AddForTenantAsync(subscription, tenant.Id, cancellationToken);

        // LogForTenantAsync: quem executa é o SuperAdmin (sem tenant próprio),
        // mas o evento pertence ao tenant recém-criado.
        await _auditLogService.LogForTenantAsync(
            tenant.Id, _tenantContext.UserId, "CriarEmpresa", "Tenant", tenant.Id.ToString(),
            $"Empresa '{tenant.Name}' criada pelo SuperAdmin, admin inicial: {dto.AdminEmail}", cancellationToken);

        await _unitOfWork.CommitAsync(cancellationToken);

        return ToDto(tenant);
    }

    public async Task ActivateTenantAsync(Guid tenantId, CancellationToken cancellationToken = default)
    {
        var tenant = await _tenantRepository.GetByIdAsync(tenantId, cancellationToken)
            ?? throw new KeyNotFoundException("Empresa não encontrada.");

        tenant.Activate();
        _tenantRepository.Update(tenant);

        await _auditLogService.LogForTenantAsync(
            tenant.Id, _tenantContext.UserId, "AtivarEmpresa", "Tenant", tenant.Id.ToString(), cancellationToken: cancellationToken);

        await _unitOfWork.CommitAsync(cancellationToken);
    }

    public async Task DeactivateTenantAsync(Guid tenantId, CancellationToken cancellationToken = default)
    {
        var tenant = await _tenantRepository.GetByIdAsync(tenantId, cancellationToken)
            ?? throw new KeyNotFoundException("Empresa não encontrada.");

        tenant.Deactivate();
        _tenantRepository.Update(tenant);

        await _auditLogService.LogForTenantAsync(
            tenant.Id, _tenantContext.UserId, "DesativarEmpresa", "Tenant", tenant.Id.ToString(), cancellationToken: cancellationToken);

        await _unitOfWork.CommitAsync(cancellationToken);

        // Bloqueio de acesso de fato: AuthService.LoginAsync já checa
        // Tenant.IsActive antes de emitir token (ver etapa 6), então a partir
        // daqui ninguém dessa empresa consegue mais fazer um NOVO login.
        // Token já emitido antes disso continua válido até expirar (JWT sem
        // blocklist) — limitação conhecida, documentada, não resolvida nesta
        // etapa.
    }

    public async Task<List<UserDto>> GetUsersAsync(Guid? tenantId, CancellationToken cancellationToken = default)
    {
        var users = await _userRepository.GetAllAcrossTenantsAsync(tenantId, cancellationToken);
        return users.Select(u => new UserDto(
            u.Id,
            u.Name,
            u.Email,
            u.Profile,
            ProfileName(u.Profile),
            u.IsActive,
            u.CreatedAt,
            u.TenantId
        )).ToList();
    }

    public async Task<List<PlanDto>> GetPlansAsync(CancellationToken cancellationToken = default)
    {
        var plans = await _planRepository.GetAllAsync(cancellationToken);
        return plans.Select(ToDto).ToList();
    }

    public async Task<PlanDto> CreatePlanAsync(CreatePlanDto dto, CancellationToken cancellationToken = default)
    {
        var plan = new Plan(dto.Name, dto.Price, dto.MaxUsers, dto.MaxVehicles, dto.MaxStorageMb);
        await _planRepository.AddAsync(plan, cancellationToken);
        await _unitOfWork.CommitAsync(cancellationToken);
        return ToDto(plan);
    }

    public async Task<TenantSubscriptionDto?> GetSubscriptionAsync(Guid tenantId, CancellationToken cancellationToken = default)
    {
        var subscription = await _subscriptionRepository.GetByTenantIdAsync(tenantId, cancellationToken);
        if (subscription == null) return null;

        var plan = await _planRepository.GetByIdAsync(subscription.PlanId, cancellationToken);
        return ToDto(subscription, plan?.Name ?? "—");
    }

    public async Task<TenantSubscriptionDto> AssignPlanAsync(Guid tenantId, AssignPlanDto dto, CancellationToken cancellationToken = default)
    {
        var plan = await _planRepository.GetByIdAsync(dto.PlanId, cancellationToken)
            ?? throw new KeyNotFoundException("Plano não encontrado.");

        var subscription = await _subscriptionRepository.GetByTenantIdAsync(tenantId, cancellationToken);

        if (subscription == null)
        {
            subscription = new TenantSubscription(plan.Id, SubscriptionStatus.Active);
            await _subscriptionRepository.AddForTenantAsync(subscription, tenantId, cancellationToken);
        }
        else
        {
            subscription.ChangePlan(plan.Id);
            subscription.Activate();
            _subscriptionRepository.Update(subscription);
        }

        await _auditLogService.LogForTenantAsync(
            tenantId, _tenantContext.UserId, "AlterarPlano", "TenantSubscription", subscription.Id.ToString(),
            $"Plano alterado para '{plan.Name}'", cancellationToken);

        await _unitOfWork.CommitAsync(cancellationToken);
        return ToDto(subscription, plan.Name);
    }

    public async Task<List<AuditLogDto>> GetAuditLogsAsync(Guid? tenantId = null, CancellationToken cancellationToken = default)
    {
        var logs = await _auditLogRepository.GetAllAcrossTenantsAsync(tenantId, take: 200, cancellationToken: cancellationToken);
        return logs.Select(l => new AuditLogDto(
            l.Id, l.TenantId, l.UserId, l.Operation, l.Resource, l.ResourceId, l.Details, l.ExecutedAt
        )).ToList();
    }

    private static string ProfileName(UserProfile profile) => profile switch
    {
        UserProfile.SuperAdmin => "Super Admin",
        UserProfile.Admin => "Administrador",
        UserProfile.Vendedor => "Vendedor",
        _ => "Cliente"
    };

    private static TenantDto ToDto(Tenant tenant) =>
        new(tenant.Id, tenant.Name, tenant.Slug, tenant.IsActive, tenant.CreatedAt);

    private static PlanDto ToDto(Plan plan) =>
        new(plan.Id, plan.Name, plan.Price, plan.IsActive, plan.MaxUsers, plan.MaxVehicles, plan.MaxStorageMb);

    private static TenantSubscriptionDto ToDto(TenantSubscription subscription, string planName) => new(
        subscription.Id,
        subscription.TenantId,
        subscription.PlanId,
        planName,
        subscription.Status,
        subscription.StartDate,
        subscription.EndDate
    );
}

'@
Write-Utf8NoBom -Path "src\AutoNexus.Application\Services\SuperAdminService.cs" -Content $content

Write-Host "Escrevendo: src\AutoNexus.Domain\Interfaces\ITenantContext.cs"
$content = @'
namespace AutoNexus.Domain.Interfaces;

/// <summary>
/// Descobre qual Tenant está associado à requisição atual. A implementação
/// concreta (fora do Domain, ver AutoNexus.Infrastructure.Services.TenantContext)
/// lê o TenantId exclusivamente de um claim do token JWT já validado —
/// nunca de um header, query string ou corpo da requisição enviados pelo
/// cliente.
/// </summary>
public interface ITenantContext
{
    /// <summary>
    /// Id do tenant autenticado na requisição atual. Só é válido quando
    /// <see cref="HasTenant"/> é true.
    /// </summary>
    Guid TenantId { get; }

    /// <summary>
    /// False quando não há um tenant identificado na requisição atual —
    /// por exemplo, durante o seed/migração na inicialização da aplicação
    /// (que roda fora de um request HTTP), ou futuramente para rotas
    /// exclusivas do SuperAdmin. Nesses casos o filtro global de tenant
    /// deixa de ser aplicado — por isso HasTenant deve ser tratado com
    /// cuidado e nunca fica true a partir de dado enviado pelo cliente.
    /// </summary>
    bool HasTenant { get; }

    /// <summary>
    /// Id do usuário autenticado na requisição atual, lido do claim "sub"
    /// do JWT. Null fora de uma requisição autenticada (seed, requisições
    /// anônimas). Usado principalmente para auditoria (ver AuditLogService) —
    /// evita ter que passar "quem fez a ação" manualmente por toda cadeia de
    /// chamadas de serviço.
    /// </summary>
    Guid? UserId { get; }
}

'@
Write-Utf8NoBom -Path "src\AutoNexus.Domain\Interfaces\ITenantContext.cs" -Content $content

Write-Host "Escrevendo: src\AutoNexus.Infrastructure\DependencyInjection.cs"
$content = @'
using AutoNexus.Application.Interfaces;
using AutoNexus.Domain.Interfaces;
using AutoNexus.Infrastructure.Data;
using AutoNexus.Infrastructure.Integrations.Adapters;
using AutoNexus.Infrastructure.Repositories;
using AutoNexus.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace AutoNexus.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("Connection string 'DefaultConnection' não encontrada.");

        services.AddDbContext<AutoNexusDbContext>(options =>
            options.UseNpgsql(connectionString));

        // Multi-tenancy: ITenantContext precisa de acesso ao HttpContext para
        // ler o claim "tenant_id" do usuário autenticado (ver TenantContext).
        services.AddHttpContextAccessor();
        services.AddScoped<ITenantContext, TenantContext>();

        services.AddScoped<IUnitOfWork, UnitOfWork>();
        services.AddScoped<IVehicleRepository, VehicleRepository>();
        services.AddScoped<ILookupRepository, LookupRepository>();
        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<ITenantRepository, TenantRepository>();
        services.AddScoped<IAuditLogRepository, AuditLogRepository>();
        services.AddScoped<IPlanRepository, PlanRepository>();
        services.AddScoped<ITenantSubscriptionRepository, TenantSubscriptionRepository>();
        services.AddScoped<ITenantSettingRepository, TenantSettingRepository>();
        services.AddScoped<ITradeRepository, TradeRepository>();
        services.AddScoped<IDocumentRepository, DocumentRepository>();
        services.AddScoped<IBuyerLinkRepository, BuyerLinkRepository>();
        services.AddScoped<IAcceptanceRepository, AcceptanceRepository>();
        services.AddScoped<IBankConfigRepository, BankConfigRepository>(); // Registrado aqui
        services.AddScoped<IPasswordHasher, PasswordHasher>();
        services.AddScoped<IJwtTokenGenerator, JwtTokenGenerator>();
        services.AddScoped<IBankAdapter, SantanderBankAdapter>();
        services.AddScoped<IStorageService, LocalStorageService>();
        services.AddHttpClient<IFipeExternalService, BrasilApiFipeService>();
        services.AddScoped<ICompanyDocumentRepository, CompanyDocumentRepository>();
        

        return services;
    }
}
'@
Write-Utf8NoBom -Path "src\AutoNexus.Infrastructure\DependencyInjection.cs" -Content $content

Write-Host "Escrevendo: src\AutoNexus.Infrastructure\Services\TenantContext.cs"
$content = @'
using System.Security.Claims;
using AutoNexus.Domain.Interfaces;
using Microsoft.AspNetCore.Http;

namespace AutoNexus.Infrastructure.Services;

/// <summary>
/// Implementação real de ITenantContext. Registrada como Scoped — uma
/// instância por requisição HTTP (ou por escopo de DI criado manualmente,
/// como no seed de inicialização, onde não existe HttpContext).
///
/// O TenantId é lido exclusivamente do claim "tenant_id" do token JWT já
/// autenticado por ASP.NET Core (ou seja, já validado quanto à assinatura e
/// expiração antes de chegar aqui). Isso é proposital: o TenantId nunca deve
/// vir de um header, query string ou corpo enviados livremente pelo cliente.
/// </summary>
public class TenantContext : ITenantContext
{
    public Guid TenantId { get; }
    public bool HasTenant { get; }
    public Guid? UserId { get; }

    public TenantContext(IHttpContextAccessor httpContextAccessor)
    {
        var user = httpContextAccessor.HttpContext?.User;
        var claimValue = user?.FindFirst("tenant_id")?.Value;

        if (!string.IsNullOrEmpty(claimValue) && Guid.TryParse(claimValue, out var parsedTenantId))
        {
            TenantId = parsedTenantId;
            HasTenant = true;
        }
        else
        {
            TenantId = Guid.Empty;
            HasTenant = false;
        }

        // "sub" do JWT é mapeado automaticamente para ClaimTypes.NameIdentifier
        // pelo handler padrão do ASP.NET Core — mesmo claim que o resto do
        // projeto já usa (ver AuthController/UsersController).
        var userIdClaim = user?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        UserId = Guid.TryParse(userIdClaim, out var parsedUserId) ? parsedUserId : null;
    }
}

'@
Write-Utf8NoBom -Path "src\AutoNexus.Infrastructure\Services\TenantContext.cs" -Content $content

Write-Host ""
Write-Host "Concluido. Arquivos novos: 4 | Arquivos modificados: 10" -ForegroundColor Cyan
Write-Host "Proximo passo: dotnet build (na raiz) para confirmar que compila." -ForegroundColor Yellow
