using AutoNexus.Domain.Entities;
using AutoNexus.Domain.Interfaces;
using AutoNexus.Infrastructure.Data;

namespace AutoNexus.Infrastructure.Repositories;

public class UserConsentRepository : IUserConsentRepository
{
    private readonly AutoNexusDbContext _context;

    public UserConsentRepository(AutoNexusDbContext context)
    {
        _context = context;
    }

    public async Task AddAsync(UserConsent consent, CancellationToken cancellationToken = default)
        => await _context.UserConsents.AddAsync(consent, cancellationToken);

    public async Task AddForTenantAsync(UserConsent consent, Guid tenantId, CancellationToken cancellationToken = default)
    {
        consent.TenantId = tenantId;
        await _context.UserConsents.AddAsync(consent, cancellationToken);
    }
}
