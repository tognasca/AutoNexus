using AutoNexus.Domain.Enums;

namespace AutoNexus.Domain.Entities;

public class Lead : TenantOwnedEntityBase
{
    public string Name { get; private set; } = string.Empty;
    public string Phone { get; private set; } = string.Empty;
    public string? Email { get; private set; }
    public string Source { get; private set; } = "Manual";
    public string? Notes { get; private set; }
    public LeadStatus Status { get; private set; } = LeadStatus.Novo;
    public Guid? VehicleId { get; private set; }
    public Vehicle? Vehicle { get; private set; }
    public Guid? AssignedToUserId { get; private set; }
    public User? AssignedToUser { get; private set; }
    public DateTime? LastContactAt { get; private set; }

    private Lead() { }

    public Lead(string name, string phone, string? email, string source, string? notes, Guid? vehicleId, Guid? assignedToUserId)
    {
        UpdateDetails(name, phone, email, source, notes, vehicleId, assignedToUserId);
    }

    public void UpdateDetails(string name, string phone, string? email, string? source, string? notes, Guid? vehicleId, Guid? assignedToUserId)
    {
        if (string.IsNullOrWhiteSpace(name)) throw new ArgumentException("Nome do lead é obrigatório.", nameof(name));
        if (string.IsNullOrWhiteSpace(phone)) throw new ArgumentException("Telefone do lead é obrigatório.", nameof(phone));
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
