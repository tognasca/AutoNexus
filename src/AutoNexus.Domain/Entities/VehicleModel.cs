namespace AutoNexus.Domain.Entities;

public class VehicleModel
{
    public Guid Id { get; private set; }
    public Guid VehicleBrandId { get; private set; }
    public string Name { get; private set; } = string.Empty;
    public bool IsActive { get; private set; } = true;
    public VehicleBrand? VehicleBrand { get; private set; }

    private VehicleModel() { }

    public VehicleModel(Guid vehicleBrandId, string name)
    {
        Id = Guid.NewGuid();
        VehicleBrandId = vehicleBrandId;
        Name = name.Trim();
        IsActive = true;
    }
}