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
