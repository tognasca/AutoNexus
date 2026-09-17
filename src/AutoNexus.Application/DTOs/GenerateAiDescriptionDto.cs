namespace AutoNexus.Application.DTOs;
public record GenerateAiDescriptionDto(
    string Brand,
    string Model,
    int Year,
    decimal Price,
    decimal? FipePrice,
    int Mileage,
    string Color,
    string FuelType,
    string Transmission,
    List<string>? Optionals);