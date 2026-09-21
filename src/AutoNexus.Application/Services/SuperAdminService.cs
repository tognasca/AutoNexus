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
    private readonly IPasswordHasher _passwordHasher;
    private readonly IUnitOfWork _unitOfWork;

    public SuperAdminService(
        ITenantRepository tenantRepository,
        IUserRepository userRepository,
        IPasswordHasher passwordHasher,
        IUnitOfWork unitOfWork)
    {
        _tenantRepository = tenantRepository;
        _userRepository = userRepository;
        _passwordHasher = passwordHasher;
        _unitOfWork = unitOfWork;
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

        var tenant = new Tenant(dto.TenantName, dto.TenantSlug);
        await _tenantRepository.AddAsync(tenant, cancellationToken);

        var passwordHash = _passwordHasher.Hash(dto.AdminPassword);
        var adminUser = new User(dto.AdminName, dto.AdminEmail, passwordHash, UserProfile.Admin);

        // AddForTenantAsync (não AddAsync): o admin criado aqui pertence ao
        // tenant recém-criado acima, nunca ao "tenant" do SuperAdmin logado
        // (que não tem tenant nenhum). Ver comentário na interface do repositório.
        await _userRepository.AddForTenantAsync(adminUser, tenant.Id, cancellationToken);

        await _unitOfWork.CommitAsync(cancellationToken);

        return ToDto(tenant);
    }

    public async Task ActivateTenantAsync(Guid tenantId, CancellationToken cancellationToken = default)
    {
        var tenant = await _tenantRepository.GetByIdAsync(tenantId, cancellationToken)
            ?? throw new KeyNotFoundException("Empresa não encontrada.");

        tenant.Activate();
        _tenantRepository.Update(tenant);
        await _unitOfWork.CommitAsync(cancellationToken);
    }

    public async Task DeactivateTenantAsync(Guid tenantId, CancellationToken cancellationToken = default)
    {
        var tenant = await _tenantRepository.GetByIdAsync(tenantId, cancellationToken)
            ?? throw new KeyNotFoundException("Empresa não encontrada.");

        tenant.Deactivate();
        _tenantRepository.Update(tenant);
        await _unitOfWork.CommitAsync(cancellationToken);

        // NOTA: desativar o tenant aqui só marca IsActive = false no registro
        // da empresa. Bloquear de fato o acesso dos usuários dessa empresa
        // (impedir login/uso do sistema) é um passo à parte que ainda
        // depende de o login/middleware checar Tenant.IsActive — ver riscos
        // que vou listar na resposta.
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

    private static string ProfileName(UserProfile profile) => profile switch
    {
        UserProfile.SuperAdmin => "Super Admin",
        UserProfile.Admin => "Administrador",
        UserProfile.Vendedor => "Vendedor",
        _ => "Cliente"
    };

    private static TenantDto ToDto(Tenant tenant) =>
        new(tenant.Id, tenant.Name, tenant.Slug, tenant.IsActive, tenant.CreatedAt);
}
