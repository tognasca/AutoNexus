using AutoNexus.Application.DTOs;
using AutoNexus.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AutoNexus.Api.Controllers;

[ApiController]
[Route("api/premium/catalog")]
[Authorize]
public sealed class PremiumCatalogController : ControllerBase
{
    private readonly IPremiumCatalogService _service;
    public PremiumCatalogController(IPremiumCatalogService service) => _service = service;

    [HttpGet("publication")]
    public async Task<ActionResult<PremiumCatalogPublicationDto?>> GetPublication(CancellationToken cancellationToken) =>
        Ok(await _service.GetPublicationAsync(cancellationToken));

    [HttpPut("publication")]
    public async Task<ActionResult<PremiumCatalogPublicationDto>> SavePublication(
        [FromBody] SavePremiumCatalogPublicationDto dto,
        CancellationToken cancellationToken)
    {
        try { return Ok(await _service.SavePublicationAsync(dto, cancellationToken)); }
        catch (UnauthorizedAccessException ex) { return StatusCode(StatusCodes.Status403Forbidden, new { message = ex.Message }); }
        catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
    }

    [HttpGet("package")]
    public async Task<IActionResult> DownloadPackage(CancellationToken cancellationToken)
    {
        try
        {
            var bytes = await _service.GeneratePackageAsync(cancellationToken);
            return File(bytes, "application/zip", "autonexus-catalogo-premium.zip");
        }
        catch (UnauthorizedAccessException ex) { return StatusCode(StatusCodes.Status403Forbidden, new { message = ex.Message }); }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
    }
}
