namespace AutoNexus.Domain.Entities;

public class FipeHistory : EntityBase
{
    public Guid VehicleId { get; private set; }
    public decimal FipeValue { get; private set; }
    public int ReferenceMonth { get; private set; }
    public int ReferenceYear { get; private set; }
    public DateTime ConsultationDate { get; private set; }
    public string? Source { get; private set; }

    public Vehicle Vehicle { get; private set; } = null!;

    protected FipeHistory() { }

    public FipeHistory(
        Guid vehicleId,
        decimal fipeValue,
        int referenceMonth,
        int referenceYear,
        string? source = null)
    {
        if (fipeValue < 0)
            throw new ArgumentException("Valor FIPE não pode ser negativo.");

        if (referenceMonth < 1 || referenceMonth > 12)
            throw new ArgumentException("Mês de referência inválido.");

        VehicleId = vehicleId;
        FipeValue = fipeValue;
        ReferenceMonth = referenceMonth;
        ReferenceYear = referenceYear;
        ConsultationDate = DateTime.UtcNow;
        Source = source ?? "BrasilAPI";
    }
}
