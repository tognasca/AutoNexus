using System.Text.RegularExpressions;
using AutoNexus.Application.DTOs;
using AutoNexus.Application.Interfaces;
using AutoNexus.Application.Services;
using AutoNexus.Domain.Entities;
using AutoNexus.Domain.Enums;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;

namespace AutoNexus.Application.Tests.Billing;

internal static class TestConfig
{
    public static IConfiguration Create() => new ConfigurationBuilder()
        .AddInMemoryCollection(new Dictionary<string, string?> { ["Application:Url"] = "https://app.test" })
        .Build();
}

public class PlanAndSubscriptionEntityTests
{
    [Fact]
    public void Plan_PriceForCycle_UsesAnnualPriceWhenAvailable()
    {
        var plan = new Plan("Starter", 49.90m, annualPrice: 499.00m, trialDays: 7);
        Assert.Equal(49.90m, plan.GetPriceForCycle(BillingCycle.Monthly));
        Assert.Equal(499.00m, plan.GetPriceForCycle(BillingCycle.Annual));
    }

    [Fact]
    public void Plan_WithoutAnnualPrice_AnnualFallsBackToMonthly()
    {
        var plan = new Plan("Starter", 49.90m);
        Assert.Equal(49.90m, plan.GetPriceForCycle(BillingCycle.Annual));
    }

    [Fact]
    public void Subscription_WithTrial_SetsTrialEndAndReportsRemainingDays()
    {
        var sub = new TenantSubscription(Guid.NewGuid(), SubscriptionStatus.Trialing, BillingCycle.Monthly, 7);
        Assert.NotNull(sub.TrialEndsAt);
        Assert.Equal(7, BillingMapper.TrialDaysRemaining(sub));
    }

    [Fact]
    public void Subscription_RenewPeriod_ActivatesAndStoresPeriodEnd()
    {
        var sub = new TenantSubscription(Guid.NewGuid(), SubscriptionStatus.Trialing, BillingCycle.Monthly, 7);
        var end = DateTime.UtcNow.AddMonths(1);
        sub.RenewPeriod(end);
        Assert.Equal(SubscriptionStatus.Active, sub.Status);
        Assert.Equal(end, sub.CurrentPeriodEnd);
    }

    [Fact]
    public void Subscription_Cancel_KeepsAccessUntilPaidPeriodEnd()
    {
        var sub = new TenantSubscription(Guid.NewGuid(), SubscriptionStatus.Active);
        var end = DateTime.UtcNow.AddDays(10);
        sub.RenewPeriod(end);
        sub.Cancel();
        Assert.Equal(SubscriptionStatus.Canceled, sub.Status);
        Assert.Equal(end, sub.EndDate);
        Assert.NotNull(sub.CancelledAt);
    }
}

public class SubscriptionAccessTests
{
    private static (SubscriptionAccessService Service, FakeSubscriptionRepo Repo, FakeNotifier Notifier, FakeUow Uow) Build()
    {
        var repo = new FakeSubscriptionRepo();
        var notifier = new FakeNotifier();
        var uow = new FakeUow();
        var service = new SubscriptionAccessService(repo, new FakeAudit(), notifier, new FakeTenantContext(), uow, TestConfig.Create());
        return (service, repo, notifier, uow);
    }

    [Fact]
    public void ExpireTrialIfNeeded_AfterTrialEnd_Expires_BeforeEnd_DoesNot()
    {
        var (service, _, _, _) = Build();
        var sub = new TenantSubscription(Guid.NewGuid(), SubscriptionStatus.Trialing, BillingCycle.Monthly, 7);

        Assert.False(service.ExpireTrialIfNeeded(sub, DateTime.UtcNow.AddDays(3)));
        Assert.Equal(SubscriptionStatus.Trialing, sub.Status);

        Assert.True(service.ExpireTrialIfNeeded(sub, DateTime.UtcNow.AddDays(8)));
        Assert.Equal(SubscriptionStatus.Expired, sub.Status);
    }

    [Fact]
    public async Task Evaluate_NoSubscription_IsBlocked()
    {
        var (service, _, _, _) = Build();

        var result = await service.EvaluateAsync();

        Assert.False(result.Allowed);
        Assert.Null(result.Status);
        Assert.Contains("assinatura válida", result.Message);
    }

