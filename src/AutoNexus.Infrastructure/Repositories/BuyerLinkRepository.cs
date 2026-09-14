using AutoNexus.Domain.Entities;
using AutoNexus.Domain.Interfaces;
using AutoNexus.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace AutoNexus.Infrastructure.Repositories;

public class BuyerLinkRepository : IBuyerLinkRepository
{
    private readonly AutoNexusDbContext _context;

    public BuyerLinkRepository(AutoNexusDbContext context)
    {
        _context = context;
    }

    public async Task<BuyerAccessLink?> GetByTokenAsync(string token, CancellationToken cancellationToken = default)
    {
        return await _context.BuyerAccessLinks
            .FirstOrDefaultAsync(l => l.Token == token, cancellationToken);
    }

    public async Task AddAsync(BuyerAccessLink link, CancellationToken cancellationToken = default)
    {
        await _context.BuyerAccessLinks.AddAsync(link, cancellationToken);
    }
}
