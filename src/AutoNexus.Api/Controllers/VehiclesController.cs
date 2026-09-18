using AutoNexus.Application.DTOs;
using AutoNexus.Application.Interfaces;
using AutoNexus.Domain.Entities;
using AutoNexus.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AutoNexus.Api.Controllers;

public record AddCostRequest(Guid CostCategoryId, string Description, decimal Value, DateTime CostDate);

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class VehiclesController : ControllerBase
{
    private readonly IVehicleService _vehicleService;
    private readonly IWebHostEnvironment _environment;

    public VehiclesController(IVehicleService vehicleService, IWebHostEnvironment environment)
    {
        _vehicleService = vehicleService;
        _environment = environment;
    }

    [HttpGet]
    public async Task<IActionResult> GetPaged(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] Guid? vehicleTypeId = null,
        [FromQuery] VehicleStatus? status = null,
        [FromQuery] string? search = null,
        [FromQuery] decimal? minPrice = null,
        [FromQuery] decimal? maxPrice = null,
        [FromQuery] int? minYear = null,
        [FromQuery] int? maxYear = null,
        CancellationToken cancellationToken = default)
    {
        var filter = new VehicleFilterDto(page, pageSize, vehicleTypeId, status, search, minPrice, maxPrice, minYear, maxYear);
        var result = await _vehicleService.GetAllPagedAsync(filter, cancellationToken);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var vehicle = await _vehicleService.GetByIdAsync(id, cancellationToken);
        if (vehicle == null) return NotFound(new { message = "Veículo não encontrado." });
        return Ok(vehicle);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateVehicleDto dto, CancellationToken cancellationToken)
    {
        var vehicleId = await _vehicleService.CreateAsync(dto, cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = vehicleId }, new { id = vehicleId });
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateVehicleDto dto, CancellationToken cancellationToken)
    {
        await _vehicleService.UpdateAsync(id, dto, cancellationToken);
        return Ok(new { message = "Veículo atualizado com sucesso." });
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        await _vehicleService.DeleteAsync(id, cancellationToken);
        return NoContent();
    }

    [HttpPost("{id:guid}/sell")]
    public async Task<IActionResult> SellVehicle(Guid id, [FromBody] SellVehicleDto dto, CancellationToken cancellationToken)
    {
        if (dto == null || dto.SaleValue <= 0)
        {
            return BadRequest(new { message = "O valor final de venda deve ser maior que R$ 0,00." });
        }

        Guid? soldByUserId = dto.SoldByUserId;

        if (!soldByUserId.HasValue || soldByUserId.Value == Guid.Empty)
        {
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (Guid.TryParse(userIdClaim, out var uid))
            {
                soldByUserId = uid;
            }
        }

        var updatedDto = new SellVehicleDto(dto.SaleValue, soldByUserId, dto.SoldAt);

        await _vehicleService.SellVehicleAsync(id, updatedDto, cancellationToken);
        return Ok(new { message = "Venda registrada com sucesso." });
    }

    [HttpGet("photos/{fileName}")]
    [AllowAnonymous]
    public IActionResult GetPhotoFile(string fileName)
    {
        var uploadsPath = Path.Combine(_environment.ContentRootPath, "uploads", "vehicles", fileName);
        if (!System.IO.File.Exists(uploadsPath))
        {
            uploadsPath = Path.Combine(_environment.ContentRootPath, "uploads", fileName);
        }

        if (!System.IO.File.Exists(uploadsPath))
        {
            return NotFound(new { message = "Arquivo de imagem não encontrado." });
        }

        var provider = new Microsoft.AspNetCore.StaticFiles.FileExtensionContentTypeProvider();
        if (!provider.TryGetContentType(fileName, out var contentType))
        {
            contentType = "image/jpeg";
        }

        var bytes = System.IO.File.ReadAllBytes(uploadsPath);
        return File(bytes, contentType);
    }

    [HttpGet("{id:guid}/photos")]
    public async Task<IActionResult> GetPhotos(Guid id, CancellationToken cancellationToken)
    {
        var vehicle = await _vehicleService.GetByIdAsync(id, cancellationToken);
        if (vehicle == null) return NotFound();
        return Ok(vehicle.Photos);
    }

    [HttpPost("{id:guid}/photos")]
    public async Task<IActionResult> UploadPhotos(Guid id, [FromForm] IFormFileCollection files)
    {
        if (files == null || files.Count == 0) return BadRequest("Nenhum arquivo enviado.");

        var uploadDir = Path.Combine(_environment.ContentRootPath, "uploads", "vehicles");
        if (!Directory.Exists(uploadDir)) Directory.CreateDirectory(uploadDir);

        var photoDtos = new List<VehiclePhotoDto>();

        foreach (var file in files)
        {
            var extension = Path.GetExtension(file.FileName);
            if (string.IsNullOrWhiteSpace(extension))
            {
                extension = file.ContentType switch
                {
                    "image/png" => ".png",
                    "image/webp" => ".webp",
                    _ => ".jpg"
                };
            }

            var fileName = $"{Guid.NewGuid()}{extension}";
            var filePath = Path.Combine(uploadDir, fileName);
            var relativePath = Path.Combine("uploads", "vehicles", fileName).Replace("\\", "/");

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            var photo = new VehiclePhoto(id, fileName, file.FileName ?? fileName, relativePath,file.Length,0,false);
                       await _vehicleService.AddPhotoAsync(photo);

            photoDtos.Add(new VehiclePhotoDto(photo.Id, photo.FileName, photo.StoragePath, photo.IsMain, photo.Order));
        }

        return Ok(photoDtos);
    }

    [HttpPut("{id:guid}/photos/{photoId:guid}/main")]
    public async Task<IActionResult> SetMainPhoto(Guid id, Guid photoId, CancellationToken cancellationToken)
    {
        await _vehicleService.SetMainPhotoAsync(id, photoId, cancellationToken);
        return Ok(new { message = "Foto principal definida com sucesso." });
    }

    [HttpDelete("{id:guid}/photos/{photoId:guid}")]
    public async Task<IActionResult> DeletePhoto(Guid id, Guid photoId, CancellationToken cancellationToken)
    {
        await _vehicleService.DeletePhotoAsync(id, photoId, cancellationToken);
        return NoContent();
    }

    [HttpGet("documents/{fileName}")]
    [AllowAnonymous]
    public IActionResult GetDocumentFile(string fileName)
    {
        var uploadsPath = Path.Combine(_environment.ContentRootPath, "uploads", "documents", fileName);
        if (!System.IO.File.Exists(uploadsPath))
        {
            uploadsPath = Path.Combine(_environment.ContentRootPath, "uploads", fileName);
        }

        if (!System.IO.File.Exists(uploadsPath))
        {
            return NotFound(new { message = "Arquivo de documento não encontrado." });
        }

        var provider = new Microsoft.AspNetCore.StaticFiles.FileExtensionContentTypeProvider();
        if (!provider.TryGetContentType(fileName, out var contentType))
        {
            contentType = "application/octet-stream";
        }

        var bytes = System.IO.File.ReadAllBytes(uploadsPath);
        return File(bytes, contentType);
    }

    [HttpPost("{id:guid}/costs")]
    public async Task<IActionResult> AddCost(Guid id, [FromBody] AddCostRequest request, CancellationToken cancellationToken)
    {
        if (request == null || request.Value <= 0 || string.IsNullOrWhiteSpace(request.Description))
        {
            return BadRequest(new { message = "Descrição e valor válido são obrigatórios." });
        }

        await _vehicleService.AddCostAsync(id, request.CostCategoryId, request.Description, request.Value, request.CostDate, cancellationToken);
        return Ok(new { message = "Custo adicionado com sucesso." });
    }

    [HttpDelete("{id:guid}/costs/{costId:guid}")]
    public async Task<IActionResult> DeleteCost(Guid id, Guid costId, CancellationToken cancellationToken)
    {
        await _vehicleService.DeleteCostAsync(id, costId, cancellationToken);
        return NoContent();
    }
}