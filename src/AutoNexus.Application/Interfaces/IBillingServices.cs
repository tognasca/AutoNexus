using AutoNexus.Application.DTOs;
using AutoNexus.Domain.Entities;
using AutoNexus.Domain.Enums;

namespace AutoNexus.Application.Interfaces;

public enum WebhookProcessResult { Invalid, Duplicate, Processed }

public record SubscriptionAccessResult(bool Allowed, SubscriptionStatus? Status, string? Message);

public interface IBillingService
{
    Task<BillingOverviewDto> GetOverviewAsync(CancellationToken cancellationToken = default);
    Task<CheckoutResultDto> CreateCheckoutAsync(CreateCheckoutDto dto, CancellationToken cancellationToken = default);
    Task CancelAsync(string? reason, CancellationToken cancellationToken = default);
    Task<WebhookProcessResult> ProcessWebhookAsync(string rawBody, IDictionary<string, string> headers, IDictionary<string, string> query, CancellationToken cancellationToken = default);
}

public interface ISubscriptionAccessService
{
    /// <summary>Avalia se o tenant atual pode usar o sistema (e expira trial vencido de forma preguiçosa).</summary>
    Task<SubscriptionAccessResult> EvaluateAsync(CancellationToken cancellationToken = default);
    bool ExpireTrialIfNeeded(TenantSubscription subscription, DateTime now);
}

public interface IPlanLimitService
{
    Task EnsureCanAddUserAsync(CancellationToken cancellationToken = default);
    Task EnsureCanAddVehicleAsync(CancellationToken cancellationToken = default);
}

public interface IBillingMaintenanceService
{
    Task RunAsync(CancellationToken cancellationToken = default);
}

public interface ITenantNotifier
{
    Task NotifyAdminAsync(Guid tenantId, (string Subject, string Html) template, CancellationToken cancellationToken = default);
}

public interface ISignupService
{
    Task<SignupResultDto> SignupAsync(SignupDto dto, string? ipAddress, CancellationToken cancellationToken = default);
}

public interface ILegalService
{
    Task<LegalDocumentDto?> GetActiveAsync(LegalDocumentType type, CancellationToken cancellationToken = default);
    Task AcceptAsync(LegalDocumentType type, string? ipAddress, CancellationToken cancellationToken = default);
}
