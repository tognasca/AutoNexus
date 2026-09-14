namespace AutoNexus.Domain.Entities;

public class VehiclePhoto : EntityBase
{
    public Guid VehicleId { get; private set; }
    public string FileName { get; private set; } = string.Empty;
    public string StoragePath { get; private set; } = string.Empty;
    public string MimeType { get; private set; } = string.Empty;
    public long FileSize { get; private set; }
    public int Order { get; private set; }
    public bool IsMain { get; private set; }

    public Vehicle Vehicle { get; private set; } = null!;

    // Construtor protegido obrigatório para o EF Core
    protected VehiclePhoto() { }

    public VehiclePhoto(
        Guid vehicleId,
        string fileName,
        string storagePath,
        string mimeType,
        long fileSize,
        int order = 0,
        bool isMain = false)
    {
        VehicleId = vehicleId;
        FileName = fileName;
        StoragePath = storagePath;
        MimeType = mimeType;
        FileSize = fileSize;
        Order = order;
        IsMain = isMain;
    }

    public void SetAsMain()
    {
        IsMain = true;
        UpdatedAt = DateTime.UtcNow;
    }

    public void UnsetMain()
    {
        IsMain = false;
        UpdatedAt = DateTime.UtcNow;
    }
}