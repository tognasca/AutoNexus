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
}
