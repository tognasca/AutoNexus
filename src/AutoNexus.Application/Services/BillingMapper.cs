using AutoNexus.Application.DTOs;
using AutoNexus.Domain.Entities;

namespace AutoNexus.Application.Services;

/// <summary>Mapeamento único de Plan/TenantSubscription/Payment para DTO — evita três cópias divergentes em serviços diferentes.</summary>
public static class BillingMapper
{
    public static PlanDto ToDto(Plan p) => new(
        p.Id, p.Name, p.Price, p.IsActive, p.MaxUsers, p.MaxVehicles, p.MaxStorageMb, p.AnnualPrice, p.TrialDays);

    public static TenantSubscriptionDto ToDto(TenantSubscription s, string planName) => new(
        s.Id, s.TenantId, s.PlanId, planName, s.Status, s.StartDate, s.EndDate,
        s.BillingCycle, s.TrialEndsAt, s.CurrentPeriodEnd, s.CancelledAt, s.PaymentMethod, s.PaymentProvider);

    public static PaymentHistoryItemDto ToDto(Payment p) => new(
        p.Id, p.Amount, p.Currency, p.Method, p.Status, p.CreatedAt, p.PaidAt);

    public static int? TrialDaysRemaining(TenantSubscription s)
    {
        if (s.Status != Domain.Enums.SubscriptionStatus.Trialing || !s.TrialEndsAt.HasValue) return null;
        var remaining = (s.TrialEndsAt.Value - DateTime.UtcNow).TotalDays;
        return remaining <= 0 ? 0 : (int)Math.Ceiling(remaining);
    }
}
