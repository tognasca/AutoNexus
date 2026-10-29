using System.Text.Json.Serialization;

namespace AutoNexus.Domain.Models;

/// <summary>
/// Dados mínimos exigidos pelo BV para consultar as condições/tabelas de financiamento.
/// O código do parceiro é obtido exclusivamente da configuração segura do servidor.
/// </summary>
public sealed record BvFinancingConditionsRequest(
    bool ZeroVehicle,
    string PersonType,
    string VehicleCategoryDescription,
    int CylinderQuantity,
    DateOnly FinancingEntryDate,
    string VehicleModelYear,
    string? FinancingTableCode = null,
    string? VehicleBrandDescription = null,
    string? FullVehicleModelVersionDescription = null,
    string? VehicleSubCategoryDescription = null);

public sealed record BvFinancingConditionsResponse(
    [property: JsonPropertyName("financingTableParameterList")]
    IReadOnlyList<BvFinancingTableParameter> FinancingTableParameterList);

public sealed record BvFinancingTableParameter(
    [property: JsonPropertyName("code")] string? Code,
    [property: JsonPropertyName("commercialDescription")] string? CommercialDescription,
    [property: JsonPropertyName("minimumEntryValuePercentage")] decimal? MinimumEntryValuePercentage,
    [property: JsonPropertyName("minimumFinancingGraceDate")] DateOnly? MinimumFinancingGraceDate,
    [property: JsonPropertyName("maximumFinancingGraceDate")] DateOnly? MaximumFinancingGraceDate,
    [property: JsonPropertyName("plusPercentage")] string? PlusPercentage,
    [property: JsonPropertyName("financingReturnRateDataList")]
    IReadOnlyList<BvFinancingReturnRateData>? FinancingReturnRateDataList,
    [property: JsonPropertyName("financingTermDataList")]
    IReadOnlyList<BvFinancingTermData>? FinancingTermDataList,
    [property: JsonPropertyName("default")] bool IsDefault);

public sealed record BvFinancingReturnRateData(
    [property: JsonPropertyName("code")] int Code,
    [property: JsonPropertyName("description")] string? Description,
    [property: JsonPropertyName("value")] decimal Value,
    [property: JsonPropertyName("default")] bool IsDefault);

public sealed record BvFinancingTermData(
    [property: JsonPropertyName("financingTerm")] int FinancingTerm,
    [property: JsonPropertyName("default")] bool IsDefault);
