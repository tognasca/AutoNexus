using AutoNexus.Application.DTOs;
using AutoNexus.Application.Interfaces;
using AutoNexus.Domain.Entities;
using AutoNexus.Domain.Interfaces;

namespace AutoNexus.Application.Services;

public class FipeService : IFipeService
{
    private readonly IVehicleRepository _vehicleRepository;
    private readonly IFipeExternalService _fipeExternalService;
    private readonly IUnitOfWork _unitOfWork;

    public FipeService(
        IVehicleRepository vehicleRepository,
        IFipeExternalService fipeExternalService,
        IUnitOfWork unitOfWork)
    {
        _vehicleRepository = vehicleRepository;
        _fipeExternalService = fipeExternalService;
        _unitOfWork = unitOfWork;
    }

    public async Task<FipeSummaryDto> GetFipeSummaryAsync(Guid vehicleId, CancellationToken cancellationToken = default)
    {
        var vehicle = await _vehicleRepository.GetByIdAsync(vehicleId, includeDetails: true, cancellationToken);
        if (vehicle == null) throw new KeyNotFoundException("Veículo não encontrado.");

        return MapSummary(vehicle);
    }

    public async Task<IEnumerable<FipeLookupItemDto>> GetBrandsAsync(Guid vehicleId, CancellationToken cancellationToken = default)
    {
        var vehicle = await _vehicleRepository.GetByIdAsync(vehicleId, includeDetails: true, cancellationToken);
        if (vehicle == null) throw new KeyNotFoundException("Veículo não encontrado.");

        var typeName = vehicle.VehicleType?.Name ?? "Carro";
        return await _fipeExternalService.GetBrandsAsync(typeName, cancellationToken);
    }

    public async Task<IEnumerable<FipeLookupItemDto>> GetModelsAsync(Guid vehicleId, string brandCode, CancellationToken cancellationToken = default)
    {
        var vehicle = await _vehicleRepository.GetByIdAsync(vehicleId, includeDetails: true, cancellationToken);
        if (vehicle == null) throw new KeyNotFoundException("Veículo não encontrado.");

        var typeName = vehicle.VehicleType?.Name ?? "Carro";
        return await _fipeExternalService.GetModelsAsync(typeName, brandCode, cancellationToken);
    }

    public async Task<IEnumerable<FipeLookupItemDto>> GetYearsAsync(Guid vehicleId, string brandCode, string modelCode, CancellationToken cancellationToken = default)
    {
        var vehicle = await _vehicleRepository.GetByIdAsync(vehicleId, includeDetails: true, cancellationToken);
        if (vehicle == null) throw new KeyNotFoundException("Veículo não encontrado.");

        var typeName = vehicle.VehicleType?.Name ?? "Carro";
        return await _fipeExternalService.GetYearsAsync(typeName, brandCode, modelCode, cancellationToken);
    }

    public async Task<FipeSummaryDto> FetchGuidedFipeAsync(Guid vehicleId, FetchGuidedFipeRequestDto dto, CancellationToken cancellationToken = default)
    {
        var vehicle = await _vehicleRepository.GetByIdAsync(vehicleId, includeDetails: true, cancellationToken);
        if (vehicle == null) throw new KeyNotFoundException("Veículo não encontrado.");

        var (fipeValue, month, year, fipeCode) = await _fipeExternalService.FetchByBrandModelYearAsync(
            dto.VehicleType, dto.BrandCode, dto.ModelCode, dto.YearCode, cancellationToken);

        var source = $"FIPE ({fipeCode})";
        var history = new FipeHistory(vehicleId, fipeValue, month, year, source);
        await _vehicleRepository.AddFipeHistoryAsync(history, cancellationToken);

        await _unitOfWork.CommitAsync(cancellationToken);
        
        // Recarrega veículo atualizado com o novo histórico
        vehicle = await _vehicleRepository.GetByIdAsync(vehicleId, includeDetails: true, cancellationToken);
        return MapSummary(vehicle!);
    }

    public async Task<FipeSummaryDto> FetchAndUpdateFipeAsync(Guid vehicleId, FetchFipeRequestDto dto, CancellationToken cancellationToken = default)
    {
        var vehicle = await _vehicleRepository.GetByIdAsync(vehicleId, includeDetails: true, cancellationToken);
        if (vehicle == null) throw new KeyNotFoundException("Veículo não encontrado.");

        var modelYear = dto.ModelYear ?? vehicle.ModelYear;
        var (fipeValue, month, year) = await _fipeExternalService.FetchByFipeCodeAsync(dto.FipeCode, modelYear, cancellationToken);

        var history = new FipeHistory(vehicleId, fipeValue, month, year, $"Código {dto.FipeCode}");
        await _vehicleRepository.AddFipeHistoryAsync(history, cancellationToken);

        await _unitOfWork.CommitAsync(cancellationToken);

        vehicle = await _vehicleRepository.GetByIdAsync(vehicleId, includeDetails: true, cancellationToken);
        return MapSummary(vehicle!);
    }

    public async Task<FipeSummaryDto> AddManualFipeAsync(Guid vehicleId, ManualFipeRequestDto dto, CancellationToken cancellationToken = default)
    {
        var vehicle = await _vehicleRepository.GetByIdAsync(vehicleId, includeDetails: true, cancellationToken);
        if (vehicle == null) throw new KeyNotFoundException("Veículo não encontrado.");

        var source = string.IsNullOrWhiteSpace(dto.Notes) ? "Manual Override" : $"Manual ({dto.Notes.Trim()})";
        var history = new FipeHistory(vehicleId, dto.FipeValue, dto.ReferenceMonth, dto.ReferenceYear, source);

        await _vehicleRepository.AddFipeHistoryAsync(history, cancellationToken);
        await _unitOfWork.CommitAsync(cancellationToken);

        vehicle = await _vehicleRepository.GetByIdAsync(vehicleId, includeDetails: true, cancellationToken);
        return MapSummary(vehicle!);
    }

    private static FipeSummaryDto MapSummary(Vehicle vehicle)
    {
        var historyList = vehicle.FipeHistories
            .OrderByDescending(f => f.ReferenceYear)
            .ThenByDescending(f => f.ReferenceMonth)
            .ThenByDescending(f => f.ConsultationDate)
            .Select(f => new FipeHistoryDto(
                f.Id, f.VehicleId, f.FipeValue, f.ReferenceMonth, f.ReferenceYear, f.ConsultationDate, f.Source
            )).ToList();

        var latest = historyList.FirstOrDefault();

        return new FipeSummaryDto(
            vehicle.Id, latest?.FipeValue, latest?.ReferenceMonth, latest?.ReferenceYear, latest?.ConsultationDate, historyList
        );
    }
}
