namespace AutoNexus.Domain.Enums;

public enum UserProfile
{
    /// <summary>
    /// Dono do SaaS. Não pertence a nenhuma empresa (TenantId fica vazio/Guid.Empty
    /// de propósito) — ver SuperAdminController e o bypass explícito com
    /// IgnoreQueryFilters() em SuperAdminService. Fora do SuperAdminController,
    /// um usuário SuperAdmin não enxerga nada (o filtro global de tenant
    /// continua ativo normalmente em toda outra rota).
    /// </summary>
    SuperAdmin = 0,
    Admin = 1,
    Vendedor = 2,
    Cliente = 3
}