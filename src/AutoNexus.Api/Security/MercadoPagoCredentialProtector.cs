using System.Security.Cryptography;
using System.Text;

namespace AutoNexus.Api.Security;

/// <summary>Protege credenciais persistidas usando chave derivada do segredo JWT do servidor.</summary>
public sealed class MercadoPagoCredentialProtector
{
    private readonly byte[] _key;

    public MercadoPagoCredentialProtector(IConfiguration configuration)
    {
        var masterKey = configuration["Jwt:SecretKey"];
        if (string.IsNullOrWhiteSpace(masterKey) || masterKey.Length < 32)
            throw new InvalidOperationException("Jwt:SecretKey precisa ter ao menos 32 caracteres para proteger as credenciais do gateway.");
        _key = SHA256.HashData(Encoding.UTF8.GetBytes("AutoNexus|MercadoPago|v1|" + masterKey));
    }

    public string Protect(string value)
    {
        var nonce = RandomNumberGenerator.GetBytes(12);
        var plain = Encoding.UTF8.GetBytes(value);
        var cipher = new byte[plain.Length];
        var tag = new byte[16];
        using var aes = new AesGcm(_key, 16);
        aes.Encrypt(nonce, plain, cipher, tag);
        return Convert.ToBase64String(nonce.Concat(tag).Concat(cipher).ToArray());
    }

    public string Unprotect(string value)
    {
        var payload = Convert.FromBase64String(value);
        if (payload.Length < 28) throw new CryptographicException("Credencial criptografada inválida.");
        var nonce = payload[..12];
        var tag = payload[12..28];
        var cipher = payload[28..];
        var plain = new byte[cipher.Length];
        using var aes = new AesGcm(_key, 16);
        aes.Decrypt(nonce, cipher, tag, plain);
        return Encoding.UTF8.GetString(plain);
    }
}
