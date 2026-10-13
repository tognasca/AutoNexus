using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using AutoNexus.Application.DTOs;
using AutoNexus.Application.Interfaces;
using AutoNexus.Domain.Enums;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace AutoNexus.Infrastructure.Integrations.Adapters;

/// <summary>
/// Implementação de IPaymentProvider para o Mercado Pago (requisito 3 do
/// documento de definições de negócio). Usa a API REST pública do Mercado
/// Pago diretamente (sem o SDK oficial, para manter a dependência mínima e
/// explícita) — ver https://www.mercadopago.com.br/developers.
///
/// Credenciais vêm de configuração (MercadoPago:AccessToken,
/// MercadoPago:WebhookSecret), nunca hardcoded (requisito 19).
/// </summary>
public class MercadoPagoPaymentProvider : IPaymentProvider
{
    private const string BaseUrl = "https://api.mercadopago.com";

    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;
    private readonly ILogger<MercadoPagoPaymentProvider> _logger;

    public string ProviderName => "MercadoPago";

    public MercadoPagoPaymentProvider(HttpClient httpClient, IConfiguration configuration, ILogger<MercadoPagoPaymentProvider> logger)
    {
        _httpClient = httpClient;
        _configuration = configuration;
        _logger = logger;

        var accessToken = _configuration["MercadoPago:AccessToken"];
        if (!string.IsNullOrWhiteSpace(accessToken))
        {
            _httpClient.BaseAddress = new Uri(BaseUrl);
            _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
        }
        // Se não houver AccessToken configurado, as chamadas vão falhar com
        // mensagem clara (ver EnsureConfigured) em vez de um erro genérico
        // de autenticação do Mercado Pago.
    }

    private void EnsureConfigured()
    {
        if (string.IsNullOrWhiteSpace(_configuration["MercadoPago:AccessToken"]))
        {
            throw new InvalidOperationException(
                "MERCADOPAGO_ACCESS_TOKEN não configurado. Defina a variável de ambiente antes de processar pagamentos.");
        }
    }

    public async Task<CreateCardSubscriptionResult> CreateCardSubscriptionAsync(CreateCardSubscriptionRequest request, CancellationToken cancellationToken = default)
    {
        EnsureConfigured();

        // Mercado Pago (preapproval) só aceita frequency_type "months" ou
        // "days" — ciclo anual é modelado como frequência de 12 meses, não
        // como "years" (a API não tem esse tipo de frequência).
        var frequency = request.Cycle == BillingCycle.Annual ? 12 : 1;

        object? freeTrial = request.FreeTrialDays is > 0
            ? new { frequency = request.FreeTrialDays.Value, frequency_type = "days" }
            : null;

        var payload = new
        {
            reason = $"AutoNexus — {request.PlanName}",
            auto_recurring = new
            {
                frequency,
                frequency_type = "months",
                transaction_amount = request.Amount,
                currency_id = "BRL",
                free_trial = freeTrial
            },
            back_url = request.BackUrl,
            payer_email = request.PayerEmail,
            external_reference = request.ExternalReference
        };

        var response = await _httpClient.PostAsJsonAsync("/preapproval", payload, JsonWriteOpts, cancellationToken);
        var body = await response.Content.ReadAsStringAsync(cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            _logger.LogError("Mercado Pago: falha ao criar preapproval. Status {Status}. Body: {Body}", response.StatusCode, body);
            throw new InvalidOperationException($"Não foi possível criar a assinatura no Mercado Pago (status {(int)response.StatusCode}).");
        }

        var parsed = JsonSerializer.Deserialize<MpPreapprovalResponse>(body, JsonOpts)
            ?? throw new InvalidOperationException("Resposta inesperada do Mercado Pago ao criar assinatura.");

        return new CreateCardSubscriptionResult(parsed.Id, parsed.InitPoint ?? string.Empty);
    }

    public async Task<CreateOneTimePaymentResult> CreateOneTimePaymentAsync(CreateOneTimePaymentRequest request, CancellationToken cancellationToken = default)
    {
        EnsureConfigured();

        var paymentMethodId = request.Method switch
        {
            PaymentMethodType.Pix => "pix",
            PaymentMethodType.Boleto => "bolbradesco",
            _ => throw new ArgumentException("CreateOneTimePaymentAsync só aceita Pix ou Boleto — cartão usa CreateCardSubscriptionAsync.", nameof(request))
        };

        var payload = new
        {
            transaction_amount = request.Amount,
            description = request.Description,
            payment_method_id = paymentMethodId,
            external_reference = request.ExternalReference,
            payer = new
            {
                email = request.PayerEmail,
                first_name = request.PayerName,
                identification = request.PayerDocument != null
                    ? new { type = request.PayerDocument.Length > 11 ? "CNPJ" : "CPF", number = request.PayerDocument }
                    : null
            }
        };

        var response = await _httpClient.PostAsJsonAsync("/v1/payments", payload, JsonWriteOpts, cancellationToken);
        var body = await response.Content.ReadAsStringAsync(cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            _logger.LogError("Mercado Pago: falha ao criar pagamento. Status {Status}. Body: {Body}", response.StatusCode, body);
            throw new InvalidOperationException($"Não foi possível criar o pagamento no Mercado Pago (status {(int)response.StatusCode}).");
        }

        var parsed = JsonSerializer.Deserialize<MpPaymentResponse>(body, JsonOpts)
            ?? throw new InvalidOperationException("Resposta inesperada do Mercado Pago ao criar pagamento.");

        var detail = request.Method == PaymentMethodType.Pix
            ? parsed.PointOfInteraction?.TransactionData?.QrCode
            : parsed.TransactionDetails?.ExternalResourceUrl;

        return new CreateOneTimePaymentResult(
            parsed.Id.ToString(),
            MapStatus(parsed.Status),
            detail,
            parsed.PointOfInteraction?.TransactionData?.QrCodeBase64
        );
    }

