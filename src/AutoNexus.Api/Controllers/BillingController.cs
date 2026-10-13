using AutoNexus.Application.DTOs;
using AutoNexus.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AutoNexus.Api.Controllers;

/// <summary>Faturamento da PRÓPRIA empresa (assinatura, checkout, troca de plano, cancelamento). Só Admin altera; qualquer usuário autenticado consulta.</summary>
[ApiController]
[Route("api/billing")]
[Authorize]
public class BillingController : ControllerBase
{
    private readonly IBillingService _billing;

    public BillingController(IBillingService billing) => _billing = billing;

    [HttpGet("overview")]
    public async Task<IActionResult> Overview(CancellationToken ct) => Ok(await _billing.GetOverviewAsync(ct));

    // Checkout serve para assinar, renovar, upgrade e downgrade (troca de plano = novo checkout do novo plano).
    [HttpPost("checkout")]
    [Authorize(Roles = "Admin,1")]
    public async Task<IActionResult> Checkout([FromBody] CreateCheckoutDto dto, CancellationToken ct)
    {
        try { return Ok(await _billing.CreateCheckoutAsync(dto, ct)); }
        catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
    }

    [HttpPost("cancel")]
    [Authorize(Roles = "Admin,1")]
    public async Task<IActionResult> Cancel([FromBody] CancelSubscriptionDto dto, CancellationToken ct)
    {
        try { await _billing.CancelAsync(dto.Reason, ct); return NoContent(); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
    }
}
