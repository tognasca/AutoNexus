namespace AutoNexus.Application.DTOs.Contract;
public record ContractVehicleDto(
    string Brand,
    string Model,
    int ModelYear,
    int ManufactureYear,
    string Color,
    string LicensePlate,
    string Chassi,
    string Renavam,
    int Mileage,
    decimal Value
);