using System;
using System.Globalization;
using System.Threading;
using System.Threading.Tasks;
using AutoNexus.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.StaticFiles;

namespace AutoNexus.Api.Controllers;

[ApiController]
[Route("api/company-documents")]
[Authorize(Roles = "Admin,1")]
public class CompanyDocumentsController : ControllerBase
{
    private readonly ICompanyDocumentService _service;
    private readonly IStorageService _storageService;
    private static readonly FileExtensionContentTypeProvider ContentTypeProvider = new();

    public CompanyDocumentsController(ICompanyDocumentService service, IStorageService storageService)
    {
        _service = service;
        _storageService = storageService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        var docs = await _service.GetAllAsync(cancellationToken);
        return Ok(docs);
    }

    [HttpPost("upload")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> Upload(
        [FromForm] IFormFile? file,
        [FromForm] string title,
        [FromForm] string? category,
        [FromForm] string? amount,
        [FromForm] string? referenceDate,
        [FromForm] string? notes,
        CancellationToken cancellationToken)
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest(new { message = "Selecione um arquivo válido para upload." });
        }

        if (string.IsNullOrWhiteSpace(title))
        {
            return BadRequest(new { message = "O título do documento é obrigatório." });
        }

        // Parsing seguro do valor financeiro (R$)
        decimal? parsedAmount = null;
        if (!string.IsNullOrWhiteSpace(amount) && decimal.TryParse(amount.Replace(",", "."), NumberStyles.Any, CultureInfo.InvariantCulture, out var acc))
        {
            parsedAmount = acc;
        }

        // Parsing seguro de data de referência
        DateTime? parsedRefDate = null;
        if (!string.IsNullOrWhiteSpace(referenceDate) && DateTime.TryParse(referenceDate, out var dt))
        {
            parsedRefDate = DateTime.SpecifyKind(dt, DateTimeKind.Utc);
        }

        try
        {
            var result = await _service.UploadAsync(
                title.Trim(),
                string.IsNullOrWhiteSpace(category) ? "Despesas Fixas" : category.Trim(),
                parsedAmount,
                parsedRefDate,
                notes,
                file,
                cancellationToken
            );

            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        try
        {
            await _service.DeleteAsync(id, cancellationToken);
            return NoContent();
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    // Download autenticado — antes disso o único acesso era a URL estática
    // em /uploads, sem nenhuma verificação de autorização. Documentos da
    // empresa (CNPJ, licenças, contratos) são sensíveis, então essa rota
    // passa pelo [Authorize(Roles = "Admin,1")] do controller.
    [HttpGet("{id:guid}/file")]
    public async Task<IActionResult> Download(Guid id, CancellationToken cancellationToken)
    {
        var file = await _service.GetFileAsync(id, cancellationToken);
        if (file == null)
            return NotFound(new { message = "Documento não encontrado." });

        try
        {
            var bytes = await _storageService.GetFileBytesAsync(file.StoragePath, cancellationToken);
            if (!ContentTypeProvider.TryGetContentType(file.StoragePath, out var contentType))
            {
                contentType = "application/octet-stream";
            }
            return File(bytes, contentType, file.FileName);
        }
        catch (FileNotFoundException)
        {
            return NotFound(new { message = "Arquivo não encontrado no servidor." });
        }
    }
}