using AutoNexus.Application.DTOs;
using AutoNexus.Application.DTOs.Common;
using AutoNexus.Application.Interfaces;
using AutoNexus.Domain.Entities;
using AutoNexus.Domain.Enums;
using AutoNexus.Domain.Interfaces;

namespace AutoNexus.Application.Services;

public class VehicleService : IVehicleService
{
    private readonly IVehicleRepository _vehicleRepository;
    private readonly ILookupRepository _lookupRepository;
    private readonly IUnitOfWork _unitOfWork;

    public VehicleService(
        IVehicleRepository vehicleRepository,
        ILookupRepository lookupRepository,
        IUnitOfWork unitOfWork)
    {
        _vehicleRepository = vehicleRepository;
        _lookupRepository = lookupRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<IEnumerable<VehicleSummaryDto>> GetByListAsync(CancellationToken cancellationToken = default)
    {
        var vehicles = await _vehicleRepository.GetByListAsync(cancellationToken);
        var availableVehicles = vehicles.Where(v => v.Status == VehicleStatus.AVenda);

        return availableVehicles.Select(v => new VehicleSummaryDto
        {
            Id = v.Id,
            VehicleTypeId = v.VehicleTypeId,
            VehicleTypeName = v.VehicleType?.Name ?? string.Empty,
            Brand = v.Brand,
            Model = v.Model,
            Version = v.Version,
            ManufacturingYear = v.ManufacturingYear,
            ModelYear = v.ModelYear,
            Plate = v.Plate,
            Mileage = v.Mileage,
            Color = v.Color,
            Status = v.Status,
            PurchaseValue = v.PurchaseValue,
            ListedValue = v.ListedValue,
            SaleValue = v.SaleValue,
            MainPhotoUrl = v.Photos?.FirstOrDefault(p => p.IsMain)?.StoragePath ?? v.Photos?.FirstOrDefault()?.StoragePath,
            CreatedAt = v.CreatedAt
        });
    }

    public async Task<List<VehicleSummaryDto>> GetAllVehiclesAsync(CancellationToken cancellationToken = default)
    {
        var vehicles = await _vehicleRepository.GetAllAsync(cancellationToken);

        return vehicles.Select(v => new VehicleSummaryDto
        {
            Id = v.Id,
            VehicleTypeId = v.VehicleTypeId,
            VehicleTypeName = v.VehicleType?.Name ?? string.Empty,
            Brand = v.Brand,
            Model = v.Model,
            Version = v.Version,
            ManufacturingYear = v.ManufacturingYear,
            ModelYear = v.ModelYear,
            Plate = v.Plate,
            Mileage = v.Mileage,
            Color = v.Color,
            Status = v.Status,
            PurchaseValue = v.PurchaseValue,
            ListedValue = v.ListedValue,
            SaleValue = v.SaleValue,
            MainPhotoUrl = v.Photos?.FirstOrDefault(p => p.IsMain)?.StoragePath ?? v.Photos?.FirstOrDefault()?.StoragePath,
            CreatedAt = v.CreatedAt
        }).ToList();
    }

    public async Task<VehicleDetailDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var v = await _vehicleRepository.GetByIdAsync(id, includeDetails: true, cancellationToken);
        if (v == null) return null;

        return new VehicleDetailDto(
            v.Id,
            v.VehicleTypeId,
            v.VehicleType?.Name ?? string.Empty,
            v.Brand,
            v.Model,
            v.Version,
            v.ManufacturingYear,
            v.ModelYear,
            v.Plate,
            v.Chassis,
            v.Renavam,
            v.Mileage,
            v.Color,
            v.Fuel,
            v.Transmission,
            v.Status,
            v.PurchaseValue,
            v.ListedValue,
            v.SaleValue,
            v.GetTotalCost(),
            v.Notes,
            v.CreatedAt,
            v.UpdatedAt,
            v.Photos.Select(p => new VehiclePhotoDto(p.Id, p.FileName, p.StoragePath, p.IsMain, p.Order)),
            v.Costs.Select(c => new VehicleCostDto(c.Id, c.CostCategoryId, c.CostCategory?.Name ?? string.Empty, c.Description, c.Value, c.CostDate)),
            v.Documents?.Select(d => new VehicleDocumentDto(d.Id, d.DocumentCategoryId, d.DocumentCategory?.Name ?? "Laudo", d.Name, d.FileName, d.StoragePath, d.ShowInCatalog, d.CreatedAt))
        );
    }

