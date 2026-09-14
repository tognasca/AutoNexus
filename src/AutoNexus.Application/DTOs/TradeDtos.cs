using AutoNexus.Domain.Enums;

namespace AutoNexus.Application.DTOs;

public record CompleteSaleDto(
    decimal SaleValue,
    string? BuyerName,
    string? PaymentMethod,
    string? Notes
);

public record CreateTradeDto(
    Guid DeliveredVehicleId,
    CreateVehicleDto ReceivedVehicle,
    decimal ReceivedVehicleFipe,
    decimal DeliveredVehicleFipe,
    decimal ReceivedVehicleNegotiatedValue,
    decimal DeliveredVehicleNegotiatedValue,
    decimal EstimatedResaleCost,
    decimal DifferenceValue,
    bool DifferencePaidByUs,
    DateTime TradeDate,
    string? Notes
);

public record TradeEvaluationDto(
    decimal ReceivedVehicleFipe,
    decimal EstimatedResaleCost,
    decimal ReceivedResult,
    decimal DeliveredVehicleFipe,
    decimal DifferenceValue,
    bool DifferencePaidByUs,
    decimal DeliveredResult,
    TradeIndicator Indicator,
    string IndicatorExplanation
);

public record TradeDto(
    Guid Id,
    Guid ReceivedVehicleId,
    string ReceivedVehicleName,
    Guid DeliveredVehicleId,
    string DeliveredVehicleName,
    decimal ReceivedVehicleFipe,
    decimal DeliveredVehicleFipe,
    decimal ReceivedVehicleNegotiatedValue,
    decimal DeliveredVehicleNegotiatedValue,
    decimal EstimatedResaleCost,
    decimal DifferenceValue,
    bool DifferencePaidByUs,
    TradeEvaluationDto Evaluation,
    DateTime TradeDate,
    Guid ResponsibleUserId,
    string? Notes,
    DateTime CreatedAt
);
