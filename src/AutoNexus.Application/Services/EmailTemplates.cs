namespace AutoNexus.Application.Services;

/// <summary>
/// Templates de e-mail transacional centralizados (requisito 7 do documento
/// de definições de negócio) — nenhum HTML de e-mail deve ser escrito
/// inline em algum service/controller fora daqui.
/// </summary>
public static class EmailTemplates
{
    private static (string Subject, string Html) Wrap(string title, string bodyHtml, string? ctaLabel = null, string? ctaUrl = null)
    {
        var cta = ctaLabel != null && ctaUrl != null
            ? $@"<p style=""margin:28px 0;""><a href=""{ctaUrl}"" style=""background:#2563eb;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;"">{ctaLabel}</a></p>"
            : "";

        var html = $@"
<div style=""font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#1f2937;"">
  <h2 style=""margin:0 0 16px;color:#111827;"">{title}</h2>
  <div style=""font-size:14px;line-height:1.6;"">{bodyHtml}</div>
  {cta}
  <hr style=""border:none;border-top:1px solid #e5e7eb;margin:32px 0 16px;"" />
  <p style=""font-size:12px;color:#9ca3af;"">AutoNexus — plataforma de gestão para lojas de veículos.</p>
</div>";

        return (title, html);
    }

    public static (string Subject, string Html) CadastroConfirmado(string nomeEmpresa) =>
        Wrap("Bem-vindo ao AutoNexus!",
            $"Sua empresa <strong>{nomeEmpresa}</strong> foi cadastrada com sucesso na plataforma AutoNexus. Você já pode acessar o painel e começar a usar o sistema.");

    public static (string Subject, string Html) RecuperacaoSenha(string resetUrl) =>
        Wrap("Redefinição de senha",
            "Recebemos uma solicitação para redefinir sua senha. Se não foi você, ignore este e-mail — sua senha continuará a mesma. O link abaixo expira em 1 hora.",
            "Redefinir senha", resetUrl);

    public static (string Subject, string Html) TrialIniciado(string planoNome, int diasTrial, DateTime trialFim) =>
        Wrap("Seu teste grátis começou!",
            $"Você iniciou o período de teste gratuito de <strong>{diasTrial} dias</strong> do plano <strong>{planoNome}</strong>. Seu acesso continua liberado até <strong>{trialFim:dd/MM/yyyy}</strong>.");

    public static (string Subject, string Html) TrialProximoDoFim(int diasRestantes, DateTime trialFim, string checkoutUrl) =>
        Wrap("Seu teste grátis está terminando",
            $"Faltam <strong>{diasRestantes} dia(s)</strong> para o fim do seu período de teste gratuito (termina em {trialFim:dd/MM/yyyy}). Assine agora para continuar usando o AutoNexus sem interrupção.",
            "Assinar agora", checkoutUrl);

    public static (string Subject, string Html) TrialExpirado(string checkoutUrl) =>
        Wrap("Seu teste grátis terminou",
            "Seu período de teste gratuito do AutoNexus chegou ao fim. Seus dados continuam salvos — assine um plano para recuperar o acesso.",
            "Assinar agora", checkoutUrl);

    public static (string Subject, string Html) AssinaturaCriada(string planoNome, string valorFormatado, string periodicidade) =>
        Wrap("Assinatura confirmada",
            $"Sua assinatura do plano <strong>{planoNome}</strong> ({valorFormatado}/{periodicidade}) foi criada com sucesso.");

    public static (string Subject, string Html) PagamentoAprovado(string valorFormatado, DateTime proximaCobranca) =>
        Wrap("Pagamento aprovado",
            $"Recebemos seu pagamento de <strong>{valorFormatado}</strong>. Sua assinatura está ativa e sua próxima cobrança será em <strong>{proximaCobranca:dd/MM/yyyy}</strong>.");

    public static (string Subject, string Html) PagamentoRecusado(string checkoutUrl) =>
        Wrap("Pagamento recusado",
            "Não conseguimos confirmar seu pagamento. Verifique os dados ou tente outra forma de pagamento para manter sua assinatura ativa.",
            "Tentar novamente", checkoutUrl);

    public static (string Subject, string Html) PagamentoPendente() =>
        Wrap("Pagamento pendente",
            "Recebemos seu pagamento e estamos aguardando a confirmação do meio de pagamento escolhido (Pix/Boleto pode levar até alguns dias úteis). Avisaremos assim que for aprovado.");

    public static (string Subject, string Html) AssinaturaCancelada(DateTime? acessoAte) =>
        Wrap("Assinatura cancelada",
            acessoAte.HasValue
                ? $"Sua assinatura foi cancelada. Você continua com acesso ao AutoNexus até <strong>{acessoAte:dd/MM/yyyy}</strong>, fim do período já pago."
                : "Sua assinatura foi cancelada.");

    public static (string Subject, string Html) Renovacao(string valorFormatado, DateTime proximaCobranca) =>
        Wrap("Assinatura renovada",
            $"Sua assinatura foi renovada com sucesso — <strong>{valorFormatado}</strong> cobrado. Próxima renovação em <strong>{proximaCobranca:dd/MM/yyyy}</strong>.");
}
