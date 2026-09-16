
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
    decimal InstallmentValue
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
            InstallmentValue: request.InstallmentValue
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