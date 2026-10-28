namespace AutoNexus.Domain.Entities;

/// <summary>
/// Registro de deduplicação de eventos de webhook (requisito 5 do documento
/// original: "o mesmo webhook enviado duas vezes não pode gerar duas
/// operações"). É dado global — não pertence a um tenant específico, é só
/// controle de infraestrutura do próprio recebimento do evento — por isso
/// herda de EntityBase, não de TenantOwnedEntityBase. Além disso, o POST do
/// gateway chega sem autenticação (sem JWT, sem tenant resolvido), então um
/// filtro de tenant não faria sentido aqui de qualquer forma.
/// </summary>
public class WebhookEvent : EntityBase
{
    public string Provider { get; private set; } = string.Empty;

    /// <summary>Id do evento/notificação no gateway — único por Provider, usado para detectar duplicatas.</summary>
    public string ExternalEventId { get; private set; } = string.Empty;

    public string EventType { get; private set; } = string.Empty;
    public string? RawPayload { get; private set; }
    public bool ProcessedSuccessfully { get; private set; }
    public bool IsProcessing { get; private set; }
    public DateTime? ProcessingStartedAt { get; private set; }
    public string? ProcessingError { get; private set; }
    public DateTime ReceivedAt { get; private set; }
    public DateTime? ProcessedAt { get; private set; }

    protected WebhookEvent() { }

    public WebhookEvent(string provider, string externalEventId, string eventType, string? rawPayload)
    {
        if (string.IsNullOrWhiteSpace(provider))
            throw new ArgumentException("Gateway é obrigatório.", nameof(provider));
        if (string.IsNullOrWhiteSpace(externalEventId))
            throw new ArgumentException("Id do evento é obrigatório.", nameof(externalEventId));

        Provider = provider;
        ExternalEventId = externalEventId;
        EventType = eventType;
        RawPayload = rawPayload;
        ReceivedAt = DateTime.UtcNow;
    }

    public bool TryStartProcessing(DateTime now, TimeSpan leaseDuration)
    {
        if (ProcessedSuccessfully) return false;
        if (IsProcessing && ProcessingStartedAt.HasValue && ProcessingStartedAt.Value > now - leaseDuration)
            return false;

        IsProcessing = true;
        ProcessingStartedAt = now;
        ProcessingError = null;
        return true;
    }

    public void MarkProcessed()
    {
        ProcessedSuccessfully = true;
        IsProcessing = false;
        ProcessingStartedAt = null;
        ProcessingError = null;
        ProcessedAt = DateTime.UtcNow;
    }

    public void MarkFailed(string error)
    {
        ProcessedSuccessfully = false;
        IsProcessing = false;
        ProcessingStartedAt = null;
        ProcessingError = error;
        ProcessedAt = DateTime.UtcNow;
    }
}
