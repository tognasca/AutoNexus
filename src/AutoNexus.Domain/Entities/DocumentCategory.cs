namespace AutoNexus.Domain.Entities;

public class DocumentCategory : EntityBase
{
    public string Name { get; private set; } = string.Empty;
    public string? Description { get; private set; }
    public bool IsActive { get; private set; }

    public ICollection<VehicleDocument> Documents { get; private set; } = new List<VehicleDocument>();

    public DocumentCategory(string name, string? description = null)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new ArgumentException("Nome da categoria de documento é obrigatório.", nameof(name));

        Name = name.Trim();
        Description = description?.Trim();
        IsActive = true;
    }

    public void Update(string name, string? description)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new ArgumentException("Nome da categoria de documento é obrigatório.", nameof(name));

        Name = name.Trim();
        Description = description?.Trim();
        UpdatedAt = DateTime.UtcNow;
    }

    public void Deactivate()
    {
        IsActive = false;
        UpdatedAt = DateTime.UtcNow;
    }
}