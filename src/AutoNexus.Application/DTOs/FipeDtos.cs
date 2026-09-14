namespace AutoNexus.Application.DTOs;

public record FipeLookupItemDto(string Code, string Name);

public record FipeHistoryDto(
    Guid Id,
    Guid VehicleId,
    decimal FipeValue,
    int ReferenceMonth,
    int ReferenceYear,
    DateTime ConsultationDate,
    string? Source
);

public record FipeSummaryDto(
    Guid VehicleId,
    decimal? LatestFipeValue,
    int? LatestReferenceMonth,
    int? LatestReferenceYear,
    DateTime? LastConsultationDate,
    IEnumerable<FipeHistoryDto> History
);

public record FetchFipeRequestDto(
    string FipeCode,
    int? ModelYear
);

public record FetchGuidedFipeRequestDto(
    string VehicleType,
    string BrandCode,
    string ModelCode,
    string YearCode
);

public record ManualFipeRequestDto(
    decimal FipeValue,
    int ReferenceMonth,
    int ReferenceYear,
    string? Notes
);
