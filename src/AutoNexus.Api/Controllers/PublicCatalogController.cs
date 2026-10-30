using System.Text;
using AutoNexus.Application.DTOs;
using AutoNexus.Application.Interfaces;
using AutoNexus.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AutoNexus.Infrastructure.Data;
using AutoNexus.Domain.Interfaces;

namespace AutoNexus.Api.Controllers;

[ApiController]
[Route("api/public")]
[AllowAnonymous]
public class PublicCatalogController : ControllerBase
{
    private readonly AutoNexusDbContext _context;
    private readonly IVehicleService _vehicleService;
    private readonly IFeedExportService _feedExportService;
    private readonly IAiDescriptionService _aiDescriptionService;
    private readonly ITenantContext _tenantContext;

    public PublicCatalogController(
        AutoNexusDbContext context,
        IVehicleService vehicleService, 
        IFeedExportService feedExportService,
        IAiDescriptionService aiDescriptionService,
        ITenantContext tenantContext)
    {
        _context = context;
        _vehicleService = vehicleService;
        _feedExportService = feedExportService;
        _aiDescriptionService = aiDescriptionService;
        _tenantContext = tenantContext;
    }

    // A tela de catálogo aberta dentro do painel usa o tenant do JWT validado.
    // Assim, a loja não cai silenciosamente no tenant "default".
    [HttpGet("catalog/current")]
    [Authorize]
    public async Task<IActionResult> GetCurrentTenantCatalog(CancellationToken cancellationToken)
    {
        if (!_tenantContext.HasTenant)
            return Unauthorized(new { message = "Não foi possível identificar a empresa da sessão." });

        var tenant = await _context.Tenants.AsNoTracking()
            .SingleOrDefaultAsync(t => t.Id == _tenantContext.TenantId && t.IsActive, cancellationToken);
        if (tenant == null)
            return NotFound(new { message = "Empresa não encontrada ou inativa." });

        return await GetPublicCatalog(tenant.Slug, cancellationToken);
    }

    [HttpGet("catalog")]
    public async Task<IActionResult> GetPublicCatalog(
        [FromQuery] string? store,
        CancellationToken cancellationToken)
    {
        // O catálogo público é sempre vinculado a uma empresa explícita.
        // "default" mantém compatibilidade com a rota antiga /catalogo.
        var slug = string.IsNullOrWhiteSpace(store) ? "default" : store.Trim().ToLowerInvariant();
        var tenant = await _context.Tenants.AsNoTracking()
            .SingleOrDefaultAsync(t => t.Slug == slug && t.IsActive, cancellationToken);
        if (tenant == null) return NotFound(new { message = "Loja não encontrada ou inativa." });

        // IgnoreQueryFilters é usado apenas nesta rota pública e a consulta
        // aplica obrigatoriamente o TenantId resolvido pelo slug ativo.
        var settings = await _context.TenantSettings.IgnoreQueryFilters().AsNoTracking()
            .Where(s => s.TenantId == tenant.Id)
            .Select(s => new { s.CompanyName, s.LogoUrl, s.PrimaryColor })
            .FirstOrDefaultAsync(cancellationToken);

        var vehicles = await _context.Vehicles.IgnoreQueryFilters()
            .AsNoTracking()
            .Where(v => v.TenantId == tenant.Id && v.Status == VehicleStatus.AVenda)
            .Include(v => v.VehicleType)
            .Include(v => v.Photos)
            .OrderByDescending(v => v.CreatedAt)
            .Select(v => new
            {
                id = v.Id,
                vehicleTypeName = v.VehicleType.Name,
                brand = v.Brand,
                model = v.Model,
                version = v.Version,
                manufacturingYear = v.ManufacturingYear,
                modelYear = v.ModelYear,
                mileage = v.Mileage,
                color = v.Color,
                fuel = v.Fuel.HasValue ? v.Fuel.Value.ToString() : null,
                transmission = v.Transmission.HasValue ? v.Transmission.Value.ToString() : null,
                status = v.Status.ToString(),
                listedValue = v.ListedValue,
                mainPhotoUrl = v.Photos.Where(p => p.IsMain).Select(p => p.StoragePath).FirstOrDefault()
                    ?? v.Photos.Select(p => p.StoragePath).FirstOrDefault(),
                createdAt = v.CreatedAt
            }).ToListAsync(cancellationToken);

        return Ok(new
        {
            store = new
            {
                name = settings?.CompanyName ?? tenant.Name,
                slug = tenant.Slug,
                logoUrl = settings?.LogoUrl,
                primaryColor = settings?.PrimaryColor ?? "#2563eb"
            },
            items = vehicles
        });
    }

