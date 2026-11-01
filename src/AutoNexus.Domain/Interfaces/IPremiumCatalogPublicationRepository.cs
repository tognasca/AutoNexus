using AutoNexus.Domain.Entities;

namespace AutoNexus.Domain.Interfaces;

public interface IPremiumCatalogPublicationRepository
{
    Task<PremiumCatalogPublication?> GetAsync(Guid tenantId, CancellationToken cancellationToken = default);
    Task AddAsync(PremiumCatalogPublication entity, CancellationToken cancellationToken = default);
    void Update(PremiumCatalogPublication entity);
}
