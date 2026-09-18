using AutoNexus.Domain.Enums;

namespace AutoNexus.Domain.Entities;

public class VehicleDocument : EntityBase
{
    public Guid VehicleId { get; private set; }
    public Guid DocumentCategoryId { get; private set; }
    public string Name { get; private set; } = string.Empty;
    public string FileName { get; private set; } = string.Empty;
    public string StoragePath { get; private set; } = string.Empty;
    public string MimeType { get; private set; } = string.Empty;
    public long FileSize { get; private set; }
    public Guid UploadedByUserId { get; private set; }
    public string? Notes { get; private set; }
    public bool ShowInCatalog { get; private set; } 

    // Relacionamentos EF Core
    public Vehicle Vehicle { get; private set; } = null!;
    public DocumentCategory DocumentCategory { get; private set; } = null!;

    protected VehicleDocument() { }

    public VehicleDocument(
        Guid vehicleId,
        Guid documentCategoryId,
        string name,
        string fileName,
        string storagePath,
        string mimeType,
        long fileSize,
        Guid uploadedByUserId,
        bool showInCatalog = false,
        string? notes = null)
    {
        if (vehicleId == Guid.Empty)
            throw new ArgumentException("Identificador do veículo é obrigatório.", nameof(vehicleId));

        if (documentCategoryId == Guid.Empty)
            throw new ArgumentException("Categoria de documento é obrigatória.", nameof(documentCategoryId));

        if (string.IsNullOrWhiteSpace(name))
            throw new ArgumentException("Nome do documento é obrigatório.", nameof(name));

        VehicleId = vehicleId;
        DocumentCategoryId = documentCategoryId;
        Name = name.Trim();
        FileName = fileName;
        StoragePath = storagePath;
        MimeType = mimeType;
        FileSize = fileSize;
        UploadedByUserId = uploadedByUserId;
        ShowInCatalog = showInCatalog;
        Notes = notes?.Trim();
    }

    /// <summary>
    /// Alterna a exibição pública do documento no Catálogo Digital (/catalogo)
    /// </summary>
    public void ToggleShowInCatalog(bool show)
    {
        ShowInCatalog = show;
        UpdatedAt = DateTime.UtcNow;
    }

    /// <summary>
    /// Atualiza notas e observações internas do documento
    /// </summary>
    public void UpdateNotes(string? notes)
    {
        Notes = notes?.Trim();
        UpdatedAt = DateTime.UtcNow;
    }
}