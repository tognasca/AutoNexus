using AutoNexus.Application.DTOs;
using AutoNexus.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AutoNexus.Api.Controllers;

[ApiController]
[Route("api/bank-configs")]
[Authorize]
public class BankConfigController : ControllerBase
{
    private readonly IBankConfigService _bankConfigService;

    public BankConfigController(IBankConfigService bankConfigService)
    {
        _bankConfigService = bankConfigService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        var configs = await _bankConfigService.GetAllConfigsAsync(cancellationToken);
        return Ok(configs);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var config = await _bankConfigService.GetByIdAsync(id, cancellationToken);
        if (config == null) return NotFound(new { message = "Configuração bancária não encontrada." });
        return Ok(config);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateBankConfigDto dto, CancellationToken cancellationToken)
    {
        try
        {
            var result = await _bankConfigService.CreateConfigAsync(dto, cancellationToken);
            return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateBankConfigDto dto, CancellationToken cancellationToken)
    {
        try
        {
            var result = await _bankConfigService.UpdateConfigAsync(id, dto, cancellationToken);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPatch("{id:guid}/toggle-active")]
    public async Task<IActionResult> ToggleActive(Guid id, CancellationToken cancellationToken)
    {
        try
        {
            var active = await _bankConfigService.ToggleActiveAsync(id, cancellationToken);
            return Ok(new { isActive = active });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }
}