namespace AutoNexus.Application.Interfaces;

/// <summary>
/// Abstração de envio de e-mail transacional (requisito 7 do documento de
/// definições de negócio). A regra de negócio nunca depende diretamente do
/// Resend — só desta interface.
/// </summary>
public interface IEmailService
{
    Task SendAsync(string toEmail, string toName, string subject, string htmlBody, CancellationToken cancellationToken = default);
}
