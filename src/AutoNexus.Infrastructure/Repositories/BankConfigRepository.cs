using AutoNexus.Domain.Entities;
using AutoNexus.Domain.Interfaces;
using AutoNexus.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace AutoNexus.Infrastructure.Repositories;

public class BankConfigRepository : IBankConfigRepository
{
    private readonly AutoNexusDbContext _context;

    public BankConfigRepository(AutoNexusDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<BankConfig>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await _context.Set<BankConfig>()
            .OrderBy(b => b.Name)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<BankConfig>> GetActiveConfigsAsync(CancellationToken cancellationToken = default)
    {
        return await _context.Set<BankConfig>()
            .Where(b => b.IsActive)
            .OrderBy(b => b.Name)
            .ToListAsync(cancellationToken);
    }

    public async Task<BankConfig?> GetByCodeAsync(string bankCode, CancellationToken cancellationToken = default)
    {
        var code = bankCode.ToLower().Trim();
        return await _context.Set<BankConfig>()
            .FirstOrDefaultAsync(b => b.BankCode == code, cancellationToken);
    }

    public async Task<BankConfig?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _context.Set<BankConfig>()
            .FirstOrDefaultAsync(b => b.Id == id, cancellationToken);
    }

    public async Task AddAsync(BankConfig config, CancellationToken cancellationToken = default)
    {
        await _context.Set<BankConfig>().AddAsync(config, cancellationToken);
    }

    public Task UpdateAsync(BankConfig config, CancellationToken cancellationToken = default)
    {
        _context.Set<BankConfig>().Update(config);
        return Task.CompletedTask;
    }
}