using AutoNexus.Application.DTOs;
using AutoNexus.Application.DTOs.Common;
using AutoNexus.Domain.Entities;
using AutoNexus.Domain.Enums;

namespace AutoNexus.Application.Interfaces;

public interface IVehicleService
{
    Task<PagedResultDto<VehicleSummaryDto>> GetAllPagedAsync(VehicleFilterDto filter, CancellationToken cancellationToken = default);
    Task<VehicleDetailDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IEnumerable<VehicleSummaryDto>> GetByListAsync(CancellationToken cancellationToken = default);
    Task<Guid> CreateAsync(CreateVehicleDto dto, CancellationToken cancellationToken = default);
    Task UpdateAsync(Guid id, UpdateVehicleDto dto, CancellationToken cancellationToken = default);
    Task ChangeStatusAsync(Guid id, VehicleStatus newStatus, CancellationToken cancellationToken = default);
    Task DeleteAsync(Guid id, CancellationToken cancellationToken = default);
    Task SellVehicleAsync(Guid vehicleId, SellVehicleDto dto, CancellationToken cancellationToken = default);
    Task AddPhotoAsync(VehiclePhoto photo, CancellationToken cancellationToken = default);
    Task<List<VehicleSummaryDto>> GetAllVehiclesAsync(CancellationToken cancellationToken = default);
}