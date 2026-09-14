namespace AutoNexus.Application.DTOs;

public record CostDto(
    Guid Id,
    Guid VehicleId,
    Guid CostCategoryId,
    string CostCategoryName,
    string Description,
    decimal Value,
    DateTime CostDate,
    Guid ResponsibleUserId,
    string? Notes,
    DateTime CreatedAt
);

public record VehicleCostSummaryDto(
    Guid VehicleId,
    decimal PurchaseValue,
    decimal TotalAdditionalCosts,
    decimal TotalVehicleCost,
    IEnumerable<CostDto> Costs
);

public record CreateCostDto(
    Guid CostCategoryId,
    string Description,
    decimal Value,
    DateTime CostDate,
    string? Notes
);
