using AutoNexus.Domain.Enums;

namespace AutoNexus.Domain.Entities;

/// <summary>
/// Registro de aceite de um documento legal por um usuário (requisito 13 do
/// documento original). TenantOwnedEntityBase para que o Admin de cada
/// empresa consiga auditar o aceite dos próprios usuários, isolado dos
/// demais tenants.
/// </summary>
public class UserConsent : TenantOwnedEntityBase
{
    public Guid UserId { get; private set; }
    public LegalDocumentType DocumentType { get; private set; }
    public int DocumentVersion { get; private set; }
    public DateTime AcceptedAt { get; private set; }
    public string? IpAddress { get; private set; }

    protected UserConsent() { }

    public UserConsent(Guid userId, LegalDocumentType documentType, int documentVersion, string? ipAddress = null)
    {
        UserId = userId;
        DocumentType = documentType;
        DocumentVersion = documentVersion;
        IpAddress = ipAddress;
        AcceptedAt = DateTime.UtcNow;
    }
}
