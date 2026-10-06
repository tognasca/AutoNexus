namespace AutoNexus.Application.Interfaces;

/// <summary>
/// Registra eventos importantes do SaaS (seção 35 do documento original:
/// criação de empresa, usuário, login, alteração de plano, cancelamento,
/// operações administrativas...).
///
/// Só adiciona a entrada ao rastreador do EF — não chama SaveChanges/Commit
/// sozinho. Quem chama este serviço já tem (ou deveria ter) um
/// _unitOfWork.CommitAsync() logo depois, e o registro de auditoria entra
/// na MESMA transação da operação principal (mesmo DbContext, escopo por
/// requisição) — ou os dois são salvos juntos, ou nenhum dos dois é.
/// </summary>
public interface IAuditLogService
{
    /// <summary>
    /// Uso normal, dentro de uma requisição de tenant autenticada — tenant e
    /// usuário são resolvidos automaticamente do token JWT atual.
    /// </summary>
    Task LogAsync(string operation, string resource, string? resourceId = null, string? details = null, CancellationToken cancellationToken = default);

    /// <summary>
    /// Uso exclusivo de fluxos sem tenant ambiente correto: ações do
    /// SuperAdmin em nome de uma empresa específica (ele não pertence a
    /// nenhuma), ou o login (o token ainda não existe na requisição que o
    /// está gerando). TenantId e UserId são atribuídos explicitamente.
    /// </summary>
    Task LogForTenantAsync(Guid tenantId, Guid? userId, string operation, string resource, string? resourceId = null, string? details = null, CancellationToken cancellationToken = default);
}
