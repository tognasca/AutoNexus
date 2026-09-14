using AutoNexus.Application.DTOs;

namespace AutoNexus.Application.Interfaces;

public interface ILookupService
{
    Task<IEnumerable<LookupItemDto>> GetVehicleTypesAsync(CancellationToken cancellationToken = default);
    Task<IEnumerable<LookupItemDto>> GetCostCategoriesAsync(CancellationToken cancellationToken = default);
    Task<IEnumerable<LookupItemDto>> GetDocumentCategoriesAsync(CancellationToken cancellationToken = default);
}