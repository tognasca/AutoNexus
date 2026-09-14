namespace AutoNexus.Application.DTOs.Contract;

public record ContractRequestDto(
    string CustomerName,
    string CustomerDocument,
    string? CustomerRg,
    string CustomerPhone,
    string? CustomerEmail,
    string? CustomerAddress,
    decimal SaleValue,
    decimal EntryValue,
    bool HasTrade,
    string? TradeBrand,
    string? TradeModel,
    int TradeYear,
    string? TradeColor,
    string? TradePlate,
    string? TradeChassi,
    string? TradeRenavam,
    int TradeMileage,
    decimal TradeValue,
    decimal FinancedValue,
    int InstallmentsCount,
    decimal InstallmentValue,
    string PaymentMethod,
    string? Notes,
    bool IsProposal
);