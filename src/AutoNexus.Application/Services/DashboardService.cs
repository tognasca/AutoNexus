using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using AutoNexus.Application.DTOs;
using AutoNexus.Application.Interfaces;
using AutoNexus.Domain.Entities;
using AutoNexus.Domain.Enums;
using AutoNexus.Domain.Interfaces;

namespace AutoNexus.Application.Services;

public class DashboardService : IDashboardService
{
    private readonly IVehicleRepository _vehicleRepository;

    public DashboardService(
        IVehicleRepository vehicleRepository)
    {
        _vehicleRepository = vehicleRepository;
    }

    public async Task<DashboardSummaryDto> GetSummaryAsync(
        CancellationToken cancellationToken = default)
    {
        try
        {
            var (vehicles, _) = await _vehicleRepository.GetPagedAsync(
                page: 1,
                pageSize: 10000,
                cancellationToken: cancellationToken);

            var vehicleList = vehicles?.ToList() ?? new List<Vehicle>();

            var vehiclesForSale = vehicleList
                .Count(v => v.Status == VehicleStatus.AVenda);

            var vehiclesInTrade = vehicleList
                .Count(v => v.Status == VehicleStatus.EmTroca);

            var vehiclesSold = vehicleList
                .Count(v => v.Status == VehicleStatus.Vendido);

            var stockVehicles = vehicleList
                .Where(v => v.Status != VehicleStatus.Vendido)
                .ToList();

            var totalStockCost = stockVehicles.Sum(v =>
                v.PurchaseValue + (v.Costs != null ? v.Costs.Sum(c => c.Value) : 0m));

            var totalStockListedValue = stockVehicles.Sum(v => v.ListedValue ?? 0m);

            var totalStockFipeValue = stockVehicles.Sum(GetLatestFipeValue);

            var estimatedPotentialMargin = totalStockListedValue - totalStockCost;

            var kpis = new DashboardKpiDto(
                VehiclesForSale: vehiclesForSale,
                VehiclesInTrade: vehiclesInTrade,
                VehiclesSold: vehiclesSold,
                TotalStockCost: totalStockCost,
                TotalStockListedValue: totalStockListedValue,
                TotalStockFipeValue: totalStockFipeValue,
                EstimatedPotentialMargin: estimatedPotentialMargin
            );

            var recentActivities = new List<RecentActivityDto>();

            foreach (var vehicle in vehicleList)
            {
                if (vehicle.FipeHistories == null) continue;

                foreach (var history in vehicle.FipeHistories)
                {
                    recentActivities.Add(new RecentActivityDto(
                        VehicleId: vehicle.Id,
                        VehicleName: $"{vehicle.Brand} {vehicle.Model}".Trim(),
                        OperationType: "Consulta FIPE",
                        Value: history.FipeValue,
                        Date: history.ConsultationDate,
                        Status: vehicle.Status.ToString()
                    ));
                }
            }

            var orderedActivities = recentActivities
                .OrderByDescending(a => a.Date)
                .Take(10)
                .ToList();

            return new DashboardSummaryDto(
                Kpis: kpis,
                RecentActivities: orderedActivities
            );
        }
        catch (Exception ex)
        {
            // _logger.LogError(ex, "Erro ao calcular resumo do Dashboard.");
            throw new ApplicationException("Erro ao calcular resumo do Dashboard.", ex);
        }
    }

    private static decimal GetLatestFipeValue(Vehicle vehicle)
    {
        try
        {
            if (vehicle.FipeHistories == null || !vehicle.FipeHistories.Any())
                return 0m;

            var latest = vehicle.FipeHistories
                .OrderByDescending(h => h.ConsultationDate)
                .FirstOrDefault();

            return latest?.FipeValue ?? 0m;
        }
        catch
        {
            return 0m;
        }
    }
}