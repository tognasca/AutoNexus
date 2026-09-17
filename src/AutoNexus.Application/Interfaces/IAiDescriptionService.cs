namespace AutoNexus.Application.Interfaces;

public interface IAiDescriptionService
{
    string GenerateVehicleAdDescription(
        string brand, 
        string model, 
        int year, 
        decimal price, 
        decimal? fipePrice, 
        int mileage, 
        string color, 
        string fuelType, 
        string transmission, 
        List<string>? optionals);
}