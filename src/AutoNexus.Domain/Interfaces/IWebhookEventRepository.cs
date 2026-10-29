using AutoNexus.Domain.Entities;

namespace AutoNexus.Domain.Interfaces;

public interface IWebhookEventRepository
{
    Task<WebhookEvent?> GetByExternalEventIdAsync(string provider, string externalEventId, CancellationToken cancellationToken = default);
    Task AddAsync(WebhookEvent webhookEvent, CancellationToken cancellationToken = default);
    Task<bool> TryAcquireProcessingAsync(string provider, string externalEventId, CancellationToken cancellationToken = default);
    void Update(WebhookEvent webhookEvent);
}
