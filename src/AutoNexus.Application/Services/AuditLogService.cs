using AutoNexus.Application.Interfaces;
using AutoNexus.Domain.Entities;
using AutoNexus.Domain.Interfaces;

namespace AutoNexus.Application.Services;

public class AuditLogService : IAuditLogService
{
    private readonly IAuditLogRepository _repository;
    private readonly ITenantContext _tenantContext;

    public AuditLogService(IAuditLogRepository repository, ITenantContext tenantContext)
    {
        _repository = repository;
        _tenantContext = tenantContext;
    }

    public async Task LogAsync(string operation, string resource, string? resourceId = null, string? details = null, CancellationToken cancellationToken = default)
    {
        var log = new AuditLog(_tenantContext.UserId, operation, resource, resourceId, details);
        // Dentro de uma requisição de tenant normal, o SaveChanges do
        // AutoNexusDbContext carimba o TenantId sozinho (mesma lógica de
        // qualquer outra entidade nova) — não precisa de AddForTenantAsync aqui.
        await _repository.AddAsync(log, cancellationToken);
    }

    public async Task LogForTenantAsync(Guid tenantId, Guid? userId, string operation, string resource, string? resourceId = null, string? details = null, CancellationToken cancellationToken = default)
    {
        var log = new AuditLog(userId, operation, resource, resourceId, details);
        await _repository.AddForTenantAsync(log, tenantId, cancellationToken);
    }
}
