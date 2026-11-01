namespace AutoNexus.Application.Interfaces;

public interface IPremiumCatalogAccess
{
    Task EnsurePremiumAsync(Guid tenantId, CancellationToken cancellationToken = default);
}
