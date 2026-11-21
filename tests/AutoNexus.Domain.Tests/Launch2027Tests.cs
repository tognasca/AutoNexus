using AutoNexus.Domain.Entities;
using AutoNexus.Domain.Enums;
using Xunit;

namespace AutoNexus.Domain.Tests;

public class Launch2027Tests
{
    private static Vehicle Car() => new(Guid.NewGuid(), "Toyota", "Corolla", 2023, 2024, 80000m);

    [Fact]
    public void DiscountIsAlreadyIncludedInNegotiatedRevenue()
    {
        var margin = VehicleFinancials.Calculate(80000m, 5000m, 95000m);
        Assert.Equal(85000m, margin.TotalCost);
        Assert.Equal(10000m, margin.Profit);
        Assert.Equal(10.53m, margin.MarginPercentage);
    }

    [Fact]
    public void MissingRevenueDoesNotPretendThereIsRealProfit()
    {
        var margin = VehicleFinancials.Calculate(80000m, 5000m, null);
        Assert.Null(margin.Profit);
        Assert.Null(margin.MarginPercentage);
    }

    [Fact]
    public void AnotherSellerCannotSellAnActiveReservation()
    {
        var car = Car();
        car.Reserve(Guid.NewGuid(), Guid.NewGuid(), DateTime.UtcNow.AddHours(1), DateTime.UtcNow);
        Assert.Throws<InvalidOperationException>(() => car.MarkAsSold(100000m, Guid.NewGuid()));
        Assert.Throws<InvalidOperationException>(() => car.ChangeStatus(VehicleStatus.AVenda));
        Assert.Throws<InvalidOperationException>(() => car.CompleteSale(100000m));
    }

    [Fact]
    public void ReservationOwnerCanCloseTheSaleOnlyOnce()
    {
        var seller = Guid.NewGuid();
        var car = Car();
        car.Reserve(Guid.NewGuid(), seller, DateTime.UtcNow.AddHours(1), DateTime.UtcNow);
        car.MarkAsSold(100000m, seller);
        Assert.Equal(VehicleStatus.Vendido, car.Status);
        Assert.Throws<InvalidOperationException>(() => car.MarkAsSold(100000m, seller));
    }

    [Fact]
    public void DuplicateActiveReservationIsRejected()
    {
        var now = DateTime.UtcNow;
        var car = Car();
        car.Reserve(Guid.NewGuid(), Guid.NewGuid(), now.AddHours(1), now);
        Assert.Throws<InvalidOperationException>(() => car.Reserve(Guid.NewGuid(), Guid.NewGuid(), now.AddHours(2), now));
    }

    [Fact]
    public void ExpiredReservationCanBeAcquiredByAnotherSeller()
    {
        var car = Car();
        var now = DateTime.UtcNow;
        car.Reserve(Guid.NewGuid(), Guid.NewGuid(), now.AddHours(-1), now.AddDays(-1));
        var seller = Guid.NewGuid();
        car.Reserve(Guid.NewGuid(), seller, now.AddHours(1), now);
        Assert.Equal(seller, car.ReservedByUserId);
    }

    [Fact]
    public void LegacyReservedVehicleIsNotOverwritten()
    {
        var car = Car();
        car.ChangeStatus(VehicleStatus.Reservado);
        Assert.Throws<InvalidOperationException>(() => car.Reserve(Guid.NewGuid(), Guid.NewGuid(), DateTime.UtcNow.AddHours(1), DateTime.UtcNow));
    }

    [Fact]
    public void DeliveryCannotBeRecordedBeforeSale()
    {
        Assert.Throws<InvalidOperationException>(() => Car().SaveDeliveryChecklist("{}"));
    }

    [Fact]
    public void InvalidBuyerPreferencesAreRejected()
    {
        var lead = new Lead("Cliente", "11999999999", null, "Manual", null, null, null);
        Assert.Throws<ArgumentException>(() => lead.SetBuyerPreferences(-1, null, null));
        Assert.Throws<ArgumentException>(() => lead.SetBuyerPreferences(null, 123, null));
    }

    [Fact]
    public void RegeneratingOrRevokingProposalClearsPreviousPublicAccess()
    {
        var lead = new Lead("Cliente", "11999999999", null, "Manual", null, null, null);
        lead.PublishProposal("old", "{}", DateTime.UtcNow.AddDays(1));
        lead.RespondToProposal("Interesse");
        lead.PublishProposal("new", "{}", DateTime.UtcNow.AddDays(1));
        Assert.Equal("new", lead.ShareTokenHash);
        Assert.Null(lead.BuyerResponse);
        lead.RevokeProposal();
        Assert.Null(lead.ShareTokenHash);
    }
}
