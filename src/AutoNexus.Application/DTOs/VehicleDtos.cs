using AutoNexus.Domain.Enums;

namespace AutoNexus.Application.DTOs;

public record VehicleDto(
    Guid Id,
    Guid VehicleTypeId,
    string VehicleTypeName,
    string Brand,
    string Model,
    string? Version,
    int ManufacturingYear,
    int ModelYear,
    string? Plate,
    string? Chassis,
    string? Renavam,
    int Mileage,
    string? Color,
    int Fuel,
    int Transmission,
    decimal PurchaseValue,
    decimal? ListedValue,
    decimal? SaleValue,
    int Status,
    string? Notes,
    string? MainPhotoUrl,
    DateTime CreatedAt
);
public record VehiclePhotoDto(
    Guid Id,
    string FileName,
    string StoragePath,
    bool IsMain,
    int Order
);

public record VehicleCostDto(
    Guid Id,
    Guid CostCategoryId,
    string CostCategoryName,
    string Description,
    decimal Value,
    DateTime CostDate
);
public record VehicleDetailDto(
    Guid Id,
    Guid VehicleTypeId,
    string VehicleTypeName,
    string Brand,
    string Model,
    string? Version,
    int ManufacturingYear,
    int ModelYear,
    string? Plate,
    string? Chassis,
    string? Renavam,
    int Mileage,
    string? Color,
    FuelType? Fuel,
    TransmissionType? Transmission,
    VehicleStatus Status,
    decimal PurchaseValue,
    decimal? ListedValue,
    decimal? SaleValue,
    decimal TotalCost,
    string? Notes,
    DateTime CreatedAt,
    DateTime? UpdatedAt,
    IEnumerable<VehiclePhotoDto> Photos,
    IEnumerable<VehicleCostDto> Costs,
    IEnumerable<VehicleDocumentDto>? Documents = null
);

public record CreateVehicleDto(
    Guid VehicleTypeId,
    string Brand,
    string Model,
    string? Version,
    int ManufacturingYear,
    int ModelYear,
    string? Plate,
    string? Chassis,
    string? Renavam,
    int Mileage,
    string? Color,
    FuelType? Fuel,
    TransmissionType? Transmission,
    decimal PurchaseValue,
    decimal? ListedValue,
    string? Notes
);

public record UpdateVehicleDto(
    Guid VehicleTypeId,
    string Brand,
    string Model,
    string? Version,
    int ManufacturingYear,
    int ModelYear,
    string? Plate,
    string? Chassis,
    string? Renavam,
    int Mileage,
    string? Color,
    FuelType Fuel,
    TransmissionType Transmission,
    decimal PurchaseValue,
    decimal? ListedValue,
    decimal? SaleValue, // Permite atualização do valor de venda na edição
    VehicleStatus Status,
    string? Notes
);

public record VehicleFilterDto(
    int Page = 1,
    int PageSize = 12,
    Guid? VehicleTypeId = null,
    VehicleStatus? Status = null,
    string? Search = null,
    decimal? MinPrice = null,
    decimal? MaxPrice = null,
    int? MinYear = null,
    int? MaxYear = null
);