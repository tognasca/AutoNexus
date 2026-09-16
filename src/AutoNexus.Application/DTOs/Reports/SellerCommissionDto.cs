namespace AutoNexus.Application.DTOs.Reports;

public record SellerCommissionDto(
    Guid SellerId,
    string SellerName,
    int TotalSalesCount,
    decimal TotalSalesVolume,
    decimal TotalProfitGenerated,
    decimal CommissionRatePercentage,
    decimal TotalCommissionAmount,
    IEnumerable<SoldVehicleDetailDto> SoldVehicles
);