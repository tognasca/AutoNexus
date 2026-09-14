using AutoNexus.Application.DTOs;

namespace AutoNexus.Application.Interfaces;

public interface ICostService
{
    Task<VehicleCostSummaryDto> GetVehicleCostsSummaryAsync(Guid vehicleId, CancellationToken cancellationToken = default);
    Task<CostDto> AddCostAsync(Guid vehicleId, Guid responsibleUserId, CreateCostDto dto, CancellationToken cancellationToken = default);
    Task DeleteCostAsync(Guid vehicleId, Guid costId, CancellationToken cancellationToken = default);
}
