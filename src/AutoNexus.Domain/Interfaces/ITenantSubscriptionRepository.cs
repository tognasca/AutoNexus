using AutoNexus.Domain.Entities;

namespace AutoNexus.Domain.Interfaces;

public interface ITenantSubscriptionRepository
{
    /// <summary>Respeita o filtro global normalmente — usar dentro de rotas comuns (tenant vendo a própria assinatura).</summary>
    Task<TenantSubscription?> GetCurrentAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Uso exclusivo do SuperAdmin: busca a assinatura de um tenant
    /// específico ignorando o filtro global (o SuperAdmin não pertence a
    /// tenant nenhum, então sem isso nunca enxergaria nenhuma assinatura).
    /// </summary>
    Task<TenantSubscription?> GetByTenantIdAsync(Guid tenantId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Usado pelo processamento de webhook (requisição sem JWT/tenant
    /// ambiente) para localizar a assinatura local a partir do id que o
    /// gateway de pagamento devolve. Ignora o filtro global de propósito,
    /// pelo mesmo motivo de GetByTenantIdAsync.
    /// </summary>
    /// <summary>Uso de webhook/jobs: busca por Id ignorando o filtro de tenant.</summary>
    Task<TenantSubscription?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);

    Task<TenantSubscription?> GetByExternalSubscriptionIdAsync(string externalSubscriptionId, CancellationToken cancellationToken = default);

    /// <summary>Uso do job de manutenção (sem tenant ambiente): todas as assinaturas em trial com data de término definida, de todos os tenants.</summary>
    Task<List<TenantSubscription>> GetTrialingAsync(CancellationToken cancellationToken = default);

    Task AddAsync(TenantSubscription subscription, CancellationToken cancellationToken = default);

    /// <summary>
    /// Mesmo cuidado do IUserRepository.AddForTenantAsync: usado pelo
    /// SuperAdmin ao provisionar a assinatura de uma empresa que não é a
    /// sua (ele não tem tenant nenhum) — atribui o TenantId explicitamente
    /// em vez de deixar o AutoNexusDbContext carimbar o tenant errado.
    /// </summary>
    Task AddForTenantAsync(TenantSubscription subscription, Guid tenantId, CancellationToken cancellationToken = default);
    void Update(TenantSubscription subscription);
}
