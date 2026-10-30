using System.Text.Json;
using AutoNexus.Domain.Entities;
using AutoNexus.Domain.Interfaces;
using AutoNexus.Domain.Models;
using Microsoft.Extensions.Logging;

namespace AutoNexus.Application.Services;

public class CreditService : IBankCreditService
{
    private const string ExternalSubmissionFlag = "AUTONEXUS_ENABLE_EXTERNAL_CREDIT_SUBMISSION";

    private readonly IBankConfigRepository? _bankConfigRepository;
    private readonly ICreditProposalRepository? _proposalRepository;
    private readonly IEnumerable<IBankAdapter> _adapters;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<CreditService> _logger;

    public CreditService(
        IHttpClientFactory httpClientFactory,
        ILogger<CreditService> logger,
        IBankConfigRepository? bankConfigRepository = null,
        IEnumerable<IBankAdapter>? adapters = null,
        ICreditProposalRepository? proposalRepository = null)
    {
        _httpClientFactory = httpClientFactory;
        _logger = logger;
        _bankConfigRepository = bankConfigRepository;
        _adapters = adapters ?? Enumerable.Empty<IBankAdapter>();
        _proposalRepository = proposalRepository;
    }

    public async Task<CreditProposalResponse> SubmitProposalAsync(CreditProposalRequest request)
    {
        if (!request.PrivacyConsent)
            throw new ArgumentException("O consentimento informado é obrigatório para registrar a proposta.", nameof(request));

        // Persist business data for audit/status tracking, but never store base64
        // selfie/CNH images in PostgreSQL or write customer payloads to application logs.
        var safeRequest = request with { CustomerPhotoBase64 = null, DriverLicensePhotoBase64 = null };
        var record = new CreditProposalRecord(request, JsonSerializer.Serialize(safeRequest));
        if (_proposalRepository != null)
            await _proposalRepository.AddAsync(record);

        // Until a real financial institution is explicitly enabled for production/homologation,
        // this endpoint is registration-only. It must never turn a simulation into an approval
        // and must never call a bank just because credentials/configuration happen to exist.
        if (!IsExternalSubmissionEnabled())
        {
            var draft = new CreditProposalResponse(
                "Draft",
                $"AUTO-{record.Id:N}",
                "Cadastro de financiamento salvo. Esta é apenas uma simulação; não representa pré-aprovação, aprovação, reserva de limite ou envio à instituição financeira.",
                null, null, null);
            record.SetResult(draft);
            if (_proposalRepository != null)
                await _proposalRepository.UpdateAsync(record);
            return draft;
        }

        if (_bankConfigRepository != null)
        {
            var config = await _bankConfigRepository.GetByCodeAsync(request.BankId);
            if (config != null && config.IsActive && !string.IsNullOrWhiteSpace(config.ApiKey))
            {
                var adapter = _adapters.FirstOrDefault(a =>
                    a.BankCode.Equals(config.BankCode, StringComparison.OrdinalIgnoreCase));

                if (adapter != null)
                {
                    try
                    {
                        using var httpRequest = adapter.BuildHttpRequest(config, request);
                        var client = _httpClientFactory.CreateClient("BankCreditClient");
                        using var httpResponse = await client.SendAsync(httpRequest);
                        var responseBody = await httpResponse.Content.ReadAsStringAsync();

                        _logger.LogInformation(
                            "Resposta da integração de crédito {Bank}: HTTP {StatusCode}",
                            config.Name,
                            (int)httpResponse.StatusCode);

                        CreditProposalResponse result;
                        if (!httpResponse.IsSuccessStatusCode)
                        {
                            result = new CreditProposalResponse(
                                "Unavailable",
                                $"AUTO-{record.Id:N}",
                                "A instituição financeira não confirmou o recebimento da proposta. Nenhuma aprovação foi confirmada.",
                                null, null, null);
                        }
                        else
                        {
                            result = adapter.ParseHttpResponse(responseBody, (int)httpResponse.StatusCode);
                        }

                        record.SetResult(result);
                        if (_proposalRepository != null)
                            await _proposalRepository.UpdateAsync(record);
                        return result;
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Falha na comunicação com a API do banco {Bank}", config.Name);
                    }
                }
            }
        }

        var unavailable = new CreditProposalResponse(
            "Unavailable",
            $"AUTO-{record.Id:N}",
            "A integração real deste banco não está configurada ou está indisponível. O cadastro foi registrado no AutoNexus, mas não foi enviado ao banco e não há aprovação confirmada.",
            null, null, null);
        record.SetResult(unavailable);
        if (_proposalRepository != null)
            await _proposalRepository.UpdateAsync(record);
        return unavailable;
    }

    public async Task<CreditProposalResponse> CheckStatusAsync(string proposalNumber)
    {
        if (_proposalRepository == null)
            return new CreditProposalResponse("Unavailable", proposalNumber,
                "A consulta persistida de propostas não está configurada.", null, null, null);

        var proposal = await _proposalRepository.GetByProposalNumberAsync(proposalNumber);
        if (proposal == null)
            return new CreditProposalResponse("Unavailable", proposalNumber,
                "Proposta não encontrada para esta empresa.", null, null, null);

        return new CreditProposalResponse(
            proposal.Status,
            proposal.ProposalNumber ?? proposalNumber,
            proposal.Message,
            null, null, null);
    }

    private static bool IsExternalSubmissionEnabled()
    {
        return string.Equals(
            Environment.GetEnvironmentVariable(ExternalSubmissionFlag),
            "true",
            StringComparison.OrdinalIgnoreCase);
    }
}
