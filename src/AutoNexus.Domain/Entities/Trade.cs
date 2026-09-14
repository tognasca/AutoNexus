using AutoNexus.Domain.Enums;

namespace AutoNexus.Domain.Entities;

public class Trade : EntityBase
{
    public Guid ReceivedVehicleId { get; private set; }
    public Guid DeliveredVehicleId { get; private set; }
    public decimal ReceivedVehicleFipe { get; private set; }
    public decimal DeliveredVehicleFipe { get; private set; }
    public decimal ReceivedVehicleNegotiatedValue { get; private set; }
    public decimal DeliveredVehicleNegotiatedValue { get; private set; }
    public decimal EstimatedResaleCost { get; private set; }
    public decimal DifferenceValue { get; private set; }
    public bool DifferencePaidByUs { get; private set; }
    public TradeIndicator Indicator { get; private set; }
    public DateTime TradeDate { get; private set; }
    public Guid ResponsibleUserId { get; private set; }
    public string? Notes { get; private set; }

    public Vehicle ReceivedVehicle { get; private set; } = null!;
    public Vehicle DeliveredVehicle { get; private set; } = null!;

    public Trade(
        Guid receivedVehicleId,
        Guid deliveredVehicleId,
        decimal receivedVehicleFipe,
        decimal deliveredVehicleFipe,
        decimal receivedVehicleNegotiatedValue,
        decimal deliveredVehicleNegotiatedValue,
        decimal estimatedResaleCost,
        decimal differenceValue,
        bool differencePaidByUs,
        DateTime tradeDate,
        Guid responsibleUserId)
    {
        ReceivedVehicleId = receivedVehicleId;
        DeliveredVehicleId = deliveredVehicleId;
        ReceivedVehicleFipe = receivedVehicleFipe;
        DeliveredVehicleFipe = deliveredVehicleFipe;
        ReceivedVehicleNegotiatedValue = receivedVehicleNegotiatedValue;
        DeliveredVehicleNegotiatedValue = deliveredVehicleNegotiatedValue;
        EstimatedResaleCost = estimatedResaleCost;
        DifferenceValue = differenceValue;
        DifferencePaidByUs = differencePaidByUs;
        TradeDate = tradeDate;
        ResponsibleUserId = responsibleUserId;
        Indicator = TradeIndicator.Pendente;
    }

    /// <summary>
    /// Avalia a troca conforme a regra de negócio (Seção 13 do README).
    /// Fórmula:
    ///   Resultado Recebido = FIPE recebido - Custo estimado de revenda
    ///   Resultado Entregue = FIPE entregue + Diferença paga (se pago por nós)
    /// 
    /// REQUISITO PENDENTE: limites de classificação (verde/amarelo/vermelho)
    /// ainda não definidos (Seção 15).
    /// </summary>
    public void Evaluate()
    {
        decimal receivedResult = ReceivedVehicleFipe - EstimatedResaleCost;
        decimal deliveredResult = DeliveredVehicleFipe
            + (DifferencePaidByUs ? DifferenceValue : 0);

        // TODO: Definir limites de classificação (Seção 15 do README)
        // Por enquanto, mantém como Pendente até que a regra de negócio seja definida.
        Indicator = TradeIndicator.Pendente;
        UpdatedAt = DateTime.UtcNow;
    }

    public decimal GetReceivedResult()
    {
        return ReceivedVehicleFipe - EstimatedResaleCost;
    }

    public decimal GetDeliveredResult()
    {
        return DeliveredVehicleFipe + (DifferencePaidByUs ? DifferenceValue : 0);
    }
}