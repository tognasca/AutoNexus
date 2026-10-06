using AutoNexus.Application.DTOs;
using AutoNexus.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AutoNexus.Api.Controllers;

/// <summary>
/// Área exclusiva do dono do SaaS. Só usuários com Profile = SuperAdmin
/// acessam — nenhuma outra rota do sistema concede este role. SuperAdmin não
/// pertence a nenhum tenant, então fora deste controller ele não enxerga
/// nenhum dado (o filtro global de tenant continua valendo normalmente em
/// todo o resto da API — ver AutoNexusDbContext).
/// </summary>
[ApiController]
[Route("api/superadmin")]
[Authorize(Roles = "SuperAdmin")]
public class SuperAdminController : ControllerBase
{
    private readonly ISuperAdminService _superAdminService;

    public SuperAdminController(ISuperAdminService superAdminService)
    {
        _superAdminService = superAdminService;
    }

    [HttpGet("tenants")]
    public async Task<IActionResult> GetTenants(CancellationToken cancellationToken)
    {
        var tenants = await _superAdminService.GetAllTenantsAsync(cancellationToken);
        return Ok(tenants);
    }

    [HttpPost("tenants")]
    public async Task<IActionResult> CreateTenant([FromBody] CreateTenantWithAdminDto dto, CancellationToken cancellationToken)
    {
        try
        {
            var tenant = await _superAdminService.CreateTenantAsync(dto, cancellationToken);
            return CreatedAtAction(nameof(GetTenants), new { }, tenant);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("tenants/{tenantId:guid}/activate")]
    public async Task<IActionResult> ActivateTenant(Guid tenantId, CancellationToken cancellationToken)
    {
        try
        {
            await _superAdminService.ActivateTenantAsync(tenantId, cancellationToken);
            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpPost("tenants/{tenantId:guid}/deactivate")]
    public async Task<IActionResult> DeactivateTenant(Guid tenantId, CancellationToken cancellationToken)
    {
        try
        {
            await _superAdminService.DeactivateTenantAsync(tenantId, cancellationToken);
            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpGet("users")]
    public async Task<IActionResult> GetUsers([FromQuery] Guid? tenantId, CancellationToken cancellationToken)
    {
        var users = await _superAdminService.GetUsersAsync(tenantId, cancellationToken);
        return Ok(users);
    }

    [HttpGet("audit-logs")]
    public async Task<IActionResult> GetAuditLogs([FromQuery] Guid? tenantId, CancellationToken cancellationToken)
    {
        var logs = await _superAdminService.GetAuditLogsAsync(tenantId, cancellationToken);
        return Ok(logs);
    }

    [HttpGet("plans")]
    public async Task<IActionResult> GetPlans(CancellationToken cancellationToken)
    {
        var plans = await _superAdminService.GetPlansAsync(cancellationToken);
        return Ok(plans);
    }

    [HttpPost("plans")]
    public async Task<IActionResult> CreatePlan([FromBody] CreatePlanDto dto, CancellationToken cancellationToken)
    {
        var plan = await _superAdminService.CreatePlanAsync(dto, cancellationToken);
        return CreatedAtAction(nameof(GetPlans), new { }, plan);
    }

    [HttpGet("tenants/{tenantId:guid}/subscription")]
    public async Task<IActionResult> GetSubscription(Guid tenantId, CancellationToken cancellationToken)
    {
        var subscription = await _superAdminService.GetSubscriptionAsync(tenantId, cancellationToken);
        if (subscription == null)
            return NotFound(new { message = "Esta empresa ainda não tem assinatura." });

        return Ok(subscription);
    }

    [HttpPost("tenants/{tenantId:guid}/subscription")]
    public async Task<IActionResult> AssignPlan(Guid tenantId, [FromBody] AssignPlanDto dto, CancellationToken cancellationToken)
    {
        try
        {
            var subscription = await _superAdminService.AssignPlanAsync(tenantId, dto, cancellationToken);
            return Ok(subscription);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }
}
