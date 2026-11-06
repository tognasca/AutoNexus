using System.Security.Cryptography;
using System.Text;

namespace AutoNexus.Api.Security;

/// <summary>
/// Encrypts new secrets with an independent key. Legacy ciphertext can be read
/// with the JWT-derived key during a controlled key migration.
/// </summary>
public sealed class MercadoPagoCredentialProtector
{
    private readonly byte[] _legacyKey;
    private readonly byte[]? _encryptionKey;

    public MercadoPagoCredentialProtector(IConfiguration configuration)
    {
        var jwt = configuration["Jwt:SecretKey"];
        if (string.IsNullOrWhiteSpace(jwt) || jwt.Length < 32)
            throw new InvalidOperationException("Jwt:SecretKey precisa ter ao menos 32 caracteres.");
        _legacyKey = SHA256.HashData(Encoding.UTF8.GetBytes("AutoNexus|MercadoPago|v1|" + jwt));

        var configuredKey = configuration["Security:CredentialEncryptionKey"];
        if (!string.IsNullOrWhiteSpace(configuredKey))
        {
            var decoded = Convert.FromBase64String(configuredKey);
            if (decoded.Length != 32)
                throw new InvalidOperationException("Security:CredentialEncryptionKey deve ser Base64 de 32 bytes.");
            _encryptionKey = decoded;
        }
    }

    public string Protect(string value)
    {
        if (_encryptionKey == null)
            throw new InvalidOperationException("Configure Security:CredentialEncryptionKey antes de salvar credenciais.");
        return "v2:" + Encrypt(value, _encryptionKey);
    }

    public string Unprotect(string value)
    {
        if (value.StartsWith("v2:", StringComparison.Ordinal))
        {
            if (_encryptionKey == null)
                throw new InvalidOperationException("Security:CredentialEncryptionKey ausente.");
            return Decrypt(value[3..], _encryptionKey);
        }
        return Decrypt(value, _legacyKey);
    }

    private static string Encrypt(string value, byte[] key)
    {
        var nonce = RandomNumberGenerator.GetBytes(12);
        var plain = Encoding.UTF8.GetBytes(value);
        var cipher = new byte[plain.Length];
        var tag = new byte[16];
        using var aes = new AesGcm(key, 16);
        aes.Encrypt(nonce, plain, cipher, tag);
        return Convert.ToBase64String(nonce.Concat(tag).Concat(cipher).ToArray());
    }

    private static string Decrypt(string value, byte[] key)
    {
        var payload = Convert.FromBase64String(value);
        if (payload.Length < 28) throw new CryptographicException("Credencial criptografada inválida.");
        var nonce = payload[..12];
        var tag = payload[12..28];
        var cipher = payload[28..];
        var plain = new byte[cipher.Length];
        using var aes = new AesGcm(key, 16);
        aes.Decrypt(nonce, cipher, tag, plain);
        return Encoding.UTF8.GetString(plain);
    }
}
