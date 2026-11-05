using System.Net.Http.Headers;
using System.Net.Http.Json;
using AutoNexus.Application.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace AutoNexus.Infrastructure.Services;

/// <summary>Envio Resend com credenciais consultadas a cada envio para permitir rotação sem restart.</summary>
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
        _httpClient.BaseAddress = new Uri(BaseUrl);
    }

    public async Task SendAsync(string toEmail, string toName, string subject, string htmlBody, CancellationToken cancellationToken = default)
    {
        var apiKey = _configuration["Resend:ApiKey"];
        var fromEmail = _configuration["Resend:FromEmail"];
        var fromName = _configuration["Resend:FromName"] ?? "AutoNexus";

        if (string.IsNullOrWhiteSpace(apiKey) || string.IsNullOrWhiteSpace(fromEmail))
        {
            _logger.LogWarning("Resend não configurado — e-mail para {Email} ('{Subject}') não enviado.", toEmail, subject);
            return;
        }

        var payload = new { from = $"{fromName} <{fromEmail}>", to = new[] { toEmail }, subject, html = htmlBody };
        try
        {
            using var request = new HttpRequestMessage(HttpMethod.Post, "/emails")
            {
                Content = JsonContent.Create(payload)
            };
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
            using var response = await _httpClient.SendAsync(request, cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                var body = await response.Content.ReadAsStringAsync(cancellationToken);
                _logger.LogError("Resend: falha ao enviar e-mail para {Email}. Status {Status}. Body: {Body}", toEmail, response.StatusCode, body);
            }
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            _logger.LogError(ex, "Resend: exceção ao enviar e-mail para {Email}.", toEmail);
        }
    }
}