using AutoNexus.Application.DTOs;
using AutoNexus.Application.Interfaces;
using AutoNexus.Domain.Entities;
using AutoNexus.Domain.Enums;
using AutoNexus.Domain.Interfaces;

namespace AutoNexus.Application.Services;

public class TradeService : ITradeService
{
    private readonly ITradeRepository _tradeRepository;
    private readonly IVehicleRepository _vehicleRepository;
    private readonly ILookupRepository _lookupRepository;
    private readonly IUnitOfWork _unitOfWork;

    public TradeService(
        ITradeRepository tradeRepository,
        IVehicleRepository vehicleRepository,
        ILookupRepository lookupRepository,
        IUnitOfWork unitOfWork)
    {
        _tradeRepository = tradeRepository;
        _vehicleRepository = vehicleRepository;
        _lookupRepository = lookupRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<IEnumerable<TradeDto>> GetAllTradesAsync(CancellationToken cancellationToken = default)
    {
        var trades = await _tradeRepository.GetAllAsync(cancellationToken);
        return trades.Select(MapToDto);
    }

    public async Task<TradeDto?> GetTradeByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var trade = await _tradeRepository.GetByIdAsync(id, cancellationToken);
        return trade == null ? null : MapToDto(trade);
    }

    public async Task<TradeDto> CreateTradeAsync(Guid responsibleUserId, CreateTradeDto dto, CancellationToken cancellationToken = default)
    {
        var deliveredVehicle = await _vehicleRepository.GetByIdAsync(dto.DeliveredVehicleId, false, cancellationToken);
        if (deliveredVehicle == null)
            throw new KeyNotFoundException("Veículo entregue não encontrado no estoque.");

        if (deliveredVehicle.Status == VehicleStatus.Vendido)
            throw new InvalidOperationException("Não é possível dar em troca um veículo já vendido.");

        // 1. Cadastra o novo veículo recebido no estoque
        var receivedVehicle = new Vehicle(
            dto.ReceivedVehicle.VehicleTypeId,
            dto.ReceivedVehicle.Brand,
            dto.ReceivedVehicle.Model,
            dto.ReceivedVehicle.ManufacturingYear,
            dto.ReceivedVehicle.ModelYear,
            dto.ReceivedVehicle.PurchaseValue
        );

        if (dto.ReceivedVehicle.ListedValue.HasValue)
            receivedVehicle.UpdateListedValue(dto.ReceivedVehicle.ListedValue.Value);

        await _vehicleRepository.AddAsync(receivedVehicle, cancellationToken);

        // 2. Atualiza o status do veículo entregue para EmTroca / Vendido
        deliveredVehicle.ChangeStatus(VehicleStatus.EmTroca);

        // 3. Cria a entidade de Troca e executa a avaliação transparente
        var trade = new Trade(
            receivedVehicle.Id,
            deliveredVehicle.Id,
            dto.ReceivedVehicleFipe,
            dto.DeliveredVehicleFipe,
            dto.ReceivedVehicleNegotiatedValue,
            dto.DeliveredVehicleNegotiatedValue,
            dto.EstimatedResaleCost,
            dto.DifferenceValue,
            dto.DifferencePaidByUs,
            dto.TradeDate.ToUniversalTime(),
            responsibleUserId
        );

        trade.Evaluate();
        await _tradeRepository.AddAsync(trade, cancellationToken);

        await _unitOfWork.CommitAsync(cancellationToken);

        // Recarrega negociação completa com veículos
        var result = await _tradeRepository.GetByIdAsync(trade.Id, cancellationToken);
        return MapToDto(result!);
    }

    private static TradeDto MapToDto(Trade t)
    {
        var receivedResult = t.GetReceivedResult();
        var deliveredResult = t.GetDeliveredResult();

        var evaluation = new TradeEvaluationDto(
            t.ReceivedVehicleFipe,
            t.EstimatedResaleCost,
            receivedResult,
            t.DeliveredVehicleFipe,
            t.DifferenceValue,
            t.DifferencePaidByUs,
            deliveredResult,
            t.Indicator,
            "Cálculo matemático transparente conforme Seção 14 do README. Limites verde/amarelo pendentes de definição comercial."
        );

        return new TradeDto(
            t.Id,
            t.ReceivedVehicleId,
            $"{t.ReceivedVehicle?.Brand} {t.ReceivedVehicle?.Model}",
            t.DeliveredVehicleId,
            $"{t.DeliveredVehicle?.Brand} {t.DeliveredVehicle?.Model}",
            t.ReceivedVehicleFipe,
            t.DeliveredVehicleFipe,
            t.ReceivedVehicleNegotiatedValue,
            t.DeliveredVehicleNegotiatedValue,
            t.EstimatedResaleCost,
            t.DifferenceValue,
            t.DifferencePaidByUs,
            evaluation,
            t.TradeDate,
            t.ResponsibleUserId,
            t.Notes,
            t.CreatedAt
        );
    }
}