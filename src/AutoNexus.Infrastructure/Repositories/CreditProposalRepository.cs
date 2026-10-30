using AutoNexus.Domain.Entities;
using AutoNexus.Domain.Interfaces;
using AutoNexus.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace AutoNexus.Infrastructure.Repositories;

public sealed class CreditProposalRepository : ICreditProposalRepository
{
    private readonly AutoNexusDbContext _context;

    public CreditProposalRepository(AutoNexusDbContext context) => _context = context;

    public async Task AddAsync(CreditProposalRecord proposal, CancellationToken cancellationToken = default)
    {
        await _context.Set<CreditProposalRecord>().AddAsync(proposal, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task UpdateAsync(CreditProposalRecord proposal, CancellationToken cancellationToken = default)
    {
        _context.Set<CreditProposalRecord>().Update(proposal);
        await _context.SaveChangesAsync(cancellationToken);
    }

    public Task<CreditProposalRecord?> GetByProposalNumberAsync(string proposalNumber, CancellationToken cancellationToken = default) =>
        _context.Set<CreditProposalRecord>()
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.ProposalNumber == proposalNumber, cancellationToken);

    public Task<CreditProposalRecord?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        _context.Set<CreditProposalRecord>()
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == id, cancellationToken);

    public async Task<IReadOnlyList<CreditProposalRecord>> GetAllAsync(CancellationToken cancellationToken = default) =>
        await _context.Set<CreditProposalRecord>()
            .AsNoTracking()
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync(cancellationToken);
}
