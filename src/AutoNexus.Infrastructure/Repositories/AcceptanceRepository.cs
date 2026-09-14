using AutoNexus.Domain.Entities;
using AutoNexus.Domain.Interfaces;
using AutoNexus.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace AutoNexus.Infrastructure.Repositories;

public class AcceptanceRepository : IAcceptanceRepository
{
    private readonly AutoNexusDbContext _context;

    public AcceptanceRepository(AutoNexusDbContext context)
    {
        _context = context;
    }

    public async Task<ElectronicAcceptance?> GetByVehicleIdAsync(Guid vehicleId, CancellationToken cancellationToken = default)
    {
        return await _context.ElectronicAcceptances
            .FirstOrDefaultAsync(a => a.VehicleId == vehicleId, cancellationToken);
    }

    public async Task AddAsync(ElectronicAcceptance acceptance, CancellationToken cancellationToken = default)
    {
        await _context.ElectronicAcceptances.AddAsync(acceptance, cancellationToken);
    }
}
