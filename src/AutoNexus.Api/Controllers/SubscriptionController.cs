using AutoNexus.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AutoNexus.Api.Controllers;

/// <summary>
/// Visão da própria assinatura/plano — qualquer usuário autenticado da
/// empresa pode ver. Trocar de plano continua sendo feito pelo SuperAdmin
/// (ver SuperAdminController) até existir cobrança automática.
/// </summary>
[ApiController]
[Route("api/subscription")]
[Authorize]
public class SubscriptionController : ControllerBase
{
    private readonly ISubscriptionService _subscriptionService;

    public SubscriptionController(ISubscriptionService subscriptionService)
    {
        _subscriptionService = subscriptionService;
    }

    [HttpGet]
    public async Task<IActionResult> GetCurrent(CancellationToken cancellationToken)
    {
        var subscription = await _subscriptionService.GetCurrentAsync(cancellationToken);
        if (subscription == null)
            return NotFound(new { message = "Sua empresa ainda não tem uma assinatura." });

        return Ok(subscription);
    }

    [HttpGet("plans")]
    public async Task<IActionResult> GetAvailablePlans(CancellationToken cancellationToken)
    {
        var plans = await _subscriptionService.GetAvailablePlansAsync(cancellationToken);
        return Ok(plans);
    }
}
