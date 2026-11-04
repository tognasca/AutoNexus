using System.Text.Json;
using AutoNexus.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AutoNexus.Api.Controllers;

/// <summary>Recebe notificações do gateway de pagamento. Anônimo por natureza — a segurança é a validação da assinatura (HMAC) feita pelo provider.</summary>
[ApiController]
[Route("api/webhooks")]
[AllowAnonymous]
public class WebhooksController : ControllerBase
{
    private readonly IBillingService _billing;
    private readonly ILogger<WebhooksController> _logger;

    public WebhooksController(IBillingService billing, ILogger<WebhooksController> logger)
    {
        _billing = billing;
        _logger = logger;
    }

    [HttpPost("mercadopago")]
    public async Task<IActionResult> MercadoPago(CancellationToken ct)
    {
        using var reader = new StreamReader(Request.Body);
        var rawBody = await reader.ReadToEndAsync(ct);

        // O botão "Testar URL" do Mercado Pago envia um evento sintético
        // (type=test / action=test.created), que não representa pagamento.
        // Responder 200 sem encaminhá-lo ao fluxo financeiro evita consultar
        // um pagamento fictício e não altera assinaturas nem histórico.
        try
        {
            using var document = JsonDocument.Parse(rawBody);
            var root = document.RootElement;
            var isTestEvent =
                (root.TryGetProperty("type", out var type) &&
                 string.Equals(type.GetString(), "test", StringComparison.OrdinalIgnoreCase)) ||
                (root.TryGetProperty("action", out var action) &&
                 action.GetString()?.StartsWith("test.", StringComparison.OrdinalIgnoreCase) == true);

            if (isTestEvent)
            {
                _logger.LogInformation("Notificação de teste do Mercado Pago recebida; nenhuma operação financeira foi executada.");
                return Ok();
            }
        }
        catch (JsonException)
        {
            // Payload inválido segue para a validação normal do provider,
            // que o rejeita sem processar qualquer pagamento.
        }

        var headers = Request.Headers.ToDictionary(h => h.Key.ToLowerInvariant(), h => h.Value.ToString());
        var query = Request.Query.ToDictionary(q => q.Key.ToLowerInvariant(), q => q.Value.ToString());

        try
        {
            var result = await _billing.ProcessWebhookAsync(rawBody, headers, query, ct);
            return result == WebhookProcessResult.Invalid ? Unauthorized() : Ok();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao processar webhook do Mercado Pago.");
            return StatusCode(500); // o Mercado Pago reenvia
        }
    }
}
