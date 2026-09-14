using System.Security.Claims;
using AutoNexus.Application.DTOs;
using AutoNexus.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AutoNexus.Api.Controllers;

[ApiController]
[Route("api/vehicles/{vehicleId:guid}/costs")]
[Authorize]
public class VehicleCostsController : ControllerBase
{
    private readonly ICostService _costService;

    public VehicleCostsController(ICostService costService)
    {
        _costService = costService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(VehicleCostSummaryDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetCosts(Guid vehicleId, CancellationToken cancellationToken)
    {
        try
        {
            var summary = await _costService.GetVehicleCostsSummaryAsync(vehicleId, cancellationToken);
            return Ok(summary);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpPost]
    [ProducesResponseType(typeof(CostDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> AddCost(Guid vehicleId, [FromBody] CreateCostDto dto, CancellationToken cancellationToken)
    {
        try
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;
            if (!Guid.TryParse(userIdClaim, out var responsibleUserId))
                return Unauthorized();

            var result = await _costService.AddCostAsync(vehicleId, responsibleUserId, dto, cancellationToken);
            return StatusCode(StatusCodes.Status201Created, result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpDelete("{costId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteCost(Guid vehicleId, Guid costId, CancellationToken cancellationToken)
    {
        try
        {
            await _costService.DeleteCostAsync(vehicleId, costId, cancellationToken);
            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }
}
