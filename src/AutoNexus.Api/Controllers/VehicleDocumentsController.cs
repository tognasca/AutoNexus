using System.Security.Claims;
using AutoNexus.Application.DTOs;
using AutoNexus.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AutoNexus.Api.Controllers;

[ApiController]
[Route("api/vehicles/{vehicleId:guid}/documents")]
[Authorize]
public class VehicleDocumentsController : ControllerBase
{
    private readonly IDocumentService _documentService;
    private readonly IPortalService _portalService;

    public VehicleDocumentsController(IDocumentService documentService, IPortalService portalService)
    {
        _documentService = documentService;
        _portalService = portalService;
    }

    [HttpGet]
    public async Task<IActionResult> GetDocuments(Guid vehicleId, CancellationToken cancellationToken)
    {
        var docs = await _documentService.GetVehicleDocumentsAsync(vehicleId, cancellationToken);
        return Ok(docs);
    }

    [HttpPost]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> UploadDocument(
        Guid vehicleId,
        [FromForm] Guid categoryId,
        [FromForm] string name,
        [FromForm] IFormFile file,
        [FromForm] string? notes,
        CancellationToken cancellationToken)
    {
        try
        {
            if (file == null || file.Length == 0) return BadRequest(new { message = "Arquivo não informado." });

            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;
            if (!Guid.TryParse(userIdClaim, out var userId)) return Unauthorized();

            using var stream = file.OpenReadStream();
            var doc = await _documentService.UploadDocumentAsync(
                vehicleId, userId, categoryId, name, stream, file.FileName, file.ContentType, file.Length, notes, cancellationToken);

            return StatusCode(StatusCodes.Status201Created, doc);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpDelete("{documentId:guid}")]
    public async Task<IActionResult> DeleteDocument(Guid vehicleId, Guid documentId, CancellationToken cancellationToken)
    {
        try
        {
            await _documentService.DeleteDocumentAsync(vehicleId, documentId, cancellationToken);
            return NoContent();
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("download-zip")]
    public async Task<IActionResult> DownloadZip(Guid vehicleId, CancellationToken cancellationToken)
    {
        try
        {
            var (zipBytes, fileName) = await _documentService.GenerateDocumentsZipAsync(vehicleId, cancellationToken);
            return File(zipBytes, "application/zip", fileName);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("share-link")]
    public async Task<IActionResult> CreateShareLink(Guid vehicleId, [FromBody] CreateBuyerLinkDto dto, CancellationToken cancellationToken)
    {
        try
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;
            if (!Guid.TryParse(userIdClaim, out var userId)) return Unauthorized();

            var result = await _portalService.CreateBuyerLinkAsync(vehicleId, userId, dto, cancellationToken);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
