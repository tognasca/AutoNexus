using System.Security.Claims;
using AutoNexus.Domain.Interfaces;
using Microsoft.AspNetCore.Http;

namespace AutoNexus.Infrastructure.Services;

public class TenantContext : ITenantContext
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public TenantContext(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public bool HasTenant => TenantId != Guid.Empty;

    public Guid TenantId
    {
        get
        {
            var httpContext = _httpContextAccessor.HttpContext;
            if (httpContext == null)
                return Guid.Empty;

            var rawClaim = httpContext.User?.Claims
                .FirstOrDefault(c =>
                    c.Type == "tenantId" ||
                    c.Type == "TenantId" ||
                    c.Type == ClaimTypes.GroupSid ||
                    c.Type == ClaimTypes.NameIdentifier);

            if (rawClaim == null)
                return Guid.Empty;

            return Guid.TryParse(rawClaim.Value, out var tenantId) ? tenantId : Guid.Empty;
        }
    }
}
