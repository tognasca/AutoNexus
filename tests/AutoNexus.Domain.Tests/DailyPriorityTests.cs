using AutoNexus.Domain.Entities;

namespace AutoNexus.Domain.Tests;

public class DailyPriorityTests
{
    private static readonly DateTime Now = new(2026, 11, 20, 15, 0, 0, DateTimeKind.Utc);
    [Fact] public void FutureAppointmentAndClosedLeadAreExcluded()
    {
        Assert.Equal(0, DailyPriority.ForLead(Now, Now.Date.AddDays(1), Now.AddDays(-90), null, Now.AddDays(2), false, 90, -5).Score);
        Assert.Equal(0, DailyPriority.ForLead(Now, Now.Date.AddDays(1), Now, null, Now, true, 90, -5).Score);
    }
    [Fact] public void OverdueContactOutranksUncontactedAndIdle()
    {
        var overdue = DailyPriority.ForLead(Now, Now.Date.AddDays(1), Now, Now, Now.AddHours(-1), false, 0, null);
        var fresh = DailyPriority.ForLead(Now, Now.Date.AddDays(1), Now, null, null, false, 0, null);
        var idle = DailyPriority.ForLead(Now, Now.Date.AddDays(1), Now.AddDays(-8), Now.AddDays(-8), null, false, 0, null);
        Assert.True(overdue.Score > fresh.Score && fresh.Score > idle.Score);
    }
    [Fact] public void RecentContactDoesNotBecomePendingBecauseOfStockAge()
    {
        Assert.Equal(0, DailyPriority.ForLead(Now, Now.Date.AddDays(1), Now.AddDays(-60), Now, null, false, 60, 2).Score);
    }
    [Fact]
    public void BuyerResponseIsUrgentUntilTheSellerRegistersContact()
    {
        var next = Now.AddDays(2);
        var reply = Now.AddMinutes(-10);
        var beforeReply = Now.AddHours(-1);
        var pending = DailyPriority.ForLead(Now, Now.Date.AddDays(1), beforeReply, beforeReply,
            next, false, 0, null, reply);
        Assert.True(pending.Score > 100);
        Assert.Contains("Comprador respondeu à proposta", pending.Reasons);
        Assert.Equal(0, DailyPriority.ForLead(Now, Now.Date.AddDays(1), beforeReply, Now,
            next, false, 0, null, reply).Score);
        Assert.Equal(0, DailyPriority.ForLead(Now, Now.Date.AddDays(1), beforeReply, null,
            next, true, 0, null, reply).Score);
    }

    [Fact] public void MissingMarginDoesNotCreateFalseAlert()
    {
        Assert.Equal(0, DailyPriority.ForStock(2, null, false).Score);
        Assert.True(DailyPriority.ForStock(2, -3, false).Score > 0);
        Assert.True(DailyPriority.ForStock(30, 20, false).Score > 0);
        Assert.Equal(95, DailyPriority.ForStock(1, null, true).Score);
    }
}
