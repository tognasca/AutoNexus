using AutoNexus.Domain.Entities;
using AutoNexus.Domain.Enums;
using AutoNexus.Domain.Interfaces;
using AutoNexus.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace AutoNexus.Infrastructure.Repositories;

public class LegalDocumentRepository : ILegalDocumentRepository
{
    private readonly AutoNexusDbContext _context;

    public LegalDocumentRepository(AutoNexusDbContext context)
    {
        _context = context;
    }

    public Task<LegalDocument?> GetActiveAsync(LegalDocumentType type, CancellationToken cancellationToken = default)
        => _context.LegalDocuments
            .Where(d => d.Type == type && d.IsActive)
            .OrderByDescending(d => d.Version)
            .FirstOrDefaultAsync(cancellationToken);

    public Task<LegalDocument?> GetByTypeAndVersionAsync(LegalDocumentType type, int version, CancellationToken cancellationToken = default)
        => _context.LegalDocuments.FirstOrDefaultAsync(d => d.Type == type && d.Version == version, cancellationToken);
}
