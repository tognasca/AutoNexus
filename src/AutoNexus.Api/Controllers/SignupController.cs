using AutoNexus.Application.DTOs;
using AutoNexus.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace AutoNexus.Api.Controllers;

/// <summary>Cadastro público (self-service): empresa + admin + aceite dos termos + trial.</summary>
[ApiController]
[Route("api/signup")]
[AllowAnonymous]
public class SignupController : ControllerBase
{
    private readonly ISignupService _signup;
    private readonly IBillingService _billing;

    public SignupController(ISignupService signup, IBillingService billing)
    {
        _signup = signup;
        _billing = billing;
    }

    [HttpPost]
    [EnableRateLimiting("signup")]
    public async Task<IActionResult> Signup([FromBody] SignupDto dto, CancellationToken ct)
    {
        try
        {
            var ip = HttpContext.Connection.RemoteIpAddress?.ToString();
            return Ok(await _signup.SignupAsync(dto, ip, ct));
        }
        catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
    }

    // Catálogo público de planos para a página de preços — preços vêm do banco, não do código.
    [HttpGet("plans")]
    public async Task<IActionResult> Plans([FromServices] ISubscriptionService catalog, CancellationToken ct) => Ok(await catalog.GetAvailablePlansAsync(ct));
}
