using AutoNexus.Application.DTOs;
using AutoNexus.Application.Interfaces;
using AutoNexus.Domain.Enums;
using AutoNexus.Domain.Interfaces;
using AutoNexus.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AutoNexus.Api.Controllers;

[ApiController]
[Authorize(Roles = "Admin,Vendedor")]
[Route("api/vehicles/{vehicleId:guid}/buyer-links")]
[ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
public sealed class BuyerLinksController(AutoNexusDbContext db, ITenantContext tenant, IPortalService portal) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List(Guid vehicleId, CancellationToken ct)
    {
        if (!await CanManage(vehicleId, ct)) return NotFound();
        var links = await db.BuyerAccessLinks.AsNoTracking().Where(x => x.VehicleId == vehicleId)
            .OrderByDescending(x => x.CreatedAt).ToListAsync(ct);
        return Ok(links.Select(x => new BuyerLinkDto(x.Id, x.VehicleId, x.Token, $"/portal/{x.Token}",
            x.ExpiresAt, x.IsValid(), x.BuyerName, x.CreatedAt)));
    }

    [HttpPost]
    public async Task<IActionResult> Create(Guid vehicleId, CreateBuyerLinkDto input, CancellationToken ct)
    {
        if (tenant.UserId is not Guid userId || !await CanManage(vehicleId, ct)) return NotFound();
        try { return Ok(await portal.CreateBuyerLinkAsync(vehicleId, userId, input, ct)); }
        catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
        catch (InvalidOperationException ex) { return Conflict(new { message = ex.Message }); }
        catch (KeyNotFoundException) { return NotFound(); }
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Revoke(Guid vehicleId, Guid id, CancellationToken ct)
    {
        if (!await CanManage(vehicleId, ct)) return NotFound();
        var link = await db.BuyerAccessLinks.SingleOrDefaultAsync(x => x.VehicleId == vehicleId && x.Id == id, ct);
        if (link is null) return NotFound();
        link.Revoke();
        await db.SaveChangesAsync(ct);
        return NoContent();
    }

    private Task<bool> CanManage(Guid vehicleId, CancellationToken ct) =>
        !tenant.HasTenant || tenant.UserId is null ? Task.FromResult(false) :
            db.Vehicles.AnyAsync(x => x.Id == vehicleId && x.Status == VehicleStatus.Vendido &&
                (User.IsInRole("Admin") || x.SoldByUserId == tenant.UserId), ct);
}
