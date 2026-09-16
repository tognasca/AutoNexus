namespace AutoNexus.Application.DTOs;

public record CreateBankConfigDto(
    string BankCode,
    string Name,
    decimal DefaultMonthlyRate,
    string ApiUrl,
    string ApiKey,
    string? ApiSecret,
    string? MerchantId,
    bool IsSandbox
);