using AutoNexus.Domain.Enums;

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

    /// <summary>Preço mensal. Mantido como "Price" por compatibilidade com código já existente (telas, DTOs).</summary>
    public decimal Price { get; private set; }

    /// <summary>
    /// Preço anual (cobrança única cobrindo os 12 meses). Null = plano não
    /// oferece opção anual.
    /// </summary>
    public decimal? AnnualPrice { get; private set; }

    /// <summary>Dias de teste grátis antes da primeira cobrança. 0 = sem trial.</summary>
    public int TrialDays { get; private set; }

    public bool IsActive { get; private set; }

    public int? MaxUsers { get; private set; }
    public int? MaxVehicles { get; private set; }
    public int? MaxStorageMb { get; private set; }

    protected Plan() { }

    // Novos parâmetros (annualPrice, trialDays) ficam no final, depois dos
    // já existentes — chamadas antigas (ex.: SuperAdminService.CreatePlanAsync)
    // continuam funcionando sem alteração.
    public Plan(
        string name,
        decimal price,
        int? maxUsers = null,
        int? maxVehicles = null,
        int? maxStorageMb = null,
        decimal? annualPrice = null,
        int trialDays = 0)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new ArgumentException("Nome do plano é obrigatório.", nameof(name));
        if (price < 0)
            throw new ArgumentException("Preço não pode ser negativo.", nameof(price));
        if (annualPrice.HasValue && annualPrice.Value < 0)
            throw new ArgumentException("Preço anual não pode ser negativo.", nameof(annualPrice));
        if (trialDays < 0)
            throw new ArgumentException("Dias de trial não pode ser negativo.", nameof(trialDays));

        Name = name.Trim();
        Price = price;
        AnnualPrice = annualPrice;
        TrialDays = trialDays;
        MaxUsers = maxUsers;
        MaxVehicles = maxVehicles;
        MaxStorageMb = maxStorageMb;
        IsActive = true;
    }

    /// <summary>Altera preços/limites/trial sem mexer em código (requisito 1 do documento de definições).</summary>
    public void Update(string name, decimal price, decimal? annualPrice, int trialDays, int? maxUsers, int? maxVehicles, int? maxStorageMb)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new ArgumentException("Nome do plano é obrigatório.", nameof(name));
        if (price < 0 || (annualPrice.HasValue && annualPrice.Value < 0))
            throw new ArgumentException("Preço não pode ser negativo.");
        if (trialDays < 0)
            throw new ArgumentException("Dias de trial não pode ser negativo.", nameof(trialDays));

        Name = name.Trim();
        Price = price;
        AnnualPrice = annualPrice;
        TrialDays = trialDays;
        MaxUsers = maxUsers;
        MaxVehicles = maxVehicles;
        MaxStorageMb = maxStorageMb;
        UpdatedAt = DateTime.UtcNow;
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

    /// <summary>Preço cobrado de fato para o ciclo escolhido (mensal ou o valor anual fixo).</summary>
    public decimal GetPriceForCycle(BillingCycle cycle) =>
        cycle == BillingCycle.Annual && AnnualPrice.HasValue ? AnnualPrice.Value : Price;
}
