using AutoNexus.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using AutoNexus.Application.DTOs;
using AutoNexus.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AutoNexus.Api.Controllers;

[ApiController]
[Route("api/financing/proposals")]
[Authorize(Roles = "Admin,Vendedor")]
public sealed class FinancingProposalsController : ControllerBase
{
    private readonly IFinancingProposalService _service;

    private readonly AutoNexusDbContext _db;

    public FinancingProposalsController(IFinancingProposalService service, AutoNexusDbContext db)
    {
        _db = db;
        _service = service;
    }

    [HttpPost]
    public async Task<ActionResult<FinancingProposalDto>> Create(
        [FromBody] FinancingProposalCreateDto request,
        CancellationToken cancellationToken)
    {
        try
        {
            if (!string.IsNullOrWhiteSpace(request.VehicleId) &&
                (!Guid.TryParse(request.VehicleId, out var vehicleId) ||
                 !await _db.Vehicles.AnyAsync(x => x.Id == vehicleId)))
                return BadRequest(new { message = "O veículo informado não pertence a esta empresa ou não existe." });

            var result = await _service.CreateAsync(request, cancellationToken);
            return CreatedAtAction(nameof(Get), new { id = result.Id }, result);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<FinancingProposalDto>>> List(CancellationToken cancellationToken)
    {
        return Ok(await _service.ListAsync(cancellationToken));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<FinancingProposalDto>> Get(Guid id, CancellationToken cancellationToken)
    {
        var all = await _service.ListAsync(cancellationToken);
        var result = all.FirstOrDefault(x => x.Id == id);
        return result is null ? NotFound(new { message = "Proposta não encontrada." }) : Ok(result);
    }

    [HttpGet("{id:guid}/export/{format}")]
    public async Task<IActionResult> Export(Guid id, string format, CancellationToken cancellationToken)
    {
        try
        {
            var result = await _service.ExportAsync(id, format, cancellationToken);
            return File(System.Text.Encoding.UTF8.GetBytes(result.Content), result.ContentType, result.FileName);
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
}
