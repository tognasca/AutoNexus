namespace AutoNexus.Application.DTOs;

public record TenantDto(
    Guid Id,
    string Name,
    string Slug,
    bool IsActive,
    DateTime CreatedAt
);

public record CreateTenantDto(string Name, string Slug);

/// <summary>
/// Cria a empresa e já cria seu primeiro usuário Admin — sem isso, uma
/// empresa recém-criada pelo SuperAdmin ficaria sem ninguém capaz de entrar
/// nela (o cadastro normal de usuários exige já estar autenticado como Admin
/// daquela empresa).
/// </summary>
public record CreateTenantWithAdminDto(
    string TenantName,
    string TenantSlug,
    string AdminName,
    string AdminEmail,
    string AdminPassword
);
