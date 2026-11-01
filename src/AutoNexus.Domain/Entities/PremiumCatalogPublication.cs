using System.Text.RegularExpressions;

namespace AutoNexus.Domain.Entities;

/// <summary>Configuração do domínio próprio do catálogo Premium.</summary>
public class PremiumCatalogPublication : TenantOwnedEntityBase
{
    public string Domain { get; private set; } = string.Empty;
    public bool IsActive { get; private set; }
    public DateTime? LastGeneratedAt { get; private set; }

    protected PremiumCatalogPublication() { }

    public PremiumCatalogPublication(Guid tenantId, string domain) : base(tenantId)
    {
        SetDomain(domain);
        IsActive = true;
    }

    public void SetDomain(string domain)
    {
        var normalized = NormalizeDomain(domain);
        if (normalized.Length == 0 || normalized.Length > 253 || normalized.Contains("/"))
            throw new ArgumentException("Domínio inválido.", nameof(domain));
        if (!Regex.IsMatch(normalized, @"^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$", RegexOptions.IgnoreCase))
            throw new ArgumentException("Informe um domínio válido, como www.minhaloja.com.br.", nameof(domain));
        Domain = normalized;
        UpdatedAt = DateTime.UtcNow;
    }

    public void MarkGenerated()
    {
        LastGeneratedAt = DateTime.UtcNow;
        UpdatedAt = LastGeneratedAt;
    }

    public void Activate()
    {
        IsActive = true;
        UpdatedAt = DateTime.UtcNow;
    }

    public void Deactivate()
    {
        IsActive = false;
        UpdatedAt = DateTime.UtcNow;
    }

    public static string NormalizeDomain(string domain) =>
        domain.Trim().TrimEnd('.').ToLowerInvariant();
}
