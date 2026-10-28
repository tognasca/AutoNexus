using AutoNexus.Application.DTOs;

namespace AutoNexus.Application.Interfaces;

/// <summary>
/// Abstração de gateway de pagamento (requisito 3 do documento original).
/// A regra de negócio (BillingService) nunca depende diretamente de
/// classes do Mercado Pago — só desta interface. Trocar ou adicionar outro
/// gateway (Stripe, Asaas...) significa criar uma nova implementação desta
/// interface, sem tocar no resto do sistema.
/// </summary>
public interface IPaymentProvider
{
    /// <summary>Nome do gateway, salvo em TenantSubscription.PaymentProvider/Payment.Provider (ex.: "MercadoPago").</summary>
    string ProviderName { get; }

    Task<CreateCardSubscriptionResult> CreateCardSubscriptionAsync(CreateCardSubscriptionRequest request, CancellationToken cancellationToken = default);

    Task<CreateOneTimePaymentResult> CreateOneTimePaymentAsync(CreateOneTimePaymentRequest request, CancellationToken cancellationToken = default);

    Task<PaymentStatusResult> GetPaymentStatusAsync(string externalPaymentId, CancellationToken cancellationToken = default);

    Task<ProviderSubscriptionStatus> GetSubscriptionStatusAsync(string externalSubscriptionId, CancellationToken cancellationToken = default);

    Task<string?> GetSubscriptionExternalReferenceAsync(string externalSubscriptionId, CancellationToken cancellationToken = default);

    Task CancelSubscriptionAsync(string externalSubscriptionId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Valida a assinatura/segredo do webhook e extrai os identificadores
    /// relevantes do payload. Nunca confiar no corpo da notificação sem
    /// passar por aqui primeiro (requisito 19: "nunca confiar no frontend/
    /// requisição para confirmar pagamento" vale também para o payload do
    /// webhook não validado).
    /// </summary>
    WebhookParseResult ParseAndValidateWebhook(string rawBody, IDictionary<string, string> headers, IDictionary<string, string> queryParams);
}
