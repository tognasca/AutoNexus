using AutoNexus.Domain.Entities;
using AutoNexus.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace AutoNexus.Infrastructure.Repositories;

public class PremiumCatalogPublicationRepository : IPremiumCatalogPublicationRepository
{
    private readonly Data.AutoNexusDbContext _context;
    public PremiumCatalogPublicationRepository(Data.AutoNexusDbContext context) => _context = context;

    public Task<PremiumCatalogPublication?> GetAsync(Guid tenantId, CancellationToken cancellationToken = default) =>
        _context.Set<PremiumCatalogPublication>().FirstOrDefaultAsync(x => x.TenantId == tenantId, cancellationToken);

    public Task AddAsync(PremiumCatalogPublication entity, CancellationToken cancellationToken = default) =>
        _context.Set<PremiumCatalogPublication>().AddAsync(entity, cancellationToken).AsTask();

    public void Update(PremiumCatalogPublication entity) => _context.Set<PremiumCatalogPublication>().Update(entity);
}
