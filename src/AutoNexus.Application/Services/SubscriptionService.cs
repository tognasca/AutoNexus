using AutoNexus.Application.DTOs;
using AutoNexus.Application.Interfaces;
using AutoNexus.Domain.Interfaces;

namespace AutoNexus.Application.Services;

public class SubscriptionService : ISubscriptionService
{
    private readonly ITenantSubscriptionRepository _subscriptionRepository;
    private readonly IPlanRepository _planRepository;

    public SubscriptionService(ITenantSubscriptionRepository subscriptionRepository, IPlanRepository planRepository)
    {
        _subscriptionRepository = subscriptionRepository;
        _planRepository = planRepository;
    }

    public async Task<TenantSubscriptionDto?> GetCurrentAsync(CancellationToken cancellationToken = default)
    {
        var subscription = await _subscriptionRepository.GetCurrentAsync(cancellationToken);
        if (subscription == null) return null;

        var plan = await _planRepository.GetByIdAsync(subscription.PlanId, cancellationToken);
        return BillingMapper.ToDto(subscription, plan?.Name ?? "—");
    }

    public async Task<List<PlanDto>> GetAvailablePlansAsync(CancellationToken cancellationToken = default)
    {
        var plans = await _planRepository.GetAllAsync(cancellationToken);
        return plans
            .Where(p => p.IsActive)
            .Select(p => BillingMapper.ToDto(p))
            .ToList();
    }
}
