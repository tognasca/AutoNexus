using AutoNexus.Domain.Entities;

namespace AutoNexus.Domain.Interfaces;

public interface ITenantSubscriptionRepository
{
    Task<TenantSubscription?> GetByTenantIdAsync(Guid tenantId, CancellationToken cancellationToken = default);
    Task<TenantSubscription?> GetCurrentAsync(CancellationToken cancellationToken = default);
    Task AddAsync(TenantSubscription subscription, CancellationToken cancellationToken = default);
    Task AddForTenantAsync(TenantSubscription subscription, Guid tenantId, CancellationToken cancellationToken = default);
    void Update(TenantSubscription subscription);
}
