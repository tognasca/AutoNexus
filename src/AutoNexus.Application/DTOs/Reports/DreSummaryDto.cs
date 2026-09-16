namespace AutoNexus.Application.DTOs.Reports;

public record DreSummaryDto(
   decimal TotalRevenue,
    decimal TotalPurchaseCosts,
    decimal TotalDirectExpenses,
    decimal TotalCostBase,
    decimal TotalNetProfit,
    decimal AverageMarginPercentage,
    int TotalVehiclesCount,
    IEnumerable<VehicleDreDto> Vehicles
);