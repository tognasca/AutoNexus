using AutoNexus.Application.DTOs;

namespace AutoNexus.Application.Interfaces;

public interface IFipeExternalService
{
    Task<IEnumerable<FipeLookupItemDto>> GetBrandsAsync(string vehicleType, CancellationToken cancellationToken = default);
    Task<IEnumerable<FipeLookupItemDto>> GetModelsAsync(string vehicleType, string brandCode, CancellationToken cancellationToken = default);
    Task<IEnumerable<FipeLookupItemDto>> GetYearsAsync(string vehicleType, string brandCode, string modelCode, CancellationToken cancellationToken = default);
    Task<(decimal FipeValue, int Month, int Year, string FipeCode)> FetchByBrandModelYearAsync(string vehicleType, string brandCode, string modelCode, string yearCode, CancellationToken cancellationToken = default);
    Task<(decimal FipeValue, int Month, int Year)> FetchByFipeCodeAsync(string fipeCode, int? modelYear, CancellationToken cancellationToken = default);
}

public interface IFipeService
{
    Task<FipeSummaryDto> GetFipeSummaryAsync(Guid vehicleId, CancellationToken cancellationToken = default);
    Task<IEnumerable<FipeLookupItemDto>> GetBrandsAsync(Guid vehicleId, CancellationToken cancellationToken = default);
    Task<IEnumerable<FipeLookupItemDto>> GetModelsAsync(Guid vehicleId, string brandCode, CancellationToken cancellationToken = default);
    Task<IEnumerable<FipeLookupItemDto>> GetYearsAsync(Guid vehicleId, string brandCode, string modelCode, CancellationToken cancellationToken = default);
    Task<FipeSummaryDto> FetchGuidedFipeAsync(Guid vehicleId, FetchGuidedFipeRequestDto dto, CancellationToken cancellationToken = default);
    Task<FipeSummaryDto> FetchAndUpdateFipeAsync(Guid vehicleId, FetchFipeRequestDto dto, CancellationToken cancellationToken = default);
    Task<FipeSummaryDto> AddManualFipeAsync(Guid vehicleId, ManualFipeRequestDto dto, CancellationToken cancellationToken = default);
}
