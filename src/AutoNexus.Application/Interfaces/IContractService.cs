
using AutoNexus.Application.DTOs.Contract;

namespace AutoNexus.Application.Interfaces;

public interface IContractService
{
    Task<ContractDto> GenerateContractDataAsync(Guid vehicleId, ContractRequestDto request);
}