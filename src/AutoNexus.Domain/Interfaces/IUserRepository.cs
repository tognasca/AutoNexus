using AutoNexus.Domain.Entities;

namespace AutoNexus.Domain.Interfaces;

public interface IUserRepository
{
    Task<User?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IEnumerable<User>?> GetAllAsync(CancellationToken cancellationToken = default);
    Task<User?> GetByEmailAsync(string email, CancellationToken cancellationToken = default);

    /// <summary>
    /// Checagem global de existência de e-mail (ignora o filtro de tenant de
    /// propósito): o índice único de User.Email no banco é global, então a
    /// validação de "e-mail já cadastrado" precisa ser global também, ou o
    /// Create acaba falhando com erro de banco em vez de uma mensagem
    /// amigável quando duas empresas tentam usar o mesmo e-mail.
    /// </summary>
    Task<bool> EmailExistsAsync(string email, CancellationToken cancellationToken = default);
    Task AddAsync(User user, CancellationToken cancellationToken = default);

    /// <summary>
    /// Uso exclusivo do fluxo de provisionamento do SuperAdmin (criar uma
    /// empresa nova + seu primeiro Admin). Diferente de AddAsync, aqui o
    /// TenantId é atribuído explicitamente ao tenant recém-criado — nunca ao
    /// tenant do usuário autenticado (o SuperAdmin não pertence a nenhum).
    /// Fora desse fluxo, jamais atribuir TenantId manualmente: em todo o
    /// resto do sistema isso é feito sozinho por AutoNexusDbContext.SaveChanges.
    /// </summary>
    Task AddForTenantAsync(User user, Guid tenantId, CancellationToken cancellationToken = default);
    void Update(User user);

    /// <summary>
    /// Uso exclusivo do SuperAdmin: ignora deliberadamente o filtro global de
    /// tenant para listar usuários de uma empresa específica (gestão) ou de
    /// todas (visão global). Nunca chamar isso fora de um fluxo autorizado
    /// como SuperAdmin — ver SuperAdminService/SuperAdminController.
    /// </summary>
    Task<List<User>> GetAllAcrossTenantsAsync(Guid? tenantId = null, CancellationToken cancellationToken = default);
}