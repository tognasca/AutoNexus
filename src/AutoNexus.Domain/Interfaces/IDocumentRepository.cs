using AutoNexus.Domain.Entities;

namespace AutoNexus.Domain.Interfaces;

public interface IDocumentRepository
{
    Task<IEnumerable<VehicleDocument>> GetByVehicleIdAsync(Guid vehicleId, CancellationToken cancellationToken = default);
    Task<VehicleDocument?> GetByIdAsync(Guid documentId, CancellationToken cancellationToken = default);
    Task AddAsync(VehicleDocument document, CancellationToken cancellationToken = default);
    void Delete(VehicleDocument document);
}
