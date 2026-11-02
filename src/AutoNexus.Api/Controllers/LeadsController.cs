using System.Security.Claims;
using AutoNexus.Domain.Entities;
using AutoNexus.Domain.Enums;
using AutoNexus.Domain.Interfaces;
using AutoNexus.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AutoNexus.Api.Controllers;

[ApiController]
[Route("api/leads")]
[Authorize(Roles = "Admin,Vendedor")]
public sealed class LeadsController : ControllerBase
{
    private readonly AutoNexusDbContext _db;
    private readonly ITenantContext _tenant;

    public LeadsController(AutoNexusDbContext db, ITenantContext tenant)
    {
        _db = db;
        _tenant = tenant;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? search, [FromQuery] LeadStatus? status, CancellationToken ct)
    {
        if (!_tenant.HasTenant) return Forbid();
        var query = _db.Leads.AsNoTracking().Include(x => x.Vehicle).Include(x => x.AssignedToUser).AsQueryable();
        if (status.HasValue) query = query.Where(x => x.Status == status.Value);
        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            query = query.Where(x => x.Name.Contains(term) || x.Phone.Contains(term) || (x.Email != null && x.Email.Contains(term)));
        }
        var leads = await query.OrderByDescending(x => x.UpdatedAt ?? x.CreatedAt).Take(500).ToListAsync(ct);
        return Ok(leads.Select(ToResponse));
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        if (!_tenant.HasTenant) return Forbid();
        var lead = await _db.Leads.AsNoTracking().Include(x => x.Vehicle).Include(x => x.AssignedToUser).FirstOrDefaultAsync(x => x.Id == id, ct);
        return lead is null ? NotFound() : Ok(ToResponse(lead));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] LeadRequest request, CancellationToken ct)
    {
        if (!_tenant.HasTenant) return Forbid();
        if (!ModelState.IsValid) return ValidationProblem(ModelState);
        if (string.IsNullOrWhiteSpace(request.Name) || string.IsNullOrWhiteSpace(request.Phone)) return BadRequest(new { message = "Nome e telefone são obrigatórios." });
        if (request.Name.Length > 160 || request.Phone.Length > 30 || (request.Email?.Length ?? 0) > 254 || (request.Source?.Length ?? 0) > 80 || (request.Notes?.Length ?? 0) > 2000) return BadRequest(new { message = "Um ou mais campos excedem o tamanho permitido." });
        var userId = _tenant.UserId;
        var assignedTo = request.AssignedToUserId ?? userId;
        if (!await ReferencesAreValid(request.VehicleId, assignedTo, ct))
            return BadRequest(new { message = "O veículo ou o responsável informado não pertence à empresa ou não existe." });

        var lead = new Lead(request.Name, request.Phone, request.Email, request.Source, request.Notes, request.VehicleId, assignedTo);
        _db.Leads.Add(lead);
        await _db.SaveChangesAsync(ct);
        await _db.Entry(lead).Reference(x => x.Vehicle).LoadAsync(ct);
        await _db.Entry(lead).Reference(x => x.AssignedToUser).LoadAsync(ct);
        return CreatedAtAction(nameof(GetById), new { id = lead.Id }, ToResponse(lead));
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] LeadRequest request, CancellationToken ct)
    {
        if (!_tenant.HasTenant) return Forbid();
        var lead = await _db.Leads.FirstOrDefaultAsync(x => x.Id == id, ct);
        if (lead is null) return NotFound();
        if (string.IsNullOrWhiteSpace(request.Name) || string.IsNullOrWhiteSpace(request.Phone)) return BadRequest(new { message = "Nome e telefone são obrigatórios." });
        if (request.Name.Length > 160 || request.Phone.Length > 30 || (request.Email?.Length ?? 0) > 254 || (request.Source?.Length ?? 0) > 80 || (request.Notes?.Length ?? 0) > 2000) return BadRequest(new { message = "Um ou mais campos excedem o tamanho permitido." });
        var assignedTo = request.AssignedToUserId ?? lead.AssignedToUserId ?? _tenant.UserId;
        if (!await ReferencesAreValid(request.VehicleId, assignedTo, ct))
            return BadRequest(new { message = "O veículo ou o responsável informado não pertence à empresa ou não existe." });
        lead.UpdateDetails(request.Name, request.Phone, request.Email, request.Source, request.Notes, request.VehicleId, assignedTo);
        await _db.SaveChangesAsync(ct);
        await _db.Entry(lead).Reference(x => x.Vehicle).LoadAsync(ct);
        await _db.Entry(lead).Reference(x => x.AssignedToUser).LoadAsync(ct);
        return Ok(ToResponse(lead));
    }

    [HttpPatch("{id:guid}/status")]
    public async Task<IActionResult> ChangeStatus(Guid id, [FromBody] ChangeLeadStatusRequest request, CancellationToken ct)
    {
        if (!_tenant.HasTenant) return Forbid();
        if (!Enum.IsDefined(request.Status)) return BadRequest(new { message = "Etapa inválida." });
        var lead = await _db.Leads.FirstOrDefaultAsync(x => x.Id == id, ct);
        if (lead is null) return NotFound();
        lead.ChangeStatus(request.Status);
        await _db.SaveChangesAsync(ct);
        return Ok(ToResponse(lead));
    }

    [HttpPost("{id:guid}/contact")]
    public async Task<IActionResult> RegisterContact(Guid id, CancellationToken ct)
    {
        if (!_tenant.HasTenant) return Forbid();
        var lead = await _db.Leads.FirstOrDefaultAsync(x => x.Id == id, ct);
        if (lead is null) return NotFound();
        lead.RegisterContact();
        await _db.SaveChangesAsync(ct);
        return Ok(ToResponse(lead));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        if (!_tenant.HasTenant) return Forbid();
        var lead = await _db.Leads.FirstOrDefaultAsync(x => x.Id == id, ct);
        if (lead is null) return NotFound();
        _db.Leads.Remove(lead);
        await _db.SaveChangesAsync(ct);
        return NoContent();
    }

    private async Task<bool> ReferencesAreValid(Guid? vehicleId, Guid? assignedToUserId, CancellationToken ct)
    {
        if (vehicleId.HasValue && !await _db.Vehicles.AnyAsync(x => x.Id == vehicleId.Value, ct)) return false;
        if (assignedToUserId.HasValue && !await _db.Users.AnyAsync(x => x.Id == assignedToUserId.Value && x.IsActive && (x.Profile == UserProfile.Admin || x.Profile == UserProfile.Vendedor), ct)) return false;
        return true;
    }

    private static object ToResponse(Lead lead) => new
    {
        lead.Id, lead.Name, lead.Phone, lead.Email, lead.Source, lead.Notes,
        Status = (int)lead.Status, StatusName = lead.Status.ToString(),
        lead.VehicleId, VehicleName = lead.Vehicle is null ? null : $"{lead.Vehicle.Brand} {lead.Vehicle.Model}",
        lead.AssignedToUserId, AssignedToName = lead.AssignedToUser?.Name,
        lead.LastContactAt, lead.CreatedAt, lead.UpdatedAt
    };

    public sealed record LeadRequest(string Name, string Phone, string? Email, string? Source, string? Notes, Guid? VehicleId, Guid? AssignedToUserId);
    public sealed record ChangeLeadStatusRequest(LeadStatus Status);
}
