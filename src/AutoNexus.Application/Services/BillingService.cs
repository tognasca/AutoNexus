using System.Globalization;
using AutoNexus.Application.DTOs;
using AutoNexus.Application.Interfaces;
using AutoNexus.Domain.Entities;
using AutoNexus.Domain.Enums;
using AutoNexus.Domain.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace AutoNexus.Application.Services;

/// <summary>
/// Orquestra checkout, confirmação por webhook, troca de plano e
/// cancelamento. Depende só de IPaymentProvider (nunca do Mercado Pago
/// diretamente). REGRA CENTRAL: pagamento só é considerado aprovado depois
/// que o próprio gateway confirma (consulta servidor-a-servidor disparada
/// por webhook validado) — nunca por informação vinda do frontend.
/// </summary>
public class BillingService : IBillingService
{
    private static readonly CultureInfo PtBr = new("pt-BR");

    private sealed record Notification(Guid TenantId, (string Subject, string Html) Template);

    private readonly ITenantSubscriptionRepository _subs;
    private readonly IPlanRepository _plans;
    private readonly IPaymentRepository _payments;
    private readonly IWebhookEventRepository _events;
    private readonly IUserRepository _users;
    private readonly IPaymentProvider _provider;
    private readonly IAuditLogService _audit;
    private readonly ITenantNotifier _notifier;
    private readonly ITenantContext _tenantContext;
    private readonly IUnitOfWork _uow;
    private readonly IConfiguration _config;
    private readonly ILogger<BillingService> _logger;

    public BillingService(ITenantSubscriptionRepository subs, IPlanRepository plans, IPaymentRepository payments,
        IWebhookEventRepository events, IUserRepository users, IPaymentProvider provider, IAuditLogService audit,
        ITenantNotifier notifier, ITenantContext tenantContext, IUnitOfWork uow, IConfiguration config, ILogger<BillingService> logger)
    {
        _subs = subs; _plans = plans; _payments = payments; _events = events; _users = users; _provider = provider;
        _audit = audit; _notifier = notifier; _tenantContext = tenantContext; _uow = uow; _config = config; _logger = logger;
    }

    private string AppUrl => (_config["Application:Url"] ?? string.Empty).TrimEnd('/');

    public async Task<BillingOverviewDto> GetOverviewAsync(CancellationToken ct = default)
    {
        var sub = await _subs.GetCurrentAsync(ct);
        if (sub == null) return new BillingOverviewDto(null, null, new List<PaymentHistoryItemDto>(), null);

        var plan = await _plans.GetByIdAsync(sub.PlanId, ct);
        var payments = await _payments.GetBySubscriptionAsync(sub.Id, ct);
        return new BillingOverviewDto(
            BillingMapper.ToDto(sub, plan?.Name ?? "—"),
            plan == null ? null : BillingMapper.ToDto(plan),
            payments.Select(p => BillingMapper.ToDto(p)).ToList(),
            BillingMapper.TrialDaysRemaining(sub));
    }

