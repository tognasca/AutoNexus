using AutoNexus.Domain.Entities;
using AutoNexus.Domain.Interfaces;
using AutoNexus.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace AutoNexus.Infrastructure.Repositories;

public class TenantRepository : ITenantRepository
{
    private readonly AutoNexusDbContext _context;

    public TenantRepository(AutoNexusDbContext context)
    {
        _context = context;
    }

    // Tenant não herda de TenantOwnedEntityBase (é EntityBase puro), então
    // nenhuma consulta aqui é afetada pelo filtro global de tenant — o que é
    // correto: listar/gerenciar empresas é uma operação do SuperAdmin, não
    // de dentro de uma empresa específica.
    public Task<Tenant?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
        => _context.Tenants.FirstOrDefaultAsync(t => t.Id == id, cancellationToken);

    public Task<List<Tenant>> GetAllAsync(CancellationToken cancellationToken = default)
        => _context.Tenants.OrderBy(t => t.Name).ToListAsync(cancellationToken);

    public Task<bool> SlugExistsAsync(string slug, CancellationToken cancellationToken = default)
        => _context.Tenants.AnyAsync(t => t.Slug == slug, cancellationToken);

    public async Task AddAsync(Tenant tenant, CancellationToken cancellationToken = default)
        => await _context.Tenants.AddAsync(tenant, cancellationToken);

    public void Update(Tenant tenant)
        => _context.Tenants.Update(tenant);
}
