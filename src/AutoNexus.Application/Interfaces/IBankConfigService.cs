using AutoNexus.Application.DTOs;
namespace AutoNexus.Application.Interfaces;
public interface IBankConfigService
{
    Task<IEnumerable<BankConfigDto>> GetAllConfigsAsync(CancellationToken cancellationToken = default);
    Task<BankConfigDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<BankConfigDto> CreateConfigAsync(CreateBankConfigDto dto, CancellationToken cancellationToken = default);
    Task<BankConfigDto> UpdateConfigAsync(Guid id, UpdateBankConfigDto dto, CancellationToken cancellationToken = default);
    Task<bool> ToggleActiveAsync(Guid id, CancellationToken cancellationToken = default);
}