    public async Task<PagedResultDto<VehicleSummaryDto>> GetAllPagedAsync(VehicleFilterDto filter, CancellationToken cancellationToken = default)
    {
        var (items, total) = await _vehicleRepository.GetPagedAsync(
            filter.Page,
            filter.PageSize,
            filter.VehicleTypeId,
            filter.Status,
            filter.Search,
            filter.MinPrice,
            filter.MaxPrice,
            filter.MinYear,
            filter.MaxYear,
            cancellationToken);

        var dtos = items.Select(v => new VehicleSummaryDto
        {
            Id = v.Id,
            VehicleTypeId = v.VehicleTypeId,
            VehicleTypeName = v.VehicleType?.Name ?? string.Empty,
            Brand = v.Brand,
            Model = v.Model,
            Version = v.Version,
            ManufacturingYear = v.ManufacturingYear,
            ModelYear = v.ModelYear,
            Plate = v.Plate,
            Mileage = v.Mileage,
            Color = v.Color,
            Status = v.Status,
            PurchaseValue = v.PurchaseValue,
            ListedValue = v.ListedValue,
            SaleValue = v.SaleValue,
            MainPhotoUrl = v.Photos?.FirstOrDefault(p => p.IsMain)?.StoragePath ?? v.Photos?.FirstOrDefault()?.StoragePath,
            CreatedAt = v.CreatedAt
        }).ToList();

        return new PagedResultDto<VehicleSummaryDto>(dtos, total, filter.Page, filter.PageSize);
    }

    public async Task<Guid> CreateAsync(CreateVehicleDto dto, CancellationToken cancellationToken = default)
    {
        var vehicleType = await _lookupRepository.GetVehicleTypeByIdAsync(dto.VehicleTypeId, cancellationToken)
            ?? throw new ArgumentException("Tipo de veículo inválido.");

        var vehicle = new Vehicle(
            dto.VehicleTypeId,
            dto.Brand,
            dto.Model,
            dto.ManufacturingYear,
            dto.ModelYear,
            dto.PurchaseValue
        );

        if (dto.ListedValue.HasValue)
            vehicle.UpdateListedValue(dto.ListedValue.Value);

        typeof(Vehicle).GetProperty(nameof(Vehicle.Version))?.SetValue(vehicle, dto.Version?.Trim());
        typeof(Vehicle).GetProperty(nameof(Vehicle.Plate))?.SetValue(vehicle, dto.Plate?.Trim().ToUpper());
        typeof(Vehicle).GetProperty(nameof(Vehicle.Chassis))?.SetValue(vehicle, dto.Chassis?.Trim().ToUpper());
        typeof(Vehicle).GetProperty(nameof(Vehicle.Renavam))?.SetValue(vehicle, dto.Renavam?.Trim().ToUpper());
        typeof(Vehicle).GetProperty(nameof(Vehicle.Mileage))?.SetValue(vehicle, dto.Mileage);
        typeof(Vehicle).GetProperty(nameof(Vehicle.Color))?.SetValue(vehicle, dto.Color?.Trim());
        typeof(Vehicle).GetProperty(nameof(Vehicle.Fuel))?.SetValue(vehicle, dto.Fuel);
        typeof(Vehicle).GetProperty(nameof(Vehicle.Transmission))?.SetValue(vehicle, dto.Transmission);
        typeof(Vehicle).GetProperty(nameof(Vehicle.Notes))?.SetValue(vehicle, dto.Notes?.Trim());

        await _vehicleRepository.AddAsync(vehicle, cancellationToken);
        await _unitOfWork.CommitAsync(cancellationToken);

        return vehicle.Id;
    }

