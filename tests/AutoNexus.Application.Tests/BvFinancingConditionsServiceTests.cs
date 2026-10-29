using System.Net;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using AutoNexus.Domain.Models;
using AutoNexus.Infrastructure.Integrations;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;

namespace AutoNexus.Application.Tests;

public sealed class BvFinancingConditionsServiceTests
{
    [Fact]
    public async Task GetConditionsAsync_SendsDocumentedSandboxRequest_AndMapsTables()
    {
        const string responseJson = """
        {
          "financingTableParameterList": [
            {
              "code": "BVM79",
              "commercialDescription": "FEIRAOBV",
              "minimumEntryValuePercentage": 0,
              "minimumFinancingGraceDate": "2026-05-20",
              "maximumFinancingGraceDate": "2026-06-29",
              "plusPercentage": "1.2",
              "financingReturnRateDataList": [
                { "code": 2, "description": "T01", "value": 2.4, "default": true }
              ],
              "financingTermDataList": [
                { "financingTerm": 48, "default": true }
              ],
              "default": true
            }
          ]
        }
        """;

        var handler = new RecordingHandler(_ => new HttpResponseMessage(HttpStatusCode.OK)
        {
            Content = new StringContent(responseJson, Encoding.UTF8, "application/json")
        });
        var service = CreateService(handler, includeCredentials: true);

        var result = await service.GetConditionsAsync(new BvFinancingConditionsRequest(
            ZeroVehicle: false,
            PersonType: "F",
            VehicleCategoryDescription: "AUTOMOVEL",
            CylinderQuantity: 185,
            FinancingEntryDate: new DateOnly(2026, 10, 29),
            VehicleModelYear: "2020",
            FinancingTableCode: "BVIST",
            VehicleBrandDescription: "HONDA",
            FullVehicleModelVersionDescription: "MODELO VERSAO",
            VehicleSubCategoryDescription: "AUTOMOVEL"));

        Assert.Equal("BVM79", Assert.Single(result.FinancingTableParameterList).Code);
        Assert.Equal(2.4m, Assert.Single(result.FinancingTableParameterList[0].FinancingReturnRateDataList!).Value);
        Assert.Equal(48, Assert.Single(result.FinancingTableParameterList[0].FinancingTermDataList!).FinancingTerm);
        Assert.Equal(HttpMethod.Post, handler.Method);
        Assert.Equal(
            "https://apige-uat-sbx.bancobv.com.br/partner-funding/v1/financing-conditions",
            handler.RequestUri?.ToString());
        Assert.Equal("Bearer", handler.Authorization?.Scheme);
        Assert.Equal("sandbox-token", handler.Authorization?.Parameter);

        using var payload = JsonDocument.Parse(handler.RequestBody!);
        Assert.Equal(
            "partner-code-123",
            payload.RootElement.GetProperty("commercialPartnerCode").GetString());
        Assert.Equal(
            "2026-10-29",
            payload.RootElement.GetProperty("financingEntryDate").GetString());
        Assert.Equal(
            "2020",
            payload.RootElement.GetProperty("vehicleModelYear").GetString());
    }

    [Fact]
    public async Task GetConditionsAsync_WithoutCredentials_FailsClosed()
    {
        var handler = new RecordingHandler(_ => new HttpResponseMessage(HttpStatusCode.OK));
        var service = CreateService(handler, includeCredentials: false);

        var exception = await Assert.ThrowsAsync<BvOpenIntegrationException>(() =>
            service.GetConditionsAsync(CreateRequest()));

        Assert.Null(handler.RequestUri);
        Assert.Contains("não configurada", exception.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task GetConditionsAsync_WhenPartnerForbidden_ThrowsSafeUpstreamError()
    {
        var handler = new RecordingHandler(_ =>
        {
            var response = new HttpResponseMessage(HttpStatusCode.Forbidden)
            {
                Content = new StringContent(
                    "{\"correlationId\":\"corr-body-456\",\"fault\":{\"message\":\"private upstream detail\"}}")
            };
            return response;
        });
        var service = CreateService(handler, includeCredentials: true);

        var exception = await Assert.ThrowsAsync<BvOpenIntegrationException>(() =>
            service.GetConditionsAsync(CreateRequest()));

        Assert.Equal(403, exception.UpstreamStatusCode);
        Assert.Equal("corr-body-456", exception.CorrelationId);
        Assert.DoesNotContain("private upstream detail", exception.Message);
    }

    [Fact]
    public async Task GetConditionsAsync_WhenErrorBodyHasNoCorrelationId_UsesHeaderFallback()
    {
        var handler = new RecordingHandler(_ =>
        {
            var response = new HttpResponseMessage(HttpStatusCode.Forbidden)
            {
                Content = new StringContent("{\"fault\":{\"message\":\"private upstream detail\"}}")
            };
            response.Headers.Add("x-correlation-id", "corr-header-789");
            return response;
        });
        var service = CreateService(handler, includeCredentials: true);

        var exception = await Assert.ThrowsAsync<BvOpenIntegrationException>(() =>
            service.GetConditionsAsync(CreateRequest()));

        Assert.Equal("corr-header-789", exception.CorrelationId);
        Assert.DoesNotContain("private upstream detail", exception.Message);
    }

    private static BvFinancingConditionsRequest CreateRequest() => new(
        ZeroVehicle: false,
        PersonType: "F",
        VehicleCategoryDescription: "AUTOMOVEL",
        CylinderQuantity: 1600,
        FinancingEntryDate: new DateOnly(2026, 10, 29),
        VehicleModelYear: "2022");

    private static BvFinancingConditionsService CreateService(
        RecordingHandler handler,
        bool includeCredentials)
    {
        var settings = new Dictionary<string, string?>();
        if (includeCredentials)
        {
            settings["BvOpen:AccessToken"] = "sandbox-token";
            settings["BvOpen:CommercialPartnerCode"] = "partner-code-123";
        }

        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(settings)
            .Build();

        return new BvFinancingConditionsService(
            new SingleClientFactory(handler),
            configuration,
            NullLogger<BvFinancingConditionsService>.Instance);
    }

    private sealed class SingleClientFactory(HttpMessageHandler handler) : IHttpClientFactory
    {
        public HttpClient CreateClient(string name) =>
            new(handler, disposeHandler: false);
    }

    private sealed class RecordingHandler(
        Func<HttpRequestMessage, HttpResponseMessage> responseFactory) : HttpMessageHandler
    {
        public HttpMethod? Method { get; private set; }
        public Uri? RequestUri { get; private set; }
        public AuthenticationHeaderValue? Authorization { get; private set; }
        public string? RequestBody { get; private set; }

        protected override async Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request,
            CancellationToken cancellationToken)
        {
            Method = request.Method;
            RequestUri = request.RequestUri;
            Authorization = request.Headers.Authorization;
            RequestBody = request.Content is null
                ? null
                : await request.Content.ReadAsStringAsync(cancellationToken);

            return responseFactory(request);
        }
    }
}
