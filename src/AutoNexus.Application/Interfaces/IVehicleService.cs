using AutoNexus.Application.DTOs;
using AutoNexus.Application.DTOs.Common;
using AutoNexus.Domain.Entities;
using AutoNexus.Domain.Enums;

namespace AutoNexus.Application.Interfaces;

public interface IVehicleService
{
    Task<IEnumerable<VehicleSummaryDto>> GetByListAsync(CancellationToken cancellationToken = default);
    Task<List<VehicleSummaryDto>> GetAllVehiclesAsync(CancellationToken cancellationToken = default);
    Task<VehicleDetailDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<PagedResultDto<VehicleSummaryDto>> GetAllPagedAsync(VehicleFilterDto filter, CancellationToken cancellationToken = default);
    Task<Guid> CreateAsync(CreateVehicleDto dto, CancellationToken cancellationToken = default);
    Task UpdateAsync(Guid id, UpdateVehicleDto dto, CancellationToken cancellationToken = default);
    Task ChangeStatusAsync(Guid id, VehicleStatus newStatus, CancellationToken cancellationToken = default);
    Task DeleteAsync(Guid id, CancellationToken cancellationToken = default);
    Task SellVehicleAsync(Guid vehicleId, SellVehicleDto dto, CancellationToken cancellationToken = default);
    
    // Gestão de Fotos
    Task AddPhotoAsync(VehiclePhoto photo, CancellationToken cancellationToken = default);
    Task SetMainPhotoAsync(Guid vehicleId, Guid photoId, CancellationToken cancellationToken = default);
    Task DeletePhotoAsync(Guid vehicleId, Guid photoId, CancellationToken cancellationToken = default);

    // Gestão de Documentos
    Task AddDocumentAsync(VehicleDocument document, CancellationToken cancellationToken = default);
    Task ToggleDocumentCatalogAsync(Guid vehicleId, Guid documentId, CancellationToken cancellationToken = default);
    Task DeleteDocumentAsync(Guid vehicleId, Guid documentId, CancellationToken cancellationToken = default);

    // Gestão de Custos
    Task AddCostAsync(Guid vehicleId, Guid costCategoryId, string description, decimal value, DateTime costDate, CancellationToken cancellationToken = default);
    Task DeleteCostAsync(Guid vehicleId, Guid costId, CancellationToken cancellationToken = default);
}