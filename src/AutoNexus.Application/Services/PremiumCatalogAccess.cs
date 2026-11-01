using AutoNexus.Application.Interfaces;
using AutoNexus.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace AutoNexus.Application.Services;

public sealed class PremiumCatalogAccess : IPremiumCatalogAccess
{
    private readonly AutoNexusDbContext _context;
    public PremiumCatalogAccess(AutoNexusDbContext context) => _context = context;

    public async Task EnsurePremiumAsync(Guid tenantId, CancellationToken cancellationToken = default)
    {
        var subscription = await _context.TenantSubscriptions.AsNoTracking()
            .Include(x => x.Plan)
            .Where(x => x.TenantId == tenantId)
            .OrderByDescending(x => x.UpdatedAt)
            .ThenByDescending(x => x.CreatedAt)
            .FirstOrDefaultAsync(cancellationToken);

        if (subscription?.Plan == null || !subscription.Plan.IsActive ||
            !string.Equals(subscription.Plan.Name.Trim(), "Premium", StringComparison.OrdinalIgnoreCase))
            throw new UnauthorizedAccessException("A publicação em hospedagem própria está disponível exclusivamente no plano Premium.");
    }
}
