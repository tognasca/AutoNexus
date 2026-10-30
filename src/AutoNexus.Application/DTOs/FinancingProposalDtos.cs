namespace AutoNexus.Application.DTOs;

public sealed record FinancingProposalCreateDto(
    string CustomerName,
    string CustomerCpf,
    string? BirthDate,
    decimal MonthlyIncome,
    bool HasDriverLicense,
    string? Phone,
    string? Email,
    string? MaritalStatus,
    string? Nationality,
    FinancingAddressDto? Address,
    FinancingProfessionalDto? Professional,
    string VehicleName,
    string? VehicleId,
    string? Brand,
    string? Model,
    string? VehicleYear,
    string? Plate,
    string? Renavam,
    string? Chassis,
    decimal VehiclePrice,
    decimal EntryValue,
    decimal TradeValue,
    decimal FinancedAmount,
    int Months,
    decimal InstallmentValue,
    string? Notes,
    string[]? DocumentReferences,
    bool PrivacyConsent
);

public sealed record FinancingAddressDto(
    string? ZipCode,
    string? Street,
    string? Number,
    string? Complement,
    string? Neighborhood,
    string? City,
    string? State
);

public sealed record FinancingProfessionalDto(
    string? Occupation,
    string? Company,
    decimal? MonthlyIncome,
    int? TimeInCurrentJobMonths
);

public sealed record FinancingProposalDto(
    Guid Id,
    string ProposalNumber,
    string Status,
    string CustomerName,
    string CustomerCpf,
    string VehicleName,
    decimal VehiclePrice,
    decimal EntryValue,
    decimal TradeValue,
    decimal FinancedAmount,
    int Months,
    decimal InstallmentValue,
    DateTime CreatedAt,
    DateTime StatusUpdatedAt,
    string Message
);
