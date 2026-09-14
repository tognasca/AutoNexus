using AutoNexus.Domain.Entities;
using AutoNexus.Domain.Enums;
using FluentAssertions;
using Xunit;

namespace AutoNexus.Domain.Tests;

public class VehicleTests
{
    [Fact]
    public void Should_Create_Vehicle_With_Status_AVenda_When_Valid()
    {
        // Arrange
        var typeId = Guid.NewGuid();

        // Act
        var vehicle = new Vehicle(typeId, "Toyota", "Corolla", 2022, 2023, 85000m);

        // Assert
        vehicle.Brand.Should().Be("Toyota");
        vehicle.Model.Should().Be("Corolla");
        vehicle.PurchaseValue.Should().Be(85000m);
        vehicle.Status.Should().Be(VehicleStatus.AVenda);
    }

    [Fact]
    public void Should_Throw_ArgumentException_When_Brand_Is_Empty()
    {
        // Act & Assert
        Action act = () => new Vehicle(Guid.NewGuid(), "", "Corolla", 2022, 2023, 85000m);
        act.Should().Throw<ArgumentException>().WithMessage("*Marca é obrigatória*");
    }

    [Fact]
    public void Should_Calculate_Total_Cost_Correctly_Including_Purchase_And_Additional_Costs()
    {
        // Arrange
        var vehicle = new Vehicle(Guid.NewGuid(), "Honda", "Civic", 2021, 2021, 90000m);
        var costCatId = Guid.NewGuid();
        var userId = Guid.NewGuid();

        var cost1 = new Cost(vehicle.Id, costCatId, "Revisão dos 50k", 1500m, DateTime.UtcNow, userId);
        var cost2 = new Cost(vehicle.Id, costCatId, "Troca de Pneus", 2500m, DateTime.UtcNow, userId);

        vehicle.Costs.Add(cost1);
        vehicle.Costs.Add(cost2);

        // Act
        var totalCost = vehicle.GetTotalCost();

        // Assert
        totalCost.Should().Be(94000m); // 90.000 + 1.500 + 2.500
    }
}