    [Fact]
    public async Task Evaluate_TrialWithoutEndDate_IsAllowed()
    {
        var (service, repo, _, _) = Build();
        repo.Items.Add(new TenantSubscription(Guid.NewGuid(), SubscriptionStatus.Trialing));
        Assert.True((await service.EvaluateAsync()).Allowed);
    }

    [Fact]
    public async Task Evaluate_ExpiredSubscription_IsBlocked()
    {
        var (service, repo, _, _) = Build();
        repo.Items.Add(new TenantSubscription(Guid.NewGuid(), SubscriptionStatus.Expired));
        var result = await service.EvaluateAsync();
        Assert.False(result.Allowed);
        Assert.False(string.IsNullOrWhiteSpace(result.Message));
    }

    [Fact]
    public async Task Evaluate_CanceledButStillInPaidPeriod_IsAllowed()
    {
        var (service, repo, _, _) = Build();
        var sub = new TenantSubscription(Guid.NewGuid(), SubscriptionStatus.Active);
        sub.RenewPeriod(DateTime.UtcNow.AddDays(10));
        sub.Cancel();
        repo.Items.Add(sub);
        Assert.True((await service.EvaluateAsync()).Allowed);
    }

    [Fact]
    public async Task Evaluate_ManualRenewalPeriodOver_IsBlocked()
    {
        var (service, repo, _, _) = Build();
        var sub = new TenantSubscription(Guid.NewGuid(), SubscriptionStatus.Active);
        sub.RenewPeriod(DateTime.UtcNow.AddDays(-1));
        repo.Items.Add(sub);
        Assert.False((await service.EvaluateAsync()).Allowed);
    }

    [Fact]
    public async Task Evaluate_TrialPastEnd_ExpiresPersistsAndNotifiesOnce()
    {
        var (service, repo, notifier, uow) = Build();
        var sub = new TenantSubscription(Guid.NewGuid(), SubscriptionStatus.Trialing, BillingCycle.Monthly, 7);
        typeof(TenantSubscription).GetProperty(nameof(TenantSubscription.TrialEndsAt))!.SetValue(sub, DateTime.UtcNow.AddDays(-1));
        repo.Items.Add(sub);

        var result = await service.EvaluateAsync();

        Assert.False(result.Allowed);
        Assert.Equal(SubscriptionStatus.Expired, sub.Status);
        Assert.Equal(1, uow.Commits);
        Assert.Single(notifier.Subjects);
    }
}

public class PlanLimitTests
{
    private static PlanLimitService Build(Plan plan, int existingUsers)
    {
        var subs = new FakeSubscriptionRepo();
        subs.Items.Add(new TenantSubscription(plan.Id, SubscriptionStatus.Active));
        var plans = new FakePlanRepo();
        plans.Items.Add(plan);
        var users = new FakeUserRepo();
        for (var i = 0; i < existingUsers; i++)
            users.Items.Add(new User($"U{i}", $"u{i}@t.com", "h", UserProfile.Vendedor));
        // Repositório de veículos não é usado nos testes de limite de usuários.
        return new PlanLimitService(subs, plans, users, null!);
    }

    [Fact]
    public async Task AddUser_AtPlanLimit_IsBlockedWithFriendlyMessage()
    {
        var service = Build(new Plan("Starter", 49.90m, maxUsers: 2), existingUsers: 2);
        var ex = await Assert.ThrowsAsync<PlanLimitExceededException>(() => service.EnsureCanAddUserAsync());
        Assert.Contains("Starter", ex.Message);
    }

    [Fact]
    public async Task AddUser_BelowLimit_IsAllowed()
    {
        var service = Build(new Plan("Starter", 49.90m, maxUsers: 2), existingUsers: 1);
        await service.EnsureCanAddUserAsync();
    }

    [Fact]
    public async Task AddUser_PlanWithoutLimit_IsAlwaysAllowed()
    {
        var service = Build(new Plan("Premium", 199.90m), existingUsers: 500);
        await service.EnsureCanAddUserAsync();
    }
}