    [HttpGet("catalog/{id:guid}")]
    public async Task<IActionResult> GetPublicVehicleDetails(
        Guid id,
        [FromQuery] string? store,
        CancellationToken cancellationToken)
    {
        var slug = string.IsNullOrWhiteSpace(store) ? "default" : store.Trim().ToLowerInvariant();
        var tenant = await _context.Tenants.AsNoTracking()
            .SingleOrDefaultAsync(t => t.Slug == slug && t.IsActive, cancellationToken);
        if (tenant == null) return NotFound(new { message = "Loja não encontrada ou inativa." });

        var vehicle = await _context.Vehicles.IgnoreQueryFilters()
            .AsNoTracking()
            .Where(v => v.Id == id && v.TenantId == tenant.Id && v.Status == VehicleStatus.AVenda)
            .Include(v => v.VehicleType)
            .Include(v => v.Photos)
            .Include(v => v.Documents).ThenInclude(d => d.DocumentCategory)
            .FirstOrDefaultAsync(cancellationToken);

        if (vehicle == null)
            return NotFound(new { message = "Veículo não encontrado no catálogo desta loja." });

        // Nunca enviar placa, chassi, Renavam, valor de compra, custos ou
        // documentos que não foram explicitamente marcados para exibição.
        return Ok(new
        {
            id = vehicle.Id,
            vehicleTypeName = vehicle.VehicleType.Name,
            brand = vehicle.Brand,
            model = vehicle.Model,
            version = vehicle.Version,
            manufacturingYear = vehicle.ManufacturingYear,
            modelYear = vehicle.ModelYear,
            mileage = vehicle.Mileage,
            color = vehicle.Color,
            fuel = vehicle.Fuel?.ToString(),
            transmission = vehicle.Transmission?.ToString(),
            status = vehicle.Status.ToString(),
            listedValue = vehicle.ListedValue,
            saleValue = vehicle.SaleValue,
            notes = vehicle.Notes,
            mainPhotoUrl = vehicle.Photos.FirstOrDefault(p => p.IsMain)?.StoragePath ?? vehicle.Photos.FirstOrDefault()?.StoragePath,
            photos = vehicle.Photos.Select(p => new { id = p.Id, url = p.StoragePath, isMain = p.IsMain }).ToList(),
            documents = vehicle.Documents.Where(d => d.ShowInCatalog).Select(d => new
            {
                id = d.Id,
                name = d.Name,
                documentType = d.DocumentCategory.Name,
                fileUrl = d.StoragePath,
                createdAt = d.CreatedAt
            }).ToList()
        });
    }

    [HttpGet("feed/xml")]
    [Produces("application/xml")]
    public async Task<IActionResult> GetXmlFeed()
    {
        var xmlContent = await _feedExportService.GenerateXmlFeedAsync();
        return Content(xmlContent, "application/xml", Encoding.UTF8);
    }

    [HttpPost("generate-ai-description")]
    public IActionResult GenerateAiDescription([FromBody] GenerateAiDescriptionDto dto)
    {
        var copy = _aiDescriptionService.GenerateVehicleAdDescription(
            dto.Brand, 
            dto.Model, 
            dto.Year, 
            dto.Price, 
            dto.FipePrice, 
            dto.Mileage, 
            dto.Color, 
            dto.FuelType, 
            dto.Transmission, 
            dto.Optionals);

        return Ok(new { description = copy });
    }
}