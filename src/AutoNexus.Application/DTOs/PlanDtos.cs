using AutoNexus.Domain.Enums;

namespace AutoNexus.Application.DTOs;

public record PlanDto(
    Guid Id,
    string Name,
    decimal Price,
    bool IsActive,
    int? MaxUsers,
    int? MaxVehicles,
    int? MaxStorageMb
);

public record CreatePlanDto(
    string Name,
    decimal Price,
    int? MaxUsers,
    int? MaxVehicles,
    int? MaxStorageMb
);

public record TenantSubscriptionDto(
    Guid Id,
    Guid TenantId,
    Guid PlanId,
    string PlanName,
    SubscriptionStatus Status,
    DateTime StartDate,
    DateTime? EndDate
);

public record AssignPlanDto(Guid PlanId);

public record TenantSettingDto(
    string CompanyName,
    string? LogoUrl,
    string PrimaryColor,
    string TimeZone,
    string Currency
);
