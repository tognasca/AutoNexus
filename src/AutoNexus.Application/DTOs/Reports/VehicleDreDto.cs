using System;
using System.Collections.Generic;

namespace AutoNexus.Application.DTOs.Reports;
public record VehicleDreDto(
    Guid VehicleId,
    string Brand,
    string Model,
    string? Plate,
    string Status,
    decimal PurchaseValue,
    decimal TotalDirectCosts,
    decimal TotalCostBase,
    decimal TargetOrSaleValue,
    decimal ProfitOrMargin,
    decimal MarginPercentage,
    int DaysInStock,
    IEnumerable<CostDetailDto> Costs,
    string? SoldByName = null,
    DateTime? SoldAt = null
);