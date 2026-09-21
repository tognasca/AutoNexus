using AutoNexus.Domain.Enums;

namespace AutoNexus.Domain.Entities;

public class User : EntityBase
{
    public string Name { get; private set; } = string.Empty;
    public string Email { get; private set; } = string.Empty;
    public string PasswordHash { get; private set; } = string.Empty;
    public UserProfile Profile { get; private set; }
    public bool IsActive { get; private set; }
    public Guid TenantId { get; private set; }

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

    public void Deactivate()
    {
        IsActive = false;
        UpdatedAt = DateTime.UtcNow;
    }
}