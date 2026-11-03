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
    private readonly IStorageService _storageService;

    public TenantSettingService(
        ITenantSettingRepository settingRepository,
        ITenantContext tenantContext,
        IUnitOfWork unitOfWork,
        IStorageService storageService)
    {
        _settingRepository = settingRepository;
        _tenantContext = tenantContext;
        _unitOfWork = unitOfWork;
        _storageService = storageService;
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
            settings.Update(dto.CompanyName, dto.LogoUrl, dto.PrimaryColor, dto.WhatsAppNumber, dto.TimeZone, dto.Currency, dto.HeroImageUrl, dto.HeroTemplateKey);
            await _settingRepository.AddForTenantAsync(settings, _tenantContext.TenantId, cancellationToken);
        }
        else
        {
            settings.Update(dto.CompanyName, dto.LogoUrl, dto.PrimaryColor, dto.WhatsAppNumber, dto.TimeZone, dto.Currency, dto.HeroImageUrl, dto.HeroTemplateKey);
            _settingRepository.Update(settings);
        }

        await _unitOfWork.CommitAsync(cancellationToken);
        return ToDto(settings);
    }

    public async Task<string> UploadLogoAsync(Microsoft.AspNetCore.Http.IFormFile file, CancellationToken cancellationToken = default)
    {
        if (!_tenantContext.HasTenant) throw new InvalidOperationException("Tenant não identificado.");
        ValidateImage(file, 5 * 1024 * 1024, "O logo deve ter no máximo 5 MB.");
        var settings = await _settingRepository.GetCurrentAsync(cancellationToken);
        if (settings == null) throw new InvalidOperationException("Salve as configurações da empresa antes de enviar o logo.");

        var old = settings.LogoUrl;
        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        await using var stream = file.OpenReadStream();
        var path = await _storageService.SaveFileAsync(stream, $"logo{ext}", "branding", cancellationToken);

        settings.Update(settings.CompanyName, path, settings.PrimaryColor, settings.WhatsAppNumber, settings.TimeZone, settings.Currency, settings.HeroImageUrl, settings.HeroTemplateKey);
        _settingRepository.Update(settings);
        await _unitOfWork.CommitAsync(cancellationToken);

        if (IsTenantBrandingFile(old)) await _storageService.DeleteFileAsync(old!, cancellationToken);
        return path;
    }

    public async Task RemoveLogoAsync(CancellationToken cancellationToken = default)
    {
        if (!_tenantContext.HasTenant) throw new InvalidOperationException("Tenant não identificado.");
        var settings = await _settingRepository.GetCurrentAsync(cancellationToken);
        if (settings == null) return;

        var old = settings.LogoUrl;
        settings.Update(settings.CompanyName, null, settings.PrimaryColor, settings.WhatsAppNumber, settings.TimeZone, settings.Currency, settings.HeroImageUrl, settings.HeroTemplateKey);
        _settingRepository.Update(settings);
        await _unitOfWork.CommitAsync(cancellationToken);

        if (IsTenantBrandingFile(old)) await _storageService.DeleteFileAsync(old!, cancellationToken);
    }

    public async Task<string> UploadHeroImageAsync(Microsoft.AspNetCore.Http.IFormFile file, CancellationToken cancellationToken = default)
    {
        if (!_tenantContext.HasTenant) throw new InvalidOperationException("Tenant não identificado.");
        ValidateImage(file, 8 * 1024 * 1024, "A imagem deve ter no máximo 8 MB.");
        var settings = await _settingRepository.GetCurrentAsync(cancellationToken);
        if (settings == null) throw new InvalidOperationException("Salve as configurações da empresa antes de enviar o hero.");

        var old = settings.HeroImageUrl;
        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        await using var stream = file.OpenReadStream();
        var path = await _storageService.SaveFileAsync(stream, $"hero{ext}", "branding", cancellationToken);

        settings.Update(settings.CompanyName, settings.LogoUrl, settings.PrimaryColor, settings.WhatsAppNumber, settings.TimeZone, settings.Currency, path, "upload");
        _settingRepository.Update(settings);
        await _unitOfWork.CommitAsync(cancellationToken);

        if (IsTenantBrandingFile(old)) await _storageService.DeleteFileAsync(old!, cancellationToken);
        return path;
    }

    public async Task RemoveHeroImageAsync(CancellationToken cancellationToken = default)
    {
        if (!_tenantContext.HasTenant) throw new InvalidOperationException("Tenant não identificado.");
        var settings = await _settingRepository.GetCurrentAsync(cancellationToken);
        if (settings == null) return;

        var old = settings.HeroImageUrl;
        settings.Update(settings.CompanyName, settings.LogoUrl, settings.PrimaryColor, settings.WhatsAppNumber, settings.TimeZone, settings.Currency, null, null);
        _settingRepository.Update(settings);
        await _unitOfWork.CommitAsync(cancellationToken);

        if (IsTenantBrandingFile(old)) await _storageService.DeleteFileAsync(old!, cancellationToken);
    }

    private void ValidateImage(Microsoft.AspNetCore.Http.IFormFile file, long maxBytes, string sizeMessage)
    {
        if (file == null || file.Length <= 0) throw new ArgumentException("Selecione uma imagem.");
        if (file.Length > maxBytes) throw new ArgumentException(sizeMessage);

        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!new[] { ".jpg", ".jpeg", ".png", ".webp" }.Contains(ext))
            throw new ArgumentException("Formato inválido. Use JPG, PNG ou WEBP.");

        if (!new[] { "image/jpeg", "image/png", "image/webp" }.Contains(file.ContentType, StringComparer.OrdinalIgnoreCase))
            throw new ArgumentException("Arquivo de imagem inválido.");
    }

    private bool IsTenantBrandingFile(string? path) =>
        !string.IsNullOrWhiteSpace(path) &&
        path.StartsWith($"/uploads/tenants/{_tenantContext.TenantId}/branding/", StringComparison.OrdinalIgnoreCase);

    private static TenantSettingDto ToDto(TenantSetting settings) => new(
        settings.CompanyName,
        settings.LogoUrl,
        settings.PrimaryColor,
        settings.WhatsAppNumber,
        settings.TimeZone,
        settings.Currency,
        settings.HeroImageUrl,
        settings.HeroTemplateKey
    );
}
