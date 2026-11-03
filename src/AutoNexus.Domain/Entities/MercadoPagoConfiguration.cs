using System;

namespace AutoNexus.Domain.Entities;

/// <summary>Credenciais globais do gateway, pertencentes exclusivamente ao SaaS.</summary>
public sealed class MercadoPagoConfiguration : EntityBase
{
    public string EncryptedAccessToken { get; private set; } = string.Empty;
    public string EncryptedWebhookSecret { get; private set; } = string.Empty;
    public string Environment { get; private set; } = "production";
    public DateTime ConfiguredAtUtc { get; private set; }

    private MercadoPagoConfiguration() { }

    public void SetCredentials(string encryptedAccessToken, string encryptedWebhookSecret, string environment)
    {
        if (string.IsNullOrWhiteSpace(encryptedAccessToken)) throw new ArgumentException("Access Token criptografado é obrigatório.");
        if (string.IsNullOrWhiteSpace(encryptedWebhookSecret)) throw new ArgumentException("Segredo do Webhook criptografado é obrigatório.");
        if (environment is not ("test" or "production")) throw new ArgumentException("Ambiente inválido.");
        EncryptedAccessToken = encryptedAccessToken;
        EncryptedWebhookSecret = encryptedWebhookSecret;
        Environment = environment;
        ConfiguredAtUtc = DateTime.UtcNow;
        UpdatedAt = DateTime.UtcNow;
    }
}
