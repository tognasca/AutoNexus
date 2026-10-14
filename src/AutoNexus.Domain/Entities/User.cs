using AutoNexus.Domain.Enums;

namespace AutoNexus.Domain.Entities;

public class User : TenantOwnedEntityBase
{
    public string Name { get; private set; } = string.Empty;
    public string Email { get; private set; } = string.Empty;
    public string PasswordHash { get; private set; } = string.Empty;
    public UserProfile Profile { get; private set; }
    public bool IsActive { get; private set; }

    /// <summary>Hash (SHA-256) do token de redefinição de senha — o token em si nunca é guardado, só enviado por e-mail.</summary>
    public string? PasswordResetTokenHash { get; private set; }
    public DateTime? PasswordResetExpiresAt { get; private set; }

    public User(string name, string email, string passwordHash, UserProfile profile)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new ArgumentException("Nome é obrigatório.", nameof(name));

        if (string.IsNullOrWhiteSpace(email))
            throw new ArgumentException("E-mail é obrigatório.", nameof(email));

        Name = name.Trim();
        Email = email.Trim().ToLower();
        PasswordHash = passwordHash;
        Profile = profile;
        IsActive = true;
    }

    public void SetPasswordResetToken(string tokenHash, DateTime expiresAt)
    {
        PasswordResetTokenHash = tokenHash;
        PasswordResetExpiresAt = expiresAt;
        UpdatedAt = DateTime.UtcNow;
    }

    /// <summary>Troca a senha e invalida qualquer token de redefinição pendente (uso único).</summary>
    public void ChangePassword(string newPasswordHash)
    {
        if (string.IsNullOrWhiteSpace(newPasswordHash))
            throw new ArgumentException("Senha inválida.", nameof(newPasswordHash));

        PasswordHash = newPasswordHash;
        PasswordResetTokenHash = null;
        PasswordResetExpiresAt = null;
        UpdatedAt = DateTime.UtcNow;
    }

    public void Deactivate()
    {
        IsActive = false;
        UpdatedAt = DateTime.UtcNow;
    }
}