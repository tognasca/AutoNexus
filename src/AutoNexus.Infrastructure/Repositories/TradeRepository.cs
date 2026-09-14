using AutoNexus.Domain.Entities;
using AutoNexus.Domain.Interfaces;
using AutoNexus.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace AutoNexus.Infrastructure.Repositories;

public class TradeRepository : ITradeRepository
{
    private readonly AutoNexusDbContext _context;

    public TradeRepository(AutoNexusDbContext context)
    {
        _context = context;
    }

    public async Task<Trade?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _context.Trades
            .Include(t => t.ReceivedVehicle)
            .Include(t => t.DeliveredVehicle)
            .FirstOrDefaultAsync(t => t.Id == id, cancellationToken);
    }

    public async Task<IEnumerable<Trade>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await _context.Trades
            .Include(t => t.ReceivedVehicle)
            .Include(t => t.DeliveredVehicle)
            .OrderByDescending(t => t.TradeDate)
            .ToListAsync(cancellationToken);
    }

    public async Task AddAsync(Trade trade, CancellationToken cancellationToken = default)
    {
        await _context.Trades.AddAsync(trade, cancellationToken);
    }
}
