using AutoNexus.Domain.Entities;
using AutoNexus.Domain.Enums;
using FluentAssertions;
using Xunit;

namespace AutoNexus.Domain.Tests;

public class TradeTests
{
    [Fact]
    public void Should_Calculate_Trade_Evaluation_Results_Transparently()
    {
        // Arrange
        var receivedVehicleId = Guid.NewGuid();
        var deliveredVehicleId = Guid.NewGuid();
        var userId = Guid.NewGuid();

        // Troca: FIPE Recebido = R$ 70.000, Custo Est. Revenda = R$ 5.000 -> Resultado Recebido = R$ 65.000
        // FIPE Entregue = R$ 80.000, Pagamos R$ 10.000 de torna -> Resultado Entregue = R$ 90.000
        var trade = new Trade(
            receivedVehicleId,
            deliveredVehicleId,
            receivedVehicleFipe: 70000m,
            deliveredVehicleFipe: 80000m,
            receivedVehicleNegotiatedValue: 68000m,
            deliveredVehicleNegotiatedValue: 82000m,
            estimatedResaleCost: 5000m,
            differenceValue: 10000m,
            differencePaidByUs: true,
            tradeDate: DateTime.UtcNow,
            responsibleUserId: userId
        );

        // Act
        var receivedResult = trade.GetReceivedResult();
        var deliveredResult = trade.GetDeliveredResult();

        // Assert
        receivedResult.Should().Be(65000m); // 70.000 - 5.000
        deliveredResult.Should().Be(90000m); // 80.000 + 10.000
    }
}
