namespace AutoNexus.Domain.Entities;

public class TenantSetting : TenantOwnedEntityBase
{
    public string CompanyName { get; private set; } = string.Empty;
    public string? LogoUrl { get; private set; }
    public string PrimaryColor { get; private set; } = "#2563eb";
    public string TimeZone { get; private set; } = "America/Sao_Paulo";
    public string Currency { get; private set; } = "BRL";

    protected TenantSetting() { }

    public TenantSetting(string companyName)
    {
        if (string.IsNullOrWhiteSpace(companyName))
            throw new ArgumentException("Nome da empresa é obrigatório.", nameof(companyName));

        CompanyName = companyName.Trim();
    }

    public void Update(string companyName, string? logoUrl, string primaryColor, string timeZone, string currency)
    {
        if (string.IsNullOrWhiteSpace(companyName))
            throw new ArgumentException("Nome da empresa é obrigatório.", nameof(companyName));

        CompanyName = companyName.Trim();
        LogoUrl = logoUrl;
        PrimaryColor = string.IsNullOrWhiteSpace(primaryColor) ? "#2563eb" : primaryColor;
        TimeZone = string.IsNullOrWhiteSpace(timeZone) ? "America/Sao_Paulo" : timeZone;
        Currency = string.IsNullOrWhiteSpace(currency) ? "BRL" : currency;
        UpdatedAt = DateTime.UtcNow;
    }
}
