using AutoNexus.Api.Security;
using AutoNexus.Domain.Entities;
using AutoNexus.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AutoNexus.Api.Controllers;

[ApiController]
[Route("api/superadmin/integrations")]
[Authorize(Roles = "SuperAdmin")]
public sealed class PlatformIntegrationConfigurationController : ControllerBase
{
    private readonly AutoNexusDbContext _db;
    private readonly IConfiguration _configuration;
    private readonly MercadoPagoCredentialProtector _protector;

    public PlatformIntegrationConfigurationController(AutoNexusDbContext db, IConfiguration configuration,
        MercadoPagoCredentialProtector protector)
    {
        _db = db;
        _configuration = configuration;
        _protector = protector;
    }

    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken ct)
    {
        var saved = await _db.PlatformIntegrationConfigurations.AsNoTracking()
            .OrderByDescending(x => x.ConfiguredAtUtc).FirstOrDefaultAsync(ct);
        return Ok(new
        {
            resendConfigured = !string.IsNullOrWhiteSpace(_configuration["Resend:ApiKey"]),
            resendApiKeyHint = Hint(_configuration["Resend:ApiKey"]),
            resendFromEmail = _configuration["Resend:FromEmail"],
            resendFromName = _configuration["Resend:FromName"] ?? "AutoNexus",
            bvConfigured = !string.IsNullOrWhiteSpace(_configuration["BvOpen:AccessToken"]) &&
                !string.IsNullOrWhiteSpace(_configuration["BvOpen:CommercialPartnerCode"]),
            bvAccessTokenHint = Hint(_configuration["BvOpen:AccessToken"]),
            bvPartnerCodeHint = Hint(_configuration["BvOpen:CommercialPartnerCode"]),
            bvEndpoint = _configuration["BvOpen:FinancingConditionsEndpoint"],
            configuredAtUtc = saved?.ConfiguredAtUtc
        });
    }

    [HttpPut]
    public async Task<IActionResult> Save([FromBody] SavePlatformIntegrationsRequest request, CancellationToken ct)
    {
        var resendKey = string.IsNullOrWhiteSpace(request.ResendApiKey) ? _configuration["Resend:ApiKey"] : request.ResendApiKey.Trim();
        var resendFromEmail = string.IsNullOrWhiteSpace(request.ResendFromEmail) ? _configuration["Resend:FromEmail"] : request.ResendFromEmail.Trim();
        var resendFromName = string.IsNullOrWhiteSpace(request.ResendFromName) ? (_configuration["Resend:FromName"] ?? "AutoNexus") : request.ResendFromName.Trim();
        var bvToken = string.IsNullOrWhiteSpace(request.BvAccessToken) ? _configuration["BvOpen:AccessToken"] : request.BvAccessToken.Trim();
        var bvPartner = string.IsNullOrWhiteSpace(request.BvCommercialPartnerCode) ? _configuration["BvOpen:CommercialPartnerCode"] : request.BvCommercialPartnerCode.Trim();
        var bvEndpoint = string.IsNullOrWhiteSpace(request.BvFinancingConditionsEndpoint)
            ? (_configuration["BvOpen:FinancingConditionsEndpoint"] ?? "https://apige-uat-sbx.bancobv.com.br/partner-funding/v1/financing-conditions")
            : request.BvFinancingConditionsEndpoint.Trim();

        if (!string.IsNullOrWhiteSpace(resendFromEmail) &&
            (!System.Net.Mail.MailAddress.TryCreate(resendFromEmail, out var address) || address.Address != resendFromEmail))
            return BadRequest(new { message = "Informe um e-mail remetente válido e verificado no Resend." });
        if (!Uri.TryCreate(bvEndpoint, UriKind.Absolute, out var endpointUri) || endpointUri.Scheme != Uri.UriSchemeHttps)
            return BadRequest(new { message = "O endpoint BV precisa utilizar HTTPS." });
        if (resendKey?.Length > 500 || bvToken?.Length > 3000 || bvPartner?.Length > 500)
            return BadRequest(new { message = "Uma das credenciais excede o tamanho permitido." });

        var entity = await _db.PlatformIntegrationConfigurations.OrderByDescending(x => x.ConfiguredAtUtc).FirstOrDefaultAsync(ct);
        if (entity is null)
        {
            entity = new PlatformIntegrationConfiguration();
            _db.PlatformIntegrationConfigurations.Add(entity);
        }
        entity.Update(
            string.IsNullOrWhiteSpace(resendKey) ? null : _protector.Protect(resendKey),
            resendFromEmail, resendFromName,
            string.IsNullOrWhiteSpace(bvToken) ? null : _protector.Protect(bvToken),
            string.IsNullOrWhiteSpace(bvPartner) ? null : _protector.Protect(bvPartner),
            bvEndpoint);
        await _db.SaveChangesAsync(ct);

        // IConfiguration é compartilhada pela aplicação: novas chamadas usam os valores imediatamente,
        // sem reiniciar o processo. Credenciais persistidas prevalecem sobre variáveis legadas.
        _configuration["Resend:ApiKey"] = resendKey;
        _configuration["Resend:FromEmail"] = resendFromEmail;
        _configuration["Resend:FromName"] = resendFromName;
        _configuration["BvOpen:AccessToken"] = bvToken;
        _configuration["BvOpen:CommercialPartnerCode"] = bvPartner;
        _configuration["BvOpen:FinancingConditionsEndpoint"] = bvEndpoint;

        return Ok(new { message = "Configurações Resend e BV salvas, criptografadas e aplicadas imediatamente.", configuredAtUtc = entity.ConfiguredAtUtc });
    }

    private static string? Hint(string? value) => string.IsNullOrWhiteSpace(value)
        ? null : $"••••••••{value[^Math.Min(4, value.Length)..]}";
}

public sealed class SavePlatformIntegrationsRequest
{
    public string? ResendApiKey { get; set; }
    public string? ResendFromEmail { get; set; }
    public string? ResendFromName { get; set; }
    public string? BvAccessToken { get; set; }
    public string? BvCommercialPartnerCode { get; set; }
    public string? BvFinancingConditionsEndpoint { get; set; }
}