    public async Task UpdateAsync(Guid id, UpdateVehicleDto dto, CancellationToken cancellationToken = default)
    {
        var vehicle = await _vehicleRepository.GetByIdAsync(id, false, cancellationToken)
            ?? throw new KeyNotFoundException("Veículo não encontrado.");

        vehicle.UpdatePurchaseValue(dto.PurchaseValue);
        vehicle.UpdateListedValue(dto.ListedValue);

        if (dto.Status == VehicleStatus.Vendido && dto.SaleValue.HasValue && dto.SaleValue.Value > 0)
        {
            vehicle.UpdateSaleValue(dto.SaleValue.Value);
        }

        vehicle.UpdateDetails(
            dto.VehicleTypeId,
            dto.Brand,
            dto.Model,
            dto.Version,
            dto.ManufacturingYear,
            dto.ModelYear,
            dto.Plate,
            dto.Chassis,
            dto.Renavam,
            dto.Mileage,
            dto.Color,
            dto.Fuel,
            dto.Transmission,
            dto.Notes
        );

        if (dto.Status != vehicle.Status)
        {
            vehicle.ChangeStatus(dto.Status);
        }

        await _vehicleRepository.UpdateAsync(vehicle, cancellationToken);
        await _unitOfWork.CommitAsync(cancellationToken);
    }

    public async Task ChangeStatusAsync(Guid id, VehicleStatus newStatus, CancellationToken cancellationToken = default)
    {
        var vehicle = await _vehicleRepository.GetByIdAsync(id, false, cancellationToken)
            ?? throw new KeyNotFoundException("Veículo não encontrado.");

        vehicle.ChangeStatus(newStatus);
        await _vehicleRepository.UpdateAsync(vehicle, cancellationToken);
        await _unitOfWork.CommitAsync(cancellationToken);
    }

    public async Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var vehicle = await _vehicleRepository.GetByIdAsync(id, false, cancellationToken)
            ?? throw new KeyNotFoundException("Veículo não encontrado.");

