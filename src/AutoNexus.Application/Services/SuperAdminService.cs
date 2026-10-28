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

        // Plano inicial = o plano ativo de menor preço (Starter, no catálogo
        // atual) — sem depender de um nome fixo no código.
        var freePlan = (await _planRepository.GetAllAsync(cancellationToken))
            .Where(p => p.IsActive)
            .OrderBy(p => p.Price)
            .FirstOrDefault()
            ?? throw new InvalidOperationException("Nenhum plano ativo cadastrado — verifique o seed de planos.");

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

        // Sem trial configurado, a empresa não pode nascer com acesso gratuito
        // indefinido: a mesma regra do signup público exige assinatura imediata.
        var initialStatus = freePlan.TrialDays > 0 ? SubscriptionStatus.Trialing : SubscriptionStatus.Expired;
        var subscription = new TenantSubscription(freePlan.Id, initialStatus, BillingCycle.Monthly, freePlan.TrialDays);
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

        // O middleware de tenant verifica IsActive em cada requisição
        // autenticada, então tokens emitidos antes da desativação também perdem acesso.
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
        var plan = new Plan(dto.Name, dto.Price, dto.MaxUsers, dto.MaxVehicles, dto.MaxStorageMb, dto.AnnualPrice, dto.TrialDays);
        await _planRepository.AddAsync(plan, cancellationToken);
        await _unitOfWork.CommitAsync(cancellationToken);
        return ToDto(plan);
    }

    public async Task<PlanDto> UpdatePlanAsync(Guid planId, UpdatePlanDto dto, CancellationToken cancellationToken = default)
    {
        var plan = await _planRepository.GetByIdAsync(planId, cancellationToken)
            ?? throw new KeyNotFoundException("Plano não encontrado.");

        plan.Update(dto.Name, dto.Price, dto.AnnualPrice, dto.TrialDays, dto.MaxUsers, dto.MaxVehicles, dto.MaxStorageMb);
        _planRepository.Update(plan);
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

    private static PlanDto ToDto(Plan plan) => BillingMapper.ToDto(plan);

    private static TenantSubscriptionDto ToDto(TenantSubscription subscription, string planName) =>
        BillingMapper.ToDto(subscription, planName);
}
