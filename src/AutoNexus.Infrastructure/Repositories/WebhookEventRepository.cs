using AutoNexus.Domain.Entities;
using AutoNexus.Domain.Interfaces;
using AutoNexus.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace AutoNexus.Infrastructure.Repositories;

// WebhookEvent é EntityBase (global) — sem filtro de tenant aplicável.
public class WebhookEventRepository : IWebhookEventRepository
{
    private readonly AutoNexusDbContext _context;

    public WebhookEventRepository(AutoNexusDbContext context)
    {
        _context = context;
    }

    public Task<WebhookEvent?> GetByExternalEventIdAsync(string provider, string externalEventId, CancellationToken cancellationToken = default)
        => _context.WebhookEvents.FirstOrDefaultAsync(
            w => w.Provider == provider && w.ExternalEventId == externalEventId, cancellationToken);

    public async Task AddAsync(WebhookEvent webhookEvent, CancellationToken cancellationToken = default)
        => await _context.WebhookEvents.AddAsync(webhookEvent, cancellationToken);

    public async Task<bool> TryAcquireProcessingAsync(string provider, string externalEventId, CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        var staleBefore = now.AddMinutes(-5);
        var updated = await _context.WebhookEvents
            .Where(w => w.Provider == provider && w.ExternalEventId == externalEventId
                && !w.ProcessedSuccessfully
                && (!w.IsProcessing || w.ProcessingStartedAt == null || w.ProcessingStartedAt < staleBefore))
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(w => w.IsProcessing, true)
                .SetProperty(w => w.ProcessingStartedAt, now)
                .SetProperty(w => w.ProcessingError, (string?)null), cancellationToken);
        return updated == 1;
    }

    public void Update(WebhookEvent webhookEvent)
        => _context.WebhookEvents.Update(webhookEvent);
}
