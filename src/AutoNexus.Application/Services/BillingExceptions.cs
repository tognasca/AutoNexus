namespace AutoNexus.Application.Services;

/// <summary>Limite do plano atingido (usuários/veículos) — vira HTTP 403 com mensagem amigável na API.</summary>
public class PlanLimitExceededException : Exception
{
    public PlanLimitExceededException(string message) : base(message) { }
}
