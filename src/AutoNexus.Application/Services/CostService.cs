using AutoNexus.Application.DTOs;
using AutoNexus.Application.Interfaces;
using AutoNexus.Domain.Entities;
using AutoNexus.Domain.Interfaces;

namespace AutoNexus.Application.Services;

public class CostService : ICostService
{
    private readonly IVehicleRepository _vehicleRepository;
    private readonly ILookupRepository _lookupRepository;
    private readonly IUnitOfWork _unitOfWork;

    public CostService(
        IVehicleRepository vehicleRepository,
        ILookupRepository lookupRepository,
        IUnitOfWork unitOfWork)
    {
        _vehicleRepository = vehicleRepository;
        _lookupRepository = lookupRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<VehicleCostSummaryDto> GetVehicleCostsSummaryAsync(Guid vehicleId, CancellationToken cancellationToken = default)
    {
        var vehicle = await _vehicleRepository.GetByIdAsync(vehicleId, includeDetails: true, cancellationToken);
        if (vehicle == null) throw new KeyNotFoundException("Veículo não encontrado.");

        var costDtos = vehicle.Costs
            .OrderByDescending(c => c.CostDate)
            .Select(c => new CostDto(
                c.Id,
                c.VehicleId,
                c.CostCategoryId,
                c.CostCategory?.Name ?? string.Empty,
                c.Description,
                c.Value,
                c.CostDate,
                c.ResponsibleUserId,
                c.Notes,
                c.CreatedAt
            ));

        var totalAdditionalCosts = vehicle.Costs.Sum(c => c.Value);
        var totalVehicleCost = vehicle.GetTotalCost();

        return new VehicleCostSummaryDto(
            vehicle.Id,
            vehicle.PurchaseValue,
            totalAdditionalCosts,
            totalVehicleCost,
            costDtos
        );
    }

    public async Task<CostDto> AddCostAsync(Guid vehicleId, Guid responsibleUserId, CreateCostDto dto, CancellationToken cancellationToken = default)
    {
        var vehicle = await _vehicleRepository.GetByIdAsync(vehicleId, includeDetails: true, cancellationToken);
        if (vehicle == null) throw new KeyNotFoundException("Veículo não encontrado.");

        var categories = await _lookupRepository.GetCostCategoriesAsync(true, cancellationToken);
        var category = categories.FirstOrDefault(c => c.Id == dto.CostCategoryId);
        if (category == null) throw new ArgumentException("Categoria de custo inválida.");

        var cost = new Cost(
            vehicleId,
            dto.CostCategoryId,
            dto.Description,
            dto.Value,
            dto.CostDate.ToUniversalTime(),
            responsibleUserId
        );

        if (!string.IsNullOrWhiteSpace(dto.Notes))
        {
            typeof(Cost).GetProperty(nameof(Cost.Notes))?.SetValue(cost, dto.Notes.Trim());
        }

        await _vehicleRepository.AddCostAsync(cost, cancellationToken);
        await _unitOfWork.CommitAsync(cancellationToken);

        return new CostDto(
            cost.Id,
            cost.VehicleId,
            cost.CostCategoryId,
            category.Name,
            cost.Description,
            cost.Value,
            cost.CostDate,
            cost.ResponsibleUserId,
            cost.Notes,
            cost.CreatedAt
        );
    }

    public async Task DeleteCostAsync(Guid vehicleId, Guid costId, CancellationToken cancellationToken = default)
    {
        var vehicle = await _vehicleRepository.GetByIdAsync(vehicleId, includeDetails: true, cancellationToken);
        if (vehicle == null) throw new KeyNotFoundException("Veículo não encontrado.");

        var cost = vehicle.Costs.FirstOrDefault(c => c.Id == costId);
        if (cost == null) throw new KeyNotFoundException("Custo não encontrado.");

      _vehicleRepository.DeleteCost(cost);
await _unitOfWork.CommitAsync(cancellationToken);
    }
}
