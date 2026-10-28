using AutoNexus.Application.DTOs;
using AutoNexus.Application.Interfaces;
using AutoNexus.Domain.Entities;
using AutoNexus.Domain.Enums;
using AutoNexus.Domain.Interfaces;

namespace AutoNexus.Application.Tests.Billing;

// Implementações em memória (sem banco, sem rede) usadas só pelos testes de billing.

internal class FakeUow : IUnitOfWork
{
    public int Commits { get; private set; }
    public Task<int> CommitAsync(CancellationToken cancellationToken = default) { Commits++; return Task.FromResult(0); }
    public void DiscardChanges() { }
    public Task ExecuteInTransactionAsync(Func<Task> operation, CancellationToken cancellationToken = default) => operation();
}

internal class FakeTenantContext : ITenantContext
{
    public Guid TenantId { get; set; } = Guid.NewGuid();
    public bool HasTenant { get; set; } = true;
    public bool HasHttpContext { get; set; } = true;
    public Guid? UserId { get; set; } = Guid.NewGuid();
}

internal class FakeAudit : IAuditLogService
{
    public List<string> Operations { get; } = new();
    public Task LogAsync(string operation, string resource, string? resourceId = null, string? details = null, CancellationToken cancellationToken = default)
    { Operations.Add(operation); return Task.CompletedTask; }
    public Task LogForTenantAsync(Guid tenantId, Guid? userId, string operation, string resource, string? resourceId = null, string? details = null, CancellationToken cancellationToken = default)
    { Operations.Add(operation); return Task.CompletedTask; }
}

internal class FakeNotifier : ITenantNotifier
{
    public List<string> Subjects { get; } = new();
    public Task NotifyAdminAsync(Guid tenantId, (string Subject, string Html) template, CancellationToken cancellationToken = default)
    { Subjects.Add(template.Subject); return Task.CompletedTask; }
}

internal class FakeEmail : IEmailService
{
    public List<(string To, string Subject, string Html)> Sent { get; } = new();
    public Task SendAsync(string toEmail, string toName, string subject, string htmlBody, CancellationToken cancellationToken = default)
    { Sent.Add((toEmail, subject, htmlBody)); return Task.CompletedTask; }
}

internal class FakeHasher : IPasswordHasher
{
    public string Hash(string password) => "H:" + password;
    public bool Verify(string password, string passwordHash) => passwordHash == "H:" + password;
}

internal class FakeSubscriptionRepo : ITenantSubscriptionRepository
{
    public List<TenantSubscription> Items { get; } = new();
    public Task<TenantSubscription?> GetCurrentAsync(CancellationToken cancellationToken = default) => Task.FromResult(Items.FirstOrDefault());
    public Task<TenantSubscription?> GetByTenantIdAsync(Guid tenantId, CancellationToken cancellationToken = default) => Task.FromResult(Items.FirstOrDefault());
    public Task<TenantSubscription?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) => Task.FromResult(Items.FirstOrDefault(s => s.Id == id));
    public Task<TenantSubscription?> GetByExternalSubscriptionIdAsync(string externalSubscriptionId, CancellationToken cancellationToken = default) => Task.FromResult(Items.FirstOrDefault(s => s.ExternalSubscriptionId == externalSubscriptionId));
    public Task<List<TenantSubscription>> GetTrialingAsync(CancellationToken cancellationToken = default) => Task.FromResult(Items.Where(s => s.Status == SubscriptionStatus.Trialing && s.TrialEndsAt != null).ToList());
    public Task<List<TenantSubscription>> GetActiveManualRenewalAsync(CancellationToken cancellationToken = default) => Task.FromResult(Items.Where(s => s.Status == SubscriptionStatus.Active && s.ExternalSubscriptionId == null && s.CurrentPeriodEnd != null).ToList());
    public Task AddAsync(TenantSubscription subscription, CancellationToken cancellationToken = default) { Items.Add(subscription); return Task.CompletedTask; }
    public Task AddForTenantAsync(TenantSubscription subscription, Guid tenantId, CancellationToken cancellationToken = default) { Items.Add(subscription); return Task.CompletedTask; }
    public void Update(TenantSubscription subscription) { }
}

internal class FakePlanRepo : IPlanRepository
{
    public List<Plan> Items { get; } = new();
    public Task<Plan?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) => Task.FromResult(Items.FirstOrDefault(p => p.Id == id));
    public Task<List<Plan>> GetAllAsync(CancellationToken cancellationToken = default) => Task.FromResult(Items.ToList());
    public Task AddAsync(Plan plan, CancellationToken cancellationToken = default) { Items.Add(plan); return Task.CompletedTask; }
    public void Update(Plan plan) { }
}

internal class FakePaymentRepo : IPaymentRepository
{
    public List<Payment> Items { get; } = new();
    public Task<List<Payment>> GetBySubscriptionAsync(Guid subscriptionId, CancellationToken cancellationToken = default) => Task.FromResult(Items.Where(p => p.SubscriptionId == subscriptionId).ToList());
    public Task<Payment?> GetByExternalPaymentIdAsync(string externalPaymentId, CancellationToken cancellationToken = default) => Task.FromResult(Items.FirstOrDefault(p => p.ExternalPaymentId == externalPaymentId));
    public Task<Payment?> GetByIdAsync(Guid paymentId, CancellationToken cancellationToken = default) => Task.FromResult(Items.FirstOrDefault(p => p.Id == paymentId));
    public Task<Payment?> GetPendingWithoutExternalIdAsync(Guid subscriptionId, CancellationToken cancellationToken = default) => Task.FromResult(Items.FirstOrDefault(p => p.SubscriptionId == subscriptionId && p.ExternalPaymentId == null && p.Status == PaymentStatus.Pending));
    public Task AddAsync(Payment payment, CancellationToken cancellationToken = default) { Items.Add(payment); return Task.CompletedTask; }
    public Task AddForTenantAsync(Payment payment, Guid tenantId, CancellationToken cancellationToken = default) { Items.Add(payment); return Task.CompletedTask; }
    public void Update(Payment payment) { }
}

