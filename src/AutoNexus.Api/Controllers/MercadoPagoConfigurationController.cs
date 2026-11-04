using AutoNexus.Api.Security;
using AutoNexus.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Net.Http.Headers;

namespace AutoNexus.Api.Controllers;

[ApiController]
[Route("api/superadmin/mercadopago")]
[Authorize(Roles = "SuperAdmin")]
public sealed class MercadoPagoConfigurationController : ControllerBase
{
    private readonly AutoNexusDbContext _db;
    private readonly IConfiguration _configuration;
    private readonly MercadoPagoCredentialProtector _protector;
    private readonly IHttpClientFactory _httpClientFactory;

    public MercadoPagoConfigurationController(AutoNexusDbContext db, IConfiguration configuration,
        MercadoPagoCredentialProtector protector, IHttpClientFactory httpClientFactory)
    {
        _db = db;
        _configuration = configuration;
        _protector = protector;
        _httpClientFactory = httpClientFactory;
    }

    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken ct)
    {
        var saved = await _db.MercadoPagoConfigurations.AsNoTracking()
            .OrderByDescending(x => x.ConfiguredAtUtc).FirstOrDefaultAsync(ct);
        var token = _configuration["MercadoPago:AccessToken"];
        return Ok(new
        {
            configured = !string.IsNullOrWhiteSpace(token),
            environment = saved?.Environment ?? (_configuration["MercadoPago:Environment"] ?? "production"),
            accessTokenHint = string.IsNullOrWhiteSpace(token) ? null : $"••••••••{token[^Math.Min(4, token.Length)..]}",
            webhookSecretConfigured = !string.IsNullOrWhiteSpace(_configuration["MercadoPago:WebhookSecret"]),
            configuredAtUtc = saved?.ConfiguredAtUtc
        });
    }

    [HttpPut]
    public async Task<IActionResult> Save([FromBody] SaveMercadoPagoConfigurationRequest request, CancellationToken ct)
    {
        var accessToken = request.AccessToken?.Trim();
        var webhookSecret = request.WebhookSecret?.Trim();
        var environment = request.Environment?.Trim().ToLowerInvariant();

        if (environment is not ("test" or "production"))
            return BadRequest(new { message = "Selecione o ambiente de teste ou produção." });
        if (string.IsNullOrWhiteSpace(accessToken) || accessToken.Length > 500)
            return BadRequest(new { message = "Informe um Access Token válido (máximo 500 caracteres)." });
        if (string.IsNullOrWhiteSpace(webhookSecret) || webhookSecret.Length > 500)
            return BadRequest(new { message = "Informe o segredo do Webhook (máximo 500 caracteres)." });
        // No Brasil, o Mercado Pago também utiliza o prefixo APP_USR- para Access Tokens
        // de teste. O prefixo não diferencia teste de produção; o ambiente é definido
        // pela credencial copiada no painel e pela seleção explícita nesta tela.
        if (!accessToken.StartsWith("APP_USR-", StringComparison.Ordinal) &&
            !(environment == "test" && accessToken.StartsWith("TEST-", StringComparison.Ordinal)))
            return BadRequest(new { message = environment == "test"
                ? "Informe o Access Token copiado na seção Credenciais de teste do Mercado Pago."
                : "O ambiente de produção exige um Access Token APP_USR-." });

        var entity = await _db.MercadoPagoConfigurations.OrderByDescending(x => x.ConfiguredAtUtc).FirstOrDefaultAsync(ct);
        if (entity == null)
        {
            entity = new AutoNexus.Domain.Entities.MercadoPagoConfiguration();
            entity.SetCredentials(_protector.Protect(accessToken), _protector.Protect(webhookSecret), environment);
            _db.MercadoPagoConfigurations.Add(entity);
        }
        else
        {
            entity.SetCredentials(_protector.Protect(accessToken), _protector.Protect(webhookSecret), environment);
        }

        await _db.SaveChangesAsync(ct);
        _configuration["MercadoPago:AccessToken"] = accessToken;
        _configuration["MercadoPago:WebhookSecret"] = webhookSecret;
        _configuration["MercadoPago:Environment"] = environment;
        return Ok(new { message = "Credenciais do Mercado Pago salvas e aplicadas.", configured = true, environment, configuredAtUtc = entity.ConfiguredAtUtc });
    }

    [HttpPost("validate")]
    public async Task<IActionResult> Validate(CancellationToken ct)
    {
        var token = _configuration["MercadoPago:AccessToken"];
        if (string.IsNullOrWhiteSpace(token))
            return BadRequest(new { valid = false, message = "Configure o Access Token antes de validar." });

        var client = _httpClientFactory.CreateClient();
        using var request = new HttpRequestMessage(HttpMethod.Get, "https://api.mercadopago.com/users/me");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        try
        {
            using var response = await client.SendAsync(request, ct);
            if (!response.IsSuccessStatusCode)
                return Ok(new { valid = false, message = "O Mercado Pago recusou a credencial. Confira o token e o ambiente selecionado." });
            using var document = System.Text.Json.JsonDocument.Parse(await response.Content.ReadAsStringAsync(ct));
            var root = document.RootElement;
            var nickname = root.TryGetProperty("nickname", out var nick) ? nick.GetString() : null;
            return Ok(new { valid = true, message = "Credencial validada com sucesso no Mercado Pago.", account = nickname });
        }
        catch (HttpRequestException)
        {
            return StatusCode(502, new { valid = false, message = "Não foi possível alcançar a API do Mercado Pago agora." });
        }
    }
}

public sealed class SaveMercadoPagoConfigurationRequest
{
    public string? AccessToken { get; set; }
    public string? WebhookSecret { get; set; }
    public string? Environment { get; set; }
}
