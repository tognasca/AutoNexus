using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using AutoNexus.Domain.Interfaces;
using AutoNexus.Domain.Models;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace AutoNexus.Infrastructure.Integrations;

/// <summary>
/// Integra exclusivamente a consulta de condições/tabelas BV documentada no BV Open.
/// Não envia propostas de crédito nem declara aprovação.
/// </summary>
public sealed class BvFinancingConditionsService : IBvFinancingConditionsService
{
    private const string ClientName = "BvOpen";
    private const string SandboxEndpoint =
        "https://apige-uat-sbx.bancobv.com.br/partner-funding/v1/financing-conditions";

    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _configuration;
    private readonly ILogger<BvFinancingConditionsService> _logger;

    public BvFinancingConditionsService(
        IHttpClientFactory httpClientFactory,
        IConfiguration configuration,
        ILogger<BvFinancingConditionsService> logger)
    {
        _httpClientFactory = httpClientFactory;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<BvFinancingConditionsResponse> GetConditionsAsync(
        BvFinancingConditionsRequest request,
        CancellationToken cancellationToken = default)
    {
        var accessToken = _configuration["BvOpen:AccessToken"];
        var commercialPartnerCode = _configuration["BvOpen:CommercialPartnerCode"];

        if (string.IsNullOrWhiteSpace(accessToken) ||
            string.IsNullOrWhiteSpace(commercialPartnerCode))
        {
            throw new BvOpenIntegrationException(
                "Integração BV ainda não configurada. Cadastre o token de acesso e o código de parceiro fornecidos pelo BV.");
        }

        var endpoint = _configuration["BvOpen:FinancingConditionsEndpoint"];
        if (string.IsNullOrWhiteSpace(endpoint))
            endpoint = SandboxEndpoint;

        if (!Uri.TryCreate(endpoint, UriKind.Absolute, out var endpointUri) ||
            endpointUri.Scheme != Uri.UriSchemeHttps)
        {
            throw new BvOpenIntegrationException(
                "Endpoint BV inválido. A integração exige uma URL HTTPS configurada.");
        }

        var payload = new
        {
            financingTableCode = request.FinancingTableCode,
            zeroVehicle = request.ZeroVehicle,
            personType = request.PersonType,
            vehicleBrandDescription = request.VehicleBrandDescription,
            vehicleCategoryDescription = request.VehicleCategoryDescription,
            commercialPartnerCode,
            cylinderQuantity = request.CylinderQuantity,
            fullVehicleModelVersionDescription = request.FullVehicleModelVersionDescription,
            financingEntryDate = request.FinancingEntryDate.ToString("yyyy-MM-dd"),
            vehicleSubCategoryDescription = request.VehicleSubCategoryDescription,
            vehicleModelYear = request.VehicleModelYear
        };

        using var message = new HttpRequestMessage(HttpMethod.Post, endpointUri);
        message.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
        message.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
        message.Content = JsonContent.Create(payload);

        try
        {
            var client = _httpClientFactory.CreateClient(ClientName);
            using var response = await client.SendAsync(
                message,
                HttpCompletionOption.ResponseHeadersRead,
                cancellationToken);

            var correlationId =
                response.Headers.TryGetValues("x-correlation-id", out var correlationValues)
                    ? correlationValues.FirstOrDefault()
                    : null;

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning(
                    "BV Open financing-conditions returned HTTP {StatusCode}; correlation {CorrelationId}",
                    (int)response.StatusCode,
                    correlationId);

                var safeMessage = response.StatusCode switch
                {
                    HttpStatusCode.BadRequest => "O BV rejeitou os dados da consulta. Confira os dados do veículo e tente novamente.",
                    HttpStatusCode.Unauthorized => "O BV não aceitou o token configurado. Verifique as credenciais e a validade do token.",
                    HttpStatusCode.Forbidden => "O parceiro ainda não possui permissão para consultar este produto no BV.",
                    HttpStatusCode.NotFound => "O endpoint BV configurado não foi encontrado.",
                    _ => "O BV não conseguiu processar a consulta neste momento."
                };

                throw new BvOpenIntegrationException(
                    safeMessage,
                    (int)response.StatusCode,
                    correlationId);
            }

            var result = await response.Content.ReadFromJsonAsync<BvFinancingConditionsResponse>(
                new JsonSerializerOptions(JsonSerializerDefaults.Web),
                cancellationToken);

            if (result?.FinancingTableParameterList is null)
            {
                throw new BvOpenIntegrationException(
                    "O BV retornou uma resposta vazia ou fora do contrato esperado.",
                    (int)response.StatusCode,
                    correlationId);
            }

            return result;
        }
        catch (BvOpenIntegrationException)
        {
            throw;
        }
        catch (OperationCanceledException) when (!cancellationToken.IsCancellationRequested)
        {
            throw new BvOpenIntegrationException(
                "Tempo limite excedido ao consultar o BV. Tente novamente.");
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex, "Falha de transporte ao consultar condições de financiamento BV.");
            throw new BvOpenIntegrationException(
                "Não foi possível estabelecer comunicação com o BV.",
                innerException: ex);
        }
        catch (JsonException ex)
        {
            _logger.LogError(ex, "Resposta inválida recebida do BV Open.");
            throw new BvOpenIntegrationException(
                "O BV retornou dados em formato inesperado.",
                innerException: ex);
        }
    }
}
