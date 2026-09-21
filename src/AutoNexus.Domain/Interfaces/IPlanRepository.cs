using AutoNexus.Domain.Entities;

namespace AutoNexus.Domain.Interfaces;

public interface IPlanRepository
{
    Task<List<Plan>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<Plan?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task AddAsync(Plan plan, CancellationToken cancellationToken = default);
    void Update(Plan plan);
}
