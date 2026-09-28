using AutoNexus.Domain.Entities;
using AutoNexus.Domain.Interfaces;
using AutoNexus.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace AutoNexus.Infrastructure.Repositories;

// Plan é dado global (EntityBase, não TenantOwnedEntityBase) — nenhuma
// consulta aqui é afetada pelo filtro de tenant, o que é correto: o
// catálogo de planos é o mesmo para todas as empresas.
public class PlanRepository : IPlanRepository
{
    private readonly AutoNexusDbContext _context;

    public PlanRepository(AutoNexusDbContext context)
    {
        _context = context;
    }

    public Task<Plan?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
        => _context.Plans.FirstOrDefaultAsync(p => p.Id == id, cancellationToken);

    public Task<List<Plan>> GetAllAsync(CancellationToken cancellationToken = default)
        => _context.Plans.OrderBy(p => p.Price).ToListAsync(cancellationToken);

    public async Task AddAsync(Plan plan, CancellationToken cancellationToken = default)
        => await _context.Plans.AddAsync(plan, cancellationToken);

    public void Update(Plan plan)
        => _context.Plans.Update(plan);
}
