using System.Text;
using System.Text.Json;
using AutoNexus.Domain.Entities;
using AutoNexus.Domain.Interfaces;
using AutoNexus.Domain.Models;

namespace AutoNexus.Infrastructure.Integrations.Adapters;

public class SantanderBankAdapter : IBankAdapter
{
    public string BankCode => "santander";

    public HttpRequestMessage BuildHttpRequest(BankConfig config, CreditProposalRequest proposal)
    {
        // 1. Monta o Payload JSON exato que o Santander exige
        var santanderPayload = new
        {
            codigoLojista = config.MerchantId ?? "AUTO_NEXUS_STORE",
            cliente = new
            {
                nomeCompleto = proposal.CustomerName,
                cpf = proposal.CustomerCpf,
                dataNascimento = proposal.BirthDate,
                rendaMensal = proposal.MonthlyIncome,
                possuiCnh = proposal.HasDriverLicense,
                selfieBase64 = proposal.CustomerPhotoBase64
            },
            simulacao = new
            {
                veiculo = proposal.VehicleName,
                valorFinanciado = proposal.FinancedAmount,
                quantidadeParcelas = proposal.Months,
                valorParcela = proposal.InstallmentValue
            }
        };

        var jsonJson = JsonSerializer.Serialize(santanderPayload);
        
        var request = new HttpRequestMessage(HttpMethod.Post, $"{config.ApiUrl}/v1/propostas")
        {
            Content = new StringContent(jsonJson, Encoding.UTF8, "application/json")
        };

        // Headers de Autenticação exigidos pelo Santander
        request.Headers.Add("X-API-KEY", config.ApiKey);
        if (!string.IsNullOrEmpty(config.ApiSecret))
        {
            request.Headers.Add("X-API-SECRET", config.ApiSecret);
        }

        return request;
    }

    public CreditProposalResponse ParseHttpResponse(string rawResponseBody, int statusCode)
    {
        try
        {
            using var doc = JsonDocument.Parse(rawResponseBody);
            var root = doc.RootElement;

            var statusStr = root.TryGetProperty("statusProposta", out var st) ? st.GetString() : "PENDING";
            var proposalId = root.TryGetProperty("idProposta", out var id) ? id.GetString() : Guid.NewGuid().ToString();
            var msg = root.TryGetProperty("mensagemMesa", out var m) ? m.GetString() : "Proposta processada.";

            var mappedStatus = statusStr?.ToUpper() switch
            {
                "APROVADO" or "APPROVED" => "Approved",
                "RECUSADO" or "REJECTED" => "Rejected",
                _ => "Pending"
            };

            return new CreditProposalResponse(
                Status: mappedStatus,
                ProposalNumber: proposalId ?? "PROP-SAN-001",
                Message: msg ?? "Proposta enviada ao Santander.",
                ApprovedLimit: null,
                ApprovedMonths: null,
                ApprovedRate: null
            );
        }
        catch
        {
            return new CreditProposalResponse("Pending", "PROP-SAN-001", "Proposta enviada para análise da mesa Santander.", null, null, null);
        }
    }
}