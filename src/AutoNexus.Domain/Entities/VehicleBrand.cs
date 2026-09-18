namespace AutoNexus.Domain.Entities;

public class VehicleBrand
{
    public Guid Id { get; private set; }
    public string Name { get; private set; } = string.Empty;
    public int Order { get; private set; }
    public bool IsActive { get; private set; } = true;
    public ICollection<VehicleModel> Models { get; private set; } = new List<VehicleModel>();

    private VehicleBrand() { }

    public VehicleBrand(string name, int order = 0)
    {
        Id = Guid.NewGuid();
        Name = name.Trim();
        Order = order;
        IsActive = true;
    }
}