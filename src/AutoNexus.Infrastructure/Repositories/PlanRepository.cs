using AutoNexus.Domain.Entities;
using AutoNexus.Domain.Interfaces;
using AutoNexus.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace AutoNexus.Infrastructure.Repositories;

public class PlanRepository : IPlanRepository
{
    private readonly AutoNexusDbContext _context;

    public PlanRepository(AutoNexusDbContext context)
    {
        _context = context;
    }

    public async Task<List<Plan>> GetAllAsync(CancellationToken cancellationToken = default)
        => await _context.Plans.OrderBy(p => p.Price).ToListAsync(cancellationToken);

    public async Task<Plan?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
        => await _context.Plans.FirstOrDefaultAsync(p => p.Id == id, cancellationToken);

    public async Task AddAsync(Plan plan, CancellationToken cancellationToken = default)
        => await _context.Plans.AddAsync(plan, cancellationToken);

    public void Update(Plan plan)
        => _context.Plans.Update(plan);
}
