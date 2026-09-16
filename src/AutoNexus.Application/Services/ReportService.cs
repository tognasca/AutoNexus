
using AutoNexus.Application.DTOs.Reports;
using AutoNexus.Application.Interfaces;
using AutoNexus.Domain.Entities;
using AutoNexus.Domain.Enums;
using AutoNexus.Domain.Interfaces;

namespace AutoNexus.Application.Services;

public class ReportService : IReportService
{
    private readonly IVehicleRepository _vehicleRepository;
    private readonly IUserRepository _userRepository;

    public ReportService(IVehicleRepository vehicleRepository, IUserRepository userRepository)
    {
        _vehicleRepository = vehicleRepository;
        _userRepository = userRepository;
    }

    public async Task<DreSummaryDto> GetVehicleDreReportAsync(CancellationToken cancellationToken = default)
    {
        var (vehicles, _) = await _vehicleRepository.GetPagedAsync(
            page: 1,
            pageSize: 10000,
            cancellationToken: cancellationToken);

        var vehicleList = vehicles?.ToList() ?? new List<Vehicle>();
        var usersList = await _userRepository.GetAllAsync(cancellationToken);
        var usersDict = usersList?.ToDictionary(u => u.Id, u => u.Name) ?? new Dictionary<Guid, string>();

        var dreItems = new List<VehicleDreDto>();

        foreach (var vehicle in vehicleList)
        {
            var costsList = vehicle.Costs?.Select(c => new CostDetailDto(
                Description: c.Description,
                CategoryName: c.CostCategory?.Name ?? "Geral",
                Value: c.Value,
                Date: c.CostDate
            )).ToList() ?? new List<CostDetailDto>();

            var totalDirectCosts = costsList.Sum(c => c.Value);
            var purchaseValue = vehicle.PurchaseValue;
            var totalCostBase = purchaseValue + totalDirectCosts;

            var revenueValue = vehicle.Status == VehicleStatus.Vendido
                ? (vehicle.SaleValue ?? vehicle.ListedValue ?? purchaseValue)
                : (vehicle.ListedValue ?? purchaseValue);

            var profit = revenueValue - totalCostBase;
            var marginPct = revenueValue > 0 ? (profit / revenueValue) * 100m : 0m;

            var daysInStock = (DateTime.UtcNow - vehicle.CreatedAt).Days;
            if (daysInStock < 0) daysInStock = 0;

            // Mapeamento e Fallback do Vendedor
            string? soldByName = vehicle.SoldByUser?.Name;

            if (string.IsNullOrEmpty(soldByName) && vehicle.SoldByUserId.HasValue)
            {
                usersDict.TryGetValue(vehicle.SoldByUserId.Value, out soldByName);
            }

            // Se foi vendido mas não tinha SoldByUserId (venda antiga de teste)
            if (string.IsNullOrEmpty(soldByName) && vehicle.Status == VehicleStatus.Vendido)
            {
                var firstSeller = usersList?.FirstOrDefault(u => u.Profile == UserProfile.Vendedor || u.Profile == UserProfile.Admin);
                soldByName = firstSeller?.Name ?? "Vendedor Sistema";
            }

            // Data/Hora da Venda (se nulo, utiliza a data da última atualização)
            DateTime? soldAt = vehicle.SoldAt ?? (vehicle.Status == VehicleStatus.Vendido ? vehicle.UpdatedAt : null);

            dreItems.Add(new VehicleDreDto(
                VehicleId: vehicle.Id,
                Brand: vehicle.Brand,
                Model: vehicle.Model,
                Plate: vehicle.Plate,
                Status: vehicle.Status.ToString(),
                PurchaseValue: purchaseValue,
                TotalDirectCosts: totalDirectCosts,
                TotalCostBase: totalCostBase,
                TargetOrSaleValue: revenueValue,
                ProfitOrMargin: profit,
                MarginPercentage: Math.Round(marginPct, 2),
                DaysInStock: daysInStock,
                Costs: costsList,
                SoldByName: soldByName,
                SoldAt: soldAt
            ));
        }

        var totalRevenue = dreItems.Sum(d => d.TargetOrSaleValue);
        var totalPurchaseCosts = dreItems.Sum(d => d.PurchaseValue);
        var totalDirectExpenses = dreItems.Sum(d => d.TotalDirectCosts);
        var totalCostBaseAll = dreItems.Sum(d => d.TotalCostBase);
        var totalNetProfit = dreItems.Sum(d => d.ProfitOrMargin);

        var avgMargin = totalRevenue > 0 ? (totalNetProfit / totalRevenue) * 100m : 0m;

        return new DreSummaryDto(
            TotalRevenue: totalRevenue,
            TotalPurchaseCosts: totalPurchaseCosts,
            TotalDirectExpenses: totalDirectExpenses,
            TotalCostBase: totalCostBaseAll,
            TotalNetProfit: totalNetProfit,
            AverageMarginPercentage: Math.Round(avgMargin, 2),
            TotalVehiclesCount: dreItems.Count,
            Vehicles: dreItems.OrderByDescending(d => d.ProfitOrMargin)
        );
    }

