using System.Security.Claims;
using AutoNexus.Application.DTOs;
using AutoNexus.Application.Interfaces;
using AutoNexus.Domain.Enums;
using AutoNexus.Domain.Interfaces;
using AutoNexus.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AutoNexus.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TradesController : ControllerBase
{
    private readonly ITradeService _tradeService;
    private readonly AutoNexusDbContext _db;
    private readonly ITenantContext _tenant;

    public TradesController(ITradeService tradeService, AutoNexusDbContext db, ITenantContext tenant)
    {
        _tradeService = tradeService;
        _db = db;
        _tenant = tenant;
    }

    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<TradeDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        var result = await _tradeService.GetAllTradesAsync(cancellationToken);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(TradeDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var result = await _tradeService.GetTradeByIdAsync(id, cancellationToken);
        if (result == null) return NotFound(new { message = "Troca não encontrada." });
        return Ok(result);
    }

    [HttpPost]
    [Authorize(Roles = "Admin,Vendedor")]
    [ProducesResponseType(typeof(TradeDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create([FromBody] CreateTradeDto dto, CancellationToken cancellationToken)
    {
        try
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;
            if (!Guid.TryParse(userIdClaim, out var responsibleUserId))
                return Unauthorized();

            if (!_tenant.HasTenant) return Forbid();
            await using var transaction = await _db.Database.BeginTransactionAsync(cancellationToken);
            await _db.Database.ExecuteSqlInterpolatedAsync(
                $"SELECT 1 FROM vehicles WHERE id = {dto.DeliveredVehicleId} AND \"tenantId\" = {_tenant.TenantId} FOR UPDATE",
                cancellationToken);
            var isAdmin = User.IsInRole("Admin");
            if (dto.LeadId is Guid leadId && !await _db.Leads.AnyAsync(x => x.Id == leadId &&
                x.VehicleId == dto.DeliveredVehicleId && x.Status != LeadStatus.Venda && x.Status != LeadStatus.Perdido &&
                (x.AssignedToUserId == null || x.AssignedToUserId == responsibleUserId || isAdmin),
                cancellationToken))
                return BadRequest(new { message = "Vincule a troca a um atendimento ativo deste veículo." });

            var result = await _tradeService.CreateTradeAsync(responsibleUserId, dto, cancellationToken);
            await transaction.CommitAsync(cancellationToken);
            return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message, detail = ex.InnerException?.Message });
        }
    }
}
