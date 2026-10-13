using System.Net.Http.Headers;
using System.Net.Http.Json;
using AutoNexus.Application.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace AutoNexus.Infrastructure.Services;

/// <summary>
/// Implementação de IEmailService para o Resend (https://resend.com/docs/api-reference/emails/send-email).
/// Credenciais vêm de configuração (Resend:ApiKey/FromEmail/FromName),
/// nunca hardcoded (requisito 19).
/// </summary>
public class ResendEmailService : IEmailService
{
    private const string BaseUrl = "https://api.resend.com";

    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;
    private readonly ILogger<ResendEmailService> _logger;

    public ResendEmailService(HttpClient httpClient, IConfiguration configuration, ILogger<ResendEmailService> logger)
    {
        _httpClient = httpClient;
        _configuration = configuration;
        _logger = logger;

        var apiKey = _configuration["Resend:ApiKey"];
        if (!string.IsNullOrWhiteSpace(apiKey))
        {
            _httpClient.BaseAddress = new Uri(BaseUrl);
            _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
        }
    }

    public async Task SendAsync(string toEmail, string toName, string subject, string htmlBody, CancellationToken cancellationToken = default)
    {
        var apiKey = _configuration["Resend:ApiKey"];
        var fromEmail = _configuration["Resend:FromEmail"];
        var fromName = _configuration["Resend:FromName"] ?? "AutoNexus";

        if (string.IsNullOrWhiteSpace(apiKey) || string.IsNullOrWhiteSpace(fromEmail))
        {
            // Não derruba o fluxo principal (ex.: criação de empresa) só
            // porque o e-mail não está configurado ainda — loga e segue.
            // Isso é intencional: e-mail é importante, mas não deveria ser
            // um ponto único de falha do cadastro/checkout.
            _logger.LogWarning(
                "RESEND_API_KEY ou RESEND_FROM_EMAIL não configurados — e-mail para {Email} ('{Subject}') não enviado.",
                toEmail, subject);
            return;
        }

        var payload = new
        {
            from = $"{fromName} <{fromEmail}>",
            to = new[] { toEmail },
            subject,
            html = htmlBody
        };

        try
        {
            var response = await _httpClient.PostAsJsonAsync("/emails", payload, cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                var body = await response.Content.ReadAsStringAsync(cancellationToken);
                _logger.LogError("Resend: falha ao enviar e-mail para {Email}. Status {Status}. Body: {Body}", toEmail, response.StatusCode, body);
            }
        }
        catch (Exception ex)
        {
            // Mesma lógica: falha de e-mail não deve derrubar a operação
            // principal que disparou o envio.
            _logger.LogError(ex, "Resend: exceção ao enviar e-mail para {Email}.", toEmail);
        }
    }
}
