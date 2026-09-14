using AutoNexus.Domain.Entities;

namespace AutoNexus.Domain.Interfaces;

public interface IAcceptanceRepository
{
    Task<ElectronicAcceptance?> GetByVehicleIdAsync(Guid vehicleId, CancellationToken cancellationToken = default);
    Task AddAsync(ElectronicAcceptance acceptance, CancellationToken cancellationToken = default);
}
