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
    decimal InstallmentValue,
    string? Phone = null,
    string? Email = null,
    string? MaritalStatus = null,
    string? Nationality = null,
    string? AddressJson = null,
    string? ProfessionalJson = null,
    bool PrivacyConsent = false
);

public record CreditProposalResponse(
    string Status,
    string ProposalNumber,
    string Message,
    decimal? ApprovedLimit,
    int? ApprovedMonths,
    decimal? ApprovedRate
);