using System.Data;
using Microsoft.EntityFrameworkCore;
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

    public void DiscardChanges()
    {
        _context.ChangeTracker.Clear();
    }

    public async Task ExecuteInTransactionAsync(Func<Task> operation, CancellationToken cancellationToken = default)
    {
        await using var transaction = await _context.Database.BeginTransactionAsync(IsolationLevel.Serializable, cancellationToken);
        await operation();
        await transaction.CommitAsync(cancellationToken);
    }
}