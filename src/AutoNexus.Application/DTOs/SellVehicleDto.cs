using System.Text.Json.Serialization;

namespace AutoNexus.Application.DTOs;

public record SellVehicleDto(
    [property: JsonPropertyName("saleValue")] decimal SaleValue,
    [property: JsonPropertyName("soldByUserId")] Guid? SoldByUserId = null,
    [property: JsonPropertyName("soldAt")] DateTime? SoldAt = null
);