    public async Task<CheckoutResultDto> CreateCheckoutAsync(CreateCheckoutDto dto, CancellationToken ct = default)
    {
        if (!_tenantContext.HasTenant || _tenantContext.UserId == null)
            throw new InvalidOperationException("Faça login para assinar um plano.");

        var sub = await _subs.GetCurrentAsync(ct) ?? throw new KeyNotFoundException("Sua empresa ainda não tem assinatura.");
        var plan = await _plans.GetByIdAsync(dto.PlanId, ct);
        if (plan == null || !plan.IsActive) throw new KeyNotFoundException("Plano não encontrado.");
        if (dto.Cycle == BillingCycle.Annual && !plan.AnnualPrice.HasValue)
            throw new ArgumentException("Este plano não oferece cobrança anual.");

        var payer = await _users.GetByIdAsync(_tenantContext.UserId.Value, ct) ?? throw new KeyNotFoundException("Usuário não encontrado.");
        var currentPlan = await _plans.GetByIdAsync(sub.PlanId, ct);
        var amount = plan.GetPriceForCycle(dto.Cycle);
        var document = new string((dto.PayerDocument ?? string.Empty).Where(char.IsDigit).ToArray());

        // Valide os dados do pagamento antes de cancelar qualquer assinatura
        // recorrente existente. Uma entrada inválida não pode causar efeito externo.
        if (dto.Method == PaymentMethodType.Boleto && document.Length is not (11 or 14))
            throw new ArgumentException("Informe um CPF ou CNPJ válido para gerar o boleto.");

        var operation = sub.Status is SubscriptionStatus.Trialing or SubscriptionStatus.Expired or SubscriptionStatus.Canceled
            ? "CriarAssinatura"
            : plan.Id == sub.PlanId ? "RenovarAssinatura"
            : plan.Price > (currentPlan?.Price ?? 0) ? "UpgradePlano" : "DowngradePlano";

        // Evita cobrança duplicada: qualquer assinatura recorrente anterior no
        // gateway é cancelada antes de criar a nova forma de cobrança. O
        // período já pago continua valendo (CurrentPeriodEnd).
        if (!string.IsNullOrEmpty(sub.ExternalSubscriptionId) && sub.PaymentProvider == _provider.ProviderName)
        {
            try
            {
                await _provider.CancelSubscriptionAsync(sub.ExternalSubscriptionId, ct);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex,
                    "Checkout interrompido: não foi possível cancelar a assinatura anterior {Id} no gateway.",
                    sub.ExternalSubscriptionId);
                // Fail closed: não criamos outra cobrança enquanto a anterior
                // pode continuar ativa. O usuário pode tentar novamente após
                // a confirmação do gateway, evitando assinaturas duplicadas.
                throw new InvalidOperationException(
                    "Não foi possível confirmar o cancelamento da cobrança anterior. Nenhuma nova cobrança foi criada. Tente novamente em instantes.");
            }
        }

        CheckoutResultDto result;
        Payment payment;

        if (dto.Method == PaymentMethodType.CreditCard)
        {
            var trialDays = BillingMapper.TrialDaysRemaining(sub);
            var card = await _provider.CreateCardSubscriptionAsync(new CreateCardSubscriptionRequest(
                plan.Name, amount, dto.Cycle, payer.Email, sub.Id.ToString(), $"{AppUrl}/", trialDays > 0 ? trialDays : null), ct);

            sub.SetExternalSubscription(_provider.ProviderName, card.ExternalSubscriptionId, PaymentMethodType.CreditCard);
            payment = new Payment(sub.Id, amount, PaymentMethodType.CreditCard, _provider.ProviderName, "BRL", plan.Id, dto.Cycle);
            result = new CheckoutResultDto(payment.Id, PaymentMethodType.CreditCard, PaymentStatus.Pending, card.CheckoutUrl, null, null);
        }
        else
        {
            var one = await _provider.CreateOneTimePaymentAsync(new CreateOneTimePaymentRequest(
                amount, dto.Method, payer.Email, payer.Name, document.Length > 0 ? document : null,
                $"AutoNexus {plan.Name} ({(dto.Cycle == BillingCycle.Annual ? "anual" : "mensal")})", sub.Id.ToString()), ct);

            if (!string.IsNullOrEmpty(sub.ExternalSubscriptionId)) sub.ClearExternalSubscription();
            sub.SetPaymentMethod(dto.Method);
            payment = new Payment(sub.Id, amount, dto.Method, _provider.ProviderName, "BRL", plan.Id, dto.Cycle);
            payment.SetExternalPaymentId(one.ExternalPaymentId);
            result = new CheckoutResultDto(payment.Id, dto.Method, one.Status,
                dto.Method == PaymentMethodType.Boleto ? one.PaymentDetail : null,
                dto.Method == PaymentMethodType.Pix ? one.PaymentDetail : null,
                one.QrCodeBase64);
        }

        await _payments.AddAsync(payment, ct);
        _subs.Update(sub);
        await _audit.LogAsync(operation, "TenantSubscription", sub.Id.ToString(),
            $"Plano {plan.Name}, {amount.ToString("C", PtBr)} ({dto.Cycle}), meio: {dto.Method}", ct);
        await _uow.CommitAsync(ct);

        if (dto.Method != PaymentMethodType.CreditCard)
            await _notifier.NotifyAdminAsync(sub.TenantId, EmailTemplates.PagamentoPendente(), ct);

