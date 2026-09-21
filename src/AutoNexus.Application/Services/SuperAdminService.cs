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

    public SuperAdminService(
        ITenantRepository tenantRepository,
        IUserRepository userRepository,
        IPlanRepository planRepository,
        ITenantSubscriptionRepository subscriptionRepository,
        ITenantSettingRepository settingRepository,
        IPasswordHasher passwordHasher,
        IUnitOfWork unitOfWork)
    {
        _tenantRepository = tenantRepository;
        _userRepository = userRepository;
        _planRepository = planRepository;
        _subscriptionRepository = subscriptionRepository;
        _settingRepository = settingRepository;
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

        var freePlan = (await _planRepository.GetAllAsync(cancellationToken))
            .FirstOrDefault(p => p.Name == "Free")
            ?? throw new InvalidOperationException("Plano Free não está cadastrado — verifique o seed de planos.");

        var tenant = new Tenant(dto.TenantName, dto.TenantSlug);
        await _tenantRepository.AddAsync(tenant, cancellationToken);

        var passwordHash = _passwordHasher.Hash(dto.AdminPassword);
        var adminUser = new User(dto.AdminName, dto.AdminEmail, passwordHash, UserProfile.Admin);
        await _userRepository.AddForTenantAsync(adminUser, tenant.Id, cancellationToken);

        var settings = new TenantSetting(dto.TenantName);
        await _settingRepository.AddForTenantAsync(settings, tenant.Id, cancellationToken);

        var subscription = new TenantSubscription(freePlan.Id, SubscriptionStatus.Trialing);
        await _subscriptionRepository.AddForTenantAsync(subscription, tenant.Id, cancellationToken);

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

        await _unitOfWork.CommitAsync(cancellationToken);
        return ToDto(subscription, plan.Name);
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
