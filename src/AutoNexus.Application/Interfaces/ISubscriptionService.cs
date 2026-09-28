using AutoNexus.Application.DTOs;

namespace AutoNexus.Application.Interfaces;

/// <summary>
/// Visão da PRÓPRIA assinatura — diferente de ISuperAdminService, aqui o
/// filtro global de tenant garante que cada empresa só vê a sua. Só leitura:
/// trocar de plano continua sendo uma ação do SuperAdmin (ver
/// SuperAdminController.AssignPlan) até existir cobrança automática.
/// </summary>
public interface ISubscriptionService
{
    Task<TenantSubscriptionDto?> GetCurrentAsync(CancellationToken cancellationToken = default);
    Task<List<PlanDto>> GetAvailablePlansAsync(CancellationToken cancellationToken = default);
}
