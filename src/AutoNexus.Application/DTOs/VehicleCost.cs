using AutoNexus.Domain.Enums;

namespace AutoNexus.Domain.Entities;

public class VehicleCost : EntityBase
{
    public Guid VehicleId { get; private set; }
    public Guid CostCategoryId { get; private set; }
    public string Description { get; private set; } = string.Empty;
    public decimal Value { get; private set; }
    public DateTime CostDate { get; private set; }

    public Vehicle Vehicle { get; private set; } = null!;
    public CostCategory CostCategory { get; private set; } = null!;

    protected VehicleCost() { }

    public VehicleCost(
        Guid vehicleId,
        Guid costCategoryId,
        string description,
        decimal value,
        DateTime costDate)
    {
        if (vehicleId == Guid.Empty)
            throw new ArgumentException("O veículo é obrigatório.", nameof(vehicleId));

        if (costCategoryId == Guid.Empty)
            throw new ArgumentException("A categoria de custo é obrigatória.", nameof(costCategoryId));

        if (string.IsNullOrWhiteSpace(description))
            throw new ArgumentException("A descrição do custo é obrigatória.", nameof(description));

        if (value <= 0)
            throw new ArgumentOutOfRangeException(nameof(value), "O valor do custo deve ser maior que zero.");

        VehicleId = vehicleId;
        CostCategoryId = costCategoryId;
        Description = description.Trim();
        Value = value;
        CostDate = costDate;
    }

    public void UpdateDetails(Guid costCategoryId, string description, decimal value, DateTime costDate)
    {
        if (costCategoryId == Guid.Empty)
            throw new ArgumentException("A categoria de custo é obrigatória.", nameof(costCategoryId));

        if (string.IsNullOrWhiteSpace(description))
            throw new ArgumentException("A descrição do custo é obrigatória.", nameof(description));

        if (value <= 0)
            throw new ArgumentOutOfRangeException(nameof(value), "O valor do custo deve ser maior que zero.");

        CostCategoryId = costCategoryId;
        Description = description.Trim();
        Value = value;
        CostDate = costDate;
        UpdatedAt = DateTime.UtcNow;
    }
}