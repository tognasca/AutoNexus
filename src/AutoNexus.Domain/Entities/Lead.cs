using AutoNexus.Domain.Enums;

namespace AutoNexus.Domain.Entities;

public class Lead : TenantOwnedEntityBase
{
    public string Name { get; private set; } = string.Empty;
    public string Phone { get; private set; } = string.Empty;
    public string? Email { get; private set; }
    public string Source { get; private set; } = "Manual";
    public string? ExternalId { get; private set; }
    public bool IsMarketplace() => IsMarketplace(Source);
    public static bool IsMarketplace(string? source) =>
        source?.Trim().ToUpperInvariant() is "MARKETPLACE" or "MERCADO LIVRE" or "OLX" or "WEBMOTORS" or "ICARROS";

    public string[] MissingContactFields()
    {
        var fields = new List<string>();
        if (string.IsNullOrWhiteSpace(Name)) fields.Add("nome");
        var digits = Phone.Count(char.IsAsciiDigit);
        if (digits < 10 || digits > 15) fields.Add("telefone");
        if (IsMarketplace() && string.IsNullOrWhiteSpace(ExternalId)) fields.Add("identificador do portal");
        return fields.ToArray();
    }

    public void SetExternalId(string? value) => ExternalId = string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    public string? Notes { get; private set; }
    public LeadStatus Status { get; private set; } = LeadStatus.Novo;
    public Guid? VehicleId { get; private set; }
    public Vehicle? Vehicle { get; private set; }
    public Guid? AssignedToUserId { get; private set; }
    public User? AssignedToUser { get; private set; }
    public DateTime? LastContactAt { get; private set; }

    public decimal? OfferValue { get; private set; }
    public decimal? DownPayment { get; private set; }
    public string? TradeDescription { get; private set; }
    public DateTime? NextContactAt { get; private set; }
    public DateOnly? OfferValidUntil { get; private set; }

    public void UpdateAttendance(decimal? offerValue, decimal? downPayment,
        string? tradeDescription, DateTime? nextContactAt, DateOnly? offerValidUntil)
    {
        OfferValue = offerValue;
        DownPayment = downPayment;
        TradeDescription = tradeDescription;
        NextContactAt = nextContactAt;
        OfferValidUntil = offerValidUntil;
        UpdatedAt = DateTime.UtcNow;
    }

    public decimal? Budget { get; private set; }
    public int? PreferredTransmission { get; private set; }
    public string? PreferredModels { get; private set; }
    public string? ShareTokenHash { get; private set; }
    public string? ProposalSnapshot { get; private set; }
    public DateTime? ShareExpiresAt { get; private set; }
    public string? BuyerResponse { get; private set; }
    public DateTime? BuyerRespondedAt { get; private set; }

    public void SetBuyerPreferences(decimal? budget, int? transmission, string? models)
    {
        if (budget <= 0 || models?.Length > 500 ||
            (transmission.HasValue && !Enum.IsDefined(typeof(TransmissionType), transmission.Value)))
            throw new ArgumentException("Preferências de compra inválidas.");
        Budget = budget;
        PreferredTransmission = transmission;
        PreferredModels = string.IsNullOrWhiteSpace(models) ? null : models.Trim();
        UpdatedAt = DateTime.UtcNow;
    }
    public void PublishProposal(string tokenHash, string snapshot, DateTime expiresAt)
    {
        ShareTokenHash = tokenHash;
        ProposalSnapshot = snapshot;
        ShareExpiresAt = expiresAt;
        BuyerResponse = null;
        BuyerRespondedAt = null;
        UpdatedAt = DateTime.UtcNow;
    }
    public void RevokeProposal() { ShareTokenHash = null; ShareExpiresAt = null; UpdatedAt = DateTime.UtcNow; }
    public void RespondToProposal(string response)
    {
        BuyerResponse = response;
        BuyerRespondedAt = DateTime.UtcNow;
        UpdatedAt = DateTime.UtcNow;
    }

    private Lead() { }

    public Lead(string name, string phone, string? email, string source, string? notes, Guid? vehicleId, Guid? assignedToUserId)
    {
        UpdateDetails(name, phone, email, source, notes, vehicleId, assignedToUserId);
    }

    public void UpdateDetails(string name, string phone, string? email, string? source, string? notes, Guid? vehicleId, Guid? assignedToUserId)
    {
        if (!IsMarketplace(source) && string.IsNullOrWhiteSpace(name)) throw new ArgumentException("Nome do lead é obrigatório.", nameof(name));
        if (!IsMarketplace(source) && string.IsNullOrWhiteSpace(phone)) throw new ArgumentException("Telefone do lead é obrigatório.", nameof(phone));
        Name = name.Trim();
        Phone = phone.Trim();
        Email = string.IsNullOrWhiteSpace(email) ? null : email.Trim().ToLowerInvariant();
        Source = string.IsNullOrWhiteSpace(source) ? "Manual" : source.Trim();
        Notes = string.IsNullOrWhiteSpace(notes) ? null : notes.Trim();
        VehicleId = vehicleId;
        AssignedToUserId = assignedToUserId;
        UpdatedAt = DateTime.UtcNow;
    }

    public void ChangeStatus(LeadStatus status)
    {
        if (!Enum.IsDefined(status)) throw new ArgumentOutOfRangeException(nameof(status));
        Status = status;
        UpdatedAt = DateTime.UtcNow;
    }

    public void RegisterContact(DateTime? contactedAt = null)
    {
        LastContactAt = contactedAt ?? DateTime.UtcNow;
        if (Status == LeadStatus.Novo) Status = LeadStatus.Contato;
        UpdatedAt = DateTime.UtcNow;
    }
}
