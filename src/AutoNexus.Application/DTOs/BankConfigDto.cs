namespace AutoNexus.Application.DTOs;

public record BankConfigDto(
    Guid Id,
    string BankCode,
    string Name,
    decimal DefaultMonthlyRate,
    string ApiUrl,
    string ApiKey,
    string? ApiSecret,
    string? MerchantId,
    bool IsActive,
    bool IsSandbox,
    DateTime CreatedAt,
    DateTime? UpdatedAt
);