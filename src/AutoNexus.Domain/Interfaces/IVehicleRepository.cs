using AutoNexus.Domain.Entities;
using AutoNexus.Domain.Enums;

namespace AutoNexus.Domain.Interfaces;

public interface IVehicleRepository
{
    Task<Vehicle?> GetByIdAsync(Guid id, bool includeDetails = false, CancellationToken cancellationToken = default);
    Task<(IEnumerable<Vehicle> Items, int TotalCount)> GetPagedAsync(
        int page,
        int pageSize,
        Guid? vehicleTypeId = null,
        VehicleStatus? status = null,
        string? search = null,
        decimal? minPrice = null,
        decimal? maxPrice = null,
        int? minYear = null,
        int? maxYear = null,
        CancellationToken cancellationToken = default);
    Task AddAsync(Vehicle vehicle, CancellationToken cancellationToken = default);
    void Update(Vehicle vehicle);
    void Delete(Vehicle vehicle);

    // Métodos explícitos para entidades filhas (Evita DbUpdateConcurrencyException)
    Task AddPhotoAsync(VehiclePhoto photo, CancellationToken cancellationToken = default);
    void DeletePhoto(VehiclePhoto photo);

    Task AddCostAsync(Cost cost, CancellationToken cancellationToken = default);
    void DeleteCost(Cost cost);

    Task AddFipeHistoryAsync(FipeHistory history, CancellationToken cancellationToken = default);
}
