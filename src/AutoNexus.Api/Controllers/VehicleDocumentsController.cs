using AutoNexus.Application.DTOs;
using AutoNexus.Application.Interfaces;
using AutoNexus.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AutoNexus.Api.Controllers;

[ApiController]
[Route("api/vehicles/{vehicleId:guid}/documents")]
[Authorize]
public class VehicleDocumentsController : ControllerBase
{
    private readonly IVehicleService _vehicleService;
    private readonly IStorageService _storageService;

    public VehicleDocumentsController(IVehicleService vehicleService, IStorageService storageService)
    {
        _vehicleService = vehicleService;
        _storageService = storageService;
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
        [FromForm] IFormFile file,
        CancellationToken cancellationToken)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { message = "Arquivo não enviado." });

        var vehicle = await _vehicleService.GetByIdAsync(vehicleId);
        if (vehicle == null)
            return NotFound(new { message = "Veículo não encontrado." });

        // IStorageService isola o arquivo em /uploads/tenants/{tenantId}/... —
        // antes isso gravava direto em uploads/documents (pasta compartilhada,
        // sem isolamento por empresa). Arquivos já enviados antes desta
        // correção continuam funcionando normalmente (o caminho deles já está
        // salvo em StoragePath no banco); só uploads novos usam a pasta correta.
        string relativePath;
        using (var stream = file.OpenReadStream())
        {
            relativePath = await _storageService.SaveFileAsync(
                stream, file.FileName, $"vehicles/{vehicleId}/documents", cancellationToken);
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
            string.IsNullOrWhiteSpace(file.FileName) ? Path.GetFileName(relativePath) : file.FileName,
            relativePath,
            file.ContentType ?? "image/jpeg",
            file.Length,
            createdByUserId,
            showInCatalog
        );

        try
        {
            await _vehicleService.AddDocumentAsync(doc);
        }
        catch (DbUpdateException ex) when (ex.InnerException?.Message.Contains("document_categories", StringComparison.OrdinalIgnoreCase) == true ||
                                          ex.InnerException?.Message.Contains("foreign key", StringComparison.OrdinalIgnoreCase) == true)
        {
            return BadRequest(new { message = "Categoria do documento inválida ou não cadastrada." });
        }

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
    [Authorize]
    [HttpGet("~/api/vehicle-photos/{photoId:guid}/content")]
    public async Task<IActionResult> GetPhotoContent(
        Guid photoId,
        CancellationToken cancellationToken)
    {
        // Buscar a foto usando uma consulta com filtro de tenant.
        // Validar que o usuário possui um tenant autenticado.
        // Ler os bytes usando IStorageService.
        // Retornar File(bytes, mimeType).

        throw new NotImplementedException(
            "Implementar conforme o repositório de fotos do projeto.");
    }
    // Download autenticado de verdade: antes disso, o único jeito de abrir um
    // documento era a URL estática em /uploads (servida sem nenhuma
    // autorização por app.UseStaticFiles() no Program.cs — qualquer um que
    // soubesse/adivinhasse a URL baixava, logado ou não). Esta rota passa
    // pelo [Authorize] do controller e confirma, via GetDocumentFileAsync,
    // que o documento realmente pertence a um veículo do tenant autenticado
    // antes de ler o arquivo do disco.
    [HttpGet("{documentId:guid}/file")]
    public async Task<IActionResult> DownloadDocument([FromRoute] Guid vehicleId, [FromRoute] Guid documentId, CancellationToken cancellationToken)
    {
        var file = await _vehicleService.GetDocumentFileAsync(vehicleId, documentId, cancellationToken);
        if (file == null)
            return NotFound(new { message = "Documento não encontrado." });

        try
        {
            var bytes = await _storageService.GetFileBytesAsync(file.StoragePath, cancellationToken);
            return File(bytes, string.IsNullOrWhiteSpace(file.ContentType) ? "application/octet-stream" : file.ContentType, file.FileName);
        }
        catch (FileNotFoundException)
        {
            return NotFound(new { message = "Arquivo não encontrado no servidor." });
        }
    }
}