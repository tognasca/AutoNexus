using AutoNexus.Application.DTOs;
using AutoNexus.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AutoNexus.Api.Controllers;

/// <summary>
/// Catálogo FIPE atual usado nos formulários de cadastro/edição.
/// Não depende de um veículo já criado, permitindo o efeito cascata antes do POST do veículo.
/// </summary>
[ApiController]
[Route("api/fipe/catalog")]
[Authorize]
public class FipeCatalogController : ControllerBase
{
    private readonly IFipeExternalService _fipeExternalService;

    public FipeCatalogController(IFipeExternalService fipeExternalService)
    {
        _fipeExternalService = fipeExternalService;
    }

    [HttpGet("brands")]
    [ProducesResponseType(typeof(IEnumerable<FipeLookupItemDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetBrands([FromQuery] string vehicleType = "Carro", CancellationToken cancellationToken = default)
    {
        var brands = await _fipeExternalService.GetBrandsAsync(vehicleType, cancellationToken);
        return Ok(brands);
    }

    [HttpGet("brands/{brandCode}/models")]
    [ProducesResponseType(typeof(IEnumerable<FipeLookupItemDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetModels(string brandCode, [FromQuery] string vehicleType = "Carro", CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(brandCode))
            return BadRequest(new { message = "Código da marca é obrigatório." });

        var models = await _fipeExternalService.GetModelsAsync(vehicleType, brandCode, cancellationToken);
        return Ok(models);
    }

    [HttpGet("brands/{brandCode}/models/{modelCode}/years")]
    [ProducesResponseType(typeof(IEnumerable<FipeLookupItemDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetYears(string brandCode, string modelCode, [FromQuery] string vehicleType = "Carro", CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(brandCode) || string.IsNullOrWhiteSpace(modelCode))
            return BadRequest(new { message = "Marca e modelo são obrigatórios." });

        var years = await _fipeExternalService.GetYearsAsync(vehicleType, brandCode, modelCode, cancellationToken);
        return Ok(years);
    }

    [HttpGet("brands/{brandCode}/models/{modelCode}/years/{yearCode}/quote")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetQuote(
        string brandCode,
        string modelCode,
        string yearCode,
        [FromQuery] string vehicleType = "Carro",
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(brandCode) || string.IsNullOrWhiteSpace(modelCode) || string.IsNullOrWhiteSpace(yearCode))
            return BadRequest(new { message = "Marca, modelo e ano FIPE são obrigatórios." });

        var result = await _fipeExternalService.FetchByBrandModelYearAsync(
            vehicleType,
            brandCode,
            modelCode,
            yearCode,
            cancellationToken);

        return Ok(new
        {
            fipeValue = result.FipeValue,
            referenceMonth = result.Month,
            referenceYear = result.Year,
            fipeCode = result.FipeCode,
            source = "Tabela FIPE / Parallelum"
        });
    }
}
