using AutoNexus.Application.DTOs;
using AutoNexus.Domain.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AutoNexus.Api.Controllers;

[ApiController]
[Route("api/lookups")]
[Route("api/lookup")]
public class LookupsController : ControllerBase
{
    private readonly ILookupRepository _lookupRepository;

    public LookupsController(ILookupRepository lookupRepository)
    {
        _lookupRepository = lookupRepository;
    }

    [HttpGet("vehicle-types")]
    [AllowAnonymous]
    public async Task<IActionResult> GetVehicleTypes(CancellationToken cancellationToken)
    {
        var types = await _lookupRepository.GetVehicleTypesAsync(true, cancellationToken);
        return Ok(types);
    }

    [HttpGet("cost-categories")]
    [Authorize]
    public async Task<IActionResult> GetCostCategories(CancellationToken cancellationToken)
    {
        var categories = await _lookupRepository.GetCostCategoriesAsync(true, cancellationToken);
        return Ok(categories);
    }

    [HttpGet("document-categories")]
    [AllowAnonymous]
    public async Task<IActionResult> GetDocumentCategories(CancellationToken cancellationToken)
    {
        try
        {
            var items = await _lookupRepository.GetDocumentCategoriesAsync(true, cancellationToken);
            var dtos = items.Select(x => new LookupItemDto(x.Id, x.Name, x.Description)).ToList();

            if (dtos.Count == 0)
            {
                return Ok(new[]
                {
                    new LookupItemDto(Guid.Parse("11111111-1111-1111-1111-111111111111"), "Laudo Cautelar", "Laudo de vistoria cautelar"),
                    new LookupItemDto(Guid.Parse("22222222-2222-2222-2222-222222222222"), "CRLV / Documento", "Documento do veículo"),
                    new LookupItemDto(Guid.Parse("33333333-3333-3333-3333-333333333333"), "Nota Fiscal", "Nota fiscal de compra/venda"),
                    new LookupItemDto(Guid.Parse("44444444-4444-4444-4444-444444444444"), "Comprovante de Revisão", "Histórico de manutenções"),
                    new LookupItemDto(Guid.Parse("55555555-5555-5555-5555-555555555555"), "Outros", "Outros documentos")
                });
            }

            return Ok(dtos);
        }
        catch
        {
            return Ok(new[]
            {
                new LookupItemDto(Guid.Parse("11111111-1111-1111-1111-111111111111"), "Laudo Cautelar", "Laudo de vistoria cautelar"),
                new LookupItemDto(Guid.Parse("22222222-2222-2222-2222-222222222222"), "CRLV / Documento", "Documento do veículo"),
                new LookupItemDto(Guid.Parse("33333333-3333-3333-3333-333333333333"), "Nota Fiscal", "Nota fiscal de compra/venda"),
                new LookupItemDto(Guid.Parse("44444444-4444-4444-4444-444444444444"), "Comprovante de Revisão", "Histórico de manutenções"),
                new LookupItemDto(Guid.Parse("55555555-5555-5555-5555-555555555555"), "Outros", "Outros documentos")
            });
        }
    }
}