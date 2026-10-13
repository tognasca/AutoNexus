using AutoNexus.Application.Interfaces;
using AutoNexus.Domain.Entities;
using AutoNexus.Domain.Enums;
using AutoNexus.Domain.Interfaces;

namespace AutoNexus.Application.Services;

/// <summary>
/// Decide se a empresa pode usar o sistema conforme a assinatura.
/// DECISÕES TÉCNICAS (a regra comercial exata não foi especificada):
///  - Active: liberado (se for renovação manual Pix/Boleto e o período pago acabou, bloqueia);
///  - Trialing: liberado até TrialEndsAt (+3 dias de tolerância se já há assinatura no gateway, para a 1ª cobrança confirmar);
///  - PastDue: liberado (o gateway ainda está tentando cobrar);
///  - Canceled: liberado até o fim do período já pago (EndDate);
///  - Expired/Suspended: bloqueado — dados preservados, só a tela de assinatura fica acessível.
/// </summary>
public class SubscriptionAccessService : ISubscriptionAccessService
{
    private const int GatewayGraceDays = 3;

    private readonly ITenantSubscriptionRepository _subscriptions;
    private readonly IAuditLogService _audit;
    private readonly ITenantNotifier _notifier;
    private readonly ITenantContext _tenantContext;
    private readonly IUnitOfWork _uow;
    private readonly Microsoft.Extensions.Configuration.IConfiguration _config;

    public SubscriptionAccessService(ITenantSubscriptionRepository subscriptions, IAuditLogService audit, ITenantNotifier notifier,
        ITenantContext tenantContext, IUnitOfWork uow, Microsoft.Extensions.Configuration.IConfiguration config)
    {
        _subscriptions = subscriptions;
        _audit = audit;
        _notifier = notifier;
        _tenantContext = tenantContext;
        _uow = uow;
        _config = config;
    }

    public bool ExpireTrialIfNeeded(TenantSubscription subscription, DateTime now)
    {
        if (subscription.Status != SubscriptionStatus.Trialing || !subscription.TrialEndsAt.HasValue) return false;
        var grace = string.IsNullOrEmpty(subscription.ExternalSubscriptionId) ? TimeSpan.Zero : TimeSpan.FromDays(GatewayGraceDays);
        if (now <= subscription.TrialEndsAt.Value + grace) return false;
        subscription.Expire();
        return true;
    }

    public async Task<SubscriptionAccessResult> EvaluateAsync(CancellationToken cancellationToken = default)
    {
        var sub = await _subscriptions.GetCurrentAsync(cancellationToken);
        if (sub == null) return new SubscriptionAccessResult(true, null, null);

        var now = DateTime.UtcNow;
        if (ExpireTrialIfNeeded(sub, now))
        {
            _subscriptions.Update(sub);
            await _audit.LogAsync("TrialExpirado", "TenantSubscription", sub.Id.ToString(), null, cancellationToken);
            await _uow.CommitAsync(cancellationToken);
            var url = (_config["Application:Url"] ?? string.Empty).TrimEnd('/');
            await _notifier.NotifyAdminAsync(sub.TenantId, EmailTemplates.TrialExpirado(url), cancellationToken);
        }

        return sub.Status switch
        {
            SubscriptionStatus.Active when sub.CurrentPeriodEnd.HasValue && sub.CurrentPeriodEnd.Value < now && string.IsNullOrEmpty(sub.ExternalSubscriptionId)
                => new SubscriptionAccessResult(false, sub.Status, "O período pago da sua assinatura terminou. Renove para continuar usando o sistema."),
            SubscriptionStatus.Active or SubscriptionStatus.Trialing or SubscriptionStatus.PastDue
                => new SubscriptionAccessResult(true, sub.Status, null),
            SubscriptionStatus.Canceled when sub.EndDate.HasValue && sub.EndDate.Value > now
                => new SubscriptionAccessResult(true, sub.Status, null),
            SubscriptionStatus.Expired
                => new SubscriptionAccessResult(false, sub.Status, "Seu período de teste terminou. Assine um plano para continuar usando o sistema — seus dados estão preservados."),
            SubscriptionStatus.Canceled
                => new SubscriptionAccessResult(false, sub.Status, "Sua assinatura foi cancelada. Assine novamente para recuperar o acesso — seus dados estão preservados."),
            _ => new SubscriptionAccessResult(false, sub.Status, "Sua assinatura está suspensa. Regularize o pagamento para voltar a usar o sistema.")
        };
    }
}
