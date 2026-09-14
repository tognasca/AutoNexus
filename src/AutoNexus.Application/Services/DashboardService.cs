using AutoNexus.Application.DTOs;
using AutoNexus.Application.Interfaces;
using AutoNexus.Domain.Enums;
using AutoNexus.Domain.Interfaces;

namespace AutoNexus.Application.Services;

public class DashboardService : IDashboardService
{
    private readonly IVehicleRepository _vehicleRepository;
    private readonly ITradeRepository _tradeRepository;

    public DashboardService(IVehicleRepository vehicleRepository, ITradeRepository tradeRepository)
    {
        _vehicleRepository = vehicleRepository;
        _tradeRepository = tradeRepository;
    }

    public async Task<DashboardSummaryDto> GetSummaryAsync(CancellationToken cancellationToken = default)
    {
        var (vehicles, _) = await _vehicleRepository.GetPagedAsync(1, 1000, cancellationToken: cancellationToken);
        var vehicleList = vehicles.ToList();

        var trades = await _tradeRepository.GetAllAsync(cancellationToken);
        var tradeList = trades.ToList();

        var activeStock = vehicleList.Where(v => v.Status != VehicleStatus.Vendido).ToList();

        var forSaleCount = vehicleList.Count(v => v.Status == VehicleStatus.AVenda);
        var inTradeCount = vehicleList.Count(v => v.Status == VehicleStatus.EmTroca);
        var soldCount = vehicleList.Count(v => v.Status == VehicleStatus.Vendido);

        var totalStockCost = activeStock.Sum(v => v.GetTotalCost());
        var totalStockListedValue = activeStock.Sum(v => v.ListedValue ?? v.PurchaseValue);

        var totalStockFipeValue = activeStock.Sum(v =>
            v.FipeHistories.OrderByDescending(f => f.ConsultationDate).FirstOrDefault()?.FipeValue ?? 0m
        );

        var estimatedMargin = totalStockListedValue - totalStockCost;

        var kpis = new DashboardKpiDto(
            forSaleCount,
            inTradeCount,
            soldCount,
            totalStockCost,
            totalStockListedValue,
            totalStockFipeValue,
            estimatedMargin
        );

        var recentActivities = vehicleList
            .Take(10)
            .Select(v => new RecentActivityDto(
                v.Id,
                $"{v.Brand} {v.Model}",
                v.Status == VehicleStatus.Vendido ? "Venda Concluída" : "Cadastro no Estoque",
                v.ListedValue ?? v.PurchaseValue,
                v.UpdatedAt ?? v.CreatedAt,
                v.Status.ToString()
            ))
            .OrderByDescending(a => a.Date)
            .ToList();

        return new DashboardSummaryDto(kpis, recentActivities);
    }
}
