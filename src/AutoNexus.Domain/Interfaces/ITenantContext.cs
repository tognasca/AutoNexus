namespace AutoNexus.Domain.Interfaces;

/// <summary>
/// Descobre qual Tenant está associado à requisição atual. A implementação
/// concreta (fora do Domain, ver AutoNexus.Infrastructure.Services.TenantContext)
/// lê o TenantId exclusivamente de um claim do token JWT já validado —
/// nunca de um header, query string ou corpo da requisição enviados pelo
/// cliente.
/// </summary>
public interface ITenantContext
{
    /// <summary>
    /// Id do tenant autenticado na requisição atual. Só é válido quando
    /// <see cref="HasTenant"/> é true.
    /// </summary>
    Guid TenantId { get; }

    /// <summary>
    /// False quando não há um tenant identificado na requisição atual —
    /// por exemplo, durante o seed/migração na inicialização da aplicação
    /// (que roda fora de um request HTTP), ou futuramente para rotas
    /// exclusivas do SuperAdmin. Nesses casos o filtro global de tenant
    /// deixa de ser aplicado — por isso HasTenant deve ser tratado com
    /// cuidado e nunca fica true a partir de dado enviado pelo cliente.
    /// </summary>
    bool HasTenant { get; }

    /// <summary>
    /// Id do usuário autenticado na requisição atual, lido do claim "sub"
    /// do JWT. Null fora de uma requisição autenticada (seed, requisições
    /// anônimas). Usado principalmente para auditoria (ver AuditLogService) —
    /// evita ter que passar "quem fez a ação" manualmente por toda cadeia de
    /// chamadas de serviço.
    /// </summary>
    Guid? UserId { get; }
}
