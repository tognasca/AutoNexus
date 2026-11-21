using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using AutoNexus.Domain.Entities;
using AutoNexus.Domain.Enums;
using AutoNexus.Domain.Interfaces;
using AutoNexus.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AutoNexus.Api.Controllers;

[ApiController]
[Route("api/launch")]
[Authorize(Roles = "Admin,Vendedor")]
public sealed class LaunchController(AutoNexusDbContext db, ITenantContext tenant) : ControllerBase
{
    public sealed record PreferencesRequest(decimal? Budget, int? Transmission, string? Models);
    public sealed record ReserveRequest(Guid LeadId, DateTime ExpiresAt);
    public sealed record DeliveryRequest(string Step, bool Done);
    public sealed record DeliveryEntry(bool Done, DateTime? CompletedAt, Guid? UserId);
    public sealed record DeliveryView(bool Done, DateTime? CompletedAt, Guid? UserId, string? UserName);
    private static readonly string[] DeliverySteps = ["payment", "documents", "accessories", "handover"];

    private async Task LockVehicle(Guid id, CancellationToken ct) =>
        await db.Database.ExecuteSqlInterpolatedAsync(
            $"SELECT 1 FROM vehicles WHERE id = {id} AND \"tenantId\" = {tenant.TenantId} FOR UPDATE", ct);

    private void Audit(Guid id, string action, string detail) =>
        db.AuditLogs.Add(new AuditLog(tenant.UserId, action, "Vehicle", id.ToString(), detail));

    [HttpGet("leads/{id:guid}")]
    public async Task<IActionResult> LeadDetails(Guid id, CancellationToken ct)
    {
        if (!tenant.HasTenant) return Forbid();
        var lead = await db.Leads.AsNoTracking().SingleOrDefaultAsync(x => x.Id == id, ct);
        if (lead is null) return NotFound();
        var vehicle = lead.VehicleId.HasValue ? await db.Vehicles.AsNoTracking()
            .SingleOrDefaultAsync(x => x.Id == lead.VehicleId, ct) : null;
        return Ok(new {
            lead.Budget, lead.PreferredTransmission, lead.PreferredModels, lead.BuyerResponse,
            lead.BuyerRespondedAt, lead.ShareExpiresAt, shareActive = lead.ShareTokenHash != null && lead.ShareExpiresAt > DateTime.UtcNow,
            reservation = vehicle is null ? null : new { vehicle.ReservedForLeadId, vehicle.ReservedByUserId,
                vehicle.ReservationExpiresAt, active = vehicle.Status == VehicleStatus.Reservado && vehicle.ReservationExpiresAt > DateTime.UtcNow }
        });
    }

    [HttpPut("leads/{id:guid}/preferences")]
    public async Task<IActionResult> SavePreferences(Guid id, PreferencesRequest input, CancellationToken ct)
    {
        if (!tenant.HasTenant) return Forbid();
        var lead = await db.Leads.SingleOrDefaultAsync(x => x.Id == id, ct);
        if (lead is null) return NotFound();
        try { lead.SetBuyerPreferences(input.Budget, input.Transmission, input.Models); }
        catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
        await db.SaveChangesAsync(ct);
        return NoContent();
    }

    [HttpGet("vehicles/{id:guid}/interested")]
    public async Task<IActionResult> Interested(Guid id, CancellationToken ct)
    {
        if (!tenant.HasTenant) return Forbid();
        var vehicle = await db.Vehicles.AsNoTracking().SingleOrDefaultAsync(x => x.Id == id, ct);
        if (vehicle is null) return NotFound();
        if (vehicle.Status != VehicleStatus.AVenda || vehicle.ListedValue is null)
            return Ok(Array.Empty<object>());
        var candidates = await db.Leads.AsNoTracking()
            .Where(x => x.Status != LeadStatus.Venda && x.Status != LeadStatus.Perdido &&
                (x.Budget != null || x.PreferredTransmission != null || x.PreferredModels != null) &&
                (x.Budget == null || x.Budget >= vehicle.ListedValue) &&
                (x.PreferredTransmission == null || x.PreferredTransmission == (int?)vehicle.Transmission))
            .OrderByDescending(x => x.UpdatedAt).ToListAsync(ct);
        var matches = candidates.Where(x => string.IsNullOrWhiteSpace(x.PreferredModels) ||
            x.PreferredModels.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .Any(term => (vehicle.Brand + " " + vehicle.Model).Contains(term, StringComparison.OrdinalIgnoreCase)))
            .Select(x => new { x.Id, x.Name, x.Phone, x.Budget, x.PreferredModels });
        return Ok(matches);
    }

