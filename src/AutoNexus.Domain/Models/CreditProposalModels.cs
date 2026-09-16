using System;

namespace AutoNexus.Domain.Models;

public record CreditProposalRequest(
    string BankId,
    string BankName,
    string CustomerName,
    string CustomerCpf,
    string? BirthDate,
    decimal MonthlyIncome,
    bool HasDriverLicense,
    string? CustomerPhotoBase64,
    string? DriverLicensePhotoBase64,
    string VehicleName,
    decimal FinancedAmount,
    int Months,
    decimal InstallmentValue
);

public record CreditProposalResponse(
    string Status,
    string ProposalNumber,
    string Message,
    decimal? ApprovedLimit,
    int? ApprovedMonths,
    decimal? ApprovedRate
);