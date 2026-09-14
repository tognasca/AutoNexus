using AutoNexus.Application.DTOs;
using AutoNexus.Application.Interfaces;
using AutoNexus.Domain.Entities;
using AutoNexus.Domain.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AutoNexus.Api.Controllers;

[ApiController]
[Route("api/vehicles/{vehicleId:guid}/photos")]
[Authorize]
public class VehiclePhotosController : ControllerBase
{
    private readonly IVehicleRepository _vehicleRepository;
    private readonly IStorageService _storageService;
    private readonly IUnitOfWork _unitOfWork;

    private static readonly HashSet<string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".jpg", ".jpeg", ".png", ".webp"
    };

    private const long MaxFileSize = 10 * 1024 * 1024; // 10 MB

    public VehiclePhotosController(
        IVehicleRepository vehicleRepository,
        IStorageService storageService,
        IUnitOfWork unitOfWork)
    {
        _vehicleRepository = vehicleRepository;
        _storageService = storageService;
        _unitOfWork = unitOfWork;
    }

    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<VehiclePhotoDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetPhotos(Guid vehicleId, CancellationToken cancellationToken)
    {
        var vehicle = await _vehicleRepository.GetByIdAsync(vehicleId, includeDetails: true, cancellationToken);
        if (vehicle == null) return NotFound(new { message = "Veículo não encontrado." });

        var photos = vehicle.Photos
            .OrderByDescending(p => p.IsMain)
            .ThenBy(p => p.Order)
            .Select(p => new VehiclePhotoDto(p.Id, p.FileName, p.StoragePath, p.IsMain, p.Order));

        return Ok(photos);
    }

    [HttpPost]
    [Consumes("multipart/form-data")]
    [ProducesResponseType(typeof(IEnumerable<VehiclePhotoDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UploadPhotos(Guid vehicleId, [FromForm] List<IFormFile> files, CancellationToken cancellationToken)
    {
        try
        {
            if (files == null || files.Count == 0)
                return BadRequest(new { message = "Nenhum arquivo enviado." });

            var vehicle = await _vehicleRepository.GetByIdAsync(vehicleId, includeDetails: true, cancellationToken);
            if (vehicle == null) return NotFound(new { message = "Veículo não encontrado." });

            var uploadedPhotos = new List<VehiclePhoto>();
            var hasExistingPhotos = vehicle.Photos.Any();

            foreach (var file in files)
            {
                if (file.Length > MaxFileSize)
                    return BadRequest(new { message = $"O arquivo {file.FileName} excede o limite de 10MB." });

                var extension = Path.GetExtension(file.FileName);
                if (string.IsNullOrEmpty(extension) || !AllowedExtensions.Contains(extension))
                    return BadRequest(new { message = $"Formato inválido ({extension}) para {file.FileName}. Permitidos: JPG, PNG, WEBP." });

                using var stream = file.OpenReadStream();
                var storagePath = await _storageService.SaveFileAsync(
                    stream,
                    file.FileName,
                    $"vehicles/{vehicleId}",
                    cancellationToken);

                var isMain = !hasExistingPhotos && uploadedPhotos.Count == 0;
                var order = vehicle.Photos.Count + uploadedPhotos.Count;

                var photo = new VehiclePhoto(
                    vehicleId,
                    file.FileName,
                    storagePath,
                    file.ContentType,
                    file.Length,
                    order,
                    isMain);

                // Adiciona explicitamente via repositório para definir EntityState.Added
                await _vehicleRepository.AddPhotoAsync(photo, cancellationToken);
                uploadedPhotos.Add(photo);
            }

            await _unitOfWork.CommitAsync(cancellationToken);

            var result = uploadedPhotos.Select(p => new VehiclePhotoDto(p.Id, p.FileName, p.StoragePath, p.IsMain, p.Order));
            return StatusCode(StatusCodes.Status201Created, result);
        }
        catch (Exception ex)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { 
                message = $"Erro ao salvar fotos: {ex.Message}", 
                detail = ex.InnerException?.Message 
            });
        }
    }

    [HttpPatch("{photoId:guid}/main")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> SetMainPhoto(Guid vehicleId, Guid photoId, CancellationToken cancellationToken)
    {
        var vehicle = await _vehicleRepository.GetByIdAsync(vehicleId, includeDetails: true, cancellationToken);
        if (vehicle == null) return NotFound(new { message = "Veículo não encontrado." });

        var targetPhoto = vehicle.Photos.FirstOrDefault(p => p.Id == photoId);
        if (targetPhoto == null) return NotFound(new { message = "Foto não encontrada." });

        foreach (var photo in vehicle.Photos)
        {
            if (photo.Id == photoId)
                photo.SetAsMain();
            else
                photo.UnsetMain();
        }

        await _unitOfWork.CommitAsync(cancellationToken);
        return NoContent();
    }

    [HttpDelete("{photoId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeletePhoto(Guid vehicleId, Guid photoId, CancellationToken cancellationToken)
    {
        var vehicle = await _vehicleRepository.GetByIdAsync(vehicleId, includeDetails: true, cancellationToken);
        if (vehicle == null) return NotFound(new { message = "Veículo não encontrado." });

        var photo = vehicle.Photos.FirstOrDefault(p => p.Id == photoId);
        if (photo == null) return NotFound(new { message = "Foto não encontrada." });

        var wasMain = photo.IsMain;
        await _storageService.DeleteFileAsync(photo.StoragePath, cancellationToken);
        _vehicleRepository.DeletePhoto(photo);

        if (wasMain && vehicle.Photos.Count > 1)
        {
            var nextMain = vehicle.Photos.FirstOrDefault(p => p.Id != photoId);
            nextMain?.SetAsMain();
        }

        await _unitOfWork.CommitAsync(cancellationToken);
        return NoContent();
    }
}