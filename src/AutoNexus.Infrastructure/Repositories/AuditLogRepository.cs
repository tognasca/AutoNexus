using AutoNexus.Domain.Entities;
using AutoNexus.Domain.Interfaces;
using AutoNexus.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace AutoNexus.Infrastructure.Repositories;

public class AuditLogRepository : IAuditLogRepository
{
    private readonly AutoNexusDbContext _context;

    public AuditLogRepository(AutoNexusDbContext context)
    {
        _context = context;
    }

    public async Task AddAsync(AuditLog log, CancellationToken cancellationToken = default)
        => await _context.AuditLogs.AddAsync(log, cancellationToken);

    public async Task AddForTenantAsync(AuditLog log, Guid tenantId, CancellationToken cancellationToken = default)
    {
        log.TenantId = tenantId;
        await _context.AuditLogs.AddAsync(log, cancellationToken);
    }

    // IgnoreQueryFilters() de propósito — mesma lógica do UserRepository.
    // GetAllAcrossTenantsAsync: só para o painel do SuperAdmin.
    public async Task<List<AuditLog>> GetAllAcrossTenantsAsync(Guid? tenantId = null, int take = 200, CancellationToken cancellationToken = default)
    {
        var query = _context.AuditLogs.IgnoreQueryFilters().AsQueryable();

        if (tenantId.HasValue)
            query = query.Where(a => a.TenantId == tenantId.Value);

        return await query
            .OrderByDescending(a => a.ExecutedAt)
            .Take(take)
            .ToListAsync(cancellationToken);
    }
}
