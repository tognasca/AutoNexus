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
    ".jpg",
    ".jpeg",
    ".png",
    ".webp"
};

    private const long MaxFileSize = 10 * 1024 * 1024;

    public VehiclePhotosController(
        IVehicleRepository vehicleRepository,
        IStorageService storageService,
        IUnitOfWork unitOfWork)
    {
        _vehicleRepository = vehicleRepository;
        _storageService = storageService;
        _unitOfWork = unitOfWork;
    }

    [HttpPost]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(52_428_800)]
    [RequestFormLimits(MultipartBodyLengthLimit = 52_428_800)]
    [ProducesResponseType(typeof(IEnumerable<VehiclePhotoDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UploadPhotos(
        Guid vehicleId,
        [FromForm] IFormFileCollection files,
        CancellationToken cancellationToken)
    {
        try
        {
            if (files == null || files.Count == 0)
            {
                return BadRequest(new
                {
                    message = "Nenhum arquivo enviado."
                });
            }

            var vehicle = await _vehicleRepository.GetByIdAsync(
                vehicleId,
                includeDetails: true,
                cancellationToken);

            if (vehicle == null)
            {
                return NotFound(new
                {
                    message = "Veículo não encontrado."
                });
            }

            var uploadedPhotos = new List<VehiclePhoto>();
            var hasExistingPhotos = vehicle.Photos.Any();

            foreach (var file in files)
            {
                if (file.Length <= 0)
                {
                    continue;
                }

                if (file.Length > MaxFileSize)
                {
                    return BadRequest(new
                    {
                        message = $"O arquivo {file.FileName} excede o limite de 10MB."
                    });
                }

                var extension = ResolveExtension(file);

                if (string.IsNullOrWhiteSpace(extension) ||
                    !AllowedExtensions.Contains(extension))
                {
                    return BadRequest(new
                    {
                        message =
                            $"Formato inválido para {file.FileName}. " +
                            "Permitidos: JPG, JPEG, PNG e WEBP."
                    });
                }

                var safeFileName = string.IsNullOrWhiteSpace(file.FileName)
                    ? $"foto_{Guid.NewGuid():N}{extension}"
                    : Path.GetFileName(file.FileName);

                if (string.IsNullOrWhiteSpace(Path.GetExtension(safeFileName)))
                {
                    safeFileName += extension;
                }

                await using var stream = file.OpenReadStream();

                var storagePath = await _storageService.SaveFileAsync(
                    stream,
                    safeFileName,
                    $"vehicles/{vehicleId}",
                    cancellationToken);

                var isMain =
                    !hasExistingPhotos &&
                    uploadedPhotos.Count == 0;

                var order =
                    vehicle.Photos.Count +
                    uploadedPhotos.Count;

                var mimeType = string.IsNullOrWhiteSpace(file.ContentType)
                    ? "image/jpeg"
                    : file.ContentType;

                var photo = new VehiclePhoto(
                    vehicleId,
                    safeFileName,
                    storagePath,
                    mimeType,
                    file.Length,
                    order,
                    isMain);

                await _vehicleRepository.AddPhotoAsync(
                    photo,
                    cancellationToken);

                uploadedPhotos.Add(photo);
            }

            if (uploadedPhotos.Count == 0)
            {
                return BadRequest(new
                {
                    message = "Nenhum arquivo válido enviado."
                });
            }

            await _unitOfWork.CommitAsync(cancellationToken);

            var result = uploadedPhotos.Select(p =>
                new VehiclePhotoDto(
                    p.Id,
                    p.FileName,
                    p.StoragePath,
                    p.IsMain,
                    p.Order));

            return StatusCode(
                StatusCodes.Status201Created,
                result);
        }
        catch (Exception ex)
        {
            return StatusCode(
                StatusCodes.Status500InternalServerError,
                new
                {
                    message = "Erro ao salvar fotos.",
                    detail = ex.Message,
                    innerException = ex.InnerException?.Message
                });
        }
    }

    private static string ResolveExtension(IFormFile file)
    {
        var extension = Path.GetExtension(file.FileName);

        if (!string.IsNullOrWhiteSpace(extension))
        {
            return extension;
        }

        return file.ContentType switch
        {
            "image/png" => ".png",
            "image/webp" => ".webp",
            "image/jpeg" => ".jpg",
            "image/jpg" => ".jpg",
            _ => ".jpg"
        };
    }

    [HttpPatch("{photoId:guid}/main")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> SetMainPhoto(
        Guid vehicleId,
        Guid photoId,
        CancellationToken cancellationToken)
    {
        try
        {
            var vehicle = await _vehicleRepository.GetByIdAsync(
                vehicleId,
                includeDetails: true,
                cancellationToken);

            if (vehicle == null)
            {
                return NotFound(new
                {
                    message = "Veículo não encontrado."
                });
            }

            var targetPhoto =
                vehicle.Photos.FirstOrDefault(p => p.Id == photoId);

            if (targetPhoto == null)
            {
                return NotFound(new
                {
                    message = "Foto não encontrada."
                });
            }

            foreach (var photo in vehicle.Photos)
            {
                if (photo.Id == photoId)
                {
                    photo.SetAsMain();
                }
                else
                {
                    photo.UnsetMain();
                }
            }

            await _unitOfWork.CommitAsync(cancellationToken);

            return NoContent();
        }
        catch (Exception ex)
        {
            return StatusCode(
                StatusCodes.Status500InternalServerError,
                new
                {
                    message = "Erro ao definir foto principal.",
                    detail = ex.Message,
                    innerException = ex.InnerException?.Message
                });
        }
    }

    [HttpDelete("{photoId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeletePhoto(
        Guid vehicleId,
        Guid photoId,
        CancellationToken cancellationToken)
    {
        try
        {
            Console.WriteLine(
                $"🗑️ DELETE FOTO - VehicleId: {vehicleId} - PhotoId: {photoId}");

            var vehicle = await _vehicleRepository.GetByIdAsync(
                vehicleId,
                includeDetails: true,
                cancellationToken);

            if (vehicle == null)
            {
                Console.WriteLine("❌ Veículo não encontrado.");

                return NotFound(new
                {
                    message = "Veículo não encontrado."
                });
            }

            var photo =
                vehicle.Photos.FirstOrDefault(p => p.Id == photoId);

            if (photo == null)
            {
                Console.WriteLine("❌ Foto não encontrada.");

                return NotFound(new
                {
                    message = "Foto não encontrada."
                });
            }

            Console.WriteLine(
                $"📸 Foto encontrada: {photo.Id}");

            Console.WriteLine(
                $"📁 StoragePath: {photo.StoragePath}");

            var wasMain = photo.IsMain;

            /*
             * Primeiro remove o registro do banco.
             */
            _vehicleRepository.DeletePhoto(photo);

            /*
             * Se a foto excluída era a principal,
             * escolhe outra foto para ser a capa.
             */
            if (wasMain)
            {
                var nextMain = vehicle.Photos
                    .Where(p => p.Id != photoId)
                    .OrderBy(p => p.Order)
                    .FirstOrDefault();

                if (nextMain != null)
                {
                    nextMain.SetAsMain();

                    Console.WriteLine(
                        $"⭐ Nova foto principal: {nextMain.Id}");
                }
            }

            /*
             * Salva a alteração no banco.
             */
            await _unitOfWork.CommitAsync(cancellationToken);

            Console.WriteLine(
                "✅ Registro da foto removido do banco.");

            /*
             * Depois tenta remover o arquivo físico.
             *
             * Se o arquivo já não existir, não devemos
             * considerar isso um erro para o usuário.
             */
            try
            {
                if (!string.IsNullOrWhiteSpace(photo.StoragePath))
                {
                    Console.WriteLine(
                        $"🗑️ Removendo arquivo: {photo.StoragePath}");

                    await _storageService.DeleteFileAsync(
                        photo.StoragePath,
                        cancellationToken);

                    Console.WriteLine(
                        "✅ Arquivo físico removido.");
                }
            }
            catch (FileNotFoundException)
            {
                /*
                 * O registro já foi removido do banco.
                 * Se o arquivo não existe mais, tudo certo.
                 */
                Console.WriteLine(
                    "⚠️ Arquivo físico não encontrado. Registro já removido.");
            }
            catch (DirectoryNotFoundException)
            {
                Console.WriteLine(
                    "⚠️ Diretório do arquivo não encontrado. Registro já removido.");
            }
            catch (Exception storageEx)
            {
                /*
                 * Não retornamos 500 aqui porque a foto já foi
                 * excluída do banco.
                 *
                 * Apenas registramos o problema para limpeza
                 * posterior do arquivo órfão.
                 */
                Console.WriteLine(
                    $"⚠️ Não foi possível remover o arquivo físico: {storageEx.Message}");
            }

            return NoContent();
        }
        catch (Exception ex)
        {
            Console.WriteLine(
                $"❌ ERRO DELETE FOTO: {ex}");

            return StatusCode(
                StatusCodes.Status500InternalServerError,
                new
                {
                    message = "Erro ao excluir foto.",
                    detail = ex.Message,
                    innerException = ex.InnerException?.Message
                });
        }
    }
}