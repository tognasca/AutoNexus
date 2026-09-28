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
        var settings = await _tenantSettingService.GetCurrentAsync(cancellationToken);
        return Ok(settings);
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
