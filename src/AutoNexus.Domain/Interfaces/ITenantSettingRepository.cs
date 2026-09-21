using AutoNexus.Domain.Entities;

namespace AutoNexus.Domain.Interfaces;

public interface ITenantSettingRepository
{
    Task<TenantSetting?> GetCurrentAsync(CancellationToken cancellationToken = default);
    Task AddAsync(TenantSetting setting, CancellationToken cancellationToken = default);
    Task AddForTenantAsync(TenantSetting setting, Guid tenantId, CancellationToken cancellationToken = default);
    void Update(TenantSetting setting);
}
