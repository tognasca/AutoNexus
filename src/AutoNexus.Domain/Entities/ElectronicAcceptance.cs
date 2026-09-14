namespace AutoNexus.Domain.Entities;

public class ElectronicAcceptance : EntityBase
{
    public Guid VehicleId { get; private set; }
    public Guid? BuyerAccessLinkId { get; private set; }
    public string BuyerName { get; private set; } = string.Empty;
    public string BuyerDocument { get; private set; } = string.Empty;
    public string IpAddress { get; private set; } = string.Empty;
    public DateTime AcceptedAt { get; private set; }
    public string TermVersion { get; private set; } = string.Empty;

    public Vehicle Vehicle { get; private set; } = null!;

    protected ElectronicAcceptance() { }

    public ElectronicAcceptance(
        Guid vehicleId,
        Guid? buyerAccessLinkId,
        string buyerName,
        string buyerDocument,
        string ipAddress,
        string termVersion = "v1.0")
    {
        if (string.IsNullOrWhiteSpace(buyerName))
            throw new ArgumentException("Nome do comprador é obrigatório.", nameof(buyerName));

        VehicleId = vehicleId;
        BuyerAccessLinkId = buyerAccessLinkId;
        BuyerName = buyerName.Trim();
        BuyerDocument = buyerDocument.Trim();
        IpAddress = string.IsNullOrWhiteSpace(ipAddress) ? "0.0.0.0" : ipAddress.Trim();
        AcceptedAt = DateTime.UtcNow;
        TermVersion = termVersion;
    }
}
