namespace AutoNexus.Domain.Entities;

/// <summary>
/// Catálogo de planos do SaaS (Free, Basic, Professional, Enterprise...).
/// É dado global — como VehicleType/VehicleBrand — não pertence a um tenant,
/// por isso herda de EntityBase diretamente, não de TenantOwnedEntityBase.
/// Só o SuperAdmin cria/edita planos (ver SuperAdminController).
///
/// Os limites abaixo são nullable de propósito: null = sem limite. Eles
/// ainda não são aplicados/checados em nenhum lugar do sistema (ver
/// requisito 11 do documento original — "preparar a arquitetura", não
/// "implementar os limites agora"). Quando isso for implementado, o lugar
/// certo é um único ponto central (ex.: um PlanLimitsChecker chamado pelos
/// services), nunca IFs espalhados pelos controllers.
/// </summary>
public class Plan : EntityBase
{
    public string Name { get; private set; } = string.Empty;
    public decimal Price { get; private set; }
    public bool IsActive { get; private set; }

    public int? MaxUsers { get; private set; }
    public int? MaxVehicles { get; private set; }
    public int? MaxStorageMb { get; private set; }

    protected Plan() { }

    public Plan(string name, decimal price, int? maxUsers = null, int? maxVehicles = null, int? maxStorageMb = null)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new ArgumentException("Nome do plano é obrigatório.", nameof(name));
        if (price < 0)
            throw new ArgumentException("Preço não pode ser negativo.", nameof(price));

        Name = name.Trim();
        Price = price;
        MaxUsers = maxUsers;
        MaxVehicles = maxVehicles;
        MaxStorageMb = maxStorageMb;
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