internal class FakeEventRepo : IWebhookEventRepository
{
    public List<WebhookEvent> Items { get; } = new();
    public Task<WebhookEvent?> GetByExternalEventIdAsync(string provider, string externalEventId, CancellationToken cancellationToken = default) => Task.FromResult(Items.FirstOrDefault(e => e.Provider == provider && e.ExternalEventId == externalEventId));
    public Task AddAsync(WebhookEvent webhookEvent, CancellationToken cancellationToken = default) { Items.Add(webhookEvent); return Task.CompletedTask; }
    public Task<bool> TryAcquireProcessingAsync(string provider, string externalEventId, CancellationToken cancellationToken = default)
    {
        var item = Items.FirstOrDefault(e => e.Provider == provider && e.ExternalEventId == externalEventId);
        return Task.FromResult(item?.TryStartProcessing(DateTime.UtcNow, TimeSpan.FromMinutes(5)) ?? false);
    }
    public void Update(WebhookEvent webhookEvent) { }
}

internal class FakeUserRepo : IUserRepository
{
    public List<User> Items { get; } = new();
    public Task<User?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) => Task.FromResult(Items.FirstOrDefault(u => u.Id == id));
    public Task<IEnumerable<User>?> GetAllAsync(CancellationToken cancellationToken = default) => Task.FromResult<IEnumerable<User>?>(Items.ToList());
    public Task<User?> GetByEmailAsync(string email, CancellationToken cancellationToken = default) => Task.FromResult(Items.FirstOrDefault(u => u.Email == email.ToLower().Trim()));
    public Task<int> CountAsync(CancellationToken cancellationToken = default) => Task.FromResult(Items.Count);
    public Task<User?> GetByPasswordResetTokenHashAsync(string tokenHash, CancellationToken cancellationToken = default) => Task.FromResult(Items.FirstOrDefault(u => u.PasswordResetTokenHash == tokenHash));
    public Task<bool> EmailExistsAsync(string email, CancellationToken cancellationToken = default) => Task.FromResult(Items.Any(u => u.Email == email.ToLower().Trim()));
    public Task AddAsync(User user, CancellationToken cancellationToken = default) { Items.Add(user); return Task.CompletedTask; }
    public Task AddForTenantAsync(User user, Guid tenantId, CancellationToken cancellationToken = default) { Items.Add(user); return Task.CompletedTask; }
    public void Update(User user) { }
    public Task<List<User>> GetAllAcrossTenantsAsync(Guid? tenantId = null, CancellationToken cancellationToken = default) => Task.FromResult(Items.ToList());
}

internal class FakePaymentProvider : IPaymentProvider
{
    public string ProviderName => "FakePay";
    public WebhookParseResult ParseResult { get; set; } = new(true, "payment", "evt-1", "pay-1", null);
    public PaymentStatusResult PaymentInfo { get; set; } = new("pay-1", PaymentStatus.Approved, "approved", 99.90m, null, PaymentMethodType.Pix);
    public Task<CreateCardSubscriptionResult> CreateCardSubscriptionAsync(CreateCardSubscriptionRequest request, CancellationToken cancellationToken = default) => throw new NotImplementedException();
    public CreateOneTimePaymentRequest? LastOneTimePaymentRequest { get; private set; }
    public CreateOneTimePaymentResult OneTimePaymentResult { get; set; } = new("pay-created", PaymentStatus.Pending, "pix-code", "qr-base64");
    public Task<CreateOneTimePaymentResult> CreateOneTimePaymentAsync(CreateOneTimePaymentRequest request, CancellationToken cancellationToken = default)
    {
        LastOneTimePaymentRequest = request;
        return Task.FromResult(OneTimePaymentResult);
    }
    public Task<PaymentStatusResult> GetPaymentStatusAsync(string externalPaymentId, CancellationToken cancellationToken = default) => Task.FromResult(PaymentInfo);
    public ProviderSubscriptionStatus SubscriptionStatus { get; set; } = ProviderSubscriptionStatus.Unknown;
    public Task<ProviderSubscriptionStatus> GetSubscriptionStatusAsync(string externalSubscriptionId, CancellationToken cancellationToken = default) => Task.FromResult(SubscriptionStatus);
    public bool ThrowOnCancelSubscription { get; set; }
    public int CancelSubscriptionCalls { get; private set; }
    public Task CancelSubscriptionAsync(string externalSubscriptionId, CancellationToken cancellationToken = default)
    {
        CancelSubscriptionCalls++;
        if (ThrowOnCancelSubscription) throw new InvalidOperationException("Gateway cancellation failed");
        return Task.CompletedTask;
    }
    public WebhookParseResult ParseAndValidateWebhook(string rawBody, IDictionary<string, string> headers, IDictionary<string, string> queryParams) => ParseResult;
}
