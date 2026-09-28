using AutoNexus.Domain.Entities;
using AutoNexus.Domain.Interfaces;
using AutoNexus.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace AutoNexus.Infrastructure.Repositories;

public class TenantSettingRepository : ITenantSettingRepository
{
    private readonly AutoNexusDbContext _context;

    public TenantSettingRepository(AutoNexusDbContext context)
    {
        _context = context;
    }

    public Task<TenantSetting?> GetCurrentAsync(CancellationToken cancellationToken = default)
        => _context.TenantSettings.FirstOrDefaultAsync(cancellationToken);

    public async Task AddAsync(TenantSetting settings, CancellationToken cancellationToken = default)
        => await _context.TenantSettings.AddAsync(settings, cancellationToken);

    public async Task AddForTenantAsync(TenantSetting settings, Guid tenantId, CancellationToken cancellationToken = default)
    {
        settings.TenantId = tenantId;
        await _context.TenantSettings.AddAsync(settings, cancellationToken);
    }

    public void Update(TenantSetting settings)
        => _context.TenantSettings.Update(settings);
}
