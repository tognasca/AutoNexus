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

/// <summary>Dados mínimos para servir o arquivo de um documento via download autenticado.</summary>
public record VehicleDocumentFileDto(
    string FileName,
    string ContentType,
    string StoragePath
);