        _vehicleRepository.Delete(vehicle);
        await _unitOfWork.CommitAsync(cancellationToken);
    }

    public async Task SellVehicleAsync(Guid vehicleId, SellVehicleDto dto, CancellationToken cancellationToken = default)
    {
        var vehicle = await _vehicleRepository.GetByIdAsync(vehicleId, false, cancellationToken)
             ?? throw new KeyNotFoundException("Veículo não encontrado.");

        vehicle.MarkAsSold(dto.SaleValue, dto.SoldByUserId, dto.SoldAt);

        await _vehicleRepository.UpdateAsync(vehicle, cancellationToken);
        await _unitOfWork.CommitAsync(cancellationToken);
    }

    // --- GESTÃO DE FOTOS ---
    public async Task AddPhotoAsync(VehiclePhoto photo, CancellationToken cancellationToken = default)
    {
        var vehicle = await _vehicleRepository.GetByIdAsync(photo.VehicleId, true, cancellationToken)
            ?? throw new KeyNotFoundException("Veículo não encontrado.");

        vehicle.Photos.Add(photo);
        await _vehicleRepository.UpdateAsync(vehicle, cancellationToken);
        await _unitOfWork.CommitAsync(cancellationToken);
    }

    public async Task SetMainPhotoAsync(Guid vehicleId, Guid photoId, CancellationToken cancellationToken = default)
    {
        var vehicle = await _vehicleRepository.GetByIdAsync(vehicleId, true, cancellationToken)
            ?? throw new KeyNotFoundException("Veículo não encontrado.");

        foreach (var photo in vehicle.Photos)
        {
            if (photo.Id == photoId)
                photo.SetAsMain();
            else
                photo.UnsetMain();
        }

        await _vehicleRepository.UpdateAsync(vehicle, cancellationToken);
        await _unitOfWork.CommitAsync(cancellationToken);
    }

    public async Task DeletePhotoAsync(Guid vehicleId, Guid photoId, CancellationToken cancellationToken = default)
    {
        var vehicle = await _vehicleRepository.GetByIdAsync(vehicleId, true, cancellationToken)
            ?? throw new KeyNotFoundException("Veículo não encontrado.");

        var photo = vehicle.Photos.FirstOrDefault(p => p.Id == photoId);
        if (photo != null)
        {
            vehicle.Photos.Remove(photo);
            await _vehicleRepository.UpdateAsync(vehicle, cancellationToken);
            await _unitOfWork.CommitAsync(cancellationToken);
        }
    }

    // --- GESTÃO DE DOCUMENTOS ---
    public async Task AddDocumentAsync(VehicleDocument document, CancellationToken cancellationToken = default)
    {
        var vehicle = await _vehicleRepository.GetByIdAsync(document.VehicleId, true, cancellationToken)
            ?? throw new KeyNotFoundException("Veículo não encontrado.");

        vehicle.Documents.Add(document);
        await _vehicleRepository.UpdateAsync(vehicle, cancellationToken);
        await _unitOfWork.CommitAsync(cancellationToken);
    }

    public async Task ToggleDocumentCatalogAsync(Guid vehicleId, Guid documentId, CancellationToken cancellationToken = default)
    {
        var vehicle = await _vehicleRepository.GetByIdAsync(vehicleId, true, cancellationToken)
            ?? throw new KeyNotFoundException("Veículo não encontrado.");

        var doc = vehicle.Documents.FirstOrDefault(d => d.Id == documentId);
        if (doc != null)
        {
            doc.ToggleShowInCatalog(!doc.ShowInCatalog);
            await _vehicleRepository.UpdateAsync(vehicle, cancellationToken);
            await _unitOfWork.CommitAsync(cancellationToken);
        }
    }

    public async Task DeleteDocumentAsync(Guid vehicleId, Guid documentId, CancellationToken cancellationToken = default)
    {
        var vehicle = await _vehicleRepository.GetByIdAsync(vehicleId, true, cancellationToken)
            ?? throw new KeyNotFoundException("Veículo não encontrado.");

        var doc = vehicle.Documents.FirstOrDefault(d => d.Id == documentId);
        if (doc != null)
        {
            vehicle.Documents.Remove(doc);
            await _vehicleRepository.UpdateAsync(vehicle, cancellationToken);
            await _unitOfWork.CommitAsync(cancellationToken);
        }
    }

    // --- GESTÃO DE CUSTOS ---
    public async Task AddCostAsync(Guid vehicleId, Guid costCategoryId, string description, decimal value, DateTime costDate, CancellationToken cancellationToken = default)
    {
        var vehicle = await _vehicleRepository.GetByIdAsync(vehicleId, true, cancellationToken)
            ?? throw new KeyNotFoundException("Veículo não encontrado.");

        var cost = new Cost(vehicleId, costCategoryId, description, value, costDate, Guid.Empty); // ResponsibleUserId is set to Guid.Empty for now
        vehicle.Costs.Add(cost);

        await _vehicleRepository.UpdateAsync(vehicle, cancellationToken);
        await _unitOfWork.CommitAsync(cancellationToken);
    }

    public async Task DeleteCostAsync(Guid vehicleId, Guid costId, CancellationToken cancellationToken = default)
    {
        var vehicle = await _vehicleRepository.GetByIdAsync(vehicleId, true, cancellationToken)
            ?? throw new KeyNotFoundException("Veículo não encontrado.");

        var cost = vehicle.Costs.FirstOrDefault(c => c.Id == costId);
        if (cost != null)
        {
            vehicle.Costs.Remove(cost);
            await _vehicleRepository.UpdateAsync(vehicle, cancellationToken);
            await _unitOfWork.CommitAsync(cancellationToken);
        }
    }
}