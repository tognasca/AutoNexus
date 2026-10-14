using AutoNexus.Application.Interfaces;
using AutoNexus.Domain.Interfaces;
using Microsoft.Extensions.Configuration;

namespace AutoNexus.Application.Services;

/// <summary>Rotina periódica: expira trials vencidos e avisa os que estão terminando (executada por um BackgroundService na API).</summary>
public class BillingMaintenanceService : IBillingMaintenanceService
{
    private const int ReminderDaysBefore = 2;
    private const int ManualRenewalReminderDays = 3;

    private readonly ITenantSubscriptionRepository _subs;
    private readonly ISubscriptionAccessService _access;
    private readonly IAuditLogService _audit;
    private readonly ITenantNotifier _notifier;
    private readonly IUnitOfWork _uow;
    private readonly IConfiguration _config;

    public BillingMaintenanceService(ITenantSubscriptionRepository subs, ISubscriptionAccessService access, IAuditLogService audit,
        ITenantNotifier notifier, IUnitOfWork uow, IConfiguration config)
    {
        _subs = subs; _access = access; _audit = audit; _notifier = notifier; _uow = uow; _config = config;
    }

    public async Task RunAsync(CancellationToken ct = default)
    {
        var url = (_config["Application:Url"] ?? string.Empty).TrimEnd('/');
        var now = DateTime.UtcNow;
        var outbox = new List<(Guid TenantId, (string Subject, string Html) Template)>();

        foreach (var s in await _subs.GetTrialingAsync(ct))
        {
            if (_access.ExpireTrialIfNeeded(s, now))
            {
                _subs.Update(s);
                await _audit.LogForTenantAsync(s.TenantId, null, "TrialExpirado", "TenantSubscription", s.Id.ToString(), null, ct);
                outbox.Add((s.TenantId, EmailTemplates.TrialExpirado(url)));
            }
            else if (s.TrialReminderSentAt == null && s.TrialEndsAt!.Value - now <= TimeSpan.FromDays(ReminderDaysBefore))
            {
                s.MarkTrialReminderSent();
                _subs.Update(s);
                var days = Math.Max(1, (int)Math.Ceiling((s.TrialEndsAt.Value - now).TotalDays));
                outbox.Add((s.TenantId, EmailTemplates.TrialProximoDoFim(days, s.TrialEndsAt.Value, url)));
            }
        }

        // Renovação manual (Pix/Boleto): avisa 3 dias antes do fim do período pago, uma vez por período.
        foreach (var s in await _subs.GetActiveManualRenewalAsync(ct))
        {
            var end = s.CurrentPeriodEnd!.Value;
            var alreadySentForThisPeriod = s.RenewalReminderSentAt.HasValue && s.RenewalReminderSentAt.Value > end.AddDays(-ManualRenewalReminderDays - 1);
            if (end > now && end - now <= TimeSpan.FromDays(ManualRenewalReminderDays) && !alreadySentForThisPeriod)
            {
                s.MarkRenewalReminderSent();
                _subs.Update(s);
                outbox.Add((s.TenantId, EmailTemplates.RenovacaoManual(end, url)));
            }
        }

        await _uow.CommitAsync(ct);
        foreach (var n in outbox) await _notifier.NotifyAdminAsync(n.TenantId, n.Template, ct);
    }
}