public class BillingWebhookTests
{
    [Fact]
    public void WebhookEvent_ProcessingClaim_AllowsOnlyOneActiveClaimAndCanRetryAfterLeaseExpires()
    {
        var ev = new WebhookEvent("FakePay", "evt-claim", "payment", "{}");
        var now = DateTime.UtcNow;

        Assert.True(ev.TryStartProcessing(now, TimeSpan.FromMinutes(5)));
        Assert.False(ev.TryStartProcessing(now.AddSeconds(1), TimeSpan.FromMinutes(5)));
        Assert.True(ev.TryStartProcessing(now.AddMinutes(6), TimeSpan.FromMinutes(5)));

        ev.MarkProcessed();
        Assert.False(ev.TryStartProcessing(now.AddMinutes(7), TimeSpan.FromMinutes(5)));
    }


    private sealed class Ctx
    {
        public FakeSubscriptionRepo Subs = new();
        public FakePlanRepo Plans = new();
        public FakePaymentRepo Payments = new();
        public FakeEventRepo Events = new();
        public FakePaymentProvider Provider = new();
        public FakeNotifier Notifier = new();
        public FakeUserRepo Users = new();
        public FakeTenantContext TenantContext = new();
        public FakeAudit Audit = new();
        public BillingService Service = null!;
        public TenantSubscription Sub = null!;
        public Payment Payment = null!;
        public Plan TargetPlan = null!;
    }

    private static Ctx Build()
    {
        var c = new Ctx();
        var starter = new Plan("Starter", 49.90m, annualPrice: 499m, trialDays: 7);
        c.TargetPlan = new Plan("Profissional", 99.90m, annualPrice: 999m, trialDays: 7);
        c.Plans.Items.AddRange(new[] { starter, c.TargetPlan });

        c.Sub = new TenantSubscription(starter.Id, SubscriptionStatus.Trialing, BillingCycle.Monthly, 7);
        c.Subs.Items.Add(c.Sub);
        var payer = new User("Admin", "admin@loja.test", "hash", UserProfile.Admin);
        c.Users.Items.Add(payer);
        c.TenantContext.UserId = payer.Id;

        c.Payment = new Payment(c.Sub.Id, 99.90m, PaymentMethodType.Pix, "FakePay", "BRL", c.TargetPlan.Id, BillingCycle.Monthly);
        c.Payment.SetExternalPaymentId("pay-1");
        c.Payments.Items.Add(c.Payment);

        c.Service = new BillingService(c.Subs, c.Plans, c.Payments, c.Events, c.Users, c.Provider, c.Audit,
            c.Notifier, c.TenantContext, new FakeUow(), TestConfig.Create(), NullLogger<BillingService>.Instance);
        return c;
    }

    private static Task<WebhookProcessResult> Send(Ctx c) =>
        c.Service.ProcessWebhookAsync("{}", new Dictionary<string, string>(), new Dictionary<string, string>());

    [Fact]
    public async Task Checkout_WhenPreviousRecurringCancellationFails_DoesNotCreateNewCharge()
    {
        var c = Build();
        c.Sub.SetExternalSubscription("FakePay", "old-subscription", PaymentMethodType.CreditCard);
        c.Provider.ThrowOnCancelSubscription = true;

        var dto = new CreateCheckoutDto(c.TargetPlan.Id, BillingCycle.Monthly, PaymentMethodType.CreditCard);

        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() => c.Service.CreateCheckoutAsync(dto));

