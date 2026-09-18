using System.Diagnostics;
using AutoNexus.Domain.Entities;
using AutoNexus.Domain.Enums;
using AutoNexus.Domain.Interfaces;
using AutoNexus.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace AutoNexus.Infrastructure.Repositories;

public class VehicleRepository : IVehicleRepository
{
    private readonly AutoNexusDbContext _context;

    public VehicleRepository(AutoNexusDbContext context)
    {
        _context = context;
    }

    public async Task<Vehicle?> GetByIdAsync(Guid id, bool includeDetails = false, CancellationToken cancellationToken = default)
    {
        var query = _context.Vehicles.AsQueryable();

        if (includeDetails)
        {
            query = query
                .Include(v => v.VehicleType)
                .Include(v => v.Photos)
                .Include(v => v.Costs)
                .ThenInclude(c => c.CostCategory)
                .Include(v => v.Documents); // <-- Carrega os documentos cadastrados
        }

        return await query.FirstOrDefaultAsync(v => v.Id == id, cancellationToken);
    }

    public async Task<IEnumerable<Vehicle>> GetByListAsync(CancellationToken cancellationToken = default)
    {
        return await _context.Vehicles
            .Include(v => v.VehicleType)
            .Include(v => v.Photos)
            .Where(v => v.Status == VehicleStatus.AVenda)
            .AsNoTracking()
            .ToListAsync(cancellationToken);
    }

    public async Task<List<Vehicle>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await _context.Vehicles
            .Include(v => v.VehicleType)
            .Include(v => v.Photos)
            .AsNoTracking()
            .ToListAsync(cancellationToken);
    }

    public async Task<List<Vehicle>> ListAsync(CancellationToken cancellationToken = default)
    {
        return await GetAllAsync(cancellationToken);
    }

    public async Task<(List<Vehicle> Items, int TotalCount)> GetPagedAsync(
        int page = 1,
        int pageSize = 10,
        Guid? vehicleTypeId = null,
        VehicleStatus? status = null,
        string? search = null,
        decimal? minPrice = null,
        decimal? maxPrice = null,
        int? minYear = null,
        int? maxYear = null,
        CancellationToken cancellationToken = default)
    {
        var query = _context.Vehicles
            .Include(v => v.VehicleType)
            .Include(v => v.Photos)
            .AsNoTracking()
            .AsQueryable();

        if (vehicleTypeId.HasValue)
            query = query.Where(v => v.VehicleTypeId == vehicleTypeId.Value);

        if (status.HasValue)
            query = query.Where(v => v.Status == status.Value);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLower();
            query = query.Where(v =>
                v.Brand.ToLower().Contains(term) ||
                v.Model.ToLower().Contains(term) ||
                (v.Plate != null && v.Plate.ToLower().Contains(term)));
        }

        if (minPrice.HasValue)
            query = query.Where(v => (v.ListedValue ?? v.PurchaseValue) >= minPrice.Value);

        if (maxPrice.HasValue)
            query = query.Where(v => (v.ListedValue ?? v.PurchaseValue) <= maxPrice.Value);

        if (minYear.HasValue)
            query = query.Where(v => v.ModelYear >= minYear.Value);

        if (maxYear.HasValue)
            query = query.Where(v => v.ModelYear <= maxYear.Value);

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderByDescending(v => v.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return (items, totalCount);
    }

    public async Task AddAsync(Vehicle vehicle, CancellationToken cancellationToken = default)
    {
        await _context.Vehicles.AddAsync(vehicle, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task UpdateAsync(Vehicle vehicle, CancellationToken cancellationToken = default)
    {
        _context.Vehicles.Update(vehicle);
        await _context.SaveChangesAsync(cancellationToken);
    }

    public void Update(Vehicle vehicle)
    {
        _context.Vehicles.Update(vehicle);
    }

    public async Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var vehicle = await _context.Vehicles.FindAsync(new object[] { id }, cancellationToken);
        if (vehicle != null)
        {
            _context.Vehicles.Remove(vehicle);
            await _context.SaveChangesAsync(cancellationToken);
        }
    }

    public void Delete(Vehicle vehicle)
    {
        _context.Vehicles.Remove(vehicle);
    }

    public async Task AddCostAsync(Cost cost, CancellationToken cancellationToken = default)
    {
        await _context.Costs.AddAsync(cost, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
    }

    public void DeleteCost(Cost cost)
    {
        _context.Costs.Remove(cost);
    }

    public void DeletePhoto(VehiclePhoto photo)
    {
        _context.VehiclePhotos.Remove(photo);
    }
    public async Task AddFipeHistoryAsync(FipeHistory fipeHistory, CancellationToken cancellationToken = default)
    {
        await _context.Set<FipeHistory>().AddAsync(fipeHistory, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
    }
    public async Task AddPhotoAsync(VehiclePhoto photo, CancellationToken cancellationToken = default)
    {
        await _context.VehiclePhotos.AddAsync(photo, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
    }


}