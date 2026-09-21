using System.IO.Compression;
using AutoNexus.Application.Interfaces;
using AutoNexus.Domain.Interfaces;
using Microsoft.AspNetCore.Hosting;

namespace AutoNexus.Infrastructure.Services;

public class LocalStorageService : IStorageService
{
    private readonly IWebHostEnvironment _environment;
    private readonly ITenantContext _tenantContext;

    public LocalStorageService(IWebHostEnvironment environment, ITenantContext tenantContext)
    {
        _environment = environment;
        _tenantContext = tenantContext;
    }

    public async Task<string> SaveFileAsync(Stream fileStream, string fileName, string folder, CancellationToken cancellationToken = default)
    {
        var root = GetWebRootPath();

        // Isola fisicamente os arquivos de cada empresa: novo upload sempre
        // cai em /uploads/tenants/{tenantId}/{folder}/... Isso é só para
        // organização/higiene operacional (ex.: dá pra apagar tudo de um
        // tenant cancelado sem afetar os demais) — a autorização em si já é
        // garantida antes de chegar aqui, pelo filtro global do
        // AutoNexusDbContext (o vehicleId/documentId só existe se pertencer
        // ao tenant autenticado).
        //
        // Arquivos que já existiam antes desta mudança continuam funcionando
        // normalmente: o caminho de cada um já está salvo em StoragePath no
        // banco e é usado literalmente por DeleteFileAsync/GetFileBytesAsync/
        // CreateZipAsync — esta função só decide o caminho de uploads NOVOS.
        var tenantSegment = _tenantContext.HasTenant
            ? _tenantContext.TenantId.ToString()
            : "shared";

        var targetDirectory = Path.Combine(root, "uploads", "tenants", tenantSegment, folder);
        if (!Directory.Exists(targetDirectory))
        {
            Directory.CreateDirectory(targetDirectory);
        }

        var extension = Path.GetExtension(fileName).ToLowerInvariant();
        var uniqueFileName = $"{Guid.NewGuid()}{extension}";
        var fullPath = Path.Combine(targetDirectory, uniqueFileName);

        using (var stream = new FileStream(fullPath, FileMode.Create, FileAccess.Write, FileShare.None))
        {
            await fileStream.CopyToAsync(stream, cancellationToken);
        }

        return $"/uploads/tenants/{tenantSegment}/{folder}/{uniqueFileName}".Replace("\\", "/");
    }

    public Task DeleteFileAsync(string relativePath, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(relativePath)) return Task.CompletedTask;

        var root = GetWebRootPath();
        var sanitized = relativePath.TrimStart('/').Replace("/", Path.DirectorySeparatorChar.ToString());
        var fullPath = Path.Combine(root, sanitized);

        if (File.Exists(fullPath))
        {
            File.Delete(fullPath);
        }

        return Task.CompletedTask;
    }

    public async Task<byte[]> GetFileBytesAsync(string relativePath, CancellationToken cancellationToken = default)
    {
        var root = GetWebRootPath();
        var sanitized = relativePath.TrimStart('/').Replace("/", Path.DirectorySeparatorChar.ToString());
        var fullPath = Path.Combine(root, sanitized);

        if (!File.Exists(fullPath))
            throw new FileNotFoundException("Arquivo não encontrado no servidor.", fullPath);

        return await File.ReadAllBytesAsync(fullPath, cancellationToken);
    }

    public async Task<byte[]> CreateZipAsync(IEnumerable<(string RelativePath, string EntryName)> files, CancellationToken cancellationToken = default)
    {
        var root = GetWebRootPath();
        using var memoryStream = new MemoryStream();

        using (var archive = new ZipArchive(memoryStream, ZipArchiveMode.Create, true))
        {
            foreach (var (relativePath, entryName) in files)
            {
                var sanitized = relativePath.TrimStart('/').Replace("/", Path.DirectorySeparatorChar.ToString());
                var fullPath = Path.Combine(root, sanitized);

                if (File.Exists(fullPath))
                {
                    var entry = archive.CreateEntry(entryName, CompressionLevel.Optimal);
                    using var entryStream = entry.Open();
                    using var fileStream = File.OpenRead(fullPath);
                    await fileStream.CopyToAsync(entryStream, cancellationToken);
                }
            }
        }

        return memoryStream.ToArray();
    }

    private string GetWebRootPath()
    {
        return _environment.WebRootPath ?? Path.Combine(_environment.ContentRootPath, "wwwroot");
    }
}
