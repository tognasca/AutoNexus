using AutoNexus.Application.DTOs;

namespace AutoNexus.Application.Interfaces;

public interface IPremiumCatalogService
{
    Task<PremiumCatalogPublicationDto?> GetPublicationAsync(CancellationToken cancellationToken = default);
    Task<PremiumCatalogPublicationDto> SavePublicationAsync(SavePremiumCatalogPublicationDto dto, CancellationToken cancellationToken = default);
    Task<byte[]> GeneratePackageAsync(CancellationToken cancellationToken = default);
}
