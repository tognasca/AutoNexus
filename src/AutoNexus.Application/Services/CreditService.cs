using AutoNexus.Domain.Interfaces;
using AutoNexus.Domain.Models;
using Microsoft.Extensions.Logging;

namespace AutoNexus.Application.Services;

public class CreditService : IBankCreditService
{
    private readonly IBankConfigRepository? _bankConfigRepository;
    private readonly IEnumerable<IBankAdapter> _adapters;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<CreditService> _logger;

    public CreditService(
        IHttpClientFactory httpClientFactory,
        ILogger<CreditService> logger,
        IBankConfigRepository? bankConfigRepository = null,
        IEnumerable<IBankAdapter>? adapters = null)
    {
        _httpClientFactory = httpClientFactory;
        _logger = logger;
        _bankConfigRepository = bankConfigRepository;
        _adapters = adapters ?? Enumerable.Empty<IBankAdapter>();
    }

    public async Task<CreditProposalResponse> SubmitProposalAsync(CreditProposalRequest request)
    {
        if (_bankConfigRepository != null)
        {
            var config = await _bankConfigRepository.GetByCodeAsync(request.BankId);

            if (config != null && config.IsActive && !string.IsNullOrEmpty(config.ApiKey))
            {
                var adapter = _adapters.FirstOrDefault(a =>
                    a.BankCode.Equals(config.BankCode, StringComparison.OrdinalIgnoreCase));

                if (adapter != null)
                {
                    try
                    {
                        using var httpRequest = adapter.BuildHttpRequest(config, request);

                        var requestBody = httpRequest.Content != null
                            ? await httpRequest.Content.ReadAsStringAsync()
                            : string.Empty;

                        _logger.LogInformation(
                            ">>> REQUEST ENVIADO PARA BANCO [{Bank}]: {Url}\nPayload: {Payload}",
                            config.Name,
                            httpRequest.RequestUri,
                            requestBody);

                        var client = _httpClientFactory.CreateClient("BankCreditClient");
                        var httpResponse = await client.SendAsync(httpRequest);
                        var responseBody = await httpResponse.Content.ReadAsStringAsync();

                        _logger.LogInformation(
                            "<<< RESPOSTA DO BANCO [{Bank}] Status [{Code}]: {Body}",
                            config.Name,
                            (int)httpResponse.StatusCode,
                            responseBody);

                        return adapter.ParseHttpResponse(responseBody, (int)httpResponse.StatusCode);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Falha na comunicação com a API do banco {Bank}", config.Name);
                    }
                }
            }
        }

        // Simulação de crédito (fallback quando a API do banco não estiver configurada)
        await Task.Delay(1000);

        var requiredIncome = request.InstallmentValue * 2.5m;
        if (request.MonthlyIncome >= requiredIncome || request.MonthlyIncome == 0)
        {
            return new CreditProposalResponse(
                Status: "Approved",
                ProposalNumber: $"PROP-{DateTime.UtcNow:yyyyMMdd}-{Random.Shared.Next(1000, 9999)}",
                Message: $"Crédito Pré-Aprovado no {request.BankName}! Margem de renda compatível.",
                ApprovedLimit: request.FinancedAmount,
                ApprovedMonths: request.Months,
                ApprovedRate: null
            );
        }

        return new CreditProposalResponse(
            Status: "Pending",
            ProposalNumber: $"PROP-{DateTime.UtcNow:yyyyMMdd}-{Random.Shared.Next(1000, 9999)}",
            Message: $"Proposta submetida para análise da mesa de crédito do {request.BankName}.",
            ApprovedLimit: null,
            ApprovedMonths: null,
            ApprovedRate: null
        );
    }

    public Task<CreditProposalResponse> CheckStatusAsync(string proposalNumber)
    {
        return Task.FromResult(new CreditProposalResponse(
            "Pending",
            proposalNumber,
            "Em análise.",
            null,
            null,
            null
        ));
    }
}