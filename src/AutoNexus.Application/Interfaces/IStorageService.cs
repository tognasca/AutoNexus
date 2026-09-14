namespace AutoNexus.Application.Interfaces;

public interface IStorageService
{
    Task<string> SaveFileAsync(Stream fileStream, string fileName, string folder, CancellationToken cancellationToken = default);
    Task DeleteFileAsync(string relativePath, CancellationToken cancellationToken = default);
    Task<byte[]> GetFileBytesAsync(string relativePath, CancellationToken cancellationToken = default);
    Task<byte[]> CreateZipAsync(IEnumerable<(string RelativePath, string EntryName)> files, CancellationToken cancellationToken = default);
}
