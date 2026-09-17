using AutoNexus.Domain.Enums;

namespace AutoNexus.Application.DTOs;

public class VehicleSummaryDto
{
    public Guid Id { get; set; }
    public Guid VehicleTypeId { get; set; }
    public string VehicleTypeName { get; set; } = string.Empty;
    public string Brand { get; set; } = string.Empty;
    public string Model { get; set; } = string.Empty;
    public string? Version { get; set; }
    public int ManufacturingYear { get; set; }
    public int ModelYear { get; set; }
    public string? Plate { get; set; }
    public int Mileage { get; set; }
    public string? Color { get; set; }
    public VehicleStatus Status { get; set; }
    public decimal PurchaseValue { get; set; }
    public decimal? ListedValue { get; set; }
    public decimal? SaleValue { get; set; }
    public string? MainPhotoUrl { get; set; }
    public DateTime CreatedAt { get; set; }

    public VehicleSummaryDto() { }

    public VehicleSummaryDto(
        Guid id,
        Guid vehicleTypeId,
        string vehicleTypeName,
        string brand,
        string model,
        string? version,
        int manufacturingYear,
        int modelYear,
        string? plate,
        int mileage,
        string? color,
        VehicleStatus status,
        decimal purchaseValue,
        decimal? listedValue,
        decimal? saleValue,
        string? mainPhotoUrl,
        DateTime createdAt)
    {
        Id = id;
        VehicleTypeId = vehicleTypeId;
        VehicleTypeName = vehicleTypeName;
        Brand = brand;
        Model = model;
        Version = version;
        ManufacturingYear = manufacturingYear;
        ModelYear = modelYear;
        Plate = plate;
        Mileage = mileage;
        Color = color;
        Status = status;
        PurchaseValue = purchaseValue;
        ListedValue = listedValue;
        SaleValue = saleValue;
        MainPhotoUrl = mainPhotoUrl;
        CreatedAt = createdAt;
    }
}