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

    public async Task<TenantSubscription?> GetByTenantIdAsync(Guid tenantId, CancellationToken cancellationToken = default)
        => await _context.TenantSubscriptions
            .FirstOrDefaultAsync(s => s.TenantId == tenantId, cancellationToken);

    public async Task<TenantSubscription?> GetCurrentAsync(CancellationToken cancellationToken = default)
    {
        var tenantId = _context.TenantSubscriptions.FirstOrDefault()?.TenantId;
        if (tenantId == Guid.Empty || tenantId == null)
            return null;

        return await _context.TenantSubscriptions
            .FirstOrDefaultAsync(s => s.TenantId == tenantId.Value, cancellationToken);
    }

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
