using System.IO.Compression;
using AutoNexus.Application.Interfaces;
using Microsoft.AspNetCore.Hosting;

namespace AutoNexus.Infrastructure.Services;

public class LocalStorageService : IStorageService
{
    private readonly IWebHostEnvironment _environment;

    public LocalStorageService(IWebHostEnvironment environment)
    {
        _environment = environment;
    }

    public async Task<string> SaveFileAsync(Stream fileStream, string fileName, string folder, CancellationToken cancellationToken = default)
    {
        var root = GetWebRootPath();
        var targetDirectory = Path.Combine(root, "uploads", folder);
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

        return $"/uploads/{folder}/{uniqueFileName}".Replace("\\", "/");
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
