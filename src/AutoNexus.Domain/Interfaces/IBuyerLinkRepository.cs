using AutoNexus.Domain.Entities;

namespace AutoNexus.Domain.Interfaces;

public interface IBuyerLinkRepository
{
    Task<BuyerAccessLink?> GetByTokenAsync(string token, CancellationToken cancellationToken = default);
    Task AddAsync(BuyerAccessLink link, CancellationToken cancellationToken = default);
}
