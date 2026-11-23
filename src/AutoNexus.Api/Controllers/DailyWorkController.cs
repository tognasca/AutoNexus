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
[Route("api/daily-work")]
[Authorize(Roles = "Admin,Vendedor")]
public sealed class DailyWorkController(AutoNexusDbContext db, ITenantContext tenant) : ControllerBase
{
    public sealed record WorkItem(string Id, string Kind, string Title, Guid? LeadId, Guid? VehicleId,
        string? VehicleName, string? ResponsibleName, int Score, IReadOnlyList<string> Reasons,
        int? StockDays, decimal? MarginPercentage, DateTime? NextContactAt, string[]? MissingFields = null);

    [HttpGet]
    public async Task<IActionResult> Get([FromQuery] bool mine = true, CancellationToken ct = default)
    {
        if (!tenant.HasTenant || tenant.UserId == null) return Forbid();
        var user = await db.Users.AsNoTracking().SingleOrDefaultAsync(x => x.Id == tenant.UserId, ct);
        if (user is null || !user.IsActive) return Forbid();
        var own = mine || user.Profile != UserProfile.Admin;
        var now = DateTime.UtcNow;
        var zone = TimeZoneInfo.FindSystemTimeZoneById("America/Sao_Paulo");
        var today = TimeZoneInfo.ConvertTimeFromUtc(now, zone).Date;
        var end = TimeZoneInfo.ConvertTimeToUtc(DateTime.SpecifyKind(today.AddDays(1).AddTicks(-1), DateTimeKind.Unspecified), zone);
        var leadsQuery = db.Leads.AsNoTracking().Include(x => x.AssignedToUser)
            .Where(x => x.Status != LeadStatus.Venda && x.Status != LeadStatus.Perdido &&
                (x.Vehicle == null || x.Vehicle.Status != VehicleStatus.Vendido));
        if (own) leadsQuery = leadsQuery.Where(x => x.AssignedToUserId == tenant.UserId);
        var leads = await leadsQuery.ToListAsync(ct);
        var vehicles = await db.Vehicles.AsNoTracking().Include(x => x.Costs).Include(x => x.SoldByUser)
            .Where(x => x.Status == VehicleStatus.AVenda || x.Status == VehicleStatus.Reservado ||
                (x.Status == VehicleStatus.Vendido && (!own || x.SoldByUserId == tenant.UserId)))
            .ToDictionaryAsync(x => x.Id, ct);
        var result = new List<WorkItem>();
        foreach (var lead in leads)
        {
            var vehicle = lead.VehicleId.HasValue ? vehicles.GetValueOrDefault(lead.VehicleId.Value) : null;
            var days = vehicle == null ? 0 : Math.Max(0, (int)(now - vehicle.CreatedAt).TotalDays);
            var margin = vehicle == null ? null : VehicleFinancials.Calculate(vehicle.MarginBasis(),
                vehicle.Costs.Sum(x => x.Value), vehicle.ListedValue).MarginPercentage;
            var rank = DailyPriority.ForLead(now, end, lead.CreatedAt, lead.LastContactAt,
                lead.NextContactAt, false, days, margin);
            var missing = lead.MissingContactFields();
            if (rank.Score == 0 && (missing.Length == 0 || lead.NextContactAt > end)) continue;
            var reasons = missing.Length == 0 ? rank.Reasons : rank.Reasons.Append("Completar " + string.Join(", ", missing)).ToArray();
            result.Add(new("lead:" + lead.Id, "lead", string.IsNullOrWhiteSpace(lead.Name) ? "Lead sem nome" : lead.Name, lead.Id, lead.VehicleId,
                vehicle == null ? null : $"{vehicle.Brand} {vehicle.Model}", lead.AssignedToUser?.Name,
                Math.Max(rank.Score, missing.Length > 0 ? 84 : 0), reasons, vehicle == null ? null : days, margin, lead.NextContactAt, missing));
        }
        foreach (var vehicle in vehicles.Values)
        {
            var sold = vehicle.Status == VehicleStatus.Vendido;
            if (!sold && vehicle.Status != VehicleStatus.AVenda) continue;
            // One card per vehicle when a prioritized customer already points to it.
            if (!sold && result.Any(x => x.VehicleId == vehicle.Id)) continue;
            var days = Math.Max(0, (int)(now - vehicle.CreatedAt).TotalDays);
            var margin = sold ? null : VehicleFinancials.Calculate(vehicle.MarginBasis(),
                vehicle.Costs.Sum(x => x.Value), vehicle.ListedValue).MarginPercentage;
            var rank = DailyPriority.ForStock(days, margin, sold && !Delivered(vehicle.DeliveryChecklist));
            if (sold && Delivered(vehicle.DeliveryChecklist) || rank.Score == 0) continue;
            result.Add(new("vehicle:" + vehicle.Id, sold ? "delivery" : "stock", $"{vehicle.Brand} {vehicle.Model}",
                null, vehicle.Id, vehicle.Plate, sold ? vehicle.SoldByUser?.Name : "Estoque compartilhado",
                rank.Score, rank.Reasons, sold ? null : days, margin, null));
        }
        var ordered = result.OrderByDescending(x => x.Score).ThenBy(x => x.NextContactAt ?? DateTime.MaxValue)
            .ThenBy(x => x.Id, StringComparer.Ordinal).ToArray();
        return Ok(new { generatedAt = now, timeZone = zone.Id, total = ordered.Length, items = ordered.Take(10) });
    }

    private static bool Delivered(string? json)
    {
        if (string.IsNullOrWhiteSpace(json)) return false;
        try
        {
            var entries = JsonSerializer.Deserialize<Dictionary<string, LaunchController.DeliveryEntry>>(json);
            return entries != null && new[] { "payment", "documents", "accessories", "handover" }
                .All(step => entries.TryGetValue(step, out var entry) && entry.Done);
        }
        catch (JsonException) { return false; }
    }
}
