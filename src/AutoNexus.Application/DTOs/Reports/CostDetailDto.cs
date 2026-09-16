
namespace AutoNexus.Application.DTOs.Reports;

public record CostDetailDto(
    string Description,
    string CategoryName,
    decimal Value,
    DateTime Date
);