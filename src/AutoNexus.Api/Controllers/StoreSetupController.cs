using AutoNexus.Application.Interfaces;
using AutoNexus.Domain.Entities;
using AutoNexus.Domain.Enums;
using AutoNexus.Domain.Interfaces;
using AutoNexus.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AutoNexus.Api.Controllers;

[ApiController]
[Route("api/store-setup")]
[Authorize(Roles = "Admin")]
public sealed class StoreSetupController(AutoNexusDbContext db, ITenantContext tenant, IPlanLimitService limits) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken ct)
    {
        if (!tenant.HasTenant) return Forbid();
        var company = await db.Tenants.AsNoTracking().SingleAsync(x => x.Id == tenant.TenantId, ct);
        var settings = await db.TenantSettings.AsNoTracking().SingleOrDefaultAsync(ct);
        return Ok(new {
            companyName = settings?.CompanyName ?? company.Name, slug = company.Slug,
            identityReady = !string.IsNullOrWhiteSpace(settings?.LogoUrl) && !string.IsNullOrWhiteSpace(settings?.PrimaryColor),
            contactReady = !string.IsNullOrWhiteSpace(settings?.WhatsAppNumber),
            teamCount = await db.Users.CountAsync(x => x.IsActive && x.Profile != UserProfile.Cliente, ct),
            vehiclesCount = await db.Vehicles.CountAsync(ct),
            publishedCount = await db.Vehicles.CountAsync(x => x.Status == VehicleStatus.AVenda, ct),
            hasAttendance = await db.Leads.AnyAsync(ct),
            hasProposal = await db.Leads.AnyAsync(x => x.ProposalSnapshot != null, ct),
            hasSale = await db.Vehicles.AnyAsync(x => x.SoldAt != null && x.SaleValue > 0, ct),
            catalogPath = "/loja/" + Uri.EscapeDataString(company.Slug)
        });
    }

    public sealed record ImportRow(Guid VehicleTypeId, string Brand, string Model, int ManufacturingYear,
        int ModelYear, string Plate, decimal PurchaseValue, decimal? ListedValue, int Mileage,
        int Transmission = 99, int Fuel = 99);
    public sealed record ImportRequest(List<ImportRow> Rows, bool Commit = false);

    [HttpPost("import")]
    public async Task<IActionResult> Import(ImportRequest request, CancellationToken ct)
    {
        if (!tenant.HasTenant) return Forbid();
        if (request.Rows is null || request.Rows.Count == 0 || request.Rows.Count > 100)
            return BadRequest(new { message = "Envie de 1 a 100 veículos por lote." });
        // Serializa importações da mesma empresa. Reenvios ignoram placas já cadastradas.
        await using var transaction = await db.Database.BeginTransactionAsync(ct);
        await db.Database.ExecuteSqlInterpolatedAsync($"SELECT 1 FROM tenants WHERE id = {tenant.TenantId} FOR UPDATE", ct);
        var types = await db.VehicleTypes.Select(x => x.Id).ToListAsync(ct);
        var existing = await db.Vehicles.Where(x => x.Plate != null).Select(x => x.Plate!).ToListAsync(ct);
        var plates = existing.Select(NormalizePlate).ToHashSet();
        var errors = new List<string>();
        var imported = new List<Vehicle>();
        var skipped = 0;
        for (var index = 0; index < request.Rows.Count; index++) {
            var row = request.Rows[index];
            if (row is null) { errors.Add($"Linha {index + 2}: veículo ausente."); continue; }
            var plate = NormalizePlate(row.Plate ?? "");
            if (string.IsNullOrWhiteSpace(row.Brand) || row.Brand.Length > 100 ||
                string.IsNullOrWhiteSpace(row.Model) || row.Model.Length > 100 ||
                plate.Length is < 5 or > 10 || !plate.All(char.IsAsciiLetterOrDigit) ||
                row.ModelYear < 1900 || row.ModelYear > DateTime.UtcNow.Year + 2 ||
                row.Mileage < 0 || row.PurchaseValue < 0 || row.ListedValue < 0 ||
                !types.Contains(row.VehicleTypeId) ||
                !Enum.IsDefined(typeof(TransmissionType), row.Transmission) || !Enum.IsDefined(typeof(FuelType), row.Fuel)) {
                errors.Add($"Linha {index + 2}: confira tipo, marca, modelo, anos, placa, valores, km, câmbio e combustível.");
                continue;
            }
            try {
                var vehicle = new Vehicle(row.VehicleTypeId, row.Brand, row.Model,
                    row.ManufacturingYear, row.ModelYear, row.PurchaseValue);
                vehicle.UpdateDetails(row.VehicleTypeId, row.Brand, row.Model, null, row.ManufacturingYear,
                    row.ModelYear, plate, null, null, row.Mileage, null, (FuelType)row.Fuel, (TransmissionType)row.Transmission, null);
                vehicle.UpdateListedValue(row.ListedValue);
                if (!plates.Add(plate)) { skipped++; continue; }
                imported.Add(vehicle);
            } catch (ArgumentException ex) { errors.Add($"Linha {index + 2}: {ex.Message}"); }
        }
        if (errors.Count > 0) return BadRequest(new { message = "Corrija o arquivo. Nenhum veículo foi importado.\n" + string.Join("\n", errors), errors });
        await limits.EnsureCanAddVehiclesAsync(imported.Count, ct);
        if (request.Commit) {
            db.Vehicles.AddRange(imported);
            db.AuditLogs.Add(new AuditLog(tenant.UserId, "Importação de estoque", "Store", tenant.TenantId.ToString(),
                $"{imported.Count} veículos importados; {skipped} placas já cadastradas."));
            await db.SaveChangesAsync(ct);
        }
        await transaction.CommitAsync(ct);
        return Ok(new { committed = request.Commit, accepted = imported.Count, skipped,
            preview = imported.Select(x => new { x.Brand, x.Model, x.Plate, x.ModelYear, x.ListedValue }) });
    }
    private static string NormalizePlate(string value) => value.Replace("-", "").Replace(" ", "").Trim().ToUpperInvariant();
}
