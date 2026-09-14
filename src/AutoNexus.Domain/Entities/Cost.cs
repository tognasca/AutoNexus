namespace AutoNexus.Domain.Entities;

public class Cost : EntityBase
{
    public Guid VehicleId { get; private set; }
    public Guid CostCategoryId { get; private set; }
    public string Description { get; private set; } = string.Empty;
    public decimal Value { get; private set; }
    public DateTime CostDate { get; private set; }
    public Guid ResponsibleUserId { get; private set; }
    public string? Notes { get; private set; }

    // Propriedades de Navegação
    public Vehicle Vehicle { get; private set; } = null!;
    public CostCategory CostCategory { get; private set; } = null!;

    public Cost(
        Guid vehicleId,
        Guid costCategoryId,
        string description,
        decimal value,
        DateTime costDate,
        Guid responsibleUserId)
    {
        if (vehicleId == Guid.Empty)
            throw new ArgumentException("Identificador do veículo é obrigatório.", nameof(vehicleId));

        if (costCategoryId == Guid.Empty)
            throw new ArgumentException("Categoria de custo é obrigatória.", nameof(costCategoryId));

        if (value < 0)
            throw new ArgumentException("Valor do custo não pode ser negativo.", nameof(value));

        if (string.IsNullOrWhiteSpace(description))
            throw new ArgumentException("Descrição é obrigatória.", nameof(description));

        VehicleId = vehicleId;
        CostCategoryId = costCategoryId;
        Description = description.Trim();
        Value = value;
        CostDate = costDate;
        ResponsibleUserId = responsibleUserId;
    }
}