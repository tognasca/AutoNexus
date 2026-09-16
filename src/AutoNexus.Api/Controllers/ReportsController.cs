using AutoNexus.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AutoNexus.Api.Controllers;

[ApiController]
[Route("api/reports")]
[Authorize]
public class ReportsController : ControllerBase
{
    private readonly IReportService _reportService;

    public ReportsController(IReportService reportService)
    {
        _reportService = reportService;
    }

    [HttpGet("dre")]
    public async Task<IActionResult> GetDreReport(CancellationToken cancellationToken)
    {
        var report = await _reportService.GetVehicleDreReportAsync(cancellationToken);
        return Ok(report);
    }

    [HttpGet("aging-stock")]
    public async Task<IActionResult> GetAgingStock(CancellationToken cancellationToken)
    {
        var report = await _reportService.GetAgingStockReportAsync(cancellationToken);
        return Ok(report);
    }

    [HttpGet("commissions")]
    public async Task<IActionResult> GetCommissions(CancellationToken cancellationToken)
    {
        var report = await _reportService.GetSellerCommissionsAsync(cancellationToken);
        return Ok(report);
    }
}