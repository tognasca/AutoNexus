using AutoNexus.Domain.Enums;

namespace AutoNexus.Domain.Entities;

/// <summary>
/// Vínculo entre um Tenant e um Plan. Ainda não há cobrança de verdade (ver
/// requisito 10 do documento original) — isso só registra qual plano cada
/// empresa está usando e o status, preparado para futuramente plugar um
/// gateway (Stripe, Mercado Pago etc.) sem precisar redesenhar isso.
/// </summary>
public class TenantSubscription : TenantOwnedEntityBase
{
    public Guid PlanId { get; private set; }
    public SubscriptionStatus Status { get; private set; }
    public DateTime StartDate { get; private set; }
    public DateTime? EndDate { get; private set; }

    public BillingCycle BillingCycle { get; private set; }

    /// <summary>Quando o trial termina. Null = nunca teve trial (ex.: assinatura criada já ativa pelo SuperAdmin).</summary>
    public DateTime? TrialEndsAt { get; private set; }

    /// <summary>Fim do período já pago atual — quando a próxima cobrança deveria ocorrer.</summary>
    public DateTime? CurrentPeriodEnd { get; private set; }

    public DateTime? CancelledAt { get; private set; }

    /// <summary>Id da assinatura no gateway (ex.: preapproval id do Mercado Pago).</summary>
    public string? ExternalSubscriptionId { get; private set; }

    /// <summary>Nome do gateway usado ("MercadoPago", "Stripe"...) — permite trocar/coexistir gateways sem redesenhar o modelo.</summary>
    public string? PaymentProvider { get; private set; }

    public PaymentMethodType? PaymentMethod { get; private set; }

    /// <summary>Quando o aviso de "trial terminando" foi enviado (evita reenviar a cada execução do job).</summary>
    public DateTime? TrialReminderSentAt { get; private set; }

    /// <summary>Quando o lembrete de renovação (Pix/Boleto, renovação manual) foi enviado para o período atual.</summary>
    public DateTime? RenewalReminderSentAt { get; private set; }

    protected TenantSubscription() { }

    // billingCycle e trialDays entram no final, depois dos parâmetros já
    // existentes — as duas chamadas já existentes (SuperAdminService)
    // continuam funcionando sem alteração, agora como Trialing sem trial
    // real (trialDays = 0) e ciclo mensal por padrão.
    public TenantSubscription(
        Guid planId,
        SubscriptionStatus status = SubscriptionStatus.Trialing,
        BillingCycle billingCycle = BillingCycle.Monthly,
        int trialDays = 0)
    {
        PlanId = planId;
        Status = status;
        BillingCycle = billingCycle;
        StartDate = DateTime.UtcNow;

        if (trialDays > 0)
        {
            TrialEndsAt = DateTime.UtcNow.AddDays(trialDays);
        }
    }

    public void ChangePlan(Guid planId)
    {
        PlanId = planId;
        UpdatedAt = DateTime.UtcNow;
    }

    public void ChangeBillingCycle(BillingCycle cycle)
    {
        BillingCycle = cycle;
        UpdatedAt = DateTime.UtcNow;
    }

    public void Activate()
    {
        Status = SubscriptionStatus.Active;
        UpdatedAt = DateTime.UtcNow;
    }

    public void MarkPastDue()
    {
        Status = SubscriptionStatus.PastDue;
        UpdatedAt = DateTime.UtcNow;
    }

    public void Suspend()
    {
        Status = SubscriptionStatus.Suspended;
        UpdatedAt = DateTime.UtcNow;
    }

    /// <summary>Trial acabou e ninguém assinou de verdade — perde acesso até assinar.</summary>
    public void Expire()
    {
        Status = SubscriptionStatus.Expired;
        UpdatedAt = DateTime.UtcNow;
    }

    public void Cancel()
    {
        Status = SubscriptionStatus.Canceled;
        CancelledAt = DateTime.UtcNow;
        // Mantém EndDate = fim do período já pago (se houver) — acesso
        // continua até lá, não corta na hora (requisito 11 do documento).
        EndDate = CurrentPeriodEnd ?? TrialEndsAt ?? DateTime.UtcNow;
        UpdatedAt = DateTime.UtcNow;
    }

    /// <summary>Cliente trocou de cartão recorrente para Pix/Boleto (ou vice-versa) — a assinatura recorrente antiga foi cancelada no gateway.</summary>
    public void ClearExternalSubscription()
    {
        ExternalSubscriptionId = null;
        UpdatedAt = DateTime.UtcNow;
    }

    public void SetPaymentMethod(PaymentMethodType method)
    {
        PaymentMethod = method;
        UpdatedAt = DateTime.UtcNow;
    }

    public void MarkRenewalReminderSent()
    {
        RenewalReminderSentAt = DateTime.UtcNow;
        UpdatedAt = DateTime.UtcNow;
    }

    public void MarkTrialReminderSent()
    {
        TrialReminderSentAt = DateTime.UtcNow;
        UpdatedAt = DateTime.UtcNow;
    }

    /// <summary>Liga a assinatura local à assinatura criada no gateway de pagamento.</summary>
    public void SetExternalSubscription(string provider, string externalSubscriptionId, PaymentMethodType? method = null)
    {
        PaymentProvider = provider;
        ExternalSubscriptionId = externalSubscriptionId;
        PaymentMethod = method;
        UpdatedAt = DateTime.UtcNow;
    }

    /// <summary>Chamado quando um pagamento do período é aprovado (via webhook) — renova o período corrente e garante status Active.</summary>
    public void RenewPeriod(DateTime newPeriodEnd)
    {
        CurrentPeriodEnd = newPeriodEnd;
        Status = SubscriptionStatus.Active;
        UpdatedAt = DateTime.UtcNow;
    }
}
