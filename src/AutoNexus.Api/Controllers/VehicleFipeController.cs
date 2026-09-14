using AutoNexus.Application.DTOs;
using AutoNexus.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AutoNexus.Api.Controllers;

[ApiController]
[Route("api/vehicles/{vehicleId:guid}/fipe")]
[Authorize]
public class VehicleFipeController : ControllerBase
{
    private readonly IFipeService _fipeService;

    public VehicleFipeController(IFipeService fipeService)
    {
        _fipeService = fipeService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(FipeSummaryDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetFipeSummary(Guid vehicleId, CancellationToken cancellationToken)
    {
        try
        {
            var summary = await _fipeService.GetFipeSummaryAsync(vehicleId, cancellationToken);
            return Ok(summary);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpGet("brands")]
    public async Task<IActionResult> GetBrands(Guid vehicleId, CancellationToken cancellationToken)
    {
        try
        {
            var brands = await _fipeService.GetBrandsAsync(vehicleId, cancellationToken);
            return Ok(brands);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("brands/{brandCode}/models")]
    public async Task<IActionResult> GetModels(Guid vehicleId, string brandCode, CancellationToken cancellationToken)
    {
        try
        {
            var models = await _fipeService.GetModelsAsync(vehicleId, brandCode, cancellationToken);
            return Ok(models);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("brands/{brandCode}/models/{modelCode}/years")]
    public async Task<IActionResult> GetYears(Guid vehicleId, string brandCode, string modelCode, CancellationToken cancellationToken)
    {
        try
        {
            var years = await _fipeService.GetYearsAsync(vehicleId, brandCode, modelCode, cancellationToken);
            return Ok(years);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("fetch-guided")]
    public async Task<IActionResult> FetchGuided(Guid vehicleId, [FromBody] FetchGuidedFipeRequestDto dto, CancellationToken cancellationToken)
    {
        try
        {
            var result = await _fipeService.FetchGuidedFipeAsync(vehicleId, dto, cancellationToken);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message, detail = ex.InnerException?.Message });
        }
    }

    [HttpPost("fetch")]
    public async Task<IActionResult> FetchFipe(Guid vehicleId, [FromBody] FetchFipeRequestDto dto, CancellationToken cancellationToken)
    {
        try
        {
            var result = await _fipeService.FetchAndUpdateFipeAsync(vehicleId, dto, cancellationToken);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message, detail = ex.InnerException?.Message });
        }
    }

    [HttpPost("manual")]
    public async Task<IActionResult> AddManualFipe(Guid vehicleId, [FromBody] ManualFipeRequestDto dto, CancellationToken cancellationToken)
    {
        try
        {
            var result = await _fipeService.AddManualFipeAsync(vehicleId, dto, cancellationToken);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message, detail = ex.InnerException?.Message });
        }
    }
}
