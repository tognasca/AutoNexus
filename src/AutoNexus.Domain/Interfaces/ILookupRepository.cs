using AutoNexus.Domain.Entities;

namespace AutoNexus.Domain.Interfaces;

public interface ILookupRepository
{
    Task<IEnumerable<VehicleType>> GetVehicleTypesAsync(bool onlyActive = true, CancellationToken cancellationToken = default);
    Task<IEnumerable<CostCategory>> GetCostCategoriesAsync(bool onlyActive = true, CancellationToken cancellationToken = default);
    Task<IEnumerable<DocumentCategory>> GetDocumentCategoriesAsync(bool onlyActive = true, CancellationToken cancellationToken = default);
    Task<VehicleType?> GetVehicleTypeByIdAsync(Guid id, CancellationToken cancellationToken = default);
}