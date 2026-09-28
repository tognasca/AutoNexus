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

    protected TenantSubscription() { }

    public TenantSubscription(Guid planId, SubscriptionStatus status = SubscriptionStatus.Trialing)
    {
        PlanId = planId;
        Status = status;
        StartDate = DateTime.UtcNow;
    }

    public void ChangePlan(Guid planId)
    {
        PlanId = planId;
        UpdatedAt = DateTime.UtcNow;
    }

    public void Activate()
    {
        Status = SubscriptionStatus.Active;
        UpdatedAt = DateTime.UtcNow;
    }

    public void Suspend()
    {
        Status = SubscriptionStatus.Suspended;
        UpdatedAt = DateTime.UtcNow;
    }

    public void Cancel()
    {
        Status = SubscriptionStatus.Canceled;
        EndDate = DateTime.UtcNow;
        UpdatedAt = DateTime.UtcNow;
    }
}
