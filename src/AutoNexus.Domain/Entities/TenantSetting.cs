namespace AutoNexus.Domain.Entities;

/// <summary>
/// Configurações próprias de cada empresa (uma linha por Tenant). Nunca
/// compartilhadas entre tenants — o filtro global de TenantOwnedEntityBase
/// garante isso automaticamente, e há também um índice único em TenantId
/// (ver TenantSettingsConfiguration) para impedir duas linhas de settings
/// para a mesma empresa.
/// </summary>
public class TenantSetting : TenantOwnedEntityBase
{
    public string CompanyName { get; private set; } = string.Empty;
    public string? LogoUrl { get; private set; }
    public string PrimaryColor { get; private set; } = "#15171B";
    public string? WhatsAppNumber { get; private set; }
    public string TimeZone { get; private set; } = "America/Sao_Paulo";
    public string Currency { get; private set; } = "BRL";

    protected TenantSetting() { }

    public TenantSetting(string companyName)
    {
        if (string.IsNullOrWhiteSpace(companyName))
            throw new ArgumentException("Nome da empresa é obrigatório.", nameof(companyName));

        CompanyName = companyName.Trim();
    }

    public void Update(string companyName, string? logoUrl, string primaryColor, string? whatsAppNumber, string timeZone, string currency)
    {
        if (string.IsNullOrWhiteSpace(companyName))
            throw new ArgumentException("Nome da empresa é obrigatório.", nameof(companyName));
        if (string.IsNullOrWhiteSpace(primaryColor))
            throw new ArgumentException("Cor primária é obrigatória.", nameof(primaryColor));
        if (string.IsNullOrWhiteSpace(timeZone))
            throw new ArgumentException("Fuso horário é obrigatório.", nameof(timeZone));
        if (string.IsNullOrWhiteSpace(currency))
            throw new ArgumentException("Moeda é obrigatória.", nameof(currency));

        CompanyName = companyName.Trim();
        LogoUrl = logoUrl;
        PrimaryColor = primaryColor.Trim();
        WhatsAppNumber = NormalizeWhatsAppNumber(whatsAppNumber);
        TimeZone = timeZone.Trim();
        Currency = currency.Trim().ToUpperInvariant();
        UpdatedAt = DateTime.UtcNow;
    }

    private static string? NormalizeWhatsAppNumber(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return null;

        var digits = new string(value.Where(char.IsDigit).ToArray());
        if (digits.Length < 10 || digits.Length > 15)
            throw new ArgumentException("WhatsApp deve conter entre 10 e 15 dígitos, incluindo DDI.", nameof(value));

        return digits;
    }
}
