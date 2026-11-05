using AutoNexus.Domain.Entities;

namespace AutoNexus.Application.Tests;

public sealed class PlatformIntegrationConfigurationTests
{
    [Fact]
    public void Update_StoresNonSecretSettingsAndUsesDefaultSenderName()
    {
        var configuration = new PlatformIntegrationConfiguration();

        configuration.Update("encrypted-resend", "contato@example.com", null,
            "encrypted-bv-token", "encrypted-partner", null);

        Assert.Equal("contato@example.com", configuration.ResendFromEmail);
        Assert.Equal("AutoNexus", configuration.ResendFromName);
        Assert.Equal("encrypted-resend", configuration.EncryptedResendApiKey);
        Assert.Equal("encrypted-bv-token", configuration.EncryptedBvAccessToken);
        Assert.Equal("encrypted-partner", configuration.EncryptedBvCommercialPartnerCode);
        Assert.StartsWith("https://", configuration.BvFinancingConditionsEndpoint);
        Assert.True(configuration.ConfiguredAtUtc > DateTime.UtcNow.AddMinutes(-1));
    }

    [Fact]
    public void Update_RejectsNonHttpsBvEndpoint()
    {
        var configuration = new PlatformIntegrationConfiguration();

        Assert.Throws<ArgumentException>(() => configuration.Update(
            null, null, null, null, null, "http://example.com/endpoint"));
    }
}
