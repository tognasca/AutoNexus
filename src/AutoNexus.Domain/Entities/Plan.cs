namespace AutoNexus.Domain.Entities;

public class Plan : EntityBase
{
    public string Name { get; private set; } = string.Empty;
    public decimal Price { get; private set; }
    public bool IsActive { get; private set; }
    public int? MaxUsers { get; private set; }
    public int? MaxVehicles { get; private set; }
    public int? MaxStorageMb { get; private set; }

    protected Plan() { }

    public Plan(string name, decimal price, int? maxUsers = null, int? maxVehicles = null, int? maxStorageMb = null)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new ArgumentException("Nome do plano é obrigatório.", nameof(name));

        if (price < 0)
            throw new ArgumentException("Preço do plano não pode ser negativo.", nameof(price));

        Name = name.Trim();
        Price = price;
        IsActive = true;
        MaxUsers = maxUsers;
        MaxVehicles = maxVehicles;
        MaxStorageMb = maxStorageMb;
    }
}