        return result;
    }

    public async Task CancelAsync(string? reason, CancellationToken ct = default)
    {
        var sub = await _subs.GetCurrentAsync(ct) ?? throw new KeyNotFoundException("Sua empresa não tem assinatura.");
        if (sub.Status == SubscriptionStatus.Canceled) return;

        // Se o gateway falhar, NÃO cancelamos localmente — senão o cliente
        // continuaria sendo cobrado sem enxergar a assinatura como ativa.
        if (!string.IsNullOrEmpty(sub.ExternalSubscriptionId) && sub.PaymentProvider == _provider.ProviderName)
        {
            try { await _provider.CancelSubscriptionAsync(sub.ExternalSubscriptionId, ct); }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Falha ao cancelar assinatura {Id} no gateway.", sub.ExternalSubscriptionId);
                throw new InvalidOperationException("Não foi possível cancelar agora. Tente novamente em instantes.");
            }
        }

        sub.Cancel();
        _subs.Update(sub);
        await _audit.LogAsync("CancelarAssinatura", "TenantSubscription", sub.Id.ToString(),
            string.IsNullOrWhiteSpace(reason) ? "Sem motivo informado" : $"Motivo: {reason}", ct);
        await _uow.CommitAsync(ct);
        await _notifier.NotifyAdminAsync(sub.TenantId, EmailTemplates.AssinaturaCancelada(sub.EndDate), ct);
    }

    // ------------------------------------------------------------------ webhook

    public async Task<WebhookProcessResult> ProcessWebhookAsync(string rawBody, IDictionary<string, string> headers, IDictionary<string, string> query, CancellationToken ct = default)
    {
        var parsed = _provider.ParseAndValidateWebhook(rawBody, headers, query);
        if (!parsed.IsValid || string.IsNullOrEmpty(parsed.ExternalEventId)) return WebhookProcessResult.Invalid;

        var provider = _provider.ProviderName;
        var existing = await _events.GetByExternalEventIdAsync(provider, parsed.ExternalEventId, ct);
        if (existing is { ProcessedSuccessfully: true }) return WebhookProcessResult.Duplicate;

        if (existing == null)
        {
            var payloadCopy = rawBody.Length > 4000 ? rawBody[..4000] : rawBody;
            await _events.AddAsync(new WebhookEvent(provider, parsed.ExternalEventId, parsed.EventType ?? "unknown", payloadCopy), ct);
            try
            {
                await _uow.CommitAsync(ct);
            }
            catch (Exception)
            {
                // O commit pode falhar porque outra instância inseriu o mesmo evento
                // ou porque a confirmação da gravação foi perdida. Releia o registro:
                // só continua se ele realmente existir; caso contrário, propaga o erro.
                _uow.DiscardChanges();
                existing = await _events.GetByExternalEventIdAsync(provider, parsed.ExternalEventId, ct);
                if (existing == null) throw;
            }
        }

        // Claim atômico no banco: somente uma instância pode processar o evento.
        // Um claim abandonado por queda do processo pode ser retomado após 5 minutos.
        if (!await _events.TryAcquireProcessingAsync(provider, parsed.ExternalEventId, ct))
            return WebhookProcessResult.Duplicate;

        var outbox = new List<Notification>();
        try
        {
            // Eventos diferentes podem apontar para o mesmo pagamento. A transação
            // serializável protege a transição financeira e a renovação da assinatura
            // como uma única operação atômica; conflito serializável é retornado ao
            // gateway como 500 para que ele reenvie o evento.
            await _uow.ExecuteInTransactionAsync(async () =>
            {
                if (!string.IsNullOrEmpty(parsed.ExternalPaymentId))
                    await ApplyPaymentAsync(parsed.ExternalPaymentId, outbox, ct);
                else if (!string.IsNullOrEmpty(parsed.ExternalSubscriptionId))
                    await ApplySubscriptionStatusAsync(parsed.ExternalSubscriptionId, outbox, ct);

                var ev = await _events.GetByExternalEventIdAsync(provider, parsed.ExternalEventId, ct);
                ev?.MarkProcessed();
                if (ev != null) _events.Update(ev);
                await _uow.CommitAsync(ct);
            }, ct);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Falha ao processar webhook {EventId}.", parsed.ExternalEventId);
            _uow.DiscardChanges(); // não persiste estado parcial
            var ev = await _events.GetByExternalEventIdAsync(provider, parsed.ExternalEventId, ct);
            if (ev != null)
            {
                ev.MarkFailed(ex.Message.Length > 900 ? ex.Message[..900] : ex.Message);
                _events.Update(ev);
                await _uow.CommitAsync(ct);
            }
            throw; // 500 → o gateway tenta de novo
        }

        foreach (var n in outbox)
            await _notifier.NotifyAdminAsync(n.TenantId, n.Template, ct);

        return WebhookProcessResult.Processed;
    }

    private async Task ApplyPaymentAsync(string externalPaymentId, List<Notification> outbox, CancellationToken ct)
    {
        // Fonte da verdade = consulta direta ao gateway, nunca o corpo do webhook.
        var info = await _provider.GetPaymentStatusAsync(externalPaymentId, ct);

        var payment = await _payments.GetByExternalPaymentIdAsync(externalPaymentId, ct);
        var isNewPayment = false;
        TenantSubscription? sub;

        if (payment == null)
        {
            // Primeira cobrança do cartão (Payment pendente criado no checkout, ainda sem id do gateway) ou renovação recorrente.
            if (!Guid.TryParse(info.ExternalReference, out var subscriptionId))
            {
                _logger.LogWarning("Pagamento {Id} do gateway sem external_reference válido — ignorado.", externalPaymentId);
                return;
            }
            sub = await _subs.GetByIdAsync(subscriptionId, ct);
            if (sub == null) return;

            payment = await _payments.GetPendingWithoutExternalIdAsync(sub.Id, ct);
            if (payment == null)
            {
                // Renovação recorrente sem checkout pendente: validar contra o preço
                // vigente do plano antes de criar um registro usando o valor do gateway.
                // Divergência exige reconciliação e nunca deve ativar/renovar acesso.
                var currentPlan = await _plans.GetByIdAsync(sub.PlanId, ct);
                var expectedAmount = currentPlan?.GetPriceForCycle(sub.BillingCycle);
                if (expectedAmount is null || info.Amount != expectedAmount.Value)
                {
                    _logger.LogError(
                        "Pagamento recorrente {ExternalPaymentId} ignorado: valor do gateway {GatewayAmount} não corresponde ao preço esperado {ExpectedAmount} do plano {PlanId}.",
                        externalPaymentId, info.Amount, sub.PlanId);
                    return;
                }

                payment = new Payment(sub.Id, info.Amount, info.Method ?? PaymentMethodType.CreditCard, _provider.ProviderName, "BRL", sub.PlanId, sub.BillingCycle);
                await _payments.AddForTenantAsync(payment, sub.TenantId, ct);
                isNewPayment = true;
            }
            payment.SetExternalPaymentId(externalPaymentId);
        }
        else
        {
            sub = await _subs.GetByIdAsync(payment.SubscriptionId, ct);
            if (sub == null) return;
        }

        // Nunca liberar uma assinatura com valor divergente do checkout local.
        // Para pagamentos criados no checkout, o valor persistido é a referência
        // esperada; divergências exigem reconciliação manual e não podem ativar o plano.
        if (!isNewPayment && info.Amount != payment.Amount)
        {
            _logger.LogError(
                "Pagamento {ExternalPaymentId} ignorado: valor do gateway {GatewayAmount} diverge do valor esperado {ExpectedAmount} para o pagamento local {PaymentId}.",
                externalPaymentId, info.Amount, payment.Amount, payment.Id);
            return;
        }

        switch (info.Status)
        {
            case PaymentStatus.Approved:
                if (payment.Status == PaymentStatus.Approved) return; // idempotente: já aplicado
                await ApplyApprovedAsync(sub, payment, outbox, ct);
                break;

            case PaymentStatus.Rejected:
                if (payment.Status == PaymentStatus.Rejected) return;
                payment.MarkRejected("Recusado pelo meio de pagamento");
                if (sub.Status == SubscriptionStatus.Active) sub.MarkPastDue();
                _subs.Update(sub);
                await _audit.LogForTenantAsync(sub.TenantId, null, "PagamentoRecusado", "Payment", payment.Id.ToString(), null, ct);
                outbox.Add(new Notification(sub.TenantId, EmailTemplates.PagamentoRecusado(AppUrl)));
                break;

            case PaymentStatus.Cancelled:
                payment.MarkCancelled();
                break;

            case PaymentStatus.Refunded:
                payment.MarkRefunded();
                await _audit.LogForTenantAsync(sub.TenantId, null, "PagamentoEstornado", "Payment", payment.Id.ToString(), "Revisar acesso manualmente", ct);
                break;

            default:
                // Pendente (Pix/Boleto aguardando) — nada a alterar; o e-mail de pendente já saiu no checkout.
                break;
        }

        // Update() em entidade recém-adicionada (ainda não salva) viraria UPDATE de linha inexistente — só atualiza as que já existiam.
        if (!isNewPayment) _payments.Update(payment);
    }

    private async Task ApplyApprovedAsync(TenantSubscription sub, Payment payment, List<Notification> outbox, CancellationToken ct)
    {
        var previouslyApproved = (await _payments.GetBySubscriptionAsync(sub.Id, ct))
            .Any(p => p.Status == PaymentStatus.Approved && p.Id != payment.Id);

        payment.MarkApproved();

        var cycle = payment.BillingCycle ?? sub.BillingCycle;
        if (payment.PlanId.HasValue && payment.PlanId.Value != sub.PlanId) sub.ChangePlan(payment.PlanId.Value);
        if (cycle != sub.BillingCycle) sub.ChangeBillingCycle(cycle);
        sub.SetPaymentMethod(payment.Method);

        // Sem pró-rata (regra comercial não definida): o novo período soma ao que já estava pago/em trial.
        var start = DateTime.UtcNow;
        if (sub.CurrentPeriodEnd is { } cpe && cpe > start) start = cpe;
        if (sub.Status == SubscriptionStatus.Trialing && sub.TrialEndsAt is { } te && te > start) start = te;
        sub.RenewPeriod(cycle == BillingCycle.Annual ? start.AddMonths(12) : start.AddMonths(1));
        _subs.Update(sub);

        var plan = await _plans.GetByIdAsync(sub.PlanId, ct);
        var valor = payment.Amount.ToString("C", PtBr);

        await _audit.LogForTenantAsync(sub.TenantId, null, "PagamentoAprovado", "Payment", payment.Id.ToString(), $"{valor} via {payment.Method}", ct);

        if (!previouslyApproved)
        {
            outbox.Add(new Notification(sub.TenantId, EmailTemplates.AssinaturaCriada(plan?.Name ?? "—", valor, cycle == BillingCycle.Annual ? "ano" : "mês")));
            outbox.Add(new Notification(sub.TenantId, EmailTemplates.PagamentoAprovado(valor, sub.CurrentPeriodEnd!.Value)));
        }
        else
        {
            outbox.Add(new Notification(sub.TenantId, EmailTemplates.Renovacao(valor, sub.CurrentPeriodEnd!.Value)));
        }
    }

    private async Task ApplySubscriptionStatusAsync(string externalSubscriptionId, List<Notification> outbox, CancellationToken ct)
    {
        var sub = await _subs.GetByExternalSubscriptionIdAsync(externalSubscriptionId, ct);
        if (sub == null) return; // assinatura antiga (já substituída) ou desconhecida

        var status = await _provider.GetSubscriptionStatusAsync(externalSubscriptionId, ct);
        switch (status)
        {
            case ProviderSubscriptionStatus.Cancelled when sub.Status != SubscriptionStatus.Canceled:
                sub.Cancel();
                _subs.Update(sub);
                await _audit.LogForTenantAsync(sub.TenantId, null, "CancelarAssinatura", "TenantSubscription", sub.Id.ToString(), "Cancelada pelo gateway", ct);
                outbox.Add(new Notification(sub.TenantId, EmailTemplates.AssinaturaCancelada(sub.EndDate)));
                break;

            case ProviderSubscriptionStatus.Paused when sub.Status == SubscriptionStatus.Active:
                sub.Suspend();
                _subs.Update(sub);
                await _audit.LogForTenantAsync(sub.TenantId, null, "SuspenderAssinatura", "TenantSubscription", sub.Id.ToString(), "Pausada pelo gateway", ct);
                break;

            case ProviderSubscriptionStatus.Authorized:
                // Cartão autorizado (inclusive durante o trial gratuito): aplica o plano/ciclo escolhido no checkout.
                var pending = await _payments.GetPendingWithoutExternalIdAsync(sub.Id, ct);
                if (pending?.PlanId is { } planId && (planId != sub.PlanId || (pending.BillingCycle.HasValue && pending.BillingCycle != sub.BillingCycle)))
                {
                    sub.ChangePlan(planId);
                    if (pending.BillingCycle.HasValue) sub.ChangeBillingCycle(pending.BillingCycle.Value);
                    _subs.Update(sub);
                    var plan = await _plans.GetByIdAsync(planId, ct);
                    outbox.Add(new Notification(sub.TenantId, EmailTemplates.AssinaturaCriada(
                        plan?.Name ?? "—", pending.Amount.ToString("C", PtBr), pending.BillingCycle == BillingCycle.Annual ? "ano" : "mês")));
                }
                break;
        }
    }
}
