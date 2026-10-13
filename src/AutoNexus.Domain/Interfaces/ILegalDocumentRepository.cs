using AutoNexus.Domain.Entities;
using AutoNexus.Domain.Enums;

namespace AutoNexus.Domain.Interfaces;

public interface ILegalDocumentRepository
{
    Task<LegalDocument?> GetActiveAsync(LegalDocumentType type, CancellationToken cancellationToken = default);
    Task<LegalDocument?> GetByTypeAndVersionAsync(LegalDocumentType type, int version, CancellationToken cancellationToken = default);
}
