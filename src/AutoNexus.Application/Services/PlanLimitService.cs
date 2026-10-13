using AutoNexus.Application.Interfaces;
using AutoNexus.Domain.Interfaces;

namespace AutoNexus.Application.Services;

/// <summary>
/// Ponto ÚNICO de verificação de limites do plano (requisito 16) — os
/// controllers/services só chamam EnsureCanAdd...; nenhum IF de limite fica
/// espalhado pelo sistema. Limite null no plano = ilimitado.
/// </summary>
public class PlanLimitService : IPlanLimitService
{
    private readonly ITenantSubscriptionRepository _subscriptions;
    private readonly IPlanRepository _plans;
    private readonly IUserRepository _users;
    private readonly IVehicleRepository _vehicles;

    public PlanLimitService(ITenantSubscriptionRepository subscriptions, IPlanRepository plans, IUserRepository users, IVehicleRepository vehicles)
    {
        _subscriptions = subscriptions;
        _plans = plans;
        _users = users;
        _vehicles = vehicles;
    }

    public async Task EnsureCanAddUserAsync(CancellationToken cancellationToken = default)
    {
        var plan = await GetCurrentPlanAsync(cancellationToken);
        if (plan?.MaxUsers is int max && await _users.CountAsync(cancellationToken) >= max)
            throw new PlanLimitExceededException($"Seu plano {plan.Name} permite até {max} usuário(s). Faça upgrade do plano para adicionar mais.");
    }

    public async Task EnsureCanAddVehicleAsync(CancellationToken cancellationToken = default)
    {
        var plan = await GetCurrentPlanAsync(cancellationToken);
        if (plan?.MaxVehicles is int max && await _vehicles.CountAsync(cancellationToken) >= max)
            throw new PlanLimitExceededException($"Seu plano {plan.Name} permite até {max} veículo(s). Faça upgrade do plano para cadastrar mais.");
    }

    private async Task<Domain.Entities.Plan?> GetCurrentPlanAsync(CancellationToken cancellationToken)
    {
        var sub = await _subscriptions.GetCurrentAsync(cancellationToken);
        return sub == null ? null : await _plans.GetByIdAsync(sub.PlanId, cancellationToken);
    }
}
