using AutoNexus.Domain.Entities;
using AutoNexus.Domain.Interfaces;
using AutoNexus.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace AutoNexus.Infrastructure.Repositories;

public class TenantSubscriptionRepository : ITenantSubscriptionRepository
{
    private readonly AutoNexusDbContext _context;

    public TenantSubscriptionRepository(AutoNexusDbContext context)
    {
        _context = context;
    }

    public Task<TenantSubscription?> GetCurrentAsync(CancellationToken cancellationToken = default)
        => _context.TenantSubscriptions.FirstOrDefaultAsync(cancellationToken);

    public Task<TenantSubscription?> GetByTenantIdAsync(Guid tenantId, CancellationToken cancellationToken = default)
        => _context.TenantSubscriptions.IgnoreQueryFilters()
            .FirstOrDefaultAsync(s => s.TenantId == tenantId, cancellationToken);

    public Task<TenantSubscription?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
        => _context.TenantSubscriptions.IgnoreQueryFilters()
            .FirstOrDefaultAsync(s => s.Id == id, cancellationToken);

    public Task<TenantSubscription?> GetByExternalSubscriptionIdAsync(string externalSubscriptionId, CancellationToken cancellationToken = default)
        => _context.TenantSubscriptions.IgnoreQueryFilters()
            .FirstOrDefaultAsync(s => s.ExternalSubscriptionId == externalSubscriptionId, cancellationToken);

    public Task<List<TenantSubscription>> GetTrialingAsync(CancellationToken cancellationToken = default)
        => _context.TenantSubscriptions.IgnoreQueryFilters()
            .Where(s => s.Status == Domain.Enums.SubscriptionStatus.Trialing && s.TrialEndsAt != null)
            .ToListAsync(cancellationToken);

    public Task<List<TenantSubscription>> GetActiveManualRenewalAsync(CancellationToken cancellationToken = default)
        => _context.TenantSubscriptions.IgnoreQueryFilters()
            .Where(s => s.Status == Domain.Enums.SubscriptionStatus.Active && s.ExternalSubscriptionId == null && s.CurrentPeriodEnd != null)
            .ToListAsync(cancellationToken);

    public async Task AddAsync(TenantSubscription subscription, CancellationToken cancellationToken = default)
        => await _context.TenantSubscriptions.AddAsync(subscription, cancellationToken);

    public async Task AddForTenantAsync(TenantSubscription subscription, Guid tenantId, CancellationToken cancellationToken = default)
    {
        subscription.TenantId = tenantId;
        await _context.TenantSubscriptions.AddAsync(subscription, cancellationToken);
    }

    public void Update(TenantSubscription subscription)
        => _context.TenantSubscriptions.Update(subscription);
}
