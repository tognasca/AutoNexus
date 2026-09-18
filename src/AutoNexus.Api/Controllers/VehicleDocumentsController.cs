using AutoNexus.Application.DTOs;
using AutoNexus.Application.Interfaces;
using AutoNexus.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AutoNexus.Api.Controllers;

[ApiController]
[Route("api/vehicles/{vehicleId:guid}/documents")]
[Authorize]
public class VehicleDocumentsController : ControllerBase
{
    private readonly IVehicleService _vehicleService;
    private readonly IWebHostEnvironment _environment;

    public VehicleDocumentsController(IVehicleService vehicleService, IWebHostEnvironment environment)
    {
        _vehicleService = vehicleService;
        _environment = environment;
    }

    [HttpGet]
    public async Task<IActionResult> GetDocuments([FromRoute] Guid vehicleId, CancellationToken cancellationToken)
    {
        var vehicle = await _vehicleService.GetByIdAsync(vehicleId, cancellationToken);
        if (vehicle == null) return NotFound(new { message = "Veículo não encontrado." });
        return Ok(vehicle.Documents ?? new List<VehicleDocumentDto>());
    }

    [HttpPost]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(30_000_000)]
    public async Task<IActionResult> UploadDocument(
        [FromRoute] Guid vehicleId,
        [FromForm] Guid categoryId,
        [FromForm] string? name,
        [FromForm] bool showInCatalog,
        [FromForm] IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { message = "Arquivo não enviado." });

        var vehicle = await _vehicleService.GetByIdAsync(vehicleId);
        if (vehicle == null)
            return NotFound(new { message = "Veículo não encontrado." });

        var uploadDir = Path.Combine(_environment.ContentRootPath, "uploads", "documents");
        if (!Directory.Exists(uploadDir)) Directory.CreateDirectory(uploadDir);

        var extension = Path.GetExtension(file.FileName);
        if (string.IsNullOrWhiteSpace(extension))
        {
            extension = file.ContentType switch
            {
                "image/png" => ".png",
                "image/webp" => ".webp",
                "application/pdf" => ".pdf",
                _ => ".jpg"
            };
        }

        var storedFileName = $"{Guid.NewGuid()}{extension}";
        var filePath = Path.Combine(uploadDir, storedFileName);
        var relativePath = Path.Combine("uploads", "documents", storedFileName).Replace("\\", "/");

        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst("sub")?.Value
            ?? User.FindFirst("id")?.Value;

        _ = Guid.TryParse(userIdClaim, out var createdByUserId);

        var docName = string.IsNullOrWhiteSpace(name)
            ? (string.IsNullOrWhiteSpace(file.FileName) ? "Documento/Foto" : file.FileName)
            : name.Trim();

        var doc = new VehicleDocument(
            vehicleId,
            categoryId,
            docName,
            file.FileName ?? storedFileName,
            relativePath,
            file.ContentType ?? "image/jpeg",
            file.Length,
            createdByUserId,
            showInCatalog
        );

        await _vehicleService.AddDocumentAsync(doc);

        return Ok(new VehicleDocumentDto(
            doc.Id,
            doc.DocumentCategoryId,
            "Documento",
            doc.Name,
            doc.FileName,
            doc.StoragePath,
            doc.ShowInCatalog,
            doc.CreatedAt
        ));
    }

    [HttpPatch("{documentId:guid}/toggle-catalog")]
    public async Task<IActionResult> ToggleDocumentCatalog([FromRoute] Guid vehicleId, [FromRoute] Guid documentId, CancellationToken cancellationToken)
    {
        await _vehicleService.ToggleDocumentCatalogAsync(vehicleId, documentId, cancellationToken);
        return Ok(new { message = "Visibilidade do documento atualizada com sucesso." });
    }

    [HttpDelete("{documentId:guid}")]
    public async Task<IActionResult> DeleteDocument([FromRoute] Guid vehicleId, [FromRoute] Guid documentId, CancellationToken cancellationToken)
    {
        await _vehicleService.DeleteDocumentAsync(vehicleId, documentId, cancellationToken);
        return NoContent();
    }
}