namespace AutoNexus.Application.DTOs;

public record VehicleDocumentDto(
    Guid Id,
    Guid DocumentCategoryId,
    string CategoryName,
    string Name,
    string FileName,
    string StoragePath,
    bool ShowInCatalog,
    DateTime CreatedAt
);