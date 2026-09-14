using AutoNexus.Application.DTOs;
using AutoNexus.Application.Interfaces;
using AutoNexus.Domain.Entities;
using AutoNexus.Domain.Interfaces;

namespace AutoNexus.Application.Services;

public class DocumentService : IDocumentService
{
    private readonly IDocumentRepository _documentRepository;
    private readonly IVehicleRepository _vehicleRepository;
    private readonly ILookupRepository _lookupRepository;
    private readonly IStorageService _storageService;
    private readonly IUnitOfWork _unitOfWork;

    private static readonly HashSet<string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".pdf", ".jpg", ".jpeg", ".png"
    };

    public DocumentService(
        IDocumentRepository documentRepository,
        IVehicleRepository vehicleRepository,
        ILookupRepository lookupRepository,
        IStorageService storageService,
        IUnitOfWork unitOfWork)
    {
        _documentRepository = documentRepository;
        _vehicleRepository = vehicleRepository;
        _lookupRepository = lookupRepository;
        _storageService = storageService;
        _unitOfWork = unitOfWork;
    }

    public async Task<IEnumerable<DocumentDto>> GetVehicleDocumentsAsync(Guid vehicleId, CancellationToken cancellationToken = default)
    {
        var docs = await _documentRepository.GetByVehicleIdAsync(vehicleId, cancellationToken);
        return docs.Select(MapToDto);
    }

    public async Task<DocumentDto> UploadDocumentAsync(
        Guid vehicleId, Guid uploadedByUserId, Guid categoryId, string name, Stream fileStream, string fileName, string mimeType, long fileSize, string? notes, CancellationToken cancellationToken = default)
    {
        var ext = Path.GetExtension(fileName);
        if (string.IsNullOrEmpty(ext) || !AllowedExtensions.Contains(ext))
            throw new ArgumentException($"Extensão inválida ({ext}). Permitidos: PDF, JPG, JPEG, PNG.");

        var categories = await _lookupRepository.GetDocumentCategoriesAsync(true, cancellationToken);
        var category = categories.FirstOrDefault(c => c.Id == categoryId)
            ?? throw new ArgumentException("Categoria de documento inválida.");

        var storagePath = await _storageService.SaveFileAsync(fileStream, fileName, $"vehicles/{vehicleId}/docs", cancellationToken);

        var doc = new VehicleDocument(vehicleId, categoryId, name, fileName, storagePath, mimeType, fileSize, uploadedByUserId);
        if (!string.IsNullOrWhiteSpace(notes))
        {
            typeof(VehicleDocument).GetProperty(nameof(VehicleDocument.Notes))?.SetValue(doc, notes.Trim());
        }

        await _documentRepository.AddAsync(doc, cancellationToken);
        await _unitOfWork.CommitAsync(cancellationToken);

        var reloaded = await _documentRepository.GetByIdAsync(doc.Id, cancellationToken);
        return MapToDto(reloaded ?? doc);
    }

    public async Task DeleteDocumentAsync(Guid vehicleId, Guid documentId, CancellationToken cancellationToken = default)
    {
        var doc = await _documentRepository.GetByIdAsync(documentId, cancellationToken);
        if (doc == null || doc.VehicleId != vehicleId)
            throw new KeyNotFoundException("Documento não encontrado.");

        await _storageService.DeleteFileAsync(doc.StoragePath, cancellationToken);
        _documentRepository.Delete(doc);
        await _unitOfWork.CommitAsync(cancellationToken);
    }

    public async Task<(byte[] ZipBytes, string ZipFileName)> GenerateDocumentsZipAsync(Guid vehicleId, CancellationToken cancellationToken = default)
    {
        var vehicle = await _vehicleRepository.GetByIdAsync(vehicleId, false, cancellationToken);
        if (vehicle == null)
            throw new KeyNotFoundException("Veículo não encontrado.");

        var docs = await _documentRepository.GetByVehicleIdAsync(vehicleId, cancellationToken);
        var list = docs.ToList();
        if (!list.Any())
            throw new InvalidOperationException("Este veículo não possui documentos cadastrados.");

        var filesToZip = list.Select(d => (d.StoragePath, $"{d.Name}_{d.FileName}"));
        var zipBytes = await _storageService.CreateZipAsync(filesToZip, cancellationToken);

        var zipFileName = $"Documentos_{vehicle.Brand}_{vehicle.Model}_{vehicle.Plate ?? "Veiculo"}.zip";
        return (zipBytes, zipFileName);
    }

    private static DocumentDto MapToDto(VehicleDocument d)
    {
        return new DocumentDto(
            d.Id,
            d.VehicleId,
            d.DocumentCategoryId,
            d.DocumentCategory?.Name ?? string.Empty,
            d.Name,
            d.FileName,
            d.StoragePath,
            d.FileSize,
            d.MimeType,
            d.UploadedByUserId,
            d.Notes,
            d.CreatedAt
        );
    }
}
