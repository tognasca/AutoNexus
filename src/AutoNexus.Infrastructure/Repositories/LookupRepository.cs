using AutoNexus.Domain.Entities;
using AutoNexus.Domain.Interfaces;
using AutoNexus.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace AutoNexus.Infrastructure.Repositories;

public class LookupRepository : ILookupRepository
{
    private readonly AutoNexusDbContext _context;

    public LookupRepository(AutoNexusDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<VehicleType>> GetVehicleTypesAsync(bool onlyActive = true, CancellationToken cancellationToken = default)
    {
        var query = _context.VehicleTypes.AsNoTracking();
        if (onlyActive) query = query.Where(x => x.IsActive);
        return await query.OrderBy(x => x.Name).ToListAsync(cancellationToken);
    }
    public async Task<IEnumerable<CostCategory>> GetCostCategoriesAsync(bool onlyActive = true, CancellationToken cancellationToken = default)
    {
        var query = _context.CostCategories.AsNoTracking();
        if (onlyActive) query = query.Where(x => x.IsActive);
        return await query.OrderBy(x => x.Name).ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<DocumentCategory>> GetDocumentCategoriesAsync(bool onlyActive = true, CancellationToken cancellationToken = default)
    {
        var query = _context.DocumentCategories.AsNoTracking();
        if (onlyActive) query = query.Where(x => x.IsActive);
        return await query.OrderBy(x => x.Name).ToListAsync(cancellationToken);
    }

    public async Task<VehicleType?> GetVehicleTypeByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _context.VehicleTypes.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
    }
    public async Task<IEnumerable<VehicleBrand>> GetBrandsAsync(bool onlyActive = true, CancellationToken cancellationToken = default)
    {
        var query = _context.VehicleBrands.AsNoTracking();
        if (onlyActive) query = query.Where(x => x.IsActive);
        return await query.OrderBy(x => x.Name).ToListAsync(cancellationToken);
    }
    public async Task<IEnumerable<VehicleModel>> GetModelsByBrandAsync(Guid brandId, bool onlyActive = true, CancellationToken cancellationToken = default)
    {
        var query = _context.VehicleModels.AsNoTracking().Where(x => x.VehicleBrandId == brandId);
        if (onlyActive) query = query.Where(x => x.IsActive);
        return await query.OrderBy(x => x.Name).ToListAsync(cancellationToken);
    }
}