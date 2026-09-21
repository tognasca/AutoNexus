using AutoNexus.Application.DTOs;

namespace AutoNexus.Application.Interfaces;

public interface ISubscriptionService
{
    Task<TenantSubscriptionDto?> GetCurrentAsync(CancellationToken cancellationToken = default);
    Task<List<PlanDto>> GetAvailablePlansAsync(CancellationToken cancellationToken = default);
}
