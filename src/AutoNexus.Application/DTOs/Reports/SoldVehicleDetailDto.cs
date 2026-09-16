
namespace AutoNexus.Application.DTOs.Reports;

public record SoldVehicleDetailDto(
    Guid VehicleId,
    string Brand,
    string Model,
    string? Plate,
    decimal SaleValue,
    string SoldByName,
    DateTime SoldAt
);