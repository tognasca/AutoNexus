using AutoNexus.Application.DTOs;
using AutoNexus.Application.Interfaces;
using AutoNexus.Domain.Interfaces;
using AutoNexus.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AutoNexus.Api.Controllers;

[ApiController]
[Route("api/portal/{token}")]
[AllowAnonymous]
[ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
public class PortalController : ControllerBase
{
    private readonly IPortalService _portalService;
    private readonly IBuyerLinkRepository _links;
    private readonly AutoNexusDbContext _db;

    public PortalController(IPortalService portalService, IBuyerLinkRepository links, AutoNexusDbContext db)
    {
        _portalService = portalService;
        _links = links;
        _db = db;
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
        catch (KeyNotFoundException)
        {
            return NotFound(new { message = "Recurso indisponível no portal." });
        }
        catch (FileNotFoundException)
        {
            return NotFound(new { message = "Arquivo indisponível no portal." });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (ArgumentException ex)
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
        catch (KeyNotFoundException)
        {
            return NotFound(new { message = "Recurso indisponível no portal." });
        }
        catch (FileNotFoundException)
        {
            return NotFound(new { message = "Arquivo indisponível no portal." });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (ArgumentException ex)
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
        catch (KeyNotFoundException)
        {
            return NotFound(new { message = "Recurso indisponível no portal." });
        }
        catch (FileNotFoundException)
        {
            return NotFound(new { message = "Arquivo indisponível no portal." });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("accept")]
    public async Task<IActionResult> SubmitAcceptance(string token, [FromBody] SubmitAcceptanceDto dto, CancellationToken cancellationToken)
    {
        try
        {
            var link = await _links.GetByTokenAsync(token, cancellationToken);
            if (link is null || !link.IsValid()) return Unauthorized(new { message = "Link inválido, expirado ou revogado." });
            await using var transaction = await _db.Database.BeginTransactionAsync(cancellationToken);
            await _db.Database.ExecuteSqlInterpolatedAsync(
                $"SELECT 1 FROM vehicles WHERE id = {link.VehicleId} AND \"tenantId\" = {link.TenantId} FOR UPDATE", cancellationToken);
            await _db.Entry(link).ReloadAsync(cancellationToken);
            if (!link.IsValid()) return Unauthorized(new { message = "Link expirado ou revogado." });
            var remoteIp = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "0.0.0.0";
            var result = await _portalService.SubmitAcceptanceAsync(token, dto, remoteIp, cancellationToken);
            await transaction.CommitAsync(cancellationToken);
            return Ok(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new { message = "Recurso indisponível no portal." });
        }
        catch (FileNotFoundException)
        {
            return NotFound(new { message = "Arquivo indisponível no portal." });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
