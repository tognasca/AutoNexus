using AutoNexus.Application.DTOs;
using AutoNexus.Application.Interfaces;
using AutoNexus.Domain.Entities;
using AutoNexus.Domain.Enums;
using AutoNexus.Domain.Interfaces;

namespace AutoNexus.Application.Services;

public class LegalService : ILegalService
{
    private readonly ILegalDocumentRepository _documents;
    private readonly IUserConsentRepository _consents;
    private readonly ITenantContext _tenantContext;
    private readonly IUnitOfWork _uow;

    public LegalService(ILegalDocumentRepository documents, IUserConsentRepository consents, ITenantContext tenantContext, IUnitOfWork uow)
    {
        _documents = documents; _consents = consents; _tenantContext = tenantContext; _uow = uow;
    }

    public async Task<LegalDocumentDto?> GetActiveAsync(LegalDocumentType type, CancellationToken ct = default)
    {
        var doc = await _documents.GetActiveAsync(type, ct);
        return doc == null ? null : new LegalDocumentDto(doc.Type, doc.Version, doc.Content, doc.PublishedAt);
    }

    /// <summary>Registra o aceite (versão vigente) do usuário autenticado — usado quando um documento é atualizado.</summary>
    public async Task AcceptAsync(LegalDocumentType type, string? ipAddress, CancellationToken ct = default)
    {
        if (!_tenantContext.HasTenant || _tenantContext.UserId == null)
            throw new InvalidOperationException("Faça login para registrar o aceite.");

        var doc = await _documents.GetActiveAsync(type, ct) ?? throw new KeyNotFoundException("Documento não encontrado.");
        await _consents.AddAsync(new UserConsent(_tenantContext.UserId.Value, doc.Type, doc.Version, ipAddress), ct);
        await _uow.CommitAsync(ct);
    }
}
