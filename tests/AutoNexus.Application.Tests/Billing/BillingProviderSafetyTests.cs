using AutoNexus.Application.Services;
using AutoNexus.Domain.Entities;
using AutoNexus.Domain.Enums;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;

namespace AutoNexus.Application.Tests.Billing;

public class BillingProviderSafetyTests
{
    [Fact]
    public async Task Cancel_WhenExternalSubscriptionBelongsToAnotherProvider_FailsClosedAndKeepsSubscriptionActive()
    {
        var subscriptions = new FakeSubscriptionRepo();
        var plans = new FakePlanRepo();
        var payments = new FakePaymentRepo();
        var events = new FakeEventRepo();
        var users = new FakeUserRepo();
        var provider = new FakePaymentProvider();
        var notifier = new FakeNotifier();
        var tenantContext = new FakeTenantContext();
        var audit = new FakeAudit();
        var uow = new FakeUow();

        var plan = new Plan("Starter", 49.90m, trialDays: 7);
        plans.Items.Add(plan);

        var subscription = new TenantSubscription(plan.Id, SubscriptionStatus.Active);
        subscription.RenewPeriod(DateTime.UtcNow.AddDays(20));
        subscription.SetExternalSubscription("Stripe", "stripe-sub-123", PaymentMethodType.CreditCard);
        subscriptions.Items.Add(subscription);

        var service = new BillingService(
            subscriptions,
            plans,
            payments,
            events,
            users,
            provider,
            audit,
            notifier,
            tenantContext,
            uow,
            new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Application:Url"] = "https://app.test"
            }).Build(),
            NullLogger<BillingService>.Instance);

        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() => service.CancelAsync("teste"));

        Assert.Contains("outro gateway", ex.Message, StringComparison.OrdinalIgnoreCase);
        Assert.Equal(SubscriptionStatus.Active, subscription.Status);
        Assert.Equal("stripe-sub-123", subscription.ExternalSubscriptionId);
        Assert.Equal(0, provider.CancelSubscriptionCalls);
        Assert.Equal(0, uow.Commits);
    }
}
