using AutoNexus.Domain.Enums;
using AutoNexus.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AutoNexus.Api.Controllers;

/// <summary>Diagnóstico seguro de preparação para produção. Nunca retorna segredos.</summary>
[ApiController]
[Route("api/superadmin/production-readiness")]
[Authorize(Roles = "SuperAdmin")]
public sealed class ProductionReadinessController : ControllerBase
{
    private readonly IConfiguration _configuration;
    private readonly AutoNexusDbContext _db;

    public ProductionReadinessController(IConfiguration configuration, AutoNexusDbContext db)
    {
        _configuration = configuration;
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken cancellationToken)
    {
        var checks = new List<ReadinessCheck>();
        var connectionString = _configuration.GetConnectionString("DefaultConnection");
        checks.Add(Check("Banco de dados configurado", !string.IsNullOrWhiteSpace(connectionString), true,
            "Configure ConnectionStrings:DefaultConnection."));

        var databaseOk = false;
        if (!string.IsNullOrWhiteSpace(connectionString))
        {
            try { databaseOk = await _db.Database.CanConnectAsync(cancellationToken); }
            catch { databaseOk = false; }
        }
        checks.Add(Check("Banco de dados acessível", databaseOk, true,
            "A API não conseguiu estabelecer conexão com o PostgreSQL."));

        var jwtSecret = _configuration["Jwt:SecretKey"];
        checks.Add(Check("JWT configurado com segurança", !string.IsNullOrWhiteSpace(jwtSecret) && jwtSecret.Length >= 32, true,
            "Configure Jwt:SecretKey com um segredo aleatório forte de pelo menos 32 caracteres."));

        var applicationUrl = _configuration["Application:Url"];
        var httpsUrl = Uri.TryCreate(applicationUrl, UriKind.Absolute, out var appUri) && appUri.Scheme == Uri.UriSchemeHttps;
        checks.Add(Check("URL pública HTTPS", httpsUrl, true,
            "Configure APPLICATION_URL com a URL HTTPS pública do AutoNexus."));

        checks.Add(Check("Mercado Pago configurado",
            !string.IsNullOrWhiteSpace(_configuration["MercadoPago:AccessToken"]) &&
            !string.IsNullOrWhiteSpace(_configuration["MercadoPago:WebhookSecret"]), true,
            "Configure o Access Token de produção e o segredo HMAC do webhook."));

        checks.Add(Check("E-mail transacional configurado",
            !string.IsNullOrWhiteSpace(_configuration["Resend:ApiKey"]) &&
            !string.IsNullOrWhiteSpace(_configuration["Resend:FromEmail"]), true,
            "Configure RESEND_API_KEY e RESEND_FROM_EMAIL."));

        var legalDocuments = await _db.Set<AutoNexus.Domain.Entities.LegalDocument>()
            .AsNoTracking().Where(x => x.IsActive).ToListAsync(cancellationToken);
        var legalTypes = new[] { LegalDocumentType.TermsOfUse, LegalDocumentType.PrivacyPolicy, LegalDocumentType.CookiePolicy };
        var legalReady = legalTypes.All(type => legalDocuments.Any(x => x.Type == type &&
            !x.Content.Contains("[RASCUNHO ESTRUTURAL", StringComparison.OrdinalIgnoreCase) &&
            !x.Content.Contains("[CNPJ]", StringComparison.OrdinalIgnoreCase) &&
            !x.Content.Contains("[Razão social]", StringComparison.OrdinalIgnoreCase)));
        checks.Add(Check("Documentos legais finais publicados", legalReady, true,
            "Termos, Privacidade e Cookies ainda contêm placeholders ou precisam de revisão jurídica."));

        var externalCredit = string.Equals(_configuration["AUTONEXUS_ENABLE_EXTERNAL_CREDIT_SUBMISSION"], "true", StringComparison.OrdinalIgnoreCase);
        checks.Add(Check("Crédito externo desligado até homologação", !externalCredit, false,
            "Mantenha desligado até uma instituição financeira estar homologada."));

        var blocking = checks.Any(x => x.Blocking && !x.Ok);
        return Ok(new
        {
            ready = !blocking,
            environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Unknown",
            checkedAtUtc = DateTime.UtcNow,
            checks
        });
    }

    private static ReadinessCheck Check(string name, bool ok, bool blocking, string guidance) =>
        new(name, ok, blocking, guidance);

    private sealed record ReadinessCheck(string Name, bool Ok, bool Blocking, string Guidance);
}
