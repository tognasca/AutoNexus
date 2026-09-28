using AutoNexus.Application.DTOs;

namespace AutoNexus.Application.Interfaces;

/// <summary>
/// Configurações da PRÓPRIA empresa autenticada — diferente do
/// ISuperAdminService, aqui o filtro global de tenant garante que cada
/// empresa só vê/edita a sua. Usado pela tela de configurações do Admin do
/// tenant, não pelo SuperAdmin.
/// </summary>
public interface ITenantSettingService
{
    Task<TenantSettingDto> GetCurrentAsync(CancellationToken cancellationToken = default);
    Task<TenantSettingDto> UpdateAsync(TenantSettingDto dto, CancellationToken cancellationToken = default);
}
