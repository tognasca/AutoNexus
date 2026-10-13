using AutoNexus.Domain.Entities;

namespace AutoNexus.Domain.Interfaces;

public interface IPaymentRepository
{
    /// <summary>Respeita o filtro global — histórico de pagamentos da própria empresa.</summary>
    Task<List<Payment>> GetBySubscriptionAsync(Guid subscriptionId, CancellationToken cancellationToken = default);

    Task<Payment?> GetByExternalPaymentIdAsync(string externalPaymentId, CancellationToken cancellationToken = default);

    /// <summary>Pagamento pendente criado no checkout de cartão, ainda sem id do gateway (a primeira cobrança recorrente ainda não chegou).</summary>
    Task<Payment?> GetPendingWithoutExternalIdAsync(Guid subscriptionId, CancellationToken cancellationToken = default);

    Task AddAsync(Payment payment, CancellationToken cancellationToken = default);

    /// <summary>Uso do webhook (sem tenant ambiente) — ver padrão em outros repositórios AddForTenantAsync.</summary>
    Task AddForTenantAsync(Payment payment, Guid tenantId, CancellationToken cancellationToken = default);

    void Update(Payment payment);
}
