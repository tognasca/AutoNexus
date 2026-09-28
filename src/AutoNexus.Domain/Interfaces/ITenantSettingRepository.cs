using AutoNexus.Domain.Entities;

namespace AutoNexus.Domain.Interfaces;

public interface ITenantSettingRepository
{
    /// <summary>Respeita o filtro global — usado pela própria empresa vendo/editando suas configurações.</summary>
    Task<TenantSetting?> GetCurrentAsync(CancellationToken cancellationToken = default);

    Task AddAsync(TenantSetting settings, CancellationToken cancellationToken = default);

    /// <summary>Uso exclusivo do provisionamento pelo SuperAdmin — ver ITenantSubscriptionRepository.AddForTenantAsync.</summary>
    Task AddForTenantAsync(TenantSetting settings, Guid tenantId, CancellationToken cancellationToken = default);

    void Update(TenantSetting settings);
}