    public async Task<PaymentStatusResult> GetPaymentStatusAsync(string externalPaymentId, CancellationToken cancellationToken = default)
    {
        EnsureConfigured();

        var response = await _httpClient.GetAsync($"/v1/payments/{externalPaymentId}", cancellationToken);
        var body = await response.Content.ReadAsStringAsync(cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            _logger.LogError("Mercado Pago: falha ao consultar pagamento {Id}. Status {Status}. Body: {Body}", externalPaymentId, response.StatusCode, body);
            throw new InvalidOperationException($"Não foi possível consultar o pagamento {externalPaymentId} no Mercado Pago.");
        }

        var parsed = JsonSerializer.Deserialize<MpPaymentResponse>(body, JsonOpts)
            ?? throw new InvalidOperationException("Resposta inesperada do Mercado Pago ao consultar pagamento.");

        var method = parsed.PaymentMethodId switch
        {
            "pix" => (PaymentMethodType?)PaymentMethodType.Pix,
            "bolbradesco" or "bolbancario" or "boleto" => PaymentMethodType.Boleto,
            null => null,
            _ => PaymentMethodType.CreditCard
        };

        return new PaymentStatusResult(
            externalPaymentId, MapStatus(parsed.Status), parsed.Status,
            parsed.TransactionAmount, parsed.ExternalReference, method);
    }

    public async Task<ProviderSubscriptionStatus> GetSubscriptionStatusAsync(string externalSubscriptionId, CancellationToken cancellationToken = default)
    {
        EnsureConfigured();

        var response = await _httpClient.GetAsync($"/preapproval/{externalSubscriptionId}", cancellationToken);
        var body = await response.Content.ReadAsStringAsync(cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            _logger.LogError("Mercado Pago: falha ao consultar assinatura {Id}. Status {Status}. Body: {Body}", externalSubscriptionId, response.StatusCode, body);
            throw new InvalidOperationException($"Não foi possível consultar a assinatura {externalSubscriptionId} no Mercado Pago.");
        }

        var parsed = JsonSerializer.Deserialize<MpPreapprovalResponse>(body, JsonOpts);
        return parsed?.Status switch
        {
            "pending" => ProviderSubscriptionStatus.Pending,
            "authorized" => ProviderSubscriptionStatus.Authorized,
            "paused" => ProviderSubscriptionStatus.Paused,
            "cancelled" => ProviderSubscriptionStatus.Cancelled,
            _ => ProviderSubscriptionStatus.Unknown
        };
    }

    public async Task CancelSubscriptionAsync(string externalSubscriptionId, CancellationToken cancellationToken = default)
    {
        EnsureConfigured();

        var payload = new { status = "cancelled" };
        var request = new HttpRequestMessage(HttpMethod.Put, $"/preapproval/{externalSubscriptionId}")
        {
            Content = JsonContent.Create(payload)
        };

        var response = await _httpClient.SendAsync(request, cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            var body = await response.Content.ReadAsStringAsync(cancellationToken);
            _logger.LogError("Mercado Pago: falha ao cancelar assinatura {Id}. Status {Status}. Body: {Body}", externalSubscriptionId, response.StatusCode, body);
            throw new InvalidOperationException($"Não foi possível cancelar a assinatura {externalSubscriptionId} no Mercado Pago.");
        }
    }

