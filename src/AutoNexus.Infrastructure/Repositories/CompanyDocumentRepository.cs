using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using AutoNexus.Domain.Entities;
using AutoNexus.Domain.Interfaces;
using AutoNexus.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
namespace AutoNexus.Infrastructure.Repositories;
public class CompanyDocumentRepository : ICompanyDocumentRepository
{
    private readonly AutoNexusDbContext _context;
    public CompanyDocumentRepository(AutoNexusDbContext context) { _context = context; }
    public async Task<IEnumerable<CompanyDocument>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await _context.Set<CompanyDocument>().OrderByDescending(d => d.CreatedAt).ToListAsync(cancellationToken);
    }
    public async Task<CompanyDocument?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _context.Set<CompanyDocument>().FirstOrDefaultAsync(d => d.Id == id, cancellationToken);
    }
    public async Task AddAsync(CompanyDocument document, CancellationToken cancellationToken = default)
    {
        await _context.Set<CompanyDocument>().AddAsync(document, cancellationToken);
    }
    public void Delete(CompanyDocument document)
    {
        _context.Set<CompanyDocument>().Remove(document);
    }
}
