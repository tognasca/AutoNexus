
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
    bool PrivacyConsent = false,
    string? VehicleId = null,
    decimal VehiclePrice = 0,
    decimal EntryValue = 0,
    decimal TradeValue = 0
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
        if (!request.PrivacyConsent)
            return BadRequest(new { message = "O consentimento informado é obrigatório para enviar a proposta." });

        if (string.IsNullOrWhiteSpace(request.BankId) ||
            string.IsNullOrWhiteSpace(request.CustomerName) ||
            string.IsNullOrWhiteSpace(request.CustomerCpf) ||
            string.IsNullOrWhiteSpace(request.VehicleName) ||
            request.Months <= 0 ||
            request.FinancedAmount <= 0 ||
            request.InstallmentValue <= 0 ||
            request.MonthlyIncome <= 0)
            return BadRequest(new { message = "Os dados obrigatórios da proposta são inválidos." });

        if (request.VehiclePrice < 0 || request.EntryValue < 0 || request.TradeValue < 0)
            return BadRequest(new { message = "Os valores do veículo, da entrada e da troca não podem ser negativos." });

        // Valida o contexto completo quando enviado pelo simulador atualizado.
        // Mantém compatibilidade com clientes antigos que ainda não enviam esses campos.
        if (request.VehiclePrice > 0 &&
            Math.Abs(request.VehiclePrice - request.EntryValue - request.TradeValue - request.FinancedAmount) > 0.02m)
            return BadRequest(new { message = "Os valores da negociação não fecham com o saldo a financiar. Recalcule a simulação." });

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
            PrivacyConsent: request.PrivacyConsent,
            VehicleId: request.VehicleId,
            VehiclePrice: request.VehiclePrice,
            EntryValue: request.EntryValue,
            TradeValue: request.TradeValue
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