    [HttpGet("vehicles/{id:guid}/margin")]
    public async Task<IActionResult> Margin(Guid id, [FromQuery] decimal? offer, CancellationToken ct)
    {
        if (!tenant.HasTenant) return Forbid();
        if (offer <= 0) return BadRequest(new { message = "Informe uma proposta positiva." });
        var vehicle = await db.Vehicles.AsNoTracking().SingleOrDefaultAsync(x => x.Id == id, ct);
        if (vehicle is null) return NotFound();
        var costs = await db.Costs.AsNoTracking().Where(x => x.VehicleId == id)
            .Select(x => new { x.Description, x.Value, category = x.CostCategory.Name }).ToListAsync(ct);
        var revenue = vehicle.Status == VehicleStatus.Vendido ? vehicle.SaleValue : offer ?? vehicle.ListedValue;
        var values = VehicleFinancials.Calculate(vehicle.MarginBasis(), costs.Sum(x => x.Value), revenue);
        return Ok(new {
            vehicle.ConsignmentPayout, values, costs, realized = vehicle.Status == VehicleStatus.Vendido && vehicle.SaleValue.HasValue,
            discount = vehicle.ListedValue.HasValue && revenue.HasValue ? Math.Max(0, vehicle.ListedValue.Value - revenue.Value) : 0
        });
    }

    public sealed record ConsignmentRequest(decimal? Payout);
    public sealed record TransferRequest(string Step, string Status, string Source, string? Evidence);
    public sealed record TransferEntry(string Status, string Source, string? Evidence, DateTime VerifiedAt, Guid UserId, string UserName);
    private static readonly string[] TransferSteps = ["signature", "inspection", "confirmation"];

