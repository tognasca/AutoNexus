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
        if (string.IsNullOrWhiteSpace(config.MerchantId))
            throw new InvalidOperationException("Configure o código de lojista fornecido pela instituição.");
        if (!Uri.TryCreate(config.ApiUrl, UriKind.Absolute, out var endpoint) || endpoint.Scheme != Uri.UriSchemeHttps)
            throw new InvalidOperationException("Configure um endpoint HTTPS válido para a instituição.");
        // Contrato do adaptador deve ser homologado com a instituição antes de habilitar o envio.
        var santanderPayload = new
        {
            codigoLojista = config.MerchantId,
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
        static CreditProposalResponse Unconfirmed() => new("Unavailable", "",
            "A resposta do banco não confirmou um protocolo e uma situação reconhecidos.", null, null, null);
        if (statusCode < 200 || statusCode >= 300) return Unconfirmed();
        try
        {
            using var doc = JsonDocument.Parse(rawResponseBody);
            var root = doc.RootElement;
            if (!root.TryGetProperty("statusProposta", out var status) ||
                !root.TryGetProperty("idProposta", out var id) ||
                status.ValueKind != JsonValueKind.String)
                return Unconfirmed();
            var protocol = id.ValueKind == JsonValueKind.String ? id.GetString() :
                id.ValueKind == JsonValueKind.Number ? id.GetRawText() : null;
            if (string.IsNullOrWhiteSpace(protocol)) return Unconfirmed();
            var mapped = status.GetString()?.Trim().ToUpperInvariant() switch
            {
                "APROVADO" or "APPROVED" => "Approved",
                "RECUSADO" or "REJECTED" => "Rejected",
                "PENDING" or "PENDENTE" or "EM_ANALISE" or "RECEBIDO" => "Pending",
                _ => null
            };
            if (mapped is null) return Unconfirmed();
            var text = root.TryGetProperty("mensagemMesa", out var message) && message.ValueKind == JsonValueKind.String
                ? message.GetString() : null;
            return new(mapped, protocol, text ?? "Situação confirmada pela instituição financeira.", null, null, null);
        }
        catch (JsonException) { return Unconfirmed(); }
        catch (InvalidOperationException) { return Unconfirmed(); }
    }
}
