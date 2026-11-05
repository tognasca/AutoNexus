namespace AutoNexus.Domain.Entities;

public sealed class TenantWhatsAppContact : TenantOwnedEntityBase
{
    public string Name { get; private set; } = string.Empty;
    public string PhoneNumber { get; private set; } = string.Empty;
    public bool IsDefault { get; private set; }
    public bool IsActive { get; private set; } = true;

    private TenantWhatsAppContact() { }

    public TenantWhatsAppContact(string name, string phoneNumber, bool isDefault = false)
    {
        Update(name, phoneNumber, isDefault);
    }

    public void Update(string name, string phoneNumber, bool isDefault)
    {
        if (string.IsNullOrWhiteSpace(name)) throw new ArgumentException("Nome do contato é obrigatório.", nameof(name));
        var digits = new string((phoneNumber ?? string.Empty).Where(char.IsDigit).ToArray());
        if (digits.Length < 10 || digits.Length > 15) throw new ArgumentException("WhatsApp deve conter entre 10 e 15 dígitos, incluindo DDI.", nameof(phoneNumber));
        Name = name.Trim();
        PhoneNumber = digits;
        IsDefault = isDefault;
        UpdatedAt = DateTime.UtcNow;
    }

    public void SetDefault(bool value) { IsDefault = value; UpdatedAt = DateTime.UtcNow; }
    public void SetActive(bool value) { IsActive = value; UpdatedAt = DateTime.UtcNow; }
}