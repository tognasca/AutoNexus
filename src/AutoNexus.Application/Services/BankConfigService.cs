using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using AutoNexus.Application.DTOs;
using AutoNexus.Application.Interfaces;
using AutoNexus.Domain.Entities;
using AutoNexus.Domain.Interfaces;

namespace AutoNexus.Application.Services;

public class BankConfigService : IBankConfigService
{
    private readonly IBankConfigRepository _bankConfigRepository;
    private readonly IUnitOfWork _unitOfWork;

    public BankConfigService(IBankConfigRepository bankConfigRepository, IUnitOfWork unitOfWork)
    {
        _bankConfigRepository = bankConfigRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<IEnumerable<BankConfigDto>> GetAllConfigsAsync(CancellationToken cancellationToken = default)
    {
        var configs = await _bankConfigRepository.GetAllAsync(cancellationToken);
        return configs.Select(MapToDto);
    }

    public async Task<BankConfigDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var config = await _bankConfigRepository.GetByIdAsync(id, cancellationToken);
        return config != null ? MapToDto(config) : null;
    }

    public async Task<BankConfigDto> CreateConfigAsync(CreateBankConfigDto dto, CancellationToken cancellationToken = default)
    {
        var existing = await _bankConfigRepository.GetByCodeAsync(dto.BankCode, cancellationToken);
        if (existing != null)
        {
            throw new InvalidOperationException($"Já existe uma financeira cadastrada com o código '{dto.BankCode}'.");
        }

        var config = new BankConfig(
            bankCode: dto.BankCode,
            name: dto.Name,
            defaultMonthlyRate: dto.DefaultMonthlyRate,
            apiUrl: dto.ApiUrl,
            apiKey: dto.ApiKey,
            apiSecret: dto.ApiSecret,
            merchantId: dto.MerchantId,
            isSandbox: dto.IsSandbox
        );

        await _bankConfigRepository.AddAsync(config, cancellationToken);
        await _unitOfWork.CommitAsync(cancellationToken);

        return MapToDto(config);
    }

    public async Task<BankConfigDto> UpdateConfigAsync(Guid id, UpdateBankConfigDto dto, CancellationToken cancellationToken = default)
    {
        var config = await _bankConfigRepository.GetByIdAsync(id, cancellationToken);
        if (config == null) throw new KeyNotFoundException("Configuração financeira não encontrada.");

        config.UpdateCredentials(
            apiUrl: dto.ApiUrl,
            apiKey: dto.ApiKey,
            apiSecret: dto.ApiSecret,
            merchantId: dto.MerchantId,
            rate: dto.DefaultMonthlyRate,
            isSandbox: dto.IsSandbox
        );

        config.SetActive(dto.IsActive);

        await _bankConfigRepository.UpdateAsync(config, cancellationToken);
        await _unitOfWork.CommitAsync(cancellationToken);

        return MapToDto(config);
    }

    public async Task<bool> ToggleActiveAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var config = await _bankConfigRepository.GetByIdAsync(id, cancellationToken);
        if (config == null) throw new KeyNotFoundException("Configuração financeira não encontrada.");

        config.SetActive(!config.IsActive);
        await _bankConfigRepository.UpdateAsync(config, cancellationToken);
        await _unitOfWork.CommitAsync(cancellationToken);

        return config.IsActive;
    }

    private static BankConfigDto MapToDto(BankConfig b) => new(
        Id: b.Id,
        BankCode: b.BankCode,
        Name: b.Name,
        DefaultMonthlyRate: b.DefaultMonthlyRate,
        ApiUrl: b.ApiUrl,
        ApiKey: b.ApiKey,
        ApiSecret: b.ApiSecret,
        MerchantId: b.MerchantId,
        IsActive: b.IsActive,
        IsSandbox: b.IsSandbox,
        CreatedAt: b.CreatedAt,
        UpdatedAt: b.UpdatedAt
    );
}