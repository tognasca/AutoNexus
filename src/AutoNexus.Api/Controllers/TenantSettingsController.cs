using AutoNexus.Application.DTOs;
using AutoNexus.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AutoNexus.Api.Controllers;

/// <summary>
/// Configurações da empresa do usuário autenticado (nome, logo, cor, fuso,
/// moeda). O filtro global de tenant garante que só a própria empresa é
/// vista/editada — diferente do SuperAdminController, que gerencia todas.
/// </summary>
[ApiController]
[Route("api/tenant-settings")]
[Authorize]
public class TenantSettingsController : ControllerBase
{
    private readonly ITenantSettingService _tenantSettingService;

    public TenantSettingsController(ITenantSettingService tenantSettingService)
    {
        _tenantSettingService = tenantSettingService;
    }

    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken cancellationToken)
    {
        try
        {
            var settings = await _tenantSettingService.GetCurrentAsync(cancellationToken);
            return Ok(settings);
        }
        catch (InvalidOperationException ex) when (
            ex.Message.Contains("Nenhum tenant identificado", StringComparison.OrdinalIgnoreCase))
        {
            return Unauthorized(new
            {
                message = "Sua sessão não está vinculada a uma empresa. Entre novamente no AutoNexus para renovar a sessão."
            });
        }
    }

    [HttpPost("logo")]
    [Authorize(Roles = "Admin")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(5 * 1024 * 1024)]
    public async Task<IActionResult> UploadLogo([FromForm] IFormFile file, CancellationToken ct)
    {
        try { return Ok(new { logoUrl = await _tenantSettingService.UploadLogoAsync(file, ct) }); }
        catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
    }

    [HttpDelete("logo")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> RemoveLogo(CancellationToken ct)
    {
        await _tenantSettingService.RemoveLogoAsync(ct);
        return NoContent();
    }

    [HttpPost("hero-image")]
    [Authorize(Roles = "Admin")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(8 * 1024 * 1024)]
    public async Task<IActionResult> UploadHeroImage([FromForm] IFormFile file, CancellationToken ct)
    {
        try { return Ok(new { heroImageUrl = await _tenantSettingService.UploadHeroImageAsync(file, ct) }); }
        catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
    }

    [HttpDelete("hero-image")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> RemoveHeroImage(CancellationToken ct)
    {
        await _tenantSettingService.RemoveHeroImageAsync(ct);
        return NoContent();
    }

    [HttpPut]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update([FromBody] TenantSettingDto dto, CancellationToken cancellationToken)
    {
        try
        {
            var settings = await _tenantSettingService.UpdateAsync(dto, cancellationToken);
            return Ok(settings);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
