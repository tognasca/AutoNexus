using AutoNexus.Domain.Entities;

namespace AutoNexus.Domain.Interfaces;

public interface IAuditLogRepository
{
    Task AddAsync(AuditLog log, CancellationToken cancellationToken = default);

    /// <summary>Mesmo cuidado de IUserRepository.AddForTenantAsync — ver AuditLogService.LogForTenantAsync.</summary>
    Task AddForTenantAsync(AuditLog log, Guid tenantId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Uso exclusivo do SuperAdmin: ignora o filtro de tenant de propósito,
    /// para permitir uma visão global de auditoria. Quando tenantId é
    /// informado, filtra para aquela empresa específica.
    /// </summary>
    Task<List<AuditLog>> GetAllAcrossTenantsAsync(Guid? tenantId = null, int take = 200, CancellationToken cancellationToken = default);
}
