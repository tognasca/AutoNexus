namespace AutoNexus.Application.DTOs;

public record DocumentDto(
    Guid Id,
    Guid VehicleId,
    Guid DocumentCategoryId,
    string DocumentCategoryName,
    string Name,
    string FileName,
    string StoragePath,
    long FileSize,
    string MimeType,
    Guid UploadedByUserId,
    string? Notes,
    DateTime CreatedAt
);

public record CreateBuyerLinkDto(
    int ExpirationDays = 30,
    string? BuyerName = null
);

public record BuyerLinkDto(
    Guid Id,
    Guid VehicleId,
    string Token,
    string ShareUrl,
    DateTime ExpiresAt,
    bool IsValid,
    string? BuyerName,
    DateTime CreatedAt
);

public record PortalVehicleDto(
    Guid VehicleId,
    string Brand,
    string Model,
    string? Version,
    int ModelYear,
    string? Plate,
    decimal Price,
    IEnumerable<VehiclePhotoDto> Photos,
    IEnumerable<DocumentDto> Documents,
    bool HasElectronicAcceptance,
    DateTime? AcceptedAt,
    string? AcceptedByBuyerName
);

public record SubmitAcceptanceDto(
    string BuyerName,
    string BuyerDocument
);

public record AcceptanceResultDto(
    Guid Id,
    string BuyerName,
    DateTime AcceptedAt,
    string IpAddress,
    string TermVersion
);
