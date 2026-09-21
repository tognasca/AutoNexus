using AutoNexus.Application.DTOs;
using AutoNexus.Application.Interfaces;
using AutoNexus.Domain.Entities;
using AutoNexus.Domain.Interfaces;

namespace AutoNexus.Application.Services;

public class TenantSettingService : ITenantSettingService
{
    private readonly ITenantSettingRepository _settingRepository;
    private readonly ITenantContext _tenantContext;
    private readonly IUnitOfWork _unitOfWork;

    public TenantSettingService(
        ITenantSettingRepository settingRepository,
        ITenantContext tenantContext,
        IUnitOfWork unitOfWork)
    {
        _settingRepository = settingRepository;
        _tenantContext = tenantContext;
        _unitOfWork = unitOfWork;
    }

    public async Task<TenantSettingDto> GetCurrentAsync(CancellationToken cancellationToken = default)
    {
        var settings = await _settingRepository.GetCurrentAsync(cancellationToken);

        if (settings == null)
        {
            if (!_tenantContext.HasTenant)
                throw new InvalidOperationException("Nenhum tenant identificado na requisição atual.");

            settings = new TenantSetting("Minha Empresa");
            await _settingRepository.AddForTenantAsync(settings, _tenantContext.TenantId, cancellationToken);
            await _unitOfWork.CommitAsync(cancellationToken);
        }

        return ToDto(settings);
    }

    public async Task<TenantSettingDto> UpdateAsync(TenantSettingDto dto, CancellationToken cancellationToken = default)
    {
        var settings = await _settingRepository.GetCurrentAsync(cancellationToken);

        if (settings == null)
        {
            if (!_tenantContext.HasTenant)
                throw new InvalidOperationException("Nenhum tenant identificado na requisição atual.");

            settings = new TenantSetting(dto.CompanyName);
            settings.Update(dto.CompanyName, dto.LogoUrl, dto.PrimaryColor, dto.TimeZone, dto.Currency);
            await _settingRepository.AddForTenantAsync(settings, _tenantContext.TenantId, cancellationToken);
        }
        else
        {
            settings.Update(dto.CompanyName, dto.LogoUrl, dto.PrimaryColor, dto.TimeZone, dto.Currency);
            _settingRepository.Update(settings);
        }

        await _unitOfWork.CommitAsync(cancellationToken);
        return ToDto(settings);
    }

    private static TenantSettingDto ToDto(TenantSetting settings) => new(
        settings.CompanyName,
        settings.LogoUrl,
        settings.PrimaryColor,
        settings.TimeZone,
        settings.Currency
    );
}
