using AutoNexus.Application.DTOs;

namespace AutoNexus.Application.Interfaces;

public interface ISuperAdminService
{
    Task<List<TenantDto>> GetAllTenantsAsync(CancellationToken cancellationToken = default);
    Task<TenantDto> CreateTenantAsync(CreateTenantWithAdminDto dto, CancellationToken cancellationToken = default);
    Task ActivateTenantAsync(Guid tenantId, CancellationToken cancellationToken = default);
    Task DeactivateTenantAsync(Guid tenantId, CancellationToken cancellationToken = default);
    Task<List<UserDto>> GetUsersAsync(Guid? tenantId, CancellationToken cancellationToken = default);
}
