using System.Security.Claims;
using AutoNexus.Domain.Interfaces;
using Microsoft.AspNetCore.Http;

namespace AutoNexus.Infrastructure.Services;

/// <summary>
/// Implementação real de ITenantContext. Registrada como Scoped — uma
/// instância por requisição HTTP (ou por escopo de DI criado manualmente,
/// como no seed de inicialização, onde não existe HttpContext).
///
/// O TenantId é lido exclusivamente do claim "tenant_id" do token JWT já
/// autenticado por ASP.NET Core (ou seja, já validado quanto à assinatura e
/// expiração antes de chegar aqui). Isso é proposital: o TenantId nunca deve
/// vir de um header, query string ou corpo enviados livremente pelo cliente.
/// </summary>
public class TenantContext : ITenantContext
{
    public Guid TenantId { get; }
    public bool HasTenant { get; }
    public Guid? UserId { get; }

    public TenantContext(IHttpContextAccessor httpContextAccessor)
    {
        var user = httpContextAccessor.HttpContext?.User;
        var claimValue = user?.FindFirst("tenant_id")?.Value;

        if (!string.IsNullOrEmpty(claimValue) && Guid.TryParse(claimValue, out var parsedTenantId))
        {
            TenantId = parsedTenantId;
            HasTenant = true;
        }
        else
        {
            TenantId = Guid.Empty;
            HasTenant = false;
        }

        // "sub" do JWT é mapeado automaticamente para ClaimTypes.NameIdentifier
        // pelo handler padrão do ASP.NET Core — mesmo claim que o resto do
        // projeto já usa (ver AuthController/UsersController).
        var userIdClaim = user?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        UserId = Guid.TryParse(userIdClaim, out var parsedUserId) ? parsedUserId : null;
    }
}
