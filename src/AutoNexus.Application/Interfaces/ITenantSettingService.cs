using AutoNexus.Application.DTOs;

namespace AutoNexus.Application.Interfaces;

public interface ITenantSettingService
{
    Task<TenantSettingDto> GetCurrentAsync(CancellationToken cancellationToken = default);
    Task<TenantSettingDto> UpdateAsync(TenantSettingDto dto, CancellationToken cancellationToken = default);
}
