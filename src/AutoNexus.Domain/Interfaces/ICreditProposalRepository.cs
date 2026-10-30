using AutoNexus.Domain.Entities;

namespace AutoNexus.Domain.Interfaces;

public interface ICreditProposalRepository
{
    Task AddAsync(CreditProposalRecord proposal, CancellationToken cancellationToken = default);
    Task UpdateAsync(CreditProposalRecord proposal, CancellationToken cancellationToken = default);
    Task<CreditProposalRecord?> GetByProposalNumberAsync(string proposalNumber, CancellationToken cancellationToken = default);
    Task<CreditProposalRecord?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<CreditProposalRecord>> GetAllAsync(CancellationToken cancellationToken = default);
}
