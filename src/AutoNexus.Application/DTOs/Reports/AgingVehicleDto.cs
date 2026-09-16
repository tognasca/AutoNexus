namespace AutoNexus.Application.DTOs.Reports;
public record AgingVehicleDto(
    Guid VehicleId,
    string Brand,
    string Model,
    string? Plate,
    decimal Price,
    int DaysInStock,
    string AlertLevel // "Normal", "Attention", "Warning", "Critical"
);