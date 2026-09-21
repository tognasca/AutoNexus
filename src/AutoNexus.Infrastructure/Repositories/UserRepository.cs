using AutoNexus.Domain.Entities;
using AutoNexus.Domain.Interfaces;
using AutoNexus.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace AutoNexus.Infrastructure.Repositories;

public class UserRepository : IUserRepository
{
    private readonly AutoNexusDbContext _context;

    public UserRepository(AutoNexusDbContext context)
    {
        _context = context;
    }

    public async Task<User?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _context.Users.FirstOrDefaultAsync(u => u.Id == id, cancellationToken);
    }

    public async Task<IEnumerable<User>?> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await _context.Users.ToListAsync(cancellationToken);
    }

    public async Task<User?> GetByEmailAsync(string email, CancellationToken cancellationToken = default)
    {
        return await _context.Users.FirstOrDefaultAsync(u => u.Email == email.ToLower().Trim(), cancellationToken);
    }

    public async Task<bool> EmailExistsAsync(string email, CancellationToken cancellationToken = default)
    {
        return await _context.Users.IgnoreQueryFilters()
            .AnyAsync(u => u.Email == email.ToLower().Trim(), cancellationToken);
    }

    public async Task AddAsync(User user, CancellationToken cancellationToken = default)
    {
        await _context.Users.AddAsync(user, cancellationToken);
    }

    public async Task AddForTenantAsync(User user, Guid tenantId, CancellationToken cancellationToken = default)
    {
        // Atribuição explícita e deliberada — só é permitida porque este
        // repositório está dentro de AutoNexus.Infrastructure (o setter de
        // TenantId é internal justamente para restringir isso). Ver
        // comentário na interface para o porquê deste método existir.
        user.TenantId = tenantId;
        await _context.Users.AddAsync(user, cancellationToken);
    }

    public void Update(User user)
    {
        _context.Users.Update(user);
    }

    // IgnoreQueryFilters() é usado aqui DE PROPÓSITO e só aqui — este método
    // existe exclusivamente para o SuperAdminService/SuperAdminController.
    // Todo o resto do repositório continua respeitando o filtro global
    // normalmente (GetByIdAsync, GetAllAsync, GetByEmailAsync acima).
    public async Task<List<User>> GetAllAcrossTenantsAsync(Guid? tenantId = null, CancellationToken cancellationToken = default)
    {
        var query = _context.Users.IgnoreQueryFilters().AsQueryable();

        if (tenantId.HasValue)
            query = query.Where(u => u.TenantId == tenantId.Value);

        return await query.OrderBy(u => u.Name).ToListAsync(cancellationToken);
    }
}