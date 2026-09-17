using System.Text;
using AutoNexus.Application.DTOs;
using AutoNexus.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AutoNexus.API.Controllers;

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
    public async Task<IActionResult> GetPublicCatalog()
    {
        var result = await _vehicleService.GetAllVehiclesAsync();
        if (result == null) return BadRequest(result);

        // Filter only available vehicles for public showcase
        var publicVehicles = result.Where(v => v.Status == Domain.Enums.VehicleStatus.AVenda).ToList();
        return Ok(publicVehicles);
    }

    [HttpGet("catalog/{id:guid}")]
    public async Task<IActionResult> GetPublicVehicleDetails(Guid id)
    {
        var result = await _vehicleService.GetByIdAsync(id);
        if (result == null) return NotFound(result);
        return Ok(result);
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
            dto.Brand, dto.Model, dto.Year, dto.Price, dto.FipePrice, dto.Mileage, dto.Color, dto.FuelType, dto.Transmission, dto.Optionals);
        
        return Ok(new { description = copy });
    }
}
