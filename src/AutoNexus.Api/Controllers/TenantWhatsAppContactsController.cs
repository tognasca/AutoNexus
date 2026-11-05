using AutoNexus.Domain.Entities;
using AutoNexus.Domain.Interfaces;
using AutoNexus.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AutoNexus.Api.Controllers;

[ApiController]
[Route("api/tenant-settings/whatsapp-contacts")]
[Authorize(Roles = "Admin,Vendedor")]
public sealed class TenantWhatsAppContactsController : ControllerBase
{
    private readonly AutoNexusDbContext _db;
    private readonly ITenantContext _tenant;

    public TenantWhatsAppContactsController(AutoNexusDbContext db, ITenantContext tenant)
    {
        _db = db;
        _tenant = tenant;
    }

    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken ct)
    {
        if (!_tenant.HasTenant) return Forbid();
        var items = await _db.Set<TenantWhatsAppContact>().AsNoTracking()
            .OrderByDescending(x => x.IsDefault).ThenBy(x => x.Name)
            .Select(x => new ContactResponse(x.Id, x.Name, x.PhoneNumber, x.IsDefault, x.IsActive))
            .ToListAsync(ct);
        return Ok(items);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] ContactRequest request, CancellationToken ct)
    {
        if (!_tenant.HasTenant) return Forbid();
        try
        {
            var contact = new TenantWhatsAppContact(request.Name, request.PhoneNumber, request.IsDefault);
            if (request.IsDefault)
                await _db.Set<TenantWhatsAppContact>().Where(x => x.IsDefault).ExecuteUpdateAsync(s => s.SetProperty(x => x.IsDefault, false), ct);
            _db.Add(contact);
            await _db.SaveChangesAsync(ct);
            return CreatedAtAction(nameof(Get), new { id = contact.Id }, new ContactResponse(contact.Id, contact.Name, contact.PhoneNumber, contact.IsDefault, contact.IsActive));
        }
        catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] ContactRequest request, CancellationToken ct)
    {
        if (!_tenant.HasTenant) return Forbid();
        var contact = await _db.Set<TenantWhatsAppContact>().FirstOrDefaultAsync(x => x.Id == id, ct);
        if (contact is null) return NotFound();
        try
        {
            if (request.IsDefault)
                await _db.Set<TenantWhatsAppContact>().Where(x => x.Id != id && x.IsDefault).ExecuteUpdateAsync(s => s.SetProperty(x => x.IsDefault, false), ct);
            contact.Update(request.Name, request.PhoneNumber, request.IsDefault);
            await _db.SaveChangesAsync(ct);
            return Ok(new ContactResponse(contact.Id, contact.Name, contact.PhoneNumber, contact.IsDefault, contact.IsActive));
        }
        catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
    }

    [HttpPatch("{id:guid}/active")]
    public async Task<IActionResult> SetActive(Guid id, [FromBody] ActiveRequest request, CancellationToken ct)
    {
        if (!_tenant.HasTenant) return Forbid();
        var contact = await _db.Set<TenantWhatsAppContact>().FirstOrDefaultAsync(x => x.Id == id, ct);
        if (contact is null) return NotFound();
        contact.SetActive(request.IsActive);
        await _db.SaveChangesAsync(ct);
        return NoContent();
    }

    public sealed record ContactRequest(string Name, string PhoneNumber, bool IsDefault = false);
    public sealed record ActiveRequest(bool IsActive);
    public sealed record ContactResponse(Guid Id, string Name, string PhoneNumber, bool IsDefault, bool IsActive);
}