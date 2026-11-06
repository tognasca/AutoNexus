using Microsoft.AspNetCore.Http;

namespace AutoNexus.Api.Security;

public static class UploadValidation
{
    private const long MaxDocumentBytes = 20 * 1024 * 1024;
    private static readonly Dictionary<string, byte[][]> Signatures = new(StringComparer.OrdinalIgnoreCase)
    {
        [".jpg"] = [new byte[] { 0xFF, 0xD8, 0xFF }],
        [".jpeg"] = [new byte[] { 0xFF, 0xD8, 0xFF }],
        [".png"] = [new byte[] { 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A }],
        [".webp"] = [new byte[] { 0x52, 0x49, 0x46, 0x46 }],
        [".pdf"] = [new byte[] { 0x25, 0x50, 0x44, 0x46, 0x2D }]
    };

    public static async Task<bool> IsValidAsync(IFormFile file, bool imagesOnly, CancellationToken ct)
    {
        if (file.Length <= 0 || file.Length > (imagesOnly ? 10 * 1024 * 1024 : MaxDocumentBytes))
            return false;
        var extension = Path.GetExtension(file.FileName);
        if (!Signatures.TryGetValue(extension, out var signatures) ||
            (imagesOnly && extension.Equals(".pdf", StringComparison.OrdinalIgnoreCase)))
            return false;

        var buffer = new byte[16];
        await using var stream = file.OpenReadStream();
        var read = await stream.ReadAsync(buffer.AsMemory(), ct);
        if (!signatures.Any(signature => read >= signature.Length && buffer.AsSpan(0, signature.Length).SequenceEqual(signature)))
            return false;
        if (extension.Equals(".webp", StringComparison.OrdinalIgnoreCase) &&
            (read < 12 || !buffer.AsSpan(8, 4).SequenceEqual("WEBP"u8)))
            return false;
        return true;
    }
}
