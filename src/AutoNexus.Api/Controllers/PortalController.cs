using AutoNexus.Application.DTOs;
using AutoNexus.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AutoNexus.Api.Controllers;

[ApiController]
[Route("api/portal/{token}")]
[AllowAnonymous]
public class PortalController : ControllerBase
{
    private readonly IPortalService _portalService;

    public PortalController(IPortalService portalService)
    {
        _portalService = portalService;
    }

    [HttpGet]
    public async Task<IActionResult> GetPortalDetails(string token, CancellationToken cancellationToken)
    {
        try
        {
            var details = await _portalService.GetPortalDetailsAsync(token, cancellationToken);
            return Ok(details);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("documents/{documentId:guid}/download")]
    public async Task<IActionResult> DownloadDocument(string token, Guid documentId, CancellationToken cancellationToken)
    {
        try
        {
            var (fileBytes, mimeType, fileName) = await _portalService.DownloadPortalDocumentAsync(token, documentId, cancellationToken);
            return File(fileBytes, mimeType, fileName);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("documents/download-all")]
    public async Task<IActionResult> DownloadZip(string token, CancellationToken cancellationToken)
    {
        try
        {
            var (zipBytes, fileName) = await _portalService.DownloadPortalZipAsync(token, cancellationToken);
            return File(zipBytes, "application/zip", fileName);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("accept")]
    public async Task<IActionResult> SubmitAcceptance(string token, [FromBody] SubmitAcceptanceDto dto, CancellationToken cancellationToken)
    {
        try
        {
            var remoteIp = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "0.0.0.0";
            var result = await _portalService.SubmitAcceptanceAsync(token, dto, remoteIp, cancellationToken);
            return Ok(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
