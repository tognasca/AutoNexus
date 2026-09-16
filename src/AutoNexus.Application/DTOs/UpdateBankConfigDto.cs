namespace AutoNexus.Application.DTOs;
public record UpdateBankConfigDto(
    string Name,
    decimal DefaultMonthlyRate,
    string ApiUrl,
    string ApiKey,
    string? ApiSecret,
    string? MerchantId,
    bool IsActive,
    bool IsSandbox
);