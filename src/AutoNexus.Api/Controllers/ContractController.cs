using System;
using System.Threading.Tasks;
using AutoNexus.Application.DTOs.Contract;
using AutoNexus.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AutoNexus.Api.Controllers;

[ApiController]
[Route("api/vehicles/{vehicleId:guid}/contract")]
[Authorize]
public class ContractController : ControllerBase
{
    private readonly IContractService _contractService;

    public ContractController(IContractService contractService)
    {
        _contractService = contractService;
    }

    [HttpPost("generate")]
    public async Task<IActionResult> GenerateContract(Guid vehicleId, [FromBody] ContractRequestDto request)
    {
        try
        {
            var result = await _contractService.GenerateContractDataAsync(vehicleId, request);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}