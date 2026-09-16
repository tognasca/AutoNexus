using AutoNexus.Application.DTOs.Reports;

namespace AutoNexus.Application.Interfaces;

public interface IReportService
{
    Task<DreSummaryDto> GetVehicleDreReportAsync(CancellationToken cancellationToken = default);
    Task<AgingStockSummaryDto> GetAgingStockReportAsync(CancellationToken cancellationToken = default);
    Task<IEnumerable<SellerCommissionDto>> GetSellerCommissionsAsync(CancellationToken cancellationToken = default);
}