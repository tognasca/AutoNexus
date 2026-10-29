using AutoNexus.Domain.Models;

namespace AutoNexus.Domain.Interfaces;

public interface IBvFinancingConditionsService
{
    Task<BvFinancingConditionsResponse> GetConditionsAsync(
        BvFinancingConditionsRequest request,
        CancellationToken cancellationToken = default);
}
