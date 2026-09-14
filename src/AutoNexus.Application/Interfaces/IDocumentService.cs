using AutoNexus.Application.DTOs;

namespace AutoNexus.Application.Interfaces;

public interface IDocumentService
{
    Task<IEnumerable<DocumentDto>> GetVehicleDocumentsAsync(Guid vehicleId, CancellationToken cancellationToken = default);
    Task<DocumentDto> UploadDocumentAsync(Guid vehicleId, Guid uploadedByUserId, Guid categoryId, string name, Stream fileStream, string fileName, string mimeType, long fileSize, string? notes, CancellationToken cancellationToken = default);
    Task DeleteDocumentAsync(Guid vehicleId, Guid documentId, CancellationToken cancellationToken = default);
    Task<(byte[] ZipBytes, string ZipFileName)> GenerateDocumentsZipAsync(Guid vehicleId, CancellationToken cancellationToken = default);
}

public interface IPortalService
{
    Task<BuyerLinkDto> CreateBuyerLinkAsync(Guid vehicleId, Guid createdByUserId, CreateBuyerLinkDto dto, CancellationToken cancellationToken = default);
    Task<PortalVehicleDto> GetPortalDetailsAsync(string token, CancellationToken cancellationToken = default);
    Task<(byte[] FileBytes, string MimeType, string FileName)> DownloadPortalDocumentAsync(string token, Guid documentId, CancellationToken cancellationToken = default);
    Task<(byte[] ZipBytes, string ZipFileName)> DownloadPortalZipAsync(string token, CancellationToken cancellationToken = default);
    Task<AcceptanceResultDto> SubmitAcceptanceAsync(string token, SubmitAcceptanceDto dto, string ipAddress, CancellationToken cancellationToken = default);
}