        Assert.Contains("Nenhuma nova cobrança foi criada", ex.Message);
        Assert.Single(c.Payments.Items);
        Assert.Equal("old-subscription", c.Sub.ExternalSubscriptionId);
    }

    [Fact]
    public async Task Cancel_WhenGatewayCallThrowsButRemoteStatusIsCancelled_CompletesLocalCancellation()
    {
        var c = Build();
        c.Sub.RenewPeriod(DateTime.UtcNow.AddDays(10));
        c.Sub.SetExternalSubscription("FakePay", "old-subscription", PaymentMethodType.CreditCard);
        c.Provider.ThrowOnCancelSubscription = true;
        c.Provider.SubscriptionStatus = ProviderSubscriptionStatus.Cancelled;

        await c.Service.CancelAsync("Solicitado pelo cliente");

        Assert.Equal(SubscriptionStatus.Canceled, c.Sub.Status);
        Assert.Equal(DateTime.UtcNow.Date, c.Sub.CancelledAt!.Value.Date);
        Assert.Single(c.Notifier.Subjects);
    }

    [Fact]
    public async Task Checkout_InvalidBoletoDocument_DoesNotCancelExistingSubscription()
    {
        var c = Build();
        c.Sub.SetExternalSubscription("FakePay", "old-subscription", PaymentMethodType.CreditCard);

        var dto = new CreateCheckoutDto(c.TargetPlan.Id, BillingCycle.Monthly, PaymentMethodType.Boleto, "123");

        await Assert.ThrowsAsync<ArgumentException>(() => c.Service.CreateCheckoutAsync(dto));

        Assert.Equal(0, c.Provider.CancelSubscriptionCalls);
        Assert.Equal("old-subscription", c.Sub.ExternalSubscriptionId);
        Assert.Single(c.Payments.Items);
    }

    [Fact]
    public async Task Checkout_OneTimePayment_PersistsLocalIntentAndUsesStableGatewayReference()
    {
        var c = Build();
        c.Payments.Items.Clear();

        var dto = new CreateCheckoutDto(c.TargetPlan.Id, BillingCycle.Monthly, PaymentMethodType.Pix);
        await c.Service.CreateCheckoutAsync(dto);

        var payment = Assert.Single(c.Payments.Items);
        Assert.Equal("pay-created", payment.ExternalPaymentId);
        Assert.NotNull(c.Provider.LastOneTimePaymentRequest);
        Assert.Equal(payment.Id.ToString(), c.Provider.LastOneTimePaymentRequest!.ExternalReference);
        Assert.Equal(payment.Id.ToString(), c.Provider.LastOneTimePaymentRequest.IdempotencyKey);
    }

    [Fact]
    public async Task Webhook_RecoversLocalPaymentWhenGatewayCreatedItBeforeFinalCommit()
    {
        var c = Build();
        var localIntent = new Payment(c.Sub.Id, 99.90m, PaymentMethodType.Pix, "FakePay", "BRL", c.TargetPlan.Id, BillingCycle.Monthly);
        c.Payments.Items.Add(localIntent);
        c.Provider.ParseResult = new(true, "payment", "evt-recovery", "pay-recovered", null);
        c.Provider.PaymentInfo = new("pay-recovered", PaymentStatus.Approved, "approved", 99.90m, localIntent.Id.ToString(), PaymentMethodType.Pix);

        await Send(c);

        Assert.Equal("pay-recovered", localIntent.ExternalPaymentId);
        Assert.Equal(PaymentStatus.Approved, localIntent.Status);
        Assert.Equal(SubscriptionStatus.Active, c.Sub.Status);
    }

    [Fact]
    public async Task Checkout_CardSubscription_PersistsIntentBeforeCallingGateway()
    {
        var c = Build();
        c.Payments.Items.Clear();

        var dto = new CreateCheckoutDto(c.TargetPlan.Id, BillingCycle.Monthly, PaymentMethodType.CreditCard);
        var ex = await Assert.ThrowsAsync<NotImplementedException>(() => c.Service.CreateCheckoutAsync(dto));

        Assert.NotNull(ex);
        var intent = Assert.Single(c.Payments.Items);
        Assert.Equal(PaymentMethodType.CreditCard, intent.Method);
        Assert.Equal(c.TargetPlan.Id, intent.PlanId);
        Assert.Equal(BillingCycle.Monthly, intent.BillingCycle);
        Assert.Equal(PaymentStatus.Pending, intent.Status);
    }

    [Fact]
    public async Task Checkout_CardSubscription_UsesPersistedIntentIdAsGatewayIdempotencyKey()
    {
        var c = Build();
        c.Payments.Items.Clear();
        c.Provider.ThrowOnCreateCardSubscription = false;

        var dto = new CreateCheckoutDto(c.TargetPlan.Id, BillingCycle.Monthly, PaymentMethodType.CreditCard);
        var result = await c.Service.CreateCheckoutAsync(dto);

        var intent = Assert.Single(c.Payments.Items);
        Assert.Equal(intent.Id, result.PaymentId);
        Assert.Equal(intent.Id.ToString(), c.Provider.LastCardSubscriptionRequest!.IdempotencyKey);
        Assert.Equal(c.Sub.Id.ToString(), c.Provider.LastCardSubscriptionRequest.ExternalReference);
        Assert.Equal("sub-created", c.Sub.ExternalSubscriptionId);
    }

    [Fact]
    public async Task Checkout_WhenNewCardSubscriptionCreationFails_DoesNotKeepCancelledOldSubscriptionLinked()
    {
        var c = Build();
        c.Payments.Items.Clear();
        c.Sub.SetExternalSubscription("FakePay", "old-subscription", PaymentMethodType.CreditCard);

        var dto = new CreateCheckoutDto(c.TargetPlan.Id, BillingCycle.Monthly, PaymentMethodType.CreditCard);
        await Assert.ThrowsAsync<NotImplementedException>(() => c.Service.CreateCheckoutAsync(dto));

        Assert.Null(c.Sub.ExternalSubscriptionId);
        Assert.Single(c.Payments.Items);
        Assert.Equal(PaymentStatus.Pending, c.Payments.Items[0].Status);
        Assert.Equal(c.TargetPlan.Id, c.Payments.Items[0].PlanId);
    }

    [Fact]
    public async Task Webhook_SubscriptionAuthorizedBeforeCheckoutResponse_RecoversLocalSubscriptionAndPlanIntent()
    {
        var c = Build();
        c.Payments.Items.Clear();
        var intent = new Payment(c.Sub.Id, 99.90m, PaymentMethodType.CreditCard, "FakePay", "BRL", c.TargetPlan.Id, BillingCycle.Monthly);
        c.Payments.Items.Add(intent);
        c.Provider.ParseResult = new(true, "subscription_preapproval", "evt-early-sub", null, "preapproval-early");
        c.Provider.SubscriptionExternalReference = c.Sub.Id.ToString();
        c.Provider.SubscriptionStatus = ProviderSubscriptionStatus.Authorized;

        Assert.Equal(WebhookProcessResult.Processed, await Send(c));

        Assert.Equal("preapproval-early", c.Sub.ExternalSubscriptionId);
        Assert.Equal("FakePay", c.Sub.PaymentProvider);
        Assert.Equal(c.TargetPlan.Id, c.Sub.PlanId);
        Assert.Equal(SubscriptionStatus.Trialing, c.Sub.Status);
    }

    [Fact]
    public async Task Webhook_WithInvalidSignature_IsRejectedAndNothingChanges()
    {
        var c = Build();
        c.Provider.ParseResult = new(false, null, null, null, null);

        Assert.Equal(WebhookProcessResult.Invalid, await Send(c));
        Assert.Empty(c.Events.Items);
        Assert.Equal(PaymentStatus.Pending, c.Payment.Status);
    }

    [Fact]
    public async Task Webhook_ApprovedPayment_ActivatesSubscriptionAndAppliesChosenPlan()
    {
        var c = Build();

        Assert.Equal(WebhookProcessResult.Processed, await Send(c));

        Assert.Equal(PaymentStatus.Approved, c.Payment.Status);
        Assert.Equal(SubscriptionStatus.Active, c.Sub.Status);
        Assert.Equal(c.TargetPlan.Id, c.Sub.PlanId);
        Assert.True(c.Sub.CurrentPeriodEnd > DateTime.UtcNow.AddDays(28));
        Assert.Equal(2, c.Notifier.Subjects.Count); // assinatura criada + pagamento aprovado
        Assert.True(c.Events.Items.Single().ProcessedSuccessfully);
    }

    [Fact]
    public async Task Webhook_SameEventDeliveredTwice_IsProcessedOnlyOnce()
    {
        var c = Build();
        await Send(c);
        var periodEnd = c.Sub.CurrentPeriodEnd;
        var emails = c.Notifier.Subjects.Count;

        Assert.Equal(WebhookProcessResult.Duplicate, await Send(c));

        Assert.Equal(periodEnd, c.Sub.CurrentPeriodEnd);
        Assert.Equal(emails, c.Notifier.Subjects.Count);
        Assert.Single(c.Events.Items);
    }

    [Fact]
    public async Task Webhook_NewEventForAlreadyApprovedPayment_DoesNotRenewTwice()
    {
        var c = Build();
        await Send(c);
        var periodEnd = c.Sub.CurrentPeriodEnd;
        var emails = c.Notifier.Subjects.Count;

        c.Provider.ParseResult = new(true, "payment", "evt-2", "pay-1", null);
        await Send(c);

        Assert.Equal(periodEnd, c.Sub.CurrentPeriodEnd);
        Assert.Equal(emails, c.Notifier.Subjects.Count);
    }

    [Fact]
    public async Task Webhook_ApprovedPaymentWithMismatchedAmount_DoesNotActivateSubscription()
    {
        var c = Build();
        c.Provider.PaymentInfo = new("pay-1", PaymentStatus.Approved, "approved", 1.00m, null, PaymentMethodType.Pix);

        await Send(c);

        Assert.Equal(PaymentStatus.Pending, c.Payment.Status);
        Assert.Equal(SubscriptionStatus.Trialing, c.Sub.Status);
        Assert.Null(c.Sub.CurrentPeriodEnd);
        Assert.Empty(c.Notifier.Subjects);
    }

    [Fact]
    public async Task Webhook_RecurringPayment_UsesLastApprovedAmountWhenPlanPriceChanges()
    {
        var c = Build();
        var starter = c.Plans.Items.Single(p => p.Name == "Starter");
        starter.Update("Starter", 79.90m, 799m, 7, null, null, null);

        var previousApproved = new Payment(c.Sub.Id, 49.90m, PaymentMethodType.CreditCard, "FakePay", "BRL", starter.Id, BillingCycle.Monthly);
        previousApproved.SetExternalPaymentId("pay-old");
        previousApproved.MarkApproved();
        c.Payments.Items.Add(previousApproved);

        c.Provider.ParseResult = new(true, "payment", "evt-recurring-price-change", "pay-recurring", null);
        c.Provider.PaymentInfo = new("pay-recurring", PaymentStatus.Approved, "approved", 49.90m, c.Sub.Id.ToString(), PaymentMethodType.CreditCard);

        await Send(c);

        Assert.Contains(c.Payments.Items, p => p.ExternalPaymentId == "pay-recurring" && p.Status == PaymentStatus.Approved);
        Assert.Equal(SubscriptionStatus.Active, c.Sub.Status);
        Assert.NotNull(c.Sub.CurrentPeriodEnd);
    }

    [Fact]
    public async Task Webhook_RecurringPaymentWithNewCatalogPriceButNoMatchingContractAmount_IsRejected()
    {
        var c = Build();
        var starter = c.Plans.Items.Single(p => p.Name == "Starter");
        starter.Update("Starter", 79.90m, 799m, 7, null, null, null);

        var previousApproved = new Payment(c.Sub.Id, 49.90m, PaymentMethodType.CreditCard, "FakePay", "BRL", starter.Id, BillingCycle.Monthly);
        previousApproved.SetExternalPaymentId("pay-old");
        previousApproved.MarkApproved();
        c.Payments.Items.Add(previousApproved);

        c.Provider.ParseResult = new(true, "payment", "evt-recurring-price-mismatch", "pay-recurring-new-price", null);
        c.Provider.PaymentInfo = new("pay-recurring-new-price", PaymentStatus.Approved, "approved", 79.90m, c.Sub.Id.ToString(), PaymentMethodType.CreditCard);

        await Send(c);

        Assert.DoesNotContain(c.Payments.Items, p => p.ExternalPaymentId == "pay-recurring-new-price");
        Assert.Equal(SubscriptionStatus.Trialing, c.Sub.Status);
        Assert.Null(c.Sub.CurrentPeriodEnd);
    }

    [Fact]
    public async Task Webhook_RecurringPaymentWithMismatchedAmount_IsNotRecordedOrActivated()
    {
        var c = Build();
        c.Provider.ParseResult = new(true, "payment", "evt-recurring", "pay-2", null);
        c.Provider.PaymentInfo = new("pay-2", PaymentStatus.Approved, "approved", 1.00m, c.Sub.Id.ToString(), PaymentMethodType.CreditCard);

        await Send(c);

        Assert.Single(c.Payments.Items);
        Assert.Equal(SubscriptionStatus.Trialing, c.Sub.Status);
        Assert.Null(c.Sub.CurrentPeriodEnd);
        Assert.Empty(c.Notifier.Subjects);
    }

    [Fact]
    public async Task Webhook_RejectedPayment_MarksPaymentRejectedAndNotifies()
    {
        var c = Build();
        c.Provider.PaymentInfo = new("pay-1", PaymentStatus.Rejected, "rejected", 99.90m, null, PaymentMethodType.CreditCard);

        await Send(c);

        Assert.Equal(PaymentStatus.Rejected, c.Payment.Status);
        Assert.NotEqual(SubscriptionStatus.Active, c.Sub.Status);
        Assert.Single(c.Notifier.Subjects);
    }
}

