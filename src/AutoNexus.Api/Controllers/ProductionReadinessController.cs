using AutoNexus.Domain.Enums;
using AutoNexus.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.RegularExpressions;

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

        var legalIssues = new List<string>();
        if (databaseOk)
        {
            var legalDocuments = await _db.Set<AutoNexus.Domain.Entities.LegalDocument>()
                .AsNoTracking().ToListAsync(cancellationToken);
            var legalTypes = new[]
            {
                (Type: LegalDocumentType.TermsOfUse, Name: "Termos de Uso"),
                (Type: LegalDocumentType.PrivacyPolicy, Name: "Política de Privacidade"),
                (Type: LegalDocumentType.CookiePolicy, Name: "Política de Cookies")
            };

            foreach (var (type, name) in legalTypes)
            {
                var activeDocument = legalDocuments
                    .Where(x => x.Type == type && x.IsActive)
                    .OrderByDescending(x => x.Version)
                    .FirstOrDefault();

                if (activeDocument is null)
                {
                    legalIssues.Add($"{name}: não há versão publicada. Salvar como rascunho não libera o bloqueio; publique a versão final.");
                    continue;
                }

                if (activeDocument.PublishedAt == DateTime.MinValue)
                {
                    legalIssues.Add($"{name}: a versão ativa não tem data de publicação válida; publique novamente uma versão final.");
                    continue;
                }

                var placeholder = FindLegalPlaceholder(activeDocument.Content);
                if (placeholder is not null)
                    legalIssues.Add($"{name} v{activeDocument.Version}: ainda contém o marcador '{placeholder}'. Substitua-o e publique uma nova versão.");
            }
        }
        else
        {
            legalIssues.Add("Não foi possível verificar os documentos porque o banco de dados está inacessível.");
        }

        var legalReady = legalIssues.Count == 0;
        checks.Add(Check("Documentos legais finais publicados", legalReady, true,
            legalReady
                ? "Os três documentos têm versões ativas sem marcadores de rascunho detectáveis. A revisão jurídica deve ser confirmada fora do sistema."
                : string.Join(" ", legalIssues)));

        var bvConfigured = !string.IsNullOrWhiteSpace(_configuration["BvOpen:AccessToken"]) &&
            !string.IsNullOrWhiteSpace(_configuration["BvOpen:CommercialPartnerCode"]) &&
            !string.IsNullOrWhiteSpace(_configuration["BvOpen:FinancingConditionsEndpoint"]);
        checks.Add(Check("Integração BV configurada", bvConfigured, false,
            "Cadastre as credenciais e o endpoint fornecidos pela instituição após a homologação. Mantenha o envio externo desligado até concluir os testes."));

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

    private static string? FindLegalPlaceholder(string content)
    {
        var explicitDraftMarker = Regex.Match(content,
            @"RASCUNHO ESTRUTURAL|PENDENTE DE REVISÃO JURÍDICA|NÃO USAR COMO",
            RegexOptions.IgnoreCase | RegexOptions.CultureInvariant);
        if (explicitDraftMarker.Success) return explicitDraftMarker.Value;

        var bracketedPlaceholder = Regex.Match(content,
            @"\[(?:CNPJ|RAZÃO SOCIAL|ENDEREÇO|CIDADE(?:/UF)?|E-?MAIL|NOME(?:/E-?MAIL)?|A DEFINIR|A SER DEFINIDO|DATA DE PUBLICAÇÃO|GATEWAY(?: DE PAGAMENTO)?|RASCUNHO|PENDENTE)[^\]]*\]",
            RegexOptions.IgnoreCase | RegexOptions.CultureInvariant);
        return bracketedPlaceholder.Success ? bracketedPlaceholder.Value : null;
    }

    private sealed record ReadinessCheck(string Name, bool Ok, bool Blocking, string Guidance);
}
