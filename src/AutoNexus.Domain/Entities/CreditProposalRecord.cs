using System;
using AutoNexus.Domain.Models;

namespace AutoNexus.Domain.Entities;

/// <summary>
/// Persisted financing proposal metadata. Images are deliberately excluded from
/// RequestDataJson to avoid storing biometric/document images as base64 in PostgreSQL.
/// </summary>
public class CreditProposalRecord : TenantOwnedEntityBase
{
    public string BankId { get; private set; } = string.Empty;
    public string BankName { get; private set; } = string.Empty;
    public string CustomerName { get; private set; } = string.Empty;
    public string CustomerCpf { get; private set; } = string.Empty;
    public string VehicleName { get; private set; } = string.Empty;
    public decimal FinancedAmount { get; private set; }
    public int Months { get; private set; }
    public decimal InstallmentValue { get; private set; }
    public string Status { get; private set; } = "Received";
    public string? ProposalNumber { get; private set; }
    public string Message { get; private set; } = string.Empty;
    public string RequestDataJson { get; private set; } = "{}";
    public bool PrivacyConsent { get; private set; }
    public DateTime StatusUpdatedAt { get; private set; } = DateTime.UtcNow;

    private CreditProposalRecord() { }

    public CreditProposalRecord(CreditProposalRequest request, string requestDataJson)
    {
        BankId = request.BankId;
        BankName = request.BankName;
        CustomerName = request.CustomerName;
        CustomerCpf = request.CustomerCpf;
        VehicleName = request.VehicleName;
        FinancedAmount = request.FinancedAmount;
        Months = request.Months;
        InstallmentValue = request.InstallmentValue;
        RequestDataJson = requestDataJson;
        PrivacyConsent = request.PrivacyConsent;
        Status = "Received";
        Message = "Proposta recebida pelo AutoNexus; aguardando envio/retorno do banco.";
        StatusUpdatedAt = DateTime.UtcNow;
    }

    public void SetResult(CreditProposalResponse response)
    {
        Status = response.Status;
        ProposalNumber = response.ProposalNumber;
        Message = response.Message;
        StatusUpdatedAt = DateTime.UtcNow;
        UpdatedAt = DateTime.UtcNow;
    }
}