using AutoNexus.Domain.Interfaces;
using AutoNexus.Infrastructure.Data;

namespace AutoNexus.Infrastructure.Repositories;

public class UnitOfWork : IUnitOfWork
{
    private readonly AutoNexusDbContext _context;

    public UnitOfWork(AutoNexusDbContext context)
    {
        _context = context;
    }

    public async Task<int> CommitAsync(CancellationToken cancellationToken = default)
    {
        return await _context.SaveChangesAsync(cancellationToken);
    }
}