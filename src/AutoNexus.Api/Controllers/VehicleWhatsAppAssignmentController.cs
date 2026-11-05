using AutoNexus.Domain.Interfaces;
using AutoNexus.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AutoNexus.Api.Controllers;

[ApiController]
[Route("api/vehicles/{vehicleId:guid}/whatsapp-contact")]
[Authorize(Roles = "Admin")]
public sealed class VehicleWhatsAppAssignmentController : ControllerBase
{
    private readonly AutoNexusDbContext _db;
    private readonly ITenantContext _tenant;

    public VehicleWhatsAppAssignmentController(AutoNexusDbContext db, ITenantContext tenant)
    {
        _db = db;
        _tenant = tenant;
    }

    [HttpPut]
    public async Task<IActionResult> Assign(Guid vehicleId, [FromBody] AssignmentRequest request, CancellationToken ct)
    {
        if (!_tenant.HasTenant) return Forbid();
        var vehicle = await _db.Vehicles.FirstOrDefaultAsync(x => x.Id == vehicleId, ct);
        if (vehicle is null) return NotFound(new { message = "Veículo não encontrado nesta empresa." });

        if (request.ContactId.HasValue)
        {
            var valid = await _db.Set<AutoNexus.Domain.Entities.TenantWhatsAppContact>()
                .AnyAsync(x => x.Id == request.ContactId.Value && x.IsActive, ct);
            if (!valid) return BadRequest(new { message = "O contato não existe, está inativo ou não pertence a esta empresa." });
        }

        vehicle.AssignWhatsAppContact(request.ContactId);
        await _db.SaveChangesAsync(ct);
        return NoContent();
    }

    public sealed record AssignmentRequest(Guid? ContactId);
}