using AutoNexus.Domain.Enums;

namespace AutoNexus.Application.DTOs;

public record PlanDto(
    Guid Id,
    string Name,
    decimal Price,
    bool IsActive,
    int? MaxUsers,
    int? MaxVehicles,
    int? MaxStorageMb,
    decimal? AnnualPrice = null,
    int TrialDays = 0
);

public record CreatePlanDto(
    string Name,
    decimal Price,
    int? MaxUsers,
    int? MaxVehicles,
    int? MaxStorageMb,
    decimal? AnnualPrice = null,
    int TrialDays = 0
);

public record TenantSubscriptionDto(
    Guid Id,
    Guid TenantId,
    Guid PlanId,
    string PlanName,
    SubscriptionStatus Status,
    DateTime StartDate,
    DateTime? EndDate,
    BillingCycle BillingCycle = BillingCycle.Monthly,
    DateTime? TrialEndsAt = null,
    DateTime? CurrentPeriodEnd = null,
    DateTime? CancelledAt = null,
    PaymentMethodType? PaymentMethod = null,
    string? PaymentProvider = null
);

public record UpdatePlanDto(
    string Name,
    decimal Price,
    decimal? AnnualPrice,
    int TrialDays,
    int? MaxUsers,
    int? MaxVehicles,
    int? MaxStorageMb
);

public record AssignPlanDto(Guid PlanId);

public record TenantSettingDto(
    string CompanyName,
    string? LogoUrl,
    string PrimaryColor,
    string? WhatsAppNumber,
    string TimeZone,
    string Currency
);
