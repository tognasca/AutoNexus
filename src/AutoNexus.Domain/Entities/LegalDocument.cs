using AutoNexus.Domain.Enums;

namespace AutoNexus.Domain.Entities;

/// <summary>
/// Texto versionado de Termos de Uso / Política de Privacidade / Política de
/// Cookies da plataforma AutoNexus — documento global da própria plataforma
/// SaaS (não de cada empresa cliente), por isso herda de EntityBase.
///
/// IMPORTANTE (requisito 12 do documento original): o conteúdo inicial
/// (ver LegalDocumentConfiguration/seed) é um texto técnico-estrutural
/// PLACEHOLDER, preparado para revisão jurídica — não é um documento
/// juridicamente válido/completo. Não declarar conformidade legal com base
/// nele.
/// </summary>
public class LegalDocument : EntityBase
{
    public LegalDocumentType Type { get; private set; }
    public int Version { get; private set; }
    public string Content { get; private set; } = string.Empty;
    public bool IsActive { get; private set; }
    public DateTime PublishedAt { get; private set; }

    protected LegalDocument() { }

    public LegalDocument(LegalDocumentType type, int version, string content)
    {
        if (string.IsNullOrWhiteSpace(content))
            throw new ArgumentException("Conteúdo do documento é obrigatório.", nameof(content));
        if (version < 1)
            throw new ArgumentException("Versão deve ser maior que zero.", nameof(version));

        Type = type;
        Version = version;
        Content = content;
        IsActive = true;
        PublishedAt = DateTime.UtcNow;
    }

    /// <summary>Aposenta esta versão (quando uma nova é publicada) — mantém o histórico, não apaga.</summary>
    public void Retire()
    {
        IsActive = false;
        UpdatedAt = DateTime.UtcNow;
    }
}