    public async Task<AgingStockSummaryDto> GetAgingStockReportAsync(CancellationToken cancellationToken = default)
    {
        var (vehicles, _) = await _vehicleRepository.GetPagedAsync(
            page: 1,
            pageSize: 10000,
            cancellationToken: cancellationToken);

        var vehicleList = vehicles?.ToList() ?? new List<Vehicle>();
        var stock = vehicleList.Where(v => v.Status != VehicleStatus.Vendido).ToList();
        var agingList = new List<AgingVehicleDto>();

        foreach (var v in stock)
        {
            var days = (DateTime.UtcNow - v.CreatedAt).Days;
            if (days < 0) days = 0;

            string level = days switch
            {
                >= 90 => "Critical",
                >= 60 => "Warning",
                >= 30 => "Attention",
                _ => "Normal"
            };

            agingList.Add(new AgingVehicleDto(
                VehicleId: v.Id,
                Brand: v.Brand,
                Model: v.Model,
                Plate: v.Plate,
                Price: v.ListedValue ?? v.PurchaseValue,
                DaysInStock: days,
                AlertLevel: level
            ));
        }

        return new AgingStockSummaryDto(
            TotalInStock: stock.Count,
            NormalCount: agingList.Count(a => a.AlertLevel == "Normal"),
            AttentionCount: agingList.Count(a => a.AlertLevel == "Attention"),
            WarningCount: agingList.Count(a => a.AlertLevel == "Warning"),
            CriticalCount: agingList.Count(a => a.AlertLevel == "Critical"),
            Vehicles: agingList.OrderByDescending(a => a.DaysInStock)
        );
    }

    public async Task<IEnumerable<SellerCommissionDto>> GetSellerCommissionsAsync(CancellationToken cancellationToken = default)
    {
        var (vehicles, _) = await _vehicleRepository.GetPagedAsync(
            page: 1, pageSize: 10000, cancellationToken: cancellationToken);

        var vehicleList = vehicles?.ToList() ?? new List<Vehicle>();
        var soldVehicles = vehicleList.Where(v => v.Status == VehicleStatus.Vendido).ToList();

        var usersList = await _userRepository.GetAllAsync(cancellationToken);
        var sellers = usersList?.ToList() ?? new List<User>();

        var commissions = new List<SellerCommissionDto>();

        foreach (var seller in sellers)
        {
            // Veículos em que este vendedor foi o responsável pela venda
            var sellerSales = soldVehicles.Where(v => v.SoldByUserId == seller.Id).ToList();

            if (!sellerSales.Any()) continue;

            decimal totalVolume = sellerSales.Sum(v => v.SaleValue ?? v.ListedValue ?? v.PurchaseValue);
            decimal totalProfit = sellerSales.Sum(v =>
            {
                var saleVal = v.SaleValue ?? v.ListedValue ?? v.PurchaseValue;
                var costVal = v.PurchaseValue + (v.Costs?.Sum(c => c.Value) ?? 0m);
                return saleVal - costVal;
            });

            decimal defaultCommissionRate = 5.0m;
            decimal commissionAmount = totalProfit > 0 ? (totalProfit * (defaultCommissionRate / 100m)) : 0m;

            var soldDetails = sellerSales.Select(v => new SoldVehicleDetailDto(
                VehicleId: v.Id,
                Brand: v.Brand,
                Model: v.Model,
                Plate: v.Plate,
                SaleValue: v.SaleValue ?? v.ListedValue ?? v.PurchaseValue,
                SoldByName: v.SoldByUser?.Name ?? seller.Name,
                SoldAt: v.SoldAt ?? v.UpdatedAt ?? DateTime.UtcNow
            )).OrderByDescending(s => s.SoldAt).ToList();

            commissions.Add(new SellerCommissionDto(
                SellerId: seller.Id,
                SellerName: seller.Name,
                TotalSalesCount: sellerSales.Count,
                TotalSalesVolume: totalVolume,
                TotalProfitGenerated: totalProfit,
                CommissionRatePercentage: defaultCommissionRate,
                TotalCommissionAmount: Math.Round(commissionAmount, 2),
                SoldVehicles: soldDetails
            ));
        }

        return commissions.OrderByDescending(c => c.TotalSalesVolume);
    }
}