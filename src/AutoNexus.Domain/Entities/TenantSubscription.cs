using AutoNexus.Domain.Enums;

namespace AutoNexus.Domain.Entities;

public class TenantSubscription : TenantOwnedEntityBase
{
    public Guid PlanId { get; private set; }
    public SubscriptionStatus Status { get; private set; }
    public DateTime StartDate { get; private set; }
    public DateTime? EndDate { get; private set; }

    protected TenantSubscription() { }

    public TenantSubscription(Guid planId, SubscriptionStatus status = SubscriptionStatus.Active)
    {
        if (planId == Guid.Empty)
            throw new ArgumentException("Plano é obrigatório.", nameof(planId));

        PlanId = planId;
        Status = status;
        StartDate = DateTime.UtcNow;
    }

    public void ChangePlan(Guid planId)
    {
        if (planId == Guid.Empty)
            throw new ArgumentException("Plano é obrigatório.", nameof(planId));

        PlanId = planId;
        UpdatedAt = DateTime.UtcNow;
    }

    public void Activate()
    {
        Status = SubscriptionStatus.Active;
        if (EndDate.HasValue)
            EndDate = null;
        UpdatedAt = DateTime.UtcNow;
    }

    public void Deactivate()
    {
        Status = SubscriptionStatus.Cancelled;
        EndDate ??= DateTime.UtcNow;
        UpdatedAt = DateTime.UtcNow;
    }
}
