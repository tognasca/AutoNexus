using AutoNexus.Application.DTOs;
using AutoNexus.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace AutoNexus.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class LookupController : ControllerBase
{
    private readonly ILookupService _lookupService;

    public LookupController(ILookupService lookupService)
    {
        _lookupService = lookupService;
    }

    [HttpGet("vehicle-types")]
    [ProducesResponseType(typeof(IEnumerable<LookupItemDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetVehicleTypes(CancellationToken cancellationToken)
    {
        var result = await _lookupService.GetVehicleTypesAsync(cancellationToken);
        return Ok(result);
    }

    [HttpGet("cost-categories")]
    [ProducesResponseType(typeof(IEnumerable<LookupItemDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetCostCategories(CancellationToken cancellationToken)
    {
        var result = await _lookupService.GetCostCategoriesAsync(cancellationToken);
        return Ok(result);
    }

    [HttpGet("document-categories")]
    [ProducesResponseType(typeof(IEnumerable<LookupItemDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetDocumentCategories(CancellationToken cancellationToken)
    {
        var result = await _lookupService.GetDocumentCategoriesAsync(cancellationToken);
        return Ok(result);
    }
}