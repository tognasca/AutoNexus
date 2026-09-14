using AutoNexus.Domain.Enums;

namespace AutoNexus.Domain.Entities;

public class Vehicle : EntityBase
{
    public Guid VehicleTypeId { get; private set; }
    public string Brand { get; private set; } = string.Empty;
    public string Model { get; private set; } = string.Empty;
    public string? Version { get; private set; }
    public int ManufacturingYear { get; private set; }
    public int ModelYear { get; private set; }
    public string? Plate { get; private set; }
    public string? Chassis { get; private set; }
    public int Mileage { get; private set; }
    public string? Color { get; private set; }
    public FuelType? Fuel { get; private set; }
    public TransmissionType? Transmission { get; private set; }
    public VehicleStatus Status { get; private set; }
    public decimal PurchaseValue { get; private set; }
    public decimal? ListedValue { get; private set; }
    public decimal? SaleValue { get; private set; }
    public string? Notes { get; private set; }

    // Propriedades de Navegação
    public VehicleType VehicleType { get; private set; } = null!;
    public ICollection<VehiclePhoto> Photos { get; private set; } = new List<VehiclePhoto>();
    public ICollection<VehicleDocument> Documents { get; private set; } = new List<VehicleDocument>();
    public ICollection<Cost> Costs { get; private set; } = new List<Cost>();
    public ICollection<FipeHistory> FipeHistories { get; private set; } = new List<FipeHistory>();

    public Vehicle(
        Guid vehicleTypeId,
        string brand,
        string model,
        int manufacturingYear,
        int modelYear,
        decimal purchaseValue)
    {
        if (vehicleTypeId == Guid.Empty)
            throw new ArgumentException("Tipo de veículo é obrigatório.", nameof(vehicleTypeId));

        if (string.IsNullOrWhiteSpace(brand))
            throw new ArgumentException("Marca é obrigatória.", nameof(brand));

        if (string.IsNullOrWhiteSpace(model))
            throw new ArgumentException("Modelo é obrigatório.", nameof(model));

        if (manufacturingYear < 1900 || manufacturingYear > DateTime.Now.Year + 1)
            throw new ArgumentException("Ano de fabricação inválido.", nameof(manufacturingYear));

        if (purchaseValue < 0)
            throw new ArgumentException("Valor de compra não pode ser negativo.", nameof(purchaseValue));

        VehicleTypeId = vehicleTypeId;
        Brand = brand.Trim();
        Model = model.Trim();
        ManufacturingYear = manufacturingYear;
        ModelYear = modelYear;
        PurchaseValue = purchaseValue;
        Status = VehicleStatus.AVenda;
    }

    public void ChangeStatus(VehicleStatus newStatus)
    {
        Status = newStatus;
        UpdatedAt = DateTime.UtcNow;
    }

    public void UpdateListedValue(decimal value)
    {
        if (value < 0)
            throw new ArgumentException("Valor anunciado não pode ser negativo.");

        ListedValue = value;
        UpdatedAt = DateTime.UtcNow;
    }

    public void CompleteSale(decimal saleValue)
    {
        if (Status == VehicleStatus.Vendido)
            throw new InvalidOperationException("Veículo já foi vendido.");

        if (saleValue <= 0)
            throw new ArgumentException("Valor de venda deve ser maior que zero.");

        SaleValue = saleValue;
        Status = VehicleStatus.Vendido;
        UpdatedAt = DateTime.UtcNow;
    }

    public decimal GetTotalCost()
    {
        return PurchaseValue + Costs.Sum(c => c.Value);
    }
}