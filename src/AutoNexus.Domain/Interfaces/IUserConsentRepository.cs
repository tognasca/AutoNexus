using AutoNexus.Domain.Entities;

namespace AutoNexus.Domain.Interfaces;

public interface IUserConsentRepository
{
    Task AddAsync(UserConsent consent, CancellationToken cancellationToken = default);

    /// <summary>Uso no cadastro público (sem tenant ambiente ainda) — ver padrão AddForTenantAsync.</summary>
    Task AddForTenantAsync(UserConsent consent, Guid tenantId, CancellationToken cancellationToken = default);
}
