using System.Text.RegularExpressions;
using AutoNexus.Domain.Interfaces;
using AutoNexus.Domain.Models;
using AutoNexus.Infrastructure.Integrations;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AutoNexus.Api.Controllers;

[ApiController]
[Route("api/credit/bv")]
[Authorize]
public sealed class BvFinancingConditionsController : ControllerBase
{
    private readonly IBvFinancingConditionsService _service;
    private readonly ILogger<BvFinancingConditionsController> _logger;

    public BvFinancingConditionsController(
        IBvFinancingConditionsService service,
        ILogger<BvFinancingConditionsController> logger)
    {
        _service = service;
        _logger = logger;
    }

    /// <summary>
    /// Consulta tabelas, taxas de retorno e prazos disponibilizados pelo BV para o parceiro.
    /// Esta operação não envia proposta de crédito.
    /// </summary>
    [HttpPost("financing-conditions")]
    [ProducesResponseType(typeof(BvFinancingConditionsResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetFinancingConditions(
        [FromBody] BvFinancingConditionsRequest request,
        CancellationToken cancellationToken)
    {
        if (request.PersonType is not ("F" or "J"))
            return BadRequest(new { message = "PersonType deve ser F (pessoa física) ou J (pessoa jurídica)." });

        if (string.IsNullOrWhiteSpace(request.VehicleCategoryDescription))
            return BadRequest(new { message = "A categoria do veículo é obrigatória." });

        if (request.CylinderQuantity < 0)
            return BadRequest(new { message = "A quantidade de cilindradas não pode ser negativa." });

        if (!Regex.IsMatch(request.VehicleModelYear ?? string.Empty, @"^\d{4}$"))
            return BadRequest(new { message = "O ano-modelo deve conter exatamente quatro dígitos." });

        if (request.FinancingEntryDate == default)
            return BadRequest(new { message = "A data de entrada do financiamento é obrigatória." });

        try
        {
            var result = await _service.GetConditionsAsync(request, cancellationToken);
            return Ok(result);
        }
        catch (BvOpenIntegrationException ex)
        {
            _logger.LogWarning(
                "Consulta BV indisponível. UpstreamStatus={UpstreamStatus}; CorrelationId={CorrelationId}",
                ex.UpstreamStatusCode,
                ex.CorrelationId);

            if (ex.UpstreamStatusCode == 400)
                return BadRequest(new { message = ex.Message, correlationId = ex.CorrelationId });

            return StatusCode(
                StatusCodes.Status503ServiceUnavailable,
                new { message = ex.Message, correlationId = ex.CorrelationId });
        }
    }
}
