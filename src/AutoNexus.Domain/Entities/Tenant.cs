namespace AutoNexus.Domain.Entities;

public class Tenant : EntityBase
{
    /// <summary>
    /// Id fixo e conhecido do tenant criado automaticamente para receber todos
    /// os dados que já existiam no sistema antes da introdução do multi-tenancy.
    /// Usado tanto pela migration (como valor padrão de coluna, para popular
    /// linhas já existentes) quanto pelo seed (<see cref="Seeds.DbInitializer"/>).
    /// NÃO reutilizar este Id para nenhum outro tenant real.
    /// </summary>
    public static readonly Guid DefaultTenantId = Guid.Parse("00000000-0000-0000-0000-000000000001");

    public string Name { get; private set; } = string.Empty;
    public string Slug { get; private set; } = string.Empty;
    public bool IsActive { get; private set; }

    protected Tenant() { }

    public Tenant(string name, string slug)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new ArgumentException("Nome da empresa é obrigatório.", nameof(name));

        if (string.IsNullOrWhiteSpace(slug))
            throw new ArgumentException("Slug da empresa é obrigatório.", nameof(slug));

        Name = name.Trim();
        Slug = slug.Trim().ToLowerInvariant();
        IsActive = true;
    }

    public void Activate()
    {
        IsActive = true;
        UpdatedAt = DateTime.UtcNow;
    }

    public void Deactivate()
    {
        IsActive = false;
        UpdatedAt = DateTime.UtcNow;
    }
}