public class PasswordServiceTests
{
    private static (PasswordService Service, FakeUserRepo Users, FakeEmail Email, User User) Build()
    {
        var users = new FakeUserRepo();
        var user = new User("Maria", "maria@loja.com", "H:senhaantiga", UserProfile.Admin);
        users.Items.Add(user);
        var email = new FakeEmail();
        var service = new PasswordService(users, new FakeHasher(), email, new FakeAudit(),
            new FakeTenantContext { UserId = user.Id }, new FakeUow(), TestConfig.Create());
        return (service, users, email, user);
    }

    [Fact]
    public async Task RequestReset_UnknownEmail_SendsNothing_AndDoesNotThrow()
    {
        var (service, _, email, _) = Build();
        await service.RequestResetAsync("naoexiste@loja.com");
        Assert.Empty(email.Sent);
    }

    [Fact]
    public async Task RequestReset_KnownEmail_SendsLink_AndStoresOnlyTheTokenHash()
    {
        var (service, _, email, user) = Build();

        await service.RequestResetAsync("maria@loja.com");

        var sent = Assert.Single(email.Sent);
        var token = Regex.Match(sent.Html, "token=([A-Za-z0-9_-]+)").Groups[1].Value;
        Assert.False(string.IsNullOrEmpty(token));
        Assert.NotEqual(token, user.PasswordResetTokenHash);
        Assert.Equal(PasswordService.HashToken(token), user.PasswordResetTokenHash);
    }

