using AutoNexus.Domain.Enums;

namespace AutoNexus.Domain.Entities;

/// <summary>
/// Histórico financeiro — nunca é apagado (requisito 17 do documento
/// original), mesmo quando a assinatura é cancelada. Cada pagamento
/// (aprovado, pendente ou recusado) de cada período de cobrança vira um
/// registro aqui.
/// </summary>
public class Payment : TenantOwnedEntityBase
{
    public Guid SubscriptionId { get; private set; }
    public decimal Amount { get; private set; }
    public string Currency { get; private set; } = "BRL";
    public PaymentMethodType Method { get; private set; }
    public PaymentStatus Status { get; private set; }

    public string Provider { get; private set; } = string.Empty;

    /// <summary>Id do pagamento no gateway (ex.: payment id do Mercado Pago).</summary>
    public string? ExternalPaymentId { get; private set; }

    public string? FailureReason { get; private set; }
    public DateTime? PaidAt { get; private set; }

    /// <summary>Plano e período que este pagamento compra — aplicados à assinatura só quando o pagamento for APROVADO (via webhook).</summary>
    public Guid? PlanId { get; private set; }
    public BillingCycle? BillingCycle { get; private set; }

    protected Payment() { }

    public Payment(Guid subscriptionId, decimal amount, PaymentMethodType method, string provider, string currency = "BRL",
        Guid? planId = null, BillingCycle? billingCycle = null)
    {
        if (amount < 0)
            throw new ArgumentException("Valor não pode ser negativo.", nameof(amount));
        if (string.IsNullOrWhiteSpace(provider))
            throw new ArgumentException("Gateway de pagamento é obrigatório.", nameof(provider));

        SubscriptionId = subscriptionId;
        Amount = amount;
        Currency = currency;
        Method = method;
        Provider = provider;
        PlanId = planId;
        BillingCycle = billingCycle;
        Status = PaymentStatus.Pending;
    }

    public void SetExternalPaymentId(string externalPaymentId)
    {
        ExternalPaymentId = externalPaymentId;
        UpdatedAt = DateTime.UtcNow;
    }

    public void MarkApproved()
    {
        Status = PaymentStatus.Approved;
        PaidAt = DateTime.UtcNow;
        UpdatedAt = DateTime.UtcNow;
    }

    public void MarkRejected(string? reason = null)
    {
        Status = PaymentStatus.Rejected;
        FailureReason = reason;
        UpdatedAt = DateTime.UtcNow;
    }

    public void MarkRefunded()
    {
        Status = PaymentStatus.Refunded;
        UpdatedAt = DateTime.UtcNow;
    }

    public void MarkCancelled()
    {
        Status = PaymentStatus.Cancelled;
        UpdatedAt = DateTime.UtcNow;
    }
}
