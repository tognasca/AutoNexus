using AutoNexus.Application.DTOs;
using AutoNexus.Domain.Interfaces;
using AutoNexus.Domain.Entities;
using AutoNexus.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AutoNexus.Api.Controllers;

[ApiController]
[Route("api/lookups")]
[Route("api/lookup")]
public class LookupsController : ControllerBase
{
    private readonly ILookupRepository _lookupRepository;
    private readonly AutoNexusDbContext _context;

    public LookupsController(ILookupRepository lookupRepository, AutoNexusDbContext context)
    {
        _lookupRepository = lookupRepository;
        _context = context;
    }

    [HttpGet("vehicle-types")]
    [AllowAnonymous]
    public async Task<IActionResult> GetVehicleTypes(CancellationToken cancellationToken)
    {
        var types = await _lookupRepository.GetVehicleTypesAsync(true, cancellationToken);
        return Ok(types);
    }

    // Faltava: o repositório (GetBrandsAsync/GetModelsByBrandAsync) já existia,
    // mas ninguém tinha exposto essas duas rotas aqui — o frontend
    // (lookupService.ts) já esperava exatamente esses caminhos.
    [HttpGet("brands")]
    [AllowAnonymous]
    public async Task<IActionResult> GetBrands(CancellationToken cancellationToken)
    {
        var brands = await _lookupRepository.GetBrandsAsync(true, cancellationToken);
        var dtos = brands.Select(b => new LookupItemDto(b.Id, b.Name, null));
        return Ok(dtos);
    }

    [HttpGet("brands/{brandId:guid}/models")]
    [AllowAnonymous]
    public async Task<IActionResult> GetModelsByBrand(Guid brandId, CancellationToken cancellationToken)
    {
        var models = await _lookupRepository.GetModelsByBrandAsync(brandId, true, cancellationToken);
        var dtos = models.Select(m => new LookupItemDto(m.Id, m.Name, null));
        return Ok(dtos);
    }

    [HttpGet("cost-categories")]
    [Authorize]
    public async Task<IActionResult> GetCostCategories(CancellationToken cancellationToken)
    {
        var categories = await _lookupRepository.GetCostCategoriesAsync(true, cancellationToken);
        return Ok(categories);
    }

    [HttpGet("document-categories")]
    [Authorize]
    public async Task<IActionResult> GetDocumentCategories(CancellationToken cancellationToken)
    {
        // DocumentCategory é tenant-owned. A rota precisa do JWT para que o
        // filtro global do AutoNexusDbContext carregue apenas as categorias
        // da empresa autenticada; devolver IDs fictícios causava violação de FK
        // no upload, pois esses IDs nunca existiam em document_categories.
        var categories = (await _lookupRepository.GetDocumentCategoriesAsync(true, cancellationToken)).ToList();

        if (categories.Count == 0)
        {
            var defaults = new[]
            {
                new DocumentCategory("Laudo Cautelar", "Laudo de vistoria cautelar"),
                new DocumentCategory("CRLV / Documento", "Documento oficial do veículo"),
                new DocumentCategory("Nota Fiscal", "Nota fiscal de compra ou venda"),
                new DocumentCategory("Comprovante de Revisão", "Histórico de revisões e manutenções"),
                new DocumentCategory("Outros", "Outros documentos do veículo")
            };

            // O SaveChanges preenche TenantId com o tenant obtido do JWT validado.
            await _context.DocumentCategories.AddRangeAsync(defaults, cancellationToken);
            await _context.SaveChangesAsync(cancellationToken);

            categories = (await _lookupRepository.GetDocumentCategoriesAsync(true, cancellationToken)).ToList();
        }

        return Ok(categories.Select(x => new LookupItemDto(x.Id, x.Name, x.Description)).ToList());
    }
}
