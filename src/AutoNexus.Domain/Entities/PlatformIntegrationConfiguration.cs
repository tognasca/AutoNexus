namespace AutoNexus.Domain.Entities;

/// <summary>Configurações globais das integrações externas do AutoNexus.</summary>
public sealed class PlatformIntegrationConfiguration : EntityBase
{
    public string? EncryptedResendApiKey { get; private set; }
    public string? ResendFromEmail { get; private set; }
    public string ResendFromName { get; private set; } = "AutoNexus";
    public string? EncryptedBvAccessToken { get; private set; }
    public string? EncryptedBvCommercialPartnerCode { get; private set; }
    public string BvFinancingConditionsEndpoint { get; private set; } =
        "https://apige-uat-sbx.bancobv.com.br/partner-funding/v1/financing-conditions";
    public DateTime ConfiguredAtUtc { get; private set; }

    private PlatformIntegrationConfiguration() { }

    public void Update(string? encryptedResendApiKey, string? resendFromEmail, string? resendFromName,
        string? encryptedBvAccessToken, string? encryptedBvCommercialPartnerCode, string? bvEndpoint)
    {
        EncryptedResendApiKey = Normalize(encryptedResendApiKey, 4000);
        ResendFromEmail = Normalize(resendFromEmail, 320);
        ResendFromName = Normalize(resendFromName, 120) ?? "AutoNexus";
        EncryptedBvAccessToken = Normalize(encryptedBvAccessToken, 4000);
        EncryptedBvCommercialPartnerCode = Normalize(encryptedBvCommercialPartnerCode, 4000);
        var endpoint = Normalize(bvEndpoint, 1000) ??
            "https://apige-uat-sbx.bancobv.com.br/partner-funding/v1/financing-conditions";
        if (!Uri.TryCreate(endpoint, UriKind.Absolute, out var uri) || uri.Scheme != Uri.UriSchemeHttps)
            throw new ArgumentException("O endpoint BV precisa ser uma URL HTTPS válida.", nameof(bvEndpoint));
        BvFinancingConditionsEndpoint = endpoint;
        ConfiguredAtUtc = DateTime.UtcNow;
        UpdatedAt = DateTime.UtcNow;
    }

    private static string? Normalize(string? value, int maxLength)
    {
        if (string.IsNullOrWhiteSpace(value)) return null;
        var result = value.Trim();
        if (result.Length > maxLength) throw new ArgumentException($"O valor excede {maxLength} caracteres.");
        return result;
    }
}