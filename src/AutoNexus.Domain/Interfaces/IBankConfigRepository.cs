
using AutoNexus.Domain.Entities;

namespace AutoNexus.Domain.Interfaces;

public interface IBankConfigRepository
{
     Task<IEnumerable<BankConfig>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<IEnumerable<BankConfig>> GetActiveConfigsAsync(CancellationToken cancellationToken = default);
    Task<BankConfig?> GetByCodeAsync(string bankCode, CancellationToken cancellationToken = default);
    Task<BankConfig?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task AddAsync(BankConfig config, CancellationToken cancellationToken = default);
    Task UpdateAsync(BankConfig config, CancellationToken cancellationToken = default);
}