
using AutoNexus.Domain.Interfaces;
using AutoNexus.Domain.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AutoNexus.Api.Controllers;

public record SubmitCreditProposalRequest(
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

[ApiController]
[Route("api/credit")]
[Authorize]
public class CreditController : ControllerBase
{
    private readonly IBankCreditService _creditService;

    public CreditController(IBankCreditService creditService)
    {
        _creditService = creditService;
    }

    [HttpPost("submit-proposal")]
    public async Task<IActionResult> SubmitProposal([FromBody] SubmitCreditProposalRequest request)
    {
        var proposalRequest = new CreditProposalRequest(
            BankId: request.BankId,
            BankName: request.BankName,
            CustomerName: request.CustomerName,
            CustomerCpf: request.CustomerCpf,
            BirthDate: request.BirthDate,
            MonthlyIncome: request.MonthlyIncome,
            HasDriverLicense: request.HasDriverLicense,
            CustomerPhotoBase64: request.CustomerPhotoBase64,
            DriverLicensePhotoBase64: request.DriverLicensePhotoBase64,
            VehicleName: request.VehicleName,
            FinancedAmount: request.FinancedAmount,
            Months: request.Months,
            InstallmentValue: request.InstallmentValue,
            Phone: request.Phone,
            Email: request.Email,
            MaritalStatus: request.MaritalStatus,
            Nationality: request.Nationality,
            AddressJson: request.AddressJson,
            ProfessionalJson: request.ProfessionalJson,
            PrivacyConsent: request.PrivacyConsent
        );

        var result = await _creditService.SubmitProposalAsync(proposalRequest);

        return Ok(result);
    }

    [HttpGet("status/{proposalNumber}")]
    public async Task<IActionResult> CheckStatus(string proposalNumber)
    {
        var result = await _creditService.CheckStatusAsync(proposalNumber);
        return Ok(result);
    }
}