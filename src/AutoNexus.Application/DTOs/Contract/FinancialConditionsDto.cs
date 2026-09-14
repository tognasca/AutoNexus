namespace AutoNexus.Application.DTOs.Contract;
public record FinancialConditionsDto(
    decimal TotalVehicleValue,
    decimal EntryValue,
    decimal TradeVehicleValue,
    decimal FinancedValue,
    int InstallmentsCount,
    decimal InstallmentValue,
    string PaymentMethod,
    string Notes
);
