using AutoNexus.Domain.Enums;

namespace AutoNexus.Application.DTOs;

public record CreateCheckoutDto(Guid PlanId, BillingCycle Cycle, PaymentMethodType Method, string? PayerDocument = null);

public record CancelSubscriptionDto(string? Reason);

public record SignupDto(
    string CompanyName,
    string AdminName,
    string AdminEmail,
    string AdminPassword,
    Guid PlanId,
    BillingCycle Cycle,
    bool AcceptTermsOfUse,
    bool AcceptPrivacyPolicy,
    bool AcceptCookiePolicy
);

public record SignupResultDto(LoginResponseDto Login, int TrialDays);

public record LegalDocumentDto(LegalDocumentType Type, int Version, string Content, DateTime PublishedAt);

public record CheckoutResultDto(
    Guid PaymentId,
    PaymentMethodType Method,
    PaymentStatus Status,
    /// <summary>Cartão: URL de checkout do Mercado Pago. Boleto: URL do boleto.</summary>
    string? RedirectUrl,
    /// <summary>Pix: código copia-e-cola.</summary>
    string? PixCode,
    /// <summary>Pix: QR Code em base64.</summary>
    string? QrCodeBase64
);

public record PaymentHistoryItemDto(
    Guid Id,
    decimal Amount,
    string Currency,
    PaymentMethodType Method,
    PaymentStatus Status,
    DateTime CreatedAt,
    DateTime? PaidAt
);

public record BillingOverviewDto(
    TenantSubscriptionDto? Subscription,
    PlanDto? Plan,
    List<PaymentHistoryItemDto> PaymentHistory,
    int? TrialDaysRemaining
);