    [Fact]
    public async Task Reset_ValidToken_ChangesPassword_AndTokenCannotBeReused()
    {
        var (service, _, email, user) = Build();
        await service.RequestResetAsync("maria@loja.com");
        var token = Regex.Match(email.Sent[0].Html, "token=([A-Za-z0-9_-]+)").Groups[1].Value;

        await service.ResetAsync(token, "novasenha123");

        Assert.Equal("H:novasenha123", user.PasswordHash);
        Assert.Null(user.PasswordResetTokenHash);
        await Assert.ThrowsAsync<InvalidOperationException>(() => service.ResetAsync(token, "outrasenha123"));
    }

    [Fact]
    public async Task Reset_ExpiredToken_IsRejected()
    {
        var (service, _, _, user) = Build();
        user.SetPasswordResetToken(PasswordService.HashToken("tok"), DateTime.UtcNow.AddMinutes(-1));
        await Assert.ThrowsAsync<InvalidOperationException>(() => service.ResetAsync("tok", "novasenha123"));
    }

    [Fact]
    public async Task Reset_ShortPassword_IsRejected()
    {
        var (service, _, _, _) = Build();
        await Assert.ThrowsAsync<ArgumentException>(() => service.ResetAsync("tok", "123"));
    }

    [Fact]
    public async Task Change_WrongCurrentPassword_IsRejected()
    {
        var (service, _, _, _) = Build();
        await Assert.ThrowsAsync<InvalidOperationException>(() => service.ChangeAsync("errada", "novasenha123"));
    }
}
