using AutoNexus.Application.DTOs;
using AutoNexus.Application.Interfaces;
using AutoNexus.Domain.Entities;
using AutoNexus.Domain.Enums;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AutoNexus.Infrastructure.Data;
using System.Text.Json;

namespace AutoNexus.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class VehiclesController : ControllerBase
{
    private readonly IVehicleService _vehicleService;
    private readonly IAuthService _authService;
    private readonly IWebHostEnvironment _environment;
    private readonly AutoNexusDbContext _dbContext;

    public VehiclesController(
        IVehicleService vehicleService,
        IAuthService authService,
        IWebHostEnvironment environment,
        AutoNexusDbContext dbContext)
    {
        _vehicleService = vehicleService;
        _authService = authService;
        _environment = environment;
        _dbContext = dbContext;
    }

    [HttpGet]
    public async Task<IActionResult> GetPaged(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] Guid? vehicleTypeId = null,
        [FromQuery] VehicleStatus? status = null,
        [FromQuery] string? search = null,
        [FromQuery] decimal? minPrice = null,
        [FromQuery] decimal? maxPrice = null,
        [FromQuery] int? minYear = null,
        [FromQuery] int? maxYear = null,
        CancellationToken cancellationToken = default)
    {
        var filter = new VehicleFilterDto(page, pageSize, vehicleTypeId, status, search, minPrice, maxPrice, minYear, maxYear);
        var result = await _vehicleService.GetAllPagedAsync(filter, cancellationToken);
        return Ok(result);
    }

    [HttpGet("inventory-summary")]
    public async Task<IActionResult> GetInventorySummary(CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;
        var active = _dbContext.Vehicles.Where(v => v.Status != VehicleStatus.Vendido);
        var result = new
        {
            total = await _dbContext.Vehicles.CountAsync(cancellationToken),
            available = await _dbContext.Vehicles.CountAsync(v => v.Status == VehicleStatus.AVenda, cancellationToken),
            reserved = await _dbContext.Vehicles.CountAsync(v => v.Status == VehicleStatus.Reservado, cancellationToken),
            sold = await _dbContext.Vehicles.CountAsync(v => v.Status == VehicleStatus.Vendido, cancellationToken),
            over60Days = await active.CountAsync(v => v.CreatedAt <= now.AddDays(-60), cancellationToken),
            over90Days = await active.CountAsync(v => v.CreatedAt <= now.AddDays(-90), cancellationToken)
        };
        return Ok(result);
    }

    [HttpGet("{id:guid}/history")]
    public async Task<IActionResult> GetVehicleHistory(Guid id, CancellationToken cancellationToken)
    {
        var vehicle = await _dbContext.Vehicles.AsNoTracking()
            .Where(v => v.Id == id)
            .Select(v => new { v.Id })
            .FirstOrDefaultAsync(cancellationToken);
        if (vehicle is null) return NotFound(new { message = "Veículo não encontrado." });

        var history = await _dbContext.AuditLogs.AsNoTracking()
            .Where(x => x.Resource == "Vehicle" && x.ResourceId == id.ToString())
            .OrderByDescending(x => x.ExecutedAt)
            .Select(x => new { x.Id, x.Operation, x.Details, x.UserId, x.ExecutedAt })
            .Take(100)
            .ToListAsync(cancellationToken);
        return Ok(history);
    }

    [HttpPatch("{id:guid}/status")]
    public async Task<IActionResult> ChangeStatus(Guid id, [FromBody] ChangeVehicleStatusRequest request, CancellationToken cancellationToken)
    {
        if (!Enum.IsDefined(typeof(VehicleStatus), request.Status))
            return BadRequest(new { message = "Status do veículo inválido." });

        var vehicle = await _vehicleService.GetByIdAsync(id, cancellationToken);
        if (vehicle is null) return NotFound(new { message = "Veículo não encontrado." });
        var previousStatus = vehicle.Status;
        await _vehicleService.ChangeStatusAsync(id, request.Status, cancellationToken);
        await RegisterVehicleHistoryAsync(id, "Alteração de status", $"Status alterado de {previousStatus} para {request.Status}.", cancellationToken);
        return Ok(new { message = "Status atualizado com sucesso." });
    }

    public sealed record ChangeVehicleStatusRequest(VehicleStatus Status);

    private async Task RegisterVehicleHistoryAsync(Guid vehicleId, string operation, string details, CancellationToken cancellationToken)
    {
        var userIdValue = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;
        Guid? userId = Guid.TryParse(userIdValue, out var parsedUserId) ? parsedUserId : null;
        _dbContext.AuditLogs.Add(new AuditLog(userId, operation, "Vehicle", vehicleId.ToString(), details));
        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var vehicle = await _vehicleService.GetByIdAsync(id, cancellationToken);
        if (vehicle == null) return NotFound(new { message = "Veículo não encontrado." });
        return Ok(vehicle);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateVehicleDto dto, CancellationToken cancellationToken)
    {
        if (dto == null)
            return BadRequest(new { message = "Os dados do veículo são obrigatórios." });

        var validationError = ValidateVehicleInput(
            dto.VehicleTypeId, dto.Brand, dto.Model, dto.ManufacturingYear,
            dto.ModelYear, dto.Plate, dto.Mileage, dto.PurchaseValue, dto.ListedValue);
        if (validationError != null)
            return BadRequest(new { message = validationError });

        var vehicleId = await _vehicleService.CreateAsync(dto, cancellationToken);
        await RegisterVehicleHistoryAsync(vehicleId, "Cadastro", $"Veículo {dto.Brand} {dto.Model} cadastrado no estoque.", cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = vehicleId }, new { id = vehicleId });
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateVehicleDto dto, CancellationToken cancellationToken)
    {
        if (dto == null)
            return BadRequest(new { message = "Os dados do veículo são obrigatórios." });

        var validationError = ValidateVehicleInput(
            dto.VehicleTypeId, dto.Brand, dto.Model, dto.ManufacturingYear,
            dto.ModelYear, dto.Plate, dto.Mileage, dto.PurchaseValue, dto.ListedValue);
        if (validationError != null)
            return BadRequest(new { message = validationError });

        var before = await _vehicleService.GetByIdAsync(id, cancellationToken);
        await _vehicleService.UpdateAsync(id, dto, cancellationToken);
        var changes = new List<string>();
        if (before is not null && before.ListedValue != dto.ListedValue) changes.Add($"Preço anunciado: {before.ListedValue:C} → {dto.ListedValue:C}");
        if (before is not null && before.PurchaseValue != dto.PurchaseValue) changes.Add($"Valor de compra: {before.PurchaseValue:C} → {dto.PurchaseValue:C}");
        if (before is not null && before.Status != dto.Status) changes.Add($"Status: {before.Status} → {dto.Status}");
        if (changes.Count == 0) changes.Add("Dados cadastrais do veículo atualizados.");
        await RegisterVehicleHistoryAsync(id, "Edição", string.Join("; ", changes), cancellationToken);
        return Ok(new { message = "Veículo atualizado com sucesso." });
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        return StatusCode(StatusCodes.Status403Forbidden, new { message = "A exclusão definitiva de veículos não é permitida. Registre a venda ou altere a situação do veículo para preservar o histórico da loja." });
    }

    [HttpPost("{id:guid}/sell")]
    public async Task<IActionResult> SellVehicle(Guid id, [FromBody] SellVehicleDto dto, CancellationToken cancellationToken)
    {
        if (dto == null || dto.SaleValue <= 0)
        {
            return BadRequest(new { message = "O valor final de venda deve ser maior que R$ 0,00." });
        }

        // O vendedor nunca deve ser informado pelo frontend: usa exclusivamente
        // a identidade autenticada e confirma que o usuário ainda existe neste tenant.
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst("sub")?.Value;

        if (!Guid.TryParse(userIdClaim, out var sellerId))
            return Unauthorized(new { message = "Não foi possível identificar o usuário da sessão. Entre novamente." });

        var currentUser = await _authService.GetCurrentUserAsync(sellerId, cancellationToken);
        if (currentUser is null || !currentUser.IsActive)
            return Unauthorized(new { message = "O usuário da sessão não está mais ativo neste cadastro. Entre novamente." });

        var updatedDto = new SellVehicleDto(dto.SaleValue, sellerId, dto.SoldAt);

        await _vehicleService.SellVehicleAsync(id, updatedDto, cancellationToken);
        await RegisterVehicleHistoryAsync(id, "Venda registrada", $"Veículo vendido por {dto.SaleValue:C}.", cancellationToken);
        return Ok(new { message = "Venda registrada com sucesso." });
    }

    [HttpGet("photos/{fileName}")]
    [AllowAnonymous]
    public IActionResult GetPhotoFile(string fileName)
    {
        // Compatibilidade com imagens antigas: aceita somente um nome simples
        // e extensões de imagem. Nunca permite segmentos de diretório.
        if (string.IsNullOrWhiteSpace(fileName) ||
            !string.Equals(Path.GetFileName(fileName), fileName, StringComparison.Ordinal) ||
            !new[] { ".jpg", ".jpeg", ".png", ".webp" }
                .Contains(Path.GetExtension(fileName), StringComparer.OrdinalIgnoreCase))
        {
            return NotFound(new { message = "Arquivo de imagem não encontrado." });
        }

        var uploadsPath = Path.Combine(_environment.ContentRootPath, "uploads", "vehicles", fileName);
        if (!System.IO.File.Exists(uploadsPath))
        {
            uploadsPath = Path.Combine(_environment.ContentRootPath, "uploads", fileName);
        }

        if (!System.IO.File.Exists(uploadsPath))
            return NotFound(new { message = "Arquivo de imagem não encontrado." });

        var provider = new Microsoft.AspNetCore.StaticFiles.FileExtensionContentTypeProvider();
        if (!provider.TryGetContentType(fileName, out var contentType))
            return NotFound(new { message = "Formato de imagem não suportado." });

        return PhysicalFile(uploadsPath, contentType);
    }

    [HttpGet("{id:guid}/photos")]
    public async Task<IActionResult> GetPhotos(Guid id, CancellationToken cancellationToken)
    {
        var vehicle = await _vehicleService.GetByIdAsync(id, cancellationToken);
        if (vehicle == null) return NotFound();
        return Ok(vehicle.Photos);
    }

    // A rota pública legada de documentos foi removida. Downloads agora
    // devem usar VehicleDocumentsController.DownloadDocument, que valida
    // veículo, documento e tenant antes de ler o arquivo.

    private static string? ValidateVehicleInput(
        Guid vehicleTypeId,
        string brand,
        string model,
        int manufacturingYear,
        int modelYear,
        string? plate,
        int mileage,
        decimal purchaseValue,
        decimal? listedValue)
    {
        var currentYear = DateTime.UtcNow.Year;
        if (vehicleTypeId == Guid.Empty)
            return "Selecione o tipo do veículo.";
        if (string.IsNullOrWhiteSpace(brand))
            return "A marca do veículo é obrigatória.";
        if (string.IsNullOrWhiteSpace(model))
            return "O modelo do veículo é obrigatório.";
        if (manufacturingYear < 1900 || manufacturingYear > currentYear + 1)
            return "O ano de fabricação informado é inválido.";
        if (modelYear < manufacturingYear || modelYear > currentYear + 2)
            return "O ano do modelo deve ser igual ou posterior ao ano de fabricação e estar dentro de um intervalo válido.";
        if (mileage < 0)
            return "A quilometragem não pode ser negativa.";
        if (purchaseValue < 0)
            return "O valor de compra não pode ser negativo.";
        if (listedValue.HasValue && listedValue.Value < 0)
            return "O valor anunciado não pode ser negativo.";
        if (!string.IsNullOrWhiteSpace(plate))
        {
            var normalizedPlate = plate.Trim().ToUpperInvariant();
            if (!System.Text.RegularExpressions.Regex.IsMatch(normalizedPlate, @"^(?:[A-Z]{3}[0-9]{4}|[A-Z]{3}[0-9][A-Z][0-9]{2})$"))
                return "A placa deve seguir o padrão antigo (ABC1234) ou Mercosul (ABC1D23).";
        }
        return null;
    }

}
