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

    public void Update(WebhookEvent webhookEvent)
        => _context.WebhookEvents.Update(webhookEvent);
}
