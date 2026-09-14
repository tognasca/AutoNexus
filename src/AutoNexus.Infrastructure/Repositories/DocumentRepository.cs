using AutoNexus.Domain.Entities;
using AutoNexus.Domain.Interfaces;
using AutoNexus.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace AutoNexus.Infrastructure.Repositories;

public class DocumentRepository : IDocumentRepository
{
    private readonly AutoNexusDbContext _context;

    public DocumentRepository(AutoNexusDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<VehicleDocument>> GetByVehicleIdAsync(Guid vehicleId, CancellationToken cancellationToken = default)
    {
        return await _context.VehicleDocuments
            .Include(d => d.DocumentCategory)
            .Where(d => d.VehicleId == vehicleId)
            .OrderByDescending(d => d.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<VehicleDocument?> GetByIdAsync(Guid documentId, CancellationToken cancellationToken = default)
    {
        return await _context.VehicleDocuments
            .Include(d => d.DocumentCategory)
            .FirstOrDefaultAsync(d => d.Id == documentId, cancellationToken);
    }

    public async Task AddAsync(VehicleDocument document, CancellationToken cancellationToken = default)
    {
        await _context.VehicleDocuments.AddAsync(document, cancellationToken);
    }

    public void Delete(VehicleDocument document)
    {
        _context.VehicleDocuments.Remove(document);
    }
}
