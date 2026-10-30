using AutoNexus.Application.DTOs;

namespace AutoNexus.Application.Interfaces;

public interface IFinancingProposalService
{
    Task<FinancingProposalDto> CreateAsync(FinancingProposalCreateDto request, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<FinancingProposalDto>> ListAsync(CancellationToken cancellationToken = default);
    Task<(string Content, string ContentType, string FileName)> ExportAsync(Guid id, string format, CancellationToken cancellationToken = default);
}
