namespace AutoNexus.Application.DTOs;

public record SellVehicleDto(
    decimal SaleValue,
    Guid SoldByUserId,
    DateTime? SoldAt
);