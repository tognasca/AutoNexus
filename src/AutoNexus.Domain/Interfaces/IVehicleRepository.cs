using AutoNexus.Domain.Entities;
using AutoNexus.Domain.Enums;

namespace AutoNexus.Domain.Interfaces;

public interface IVehicleRepository
{
    Task<Vehicle?> GetByIdAsync(Guid id, bool includeDetails = false, CancellationToken cancellationToken = default);
    Task<IEnumerable<Vehicle>> GetByListAsync(CancellationToken cancellationToken = default);
    Task<List<Vehicle>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<List<Vehicle>> ListAsync(CancellationToken cancellationToken = default);
    Task<(List<Vehicle> Items, int TotalCount)> GetPagedAsync(
        int page = 1,
        int pageSize = 10,
        Guid? vehicleTypeId = null,
        VehicleStatus? status = null,
        string? search = null,
        decimal? minPrice = null,
        decimal? maxPrice = null,
        int? minYear = null,
        int? maxYear = null,
        CancellationToken cancellationToken = default);
    Task AddAsync(Vehicle vehicle, CancellationToken cancellationToken = default);
    Task UpdateAsync(Vehicle vehicle, CancellationToken cancellationToken = default);
    void Update(Vehicle vehicle);
    Task DeleteAsync(Guid id, CancellationToken cancellationToken = default);
    void Delete(Vehicle vehicle);
    void DeletePhoto(VehiclePhoto photo);
    Task AddCostAsync(Cost cost, CancellationToken cancellationToken = default);
    void DeleteCost(Cost cost);
     Task AddPhotoAsync(VehiclePhoto photo, CancellationToken cancellationToken = default);
    
    Task AddFipeHistoryAsync(FipeHistory fipeHistory, CancellationToken cancellationToken = default);
}