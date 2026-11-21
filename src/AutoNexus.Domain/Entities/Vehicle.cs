using AutoNexus.Domain.Enums;

namespace AutoNexus.Domain.Entities;

public class Vehicle : TenantOwnedEntityBase
{
    public Guid VehicleTypeId { get; private set; }
    public string Brand { get; private set; } = string.Empty;
    public string Model { get; private set; } = string.Empty;
    public string? Version { get; private set; }
    public int ManufacturingYear { get; private set; }
    public int ModelYear { get; private set; }
    public string? Plate { get; private set; }
    public string? Chassis { get; private set; }
    public string? Renavam { get; private set; }
    public int Mileage { get; private set; }
    public string? Color { get; private set; }
    public FuelType? Fuel { get; private set; }
    public TransmissionType? Transmission { get; private set; }
    public VehicleStatus Status { get; private set; }
    public decimal PurchaseValue { get; private set; }
    public decimal? ListedValue { get; private set; }
    public decimal? SaleValue { get; private set; }
    public string? Notes { get; private set; }
    public Guid? WhatsAppContactId { get; private set; }
    public TenantWhatsAppContact? WhatsAppContact { get; private set; }

    // Propriedades da Venda
    public Guid? SoldByUserId { get; private set; }
    public User? SoldByUser { get; private set; }
    public DateTime? SoldAt { get; private set; }

    public Guid? ReservedForLeadId { get; private set; }
    public Guid? ReservedByUserId { get; private set; }
    public DateTime? ReservationExpiresAt { get; private set; }
    public string? DeliveryChecklist { get; private set; }

    public void Reserve(Guid leadId, Guid userId, DateTime expiresAt, DateTime now)
    {
        if (leadId == Guid.Empty || userId == Guid.Empty || expiresAt <= now ||
            expiresAt > now.AddDays(7))
            throw new ArgumentException("Reserva deve ter responsável e prazo de até sete dias.");
        if (Status == VehicleStatus.Vendido || Status == VehicleStatus.EmTroca ||
            (Status == VehicleStatus.Reservado && ReservationExpiresAt == null) ||
            ReservationExpiresAt > now)
            throw new InvalidOperationException("O veículo já está reservado ou indisponível.");
        ReservedForLeadId = leadId;
        ReservedByUserId = userId;
        ReservationExpiresAt = expiresAt;
        Status = VehicleStatus.Reservado;
        UpdatedAt = now;
    }
    public void ReleaseReservation()
    {
        if (ReservationExpiresAt is null) return;
        ReservedForLeadId = null;
        ReservedByUserId = null;
        ReservationExpiresAt = null;
        if (Status == VehicleStatus.Reservado) Status = VehicleStatus.AVenda;
        UpdatedAt = DateTime.UtcNow;
    }
    public void SaveDeliveryChecklist(string checklist)
    {
        if (Status != VehicleStatus.Vendido) throw new InvalidOperationException("Registre a venda antes da entrega.");
        DeliveryChecklist = checklist;
        UpdatedAt = DateTime.UtcNow;
    }

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

    public void AssignWhatsAppContact(Guid? contactId)
    {
        WhatsAppContactId = contactId;
        UpdatedAt = DateTime.UtcNow;
    }

    public void ChangeStatus(VehicleStatus newStatus)
    {
        if (ReservationExpiresAt > DateTime.UtcNow && newStatus != VehicleStatus.Reservado)
            throw new InvalidOperationException("Cancele a reserva antes de alterar a situação.");
        Status = newStatus;
        UpdatedAt = DateTime.UtcNow;
    }

    public void UpdatePurchaseValue(decimal purchaseValue)
    {
        if (purchaseValue <= 0)
            throw new ArgumentException("O valor de compra deve ser maior que zero.");

        PurchaseValue = purchaseValue;
        UpdatedAt = DateTime.UtcNow;
    }

    public void UpdateListedValue(decimal? value)
    {
        if (value.HasValue && value.Value < 0)
            throw new ArgumentException("O valor anunciado não pode ser negativo.");

        ListedValue = value;
        UpdatedAt = DateTime.UtcNow;
    }

    public void UpdateDetails(
        Guid vehicleTypeId,
        string brand,
        string model,
        string? version,
        int manufacturingYear,
        int modelYear,
        string? plate,
        string? chassis,
        string? renavam,
        int mileage,
        string? color,
        FuelType fuel,
        TransmissionType transmission,
        string? notes)
    {
        VehicleTypeId = vehicleTypeId;
        Brand = brand.Trim();
        Model = model.Trim();
        Version = version?.Trim();
        ManufacturingYear = manufacturingYear;
        ModelYear = modelYear;
        Plate = plate?.Trim().ToUpper();
        Chassis = chassis?.Trim().ToUpper();
        Renavam = renavam?.Trim().ToUpper();
        Mileage = mileage;
        Color = color?.Trim();
        Fuel = fuel;
        Transmission = transmission;
        Notes = notes?.Trim();
        UpdatedAt = DateTime.UtcNow;
    }
    public void CompleteSale(decimal saleValue)
    {
        if (ReservationExpiresAt > DateTime.UtcNow)
            throw new InvalidOperationException("Use o fechamento identificado para uma reserva ativa.");
        if (Status == VehicleStatus.Vendido)
            throw new InvalidOperationException("Veículo já foi vendido.");

        if (saleValue <= 0)
            throw new ArgumentException("Valor de venda deve ser maior que zero.");

        SaleValue = saleValue;
        Status = VehicleStatus.Vendido;
        UpdatedAt = DateTime.UtcNow;
    }

    // Método para registrar a venda com o Vendedor
    public void MarkAsSold(decimal saleValue, Guid? soldByUserId = null, DateTime? soldAt = null)
{
    if (Status == VehicleStatus.Vendido)
        throw new InvalidOperationException("O veículo já foi vendido.");
    if (ReservationExpiresAt > DateTime.UtcNow && ReservedByUserId != soldByUserId)
        throw new InvalidOperationException("Este veículo está reservado por outro vendedor.");
    if (saleValue <= 0)
        throw new ArgumentException("O valor de venda deve ser maior que R$ 0,00.");

    Status = VehicleStatus.Vendido;
    SaleValue = saleValue; // Atualiza para o novo valor negociado (ex: 74000.00)

    if (soldByUserId.HasValue && soldByUserId.Value != Guid.Empty)
        SoldByUserId = soldByUserId.Value;

    SoldAt = soldAt ?? DateTime.UtcNow;
    UpdatedAt = DateTime.UtcNow;
}

public void UpdateSaleValue(decimal? saleValue)
{
    if (saleValue.HasValue && saleValue.Value <= 0)
        throw new ArgumentException("O valor de venda deve ser maior que R$ 0,00.");

    SaleValue = saleValue;
    UpdatedAt = DateTime.UtcNow;
}
    public decimal GetTotalCost()
    {
        return PurchaseValue + Costs.Sum(c => c.Value);
    }
}