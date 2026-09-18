using System.Text;
using AutoNexus.Application.DTOs;
using AutoNexus.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AutoNexus.Api.Controllers;

[ApiController]
[Route("api/public")]
[AllowAnonymous]
public class PublicCatalogController : ControllerBase
{
    private readonly IVehicleService _vehicleService;
    private readonly IFeedExportService _feedExportService;
    private readonly IAiDescriptionService _aiDescriptionService;

    public PublicCatalogController(
        IVehicleService vehicleService, 
        IFeedExportService feedExportService,
        IAiDescriptionService aiDescriptionService)
    {
        _vehicleService = vehicleService;
        _feedExportService = feedExportService;
        _aiDescriptionService = aiDescriptionService;
    }

    [HttpGet("catalog")]
    public async Task<IActionResult> GetPublicCatalog(CancellationToken cancellationToken)
    {
        var vehicles = await _vehicleService.GetByListAsync(cancellationToken);
        if (vehicles == null) return Ok(new List<object>());

        return Ok(vehicles);
    }

    [HttpGet("catalog/{id:guid}")]
    public async Task<IActionResult> GetPublicVehicleDetails(Guid id, CancellationToken cancellationToken)
    {
        var vehicle = await _vehicleService.GetByIdAsync(id, cancellationToken);
        if (vehicle == null)
        {
            return NotFound(new { message = "Veículo não encontrado no estoque." });
        }

        // Filtra fotos e documentos marcados com ShowInCatalog = true
        var publicPhotos = vehicle.Photos?
            .Select(p => new {
                id = p.Id,
                url = p.StoragePath,
                storagePath = p.StoragePath,
                isMain = p.IsMain
            }).ToList();

        var publicDocuments = vehicle.Documents?
            .Where(d => d.ShowInCatalog)
            .Select(d => new {
                id = d.Id,
                name = d.Name,
                documentType = d.CategoryName,
                fileUrl = d.StoragePath,
                filePath = d.StoragePath,
                createdAt = d.CreatedAt
            }).ToList();

        var detail = new {
            id = vehicle.Id,
            brand = vehicle.Brand,
            model = vehicle.Model,
            version = vehicle.Version,
            manufacturingYear = vehicle.ManufacturingYear,
            modelYear = vehicle.ModelYear,
            plate = vehicle.Plate,
            mileage = vehicle.Mileage,
            color = vehicle.Color,
            fuel = (int?)vehicle.Fuel,
            transmission = (int?)vehicle.Transmission,
            status = (int)vehicle.Status,
            listedValue = vehicle.ListedValue ?? vehicle.PurchaseValue,
            purchaseValue = vehicle.PurchaseValue,
            notes = vehicle.Notes,
            mainPhotoUrl = vehicle.Photos?.FirstOrDefault(p => p.IsMain)?.StoragePath ?? vehicle.Photos?.FirstOrDefault()?.StoragePath,
            photos = publicPhotos,
            documents = publicDocuments
        };

        return Ok(detail);
    }

    [HttpGet("feed/xml")]
    [Produces("application/xml")]
    public async Task<IActionResult> GetXmlFeed()
    {
        var xmlContent = await _feedExportService.GenerateXmlFeedAsync();
        return Content(xmlContent, "application/xml", Encoding.UTF8);
    }

    [HttpPost("generate-ai-description")]
    public IActionResult GenerateAiDescription([FromBody] GenerateAiDescriptionDto dto)
    {
        var copy = _aiDescriptionService.GenerateVehicleAdDescription(
            dto.Brand, 
            dto.Model, 
            dto.Year, 
            dto.Price, 
            dto.FipePrice, 
            dto.Mileage, 
            dto.Color, 
            dto.FuelType, 
            dto.Transmission, 
            dto.Optionals);

        return Ok(new { description = copy });
    }
}