
using AutoNexus.Application.DTOs.Common;
using AutoNexus.Application.Interfaces;
using AutoNexus.Domain.Entities;
using AutoNexus.Domain.Enums;
using AutoNexus.Domain.Interfaces;
using AutoNexus.Application.DTOs;

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

        var dtos = items.Select(v => new VehicleSummaryDto(
            v.Id,
            v.VehicleTypeId,
            v.VehicleType?.Name ?? string.Empty,
            v.Brand,
            v.Model,
            v.Version,
            v.ManufacturingYear,
            v.ModelYear,
            v.Plate,
            v.Mileage,
            v.Color,
            v.Status,
            v.PurchaseValue,
            v.ListedValue,
            v.SaleValue,
            v.Photos.FirstOrDefault(p => p.IsMain)?.StoragePath,
            v.CreatedAt
        ));

        return new PagedResultDto<VehicleSummaryDto>
        {
            Items = dtos,
            TotalCount = total,
            Page = filter.Page,
            PageSize = filter.PageSize
        };
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
            v.Costs.Select(c => new VehicleCostDto(c.Id, c.CostCategoryId, c.CostCategory?.Name ?? string.Empty, c.Description, c.Value, c.CostDate))
        );
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

        // Campos complementares
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

        if (dto.ListedValue.HasValue)
            vehicle.UpdateListedValue(dto.ListedValue.Value);

        typeof(Vehicle).GetProperty(nameof(Vehicle.VehicleTypeId))?.SetValue(vehicle, dto.VehicleTypeId);
        typeof(Vehicle).GetProperty(nameof(Vehicle.Brand))?.SetValue(vehicle, dto.Brand.Trim());
        typeof(Vehicle).GetProperty(nameof(Vehicle.Model))?.SetValue(vehicle, dto.Model.Trim());
        typeof(Vehicle).GetProperty(nameof(Vehicle.Version))?.SetValue(vehicle, dto.Version?.Trim());
        typeof(Vehicle).GetProperty(nameof(Vehicle.ManufacturingYear))?.SetValue(vehicle, dto.ManufacturingYear);
        typeof(Vehicle).GetProperty(nameof(Vehicle.ModelYear))?.SetValue(vehicle, dto.ModelYear);
        typeof(Vehicle).GetProperty(nameof(Vehicle.Plate))?.SetValue(vehicle, dto.Plate?.Trim().ToUpper());
        typeof(Vehicle).GetProperty(nameof(Vehicle.Chassis))?.SetValue(vehicle, dto.Chassis?.Trim().ToUpper());
        typeof(Vehicle).GetProperty(nameof(Vehicle.Renavam))?.SetValue(vehicle, dto.Renavam?.Trim().ToUpper()); 
        typeof(Vehicle).GetProperty(nameof(Vehicle.Mileage))?.SetValue(vehicle, dto.Mileage);
        typeof(Vehicle).GetProperty(nameof(Vehicle.Color))?.SetValue(vehicle, dto.Color?.Trim());
        typeof(Vehicle).GetProperty(nameof(Vehicle.Fuel))?.SetValue(vehicle, dto.Fuel);
        typeof(Vehicle).GetProperty(nameof(Vehicle.Transmission))?.SetValue(vehicle, dto.Transmission);
        typeof(Vehicle).GetProperty(nameof(Vehicle.Notes))?.SetValue(vehicle, dto.Notes?.Trim());
        typeof(Vehicle).GetProperty(nameof(Vehicle.UpdatedAt))?.SetValue(vehicle, DateTime.UtcNow);

        _vehicleRepository.Update(vehicle);
        await _unitOfWork.CommitAsync(cancellationToken);
    }

    public async Task ChangeStatusAsync(Guid id, VehicleStatus newStatus, CancellationToken cancellationToken = default)
    {
        var vehicle = await _vehicleRepository.GetByIdAsync(id, false, cancellationToken)
            ?? throw new KeyNotFoundException("Veículo não encontrado.");

        vehicle.ChangeStatus(newStatus);
        _vehicleRepository.Update(vehicle);
        await _unitOfWork.CommitAsync(cancellationToken);
    }

    public async Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var vehicle = await _vehicleRepository.GetByIdAsync(id, false, cancellationToken)
            ?? throw new KeyNotFoundException("Veículo não encontrado.");

        _vehicleRepository.Delete(vehicle);
        await _unitOfWork.CommitAsync(cancellationToken);
    }
}