    [HttpPut("vehicles/{id:guid}/consignment")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> SaveConsignment(Guid id, ConsignmentRequest input, CancellationToken ct)
    {
        if (!tenant.HasTenant || !tenant.UserId.HasValue) return Forbid();
        var vehicle = await db.Vehicles.SingleOrDefaultAsync(x => x.Id == id, ct);
        if (vehicle is null) return NotFound();
        if (vehicle.Status == VehicleStatus.Vendido)
            return Conflict(new { message = "A modalidade de estoque fica bloqueada após a venda." });
        try { vehicle.SetConsignmentPayout(input.Payout); }
        catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
        Audit(id, "Consignação", input.Payout.HasValue ? "Repasse ao proprietário atualizado." : "Veículo marcado como estoque próprio.");
        await db.SaveChangesAsync(ct);
        return NoContent();
    }

    [HttpGet("vehicles/{id:guid}/transfer")]
    public async Task<IActionResult> Transfer(Guid id, CancellationToken ct)
    {
        if (!tenant.HasTenant) return Forbid();
        var vehicle = await db.Vehicles.AsNoTracking().SingleOrDefaultAsync(x => x.Id == id, ct);
        return vehicle is null ? NotFound() : Ok(ReadTransfer(vehicle));
    }

    [HttpPut("vehicles/{id:guid}/transfer")]
    public async Task<IActionResult> SaveTransfer(Guid id, TransferRequest input, CancellationToken ct)
    {
        if (!tenant.HasTenant || !tenant.UserId.HasValue) return Forbid();
        var evidence = input.Evidence?.Trim();
        if (!TransferSteps.Contains(input.Step) || input.Status is not ("pending" or "processing" or "completed") ||
            input.Source is not ("manual" or "external") || evidence?.Length > 300 ||
            ((input.Status == "completed" || input.Source == "external") && string.IsNullOrWhiteSpace(evidence)))
            return BadRequest(new { message = "Confira a origem e informe protocolo ou referência do comprovante para confirmações e consultas externas." });
        await using var tx = await db.Database.BeginTransactionAsync(ct);
        await LockVehicle(id, ct);
        var vehicle = await db.Vehicles.SingleOrDefaultAsync(x => x.Id == id, ct);
        if (vehicle is null) return NotFound();
        if (vehicle.Status != VehicleStatus.Vendido)
            return Conflict(new { message = "Registre a venda antes de acompanhar a transferência." });
        var user = await db.Users.AsNoTracking().SingleOrDefaultAsync(x => x.Id == tenant.UserId && x.IsActive, ct);
        if (user is null) return Forbid();
        var entries = ReadTransfer(vehicle);
        if (input.Step == "confirmation" && input.Status == "completed" &&
            TransferSteps.Take(2).Any(step => entries.GetValueOrDefault(step)?.Status != "completed"))
            return Conflict(new { message = "Confirme assinatura e vistoria antes de concluir a transferência." });
        if (input.Step != "confirmation" && input.Status != "completed" && entries.GetValueOrDefault("confirmation")?.Status == "completed")
            return Conflict(new { message = "Reabra a confirmação antes de alterar assinatura ou vistoria." });
        entries[input.Step] = new TransferEntry(input.Status, input.Source, evidence, DateTime.UtcNow, user.Id, user.Name);
        vehicle.SaveTransferTracking(JsonSerializer.Serialize(entries));
        Audit(id, "Acompanhamento da transferência", $"Etapa {input.Step}: {input.Status}, origem {input.Source}.");
        await db.SaveChangesAsync(ct);
        await tx.CommitAsync(ct);
        return Ok(entries);
    }

    private static Dictionary<string, TransferEntry> ReadTransfer(Vehicle vehicle) =>
        vehicle.TransferTracking is { } json ? JsonSerializer.Deserialize<Dictionary<string, TransferEntry>>(json) ?? [] : [];

    [HttpPost("vehicles/{id:guid}/reserve")]
    public async Task<IActionResult> Reserve(Guid id, ReserveRequest input, CancellationToken ct)
    {
        if (!tenant.HasTenant || !tenant.UserId.HasValue) return Forbid();
        await using var tx = await db.Database.BeginTransactionAsync(ct);
        await LockVehicle(id, ct);
        var vehicle = await db.Vehicles.SingleOrDefaultAsync(x => x.Id == id, ct);
        if (vehicle is null) return NotFound();
        if (!await db.Leads.AnyAsync(x => x.Id == input.LeadId && x.VehicleId == id &&
            x.Status != LeadStatus.Venda && x.Status != LeadStatus.Perdido, ct))
            return BadRequest(new { message = "Vincule este veículo a um atendimento ativo." });
        try { vehicle.Reserve(input.LeadId, tenant.UserId.Value, input.ExpiresAt.ToUniversalTime(), DateTime.UtcNow); }
        catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
        catch (InvalidOperationException ex) { return Conflict(new { message = ex.Message }); }
        Audit(id, "Reserva", $"Reserva para atendimento {input.LeadId} até {input.ExpiresAt:O}.");
        await db.SaveChangesAsync(ct);
        await tx.CommitAsync(ct);
        return NoContent();
    }

    [HttpDelete("vehicles/{id:guid}/reserve")]
    public async Task<IActionResult> Release(Guid id, CancellationToken ct)
    {
        if (!tenant.HasTenant || !tenant.UserId.HasValue) return Forbid();
        await using var tx = await db.Database.BeginTransactionAsync(ct);
        await LockVehicle(id, ct);
        var vehicle = await db.Vehicles.SingleOrDefaultAsync(x => x.Id == id, ct);
        if (vehicle is null) return NotFound();
        if (vehicle.ReservationExpiresAt > DateTime.UtcNow && vehicle.ReservedByUserId != tenant.UserId && !User.IsInRole("Admin"))
            return Forbid();
        vehicle.ReleaseReservation();
        Audit(id, "Cancelamento de reserva", "Reserva liberada pelo usuário.");
        await db.SaveChangesAsync(ct);
        await tx.CommitAsync(ct);
        return NoContent();
    }

    [HttpGet("vehicles/{id:guid}/delivery")]
    public async Task<IActionResult> Delivery(Guid id, CancellationToken ct)
    {
        if (!tenant.HasTenant) return Forbid();
        var vehicle = await db.Vehicles.AsNoTracking().SingleOrDefaultAsync(x => x.Id == id, ct);
        return vehicle is null ? NotFound() : Ok(await ChecklistView(vehicle, ct));
    }

    [HttpPut("vehicles/{id:guid}/delivery")]
    public async Task<IActionResult> SaveDelivery(Guid id, DeliveryRequest input, CancellationToken ct)
    {
        if (!tenant.HasTenant || !tenant.UserId.HasValue) return Forbid();
        if (!DeliverySteps.Contains(input.Step)) return BadRequest(new { message = "Etapa de entrega inválida." });
        await using var tx = await db.Database.BeginTransactionAsync(ct);
        await LockVehicle(id, ct);
        var vehicle = await db.Vehicles.SingleOrDefaultAsync(x => x.Id == id, ct);
        if (vehicle is null) return NotFound();
        if (vehicle.Status != VehicleStatus.Vendido) return Conflict(new { message = "Registre a venda antes da entrega." });
        var checklist = ReadChecklist(vehicle);
        if (input.Step == "handover" && input.Done && DeliverySteps.Take(3).Any(step => !checklist[step].Done))
            return Conflict(new { message = "Confira pagamento, documentos e acessórios antes da entrega." });
        if (input.Step != "handover" && !input.Done && checklist["handover"].Done)
            return Conflict(new { message = "Reabra a entrega antes de alterar as conferências." });
        if (checklist[input.Step].Done != input.Done) {
            checklist[input.Step] = new DeliveryEntry(input.Done, input.Done ? DateTime.UtcNow : null, tenant.UserId);
            vehicle.SaveDeliveryChecklist(JsonSerializer.Serialize(checklist));
            Audit(id, "Checklist de entrega", $"{input.Step}: {input.Done}.");
            await db.SaveChangesAsync(ct);
        }
        await tx.CommitAsync(ct);
        return Ok(await ChecklistView(vehicle, ct));
    }

    private async Task<Dictionary<string, DeliveryView>> ChecklistView(Vehicle vehicle, CancellationToken ct)
    {
        var checklist = ReadChecklist(vehicle);
        var ids = checklist.Values.Where(entry => entry.UserId.HasValue).Select(entry => entry.UserId!.Value).Distinct().ToArray();
        var names = await db.Users.AsNoTracking().Where(user => ids.Contains(user.Id)).ToDictionaryAsync(user => user.Id, user => user.Name, ct);
        return checklist.ToDictionary(item => item.Key, item => new DeliveryView(
            item.Value.Done, item.Value.CompletedAt, item.Value.UserId,
            item.Value.UserId.HasValue ? names.GetValueOrDefault(item.Value.UserId.Value) ?? "Usuário indisponível" : null));
    }

    private static Dictionary<string, DeliveryEntry> ReadChecklist(Vehicle vehicle)
    {
        var saved = string.IsNullOrEmpty(vehicle.DeliveryChecklist) ? null :
            JsonSerializer.Deserialize<Dictionary<string, DeliveryEntry>>(vehicle.DeliveryChecklist);
        return DeliverySteps.ToDictionary(step => step, step => saved?.GetValueOrDefault(step) ?? new(false, null, null));
    }

    [HttpPost("leads/{id:guid}/proposal")]
    public async Task<IActionResult> PublishProposal(Guid id, CancellationToken ct)
    {
        if (!tenant.HasTenant) return Forbid();
        var lead = await db.Leads.Include(x => x.Vehicle).ThenInclude(x => x!.Photos).SingleOrDefaultAsync(x => x.Id == id, ct);
        if (lead is null) return NotFound();
        if (lead.Vehicle is null || lead.Vehicle.Status == VehicleStatus.Vendido || lead.OfferValue is null ||
            lead.OfferValidUntil < DateOnly.FromDateTime(DateTime.UtcNow))
            return BadRequest(new { message = "Informe veículo disponível, valor e validade vigente da proposta." });
        var store = await db.TenantSettings.AsNoTracking().SingleOrDefaultAsync(ct);
        var now = DateTime.UtcNow;
        var expires = lead.OfferValidUntil.HasValue
            ? DateTime.SpecifyKind(lead.OfferValidUntil.Value.AddDays(1).ToDateTime(TimeOnly.MinValue), DateTimeKind.Utc)
            : now.AddDays(7);
        var token = Convert.ToHexString(RandomNumberGenerator.GetBytes(32));
        var snapshot = JsonSerializer.Serialize(new {
            store = store?.CompanyName ?? "Loja", logo = store?.LogoUrl, color = store?.PrimaryColor,
            contact = store?.WhatsAppNumber, buyer = lead.Name,
            vehicle = $"{lead.Vehicle.Brand} {lead.Vehicle.Model} {lead.Vehicle.ModelYear}",
            photos = lead.Vehicle.Photos.OrderByDescending(x => x.IsMain).ThenBy(x => x.Order).Select(x => x.StoragePath).Take(10),
            value = lead.OfferValue, downPayment = lead.DownPayment, trade = lead.TradeDescription,
            expiresAt = expires, generatedAt = now
        });
        lead.PublishProposal(Hash(token), snapshot, expires);
        await db.SaveChangesAsync(ct);
        return Ok(new { path = $"/proposta/{token}", expiresAt = expires });
    }

    [HttpDelete("leads/{id:guid}/proposal")]
    public async Task<IActionResult> Revoke(Guid id, CancellationToken ct)
    {
        if (!tenant.HasTenant) return Forbid();
        var lead = await db.Leads.SingleOrDefaultAsync(x => x.Id == id, ct);
        if (lead is null) return NotFound();
        lead.RevokeProposal();
        await db.SaveChangesAsync(ct);
        return NoContent();
    }

    public sealed record BuyerResponseRequest(string Action, string? Message);

    [AllowAnonymous]
    [HttpGet("proposals/{token}")]
    [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    public async Task<IActionResult> PublicProposal(string token, CancellationToken ct)
    {
        var lead = await FindProposal(token, ct);
        if (lead is null) return NotFound(new { message = "Proposta expirada ou indisponível." });
        return Content(lead.ProposalSnapshot!, "application/json");
    }

    [AllowAnonymous]
    [HttpPost("proposals/{token}/response")]
    public async Task<IActionResult> BuyerResponse(string token, BuyerResponseRequest input, CancellationToken ct)
    {
        if (input.Action is not ("interested" or "adjustment") || input.Message?.Length > 500)
            return BadRequest(new { message = "Informe interesse ou ajuste com até 500 caracteres." });
        // Conditional update also protects against simultaneous revocation/expiry.
        if (token.Length != 64 || !token.All(Uri.IsHexDigit)) return NotFound();
        var hash = Hash(token);
        var response = (input.Action == "interested" ? "Interesse" : "Ajuste") + ": " + input.Message?.Trim();
        var changed = await db.Leads.IgnoreQueryFilters()
            .Where(x => x.ShareTokenHash == hash && x.ShareExpiresAt > DateTime.UtcNow &&
                db.Tenants.Any(t => t.Id == x.TenantId && t.IsActive))
            .ExecuteUpdateAsync(s => s.SetProperty(x => x.BuyerResponse, response)
                .SetProperty(x => x.BuyerRespondedAt, DateTime.UtcNow)
                .SetProperty(x => x.UpdatedAt, (DateTime?)DateTime.UtcNow), ct);
        return changed == 0 ? NotFound(new { message = "Proposta expirada ou indisponível." }) : Ok(new { message = "Retorno registrado. A loja dará continuidade ao atendimento." });
    }

    private async Task<Lead?> FindProposal(string token, CancellationToken ct)
    {
        if (token.Length != 64 || !token.All(Uri.IsHexDigit)) return null;
        var hash = Hash(token);
        return await db.Leads.IgnoreQueryFilters().AsNoTracking()
            .SingleOrDefaultAsync(x => x.ShareTokenHash == hash && x.ShareExpiresAt > DateTime.UtcNow &&
                db.Tenants.Any(t => t.Id == x.TenantId && t.IsActive), ct);
    }
    private static string Hash(string token) => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(token)));
}
