using AutoNexus.Domain.Entities;

namespace AutoNexus.Domain.Interfaces;
public interface ITradeRepository
{
    Task<Trade?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IEnumerable<Trade>> GetAllAsync(CancellationToken cancellationToken = default);
    Task AddAsync(Trade trade, CancellationToken cancellationToken = default);
}