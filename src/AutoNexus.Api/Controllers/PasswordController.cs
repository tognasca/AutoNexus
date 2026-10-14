using AutoNexus.Application.DTOs;
using AutoNexus.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace AutoNexus.Api.Controllers;

[ApiController]
[Route("api/password")]
public class PasswordController : ControllerBase
{
    private readonly IPasswordService _passwords;

    public PasswordController(IPasswordService passwords) => _passwords = passwords;

    // Resposta idêntica exista o e-mail ou não (não revela quais e-mails têm conta).
    [HttpPost("forgot")]
    [AllowAnonymous]
    [EnableRateLimiting("login")]
    public async Task<IActionResult> Forgot([FromBody] ForgotPasswordDto dto, CancellationToken ct)
    {
        await _passwords.RequestResetAsync(dto.Email, ct);
        return Ok(new { message = "Se o e-mail estiver cadastrado, enviaremos as instruções para redefinir a senha." });
    }

    [HttpPost("reset")]
    [AllowAnonymous]
    [EnableRateLimiting("login")]
    public async Task<IActionResult> Reset([FromBody] ResetPasswordDto dto, CancellationToken ct)
    {
        try { await _passwords.ResetAsync(dto.Token, dto.NewPassword, ct); return NoContent(); }
        catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
    }

    [HttpPost("change")]
    [Authorize]
    public async Task<IActionResult> Change([FromBody] ChangePasswordDto dto, CancellationToken ct)
    {
        try { await _passwords.ChangeAsync(dto.CurrentPassword, dto.NewPassword, ct); return NoContent(); }
        catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
    }
}
