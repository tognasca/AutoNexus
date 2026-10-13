using AutoNexus.Application.Interfaces;
using AutoNexus.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AutoNexus.Api.Controllers;

/// <summary>Termos de Uso, Política de Privacidade e de Cookies (versionados) + registro de aceite.</summary>
[ApiController]
[Route("api/legal")]
public class LegalController : ControllerBase
{
    private readonly ILegalService _legal;

    public LegalController(ILegalService legal) => _legal = legal;

    [HttpGet("{type}")]
    [AllowAnonymous]
    public async Task<IActionResult> Get(string type, CancellationToken ct)
    {
        var parsed = type.ToLowerInvariant() switch
        {
            "terms" or "termos" => (LegalDocumentType?)LegalDocumentType.TermsOfUse,
            "privacy" or "privacidade" => LegalDocumentType.PrivacyPolicy,
            "cookies" => LegalDocumentType.CookiePolicy,
            _ => null
        };
        if (parsed == null) return NotFound(new { message = "Documento não encontrado." });

        var doc = await _legal.GetActiveAsync(parsed.Value, ct);
        return doc == null ? NotFound(new { message = "Documento não publicado." }) : Ok(doc);
    }

    [HttpPost("{type}/accept")]
    [Authorize]
    public async Task<IActionResult> Accept(string type, CancellationToken ct)
    {
        var parsed = type.ToLowerInvariant() switch
        {
            "terms" or "termos" => (LegalDocumentType?)LegalDocumentType.TermsOfUse,
            "privacy" or "privacidade" => LegalDocumentType.PrivacyPolicy,
            "cookies" => LegalDocumentType.CookiePolicy,
            _ => null
        };
        if (parsed == null) return NotFound(new { message = "Documento não encontrado." });

        try
        {
            await _legal.AcceptAsync(parsed.Value, HttpContext.Connection.RemoteIpAddress?.ToString(), ct);
            return NoContent();
        }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
    }
}