    /// <summary>
    /// Valida o cabeçalho X-Signature conforme a documentação oficial do
    /// Mercado Pago: manifest = "id:{data.id};request-id:{x-request-id};ts:{ts};",
    /// assinado com HMAC-SHA256 usando o Webhook Secret configurado no
    /// painel do Mercado Pago. Sem essa validação, qualquer um poderia
    /// forjar uma notificação de pagamento aprovado.
    /// </summary>
    public WebhookParseResult ParseAndValidateWebhook(string rawBody, IDictionary<string, string> headers, IDictionary<string, string> queryParams)
    {
        var webhookSecret = _configuration["MercadoPago:WebhookSecret"];

        headers.TryGetValue("x-signature", out var signatureHeader);
        headers.TryGetValue("x-request-id", out var requestId);
        queryParams.TryGetValue("data.id", out var dataId);

        if (string.IsNullOrWhiteSpace(webhookSecret))
        {
            _logger.LogWarning("MERCADOPAGO_WEBHOOK_SECRET não configurado — webhook recusado por segurança.");
            return new WebhookParseResult(false, null, null, null, null);
        }

        if (string.IsNullOrWhiteSpace(signatureHeader) || string.IsNullOrWhiteSpace(dataId))
        {
            return new WebhookParseResult(false, null, null, null, null);
        }

        // x-signature vem como "ts=1704908010,v1=618c85345248dd820d5fd456117c2a..."
        string? ts = null, v1 = null;
        foreach (var part in signatureHeader.Split(','))
        {
            var kv = part.Split('=', 2);
            if (kv.Length != 2) continue;
            var key = kv[0].Trim();
            var value = kv[1].Trim();
            if (key == "ts") ts = value;
            else if (key == "v1") v1 = value;
        }

        if (ts == null || v1 == null)
        {
            return new WebhookParseResult(false, null, null, null, null);
        }

        var manifest = $"id:{dataId.ToLowerInvariant()};request-id:{requestId};ts:{ts};";
        var computedHex = Convert.ToHexStringLower(
            new HMACSHA256(Encoding.UTF8.GetBytes(webhookSecret)).ComputeHash(Encoding.UTF8.GetBytes(manifest)));

        var isValid = CryptographicOperations.FixedTimeEquals(
            Encoding.UTF8.GetBytes(computedHex), Encoding.UTF8.GetBytes(v1));

        if (!isValid)
        {
            _logger.LogWarning("Webhook do Mercado Pago com assinatura inválida — descartado.");
            return new WebhookParseResult(false, null, null, null, null);
        }

        // O corpo da notificação indica o tipo de evento ("payment",
        // "subscription_preapproval"...) e o id do recurso, que é o mesmo
        // "data.id" já validado acima.
        string? eventType = null;
        try
        {
            using var doc = JsonDocument.Parse(rawBody);
            if (doc.RootElement.TryGetProperty("type", out var typeEl))
            {
                eventType = typeEl.GetString();
            }
            else if (doc.RootElement.TryGetProperty("topic", out var topicEl))
            {
                eventType = topicEl.GetString();
            }
        }
        catch (JsonException)
        {
            // corpo vazio ou não-JSON — ainda assim seguimos com o que veio na query string
        }

        var isSubscriptionEvent = eventType is "subscription_preapproval" or "preapproval";

        return new WebhookParseResult(
            IsValid: true,
            EventType: eventType,
            ExternalEventId: $"{requestId}:{dataId}",
            ExternalPaymentId: isSubscriptionEvent ? null : dataId,
            ExternalSubscriptionId: isSubscriptionEvent ? dataId : null
        );
    }

    private static PaymentStatus MapStatus(string? mpStatus) => mpStatus switch
    {
        "approved" => PaymentStatus.Approved,
        "rejected" => PaymentStatus.Rejected,
        "cancelled" => PaymentStatus.Cancelled,
        "refunded" => PaymentStatus.Refunded,
        _ => PaymentStatus.Pending
    };

    private static readonly JsonSerializerOptions JsonOpts = new() { PropertyNameCaseInsensitive = true };

    // Campos nulos (ex.: free_trial sem trial, identification sem documento) não são enviados ao gateway.
    private static readonly JsonSerializerOptions JsonWriteOpts = new() { DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull };

    // Formas mínimas da resposta do Mercado Pago que realmente usamos —
    // evita depender do SDK oficial inteiro por duas chamadas de API.
    private class MpPreapprovalResponse
    {
        [JsonPropertyName("id")] public string Id { get; set; } = string.Empty;
        [JsonPropertyName("init_point")] public string? InitPoint { get; set; }
        [JsonPropertyName("status")] public string? Status { get; set; }
    }

    private class MpPaymentResponse
    {
        [JsonPropertyName("id")] public long Id { get; set; }
        [JsonPropertyName("status")] public string? Status { get; set; }
        [JsonPropertyName("transaction_amount")] public decimal TransactionAmount { get; set; }
        [JsonPropertyName("external_reference")] public string? ExternalReference { get; set; }
        [JsonPropertyName("payment_method_id")] public string? PaymentMethodId { get; set; }
        [JsonPropertyName("point_of_interaction")] public MpPointOfInteraction? PointOfInteraction { get; set; }
        [JsonPropertyName("transaction_details")] public MpTransactionDetails? TransactionDetails { get; set; }
    }

    private class MpPointOfInteraction
    {
        [JsonPropertyName("transaction_data")] public MpTransactionData? TransactionData { get; set; }
    }

    private class MpTransactionData
    {
        [JsonPropertyName("qr_code")] public string? QrCode { get; set; }
        [JsonPropertyName("qr_code_base64")] public string? QrCodeBase64 { get; set; }
    }

    private class MpTransactionDetails
    {
        [JsonPropertyName("external_resource_url")] public string? ExternalResourceUrl { get; set; }
    }
}
