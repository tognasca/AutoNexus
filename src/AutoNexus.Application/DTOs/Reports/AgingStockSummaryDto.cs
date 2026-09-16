namespace AutoNexus.Application.DTOs.Reports;
public record AgingStockSummaryDto(
    int TotalInStock,
    int NormalCount,      // < 30 dias
    int AttentionCount,   // 30-59 dias
    int WarningCount,     // 60-89 dias
    int CriticalCount,    // 90+ dias
    IEnumerable<AgingVehicleDto> Vehicles
);