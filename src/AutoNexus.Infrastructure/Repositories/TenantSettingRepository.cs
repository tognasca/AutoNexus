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

    public async Task<TenantSetting?> GetCurrentAsync(CancellationToken cancellationToken = default)
    {
        var currentTenantId = _context.TenantSettings
            .Select(s => s.TenantId)
            .FirstOrDefault();

        if (currentTenantId == Guid.Empty)
            return null;

        return await _context.TenantSettings
            .FirstOrDefaultAsync(s => s.TenantId == currentTenantId, cancellationToken);
    }

    public async Task AddAsync(TenantSetting setting, CancellationToken cancellationToken = default)
        => await _context.TenantSettings.AddAsync(setting, cancellationToken);

    public async Task AddForTenantAsync(TenantSetting setting, Guid tenantId, CancellationToken cancellationToken = default)
    {
        setting.TenantId = tenantId;
        await _context.TenantSettings.AddAsync(setting, cancellationToken);
    }

    public void Update(TenantSetting setting)
        => _context.TenantSettings.Update(setting);
}
