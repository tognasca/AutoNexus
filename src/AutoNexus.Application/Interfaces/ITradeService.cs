using AutoNexus.Application.DTOs;

namespace AutoNexus.Application.Interfaces;
public interface ITradeService
{
    Task<IEnumerable<TradeDto>> GetAllTradesAsync(CancellationToken cancellationToken = default);
    Task<TradeDto?> GetTradeByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<TradeDto> CreateTradeAsync(Guid responsibleUserId, CreateTradeDto dto, CancellationToken cancellationToken = default);
}
