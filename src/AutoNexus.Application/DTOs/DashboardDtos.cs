namespace AutoNexus.Application.DTOs;

public record DashboardKpiDto(
    int VehiclesForSale,
    int VehiclesInTrade,
    int VehiclesSold,
    decimal TotalStockCost,
    decimal TotalStockListedValue,
    decimal TotalStockFipeValue,
    decimal EstimatedPotentialMargin
);

public record RecentActivityDto(
    Guid VehicleId,
    string VehicleName,
    string OperationType,
    decimal Value,
    DateTime Date,
    string Status
);

public record DashboardSummaryDto(
    DashboardKpiDto Kpis,
    IEnumerable<RecentActivityDto> RecentActivities
);
