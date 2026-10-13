using AutoNexus.Application.Interfaces;
using AutoNexus.Domain.Enums;
using AutoNexus.Domain.Interfaces;

namespace AutoNexus.Application.Services;

/// <summary>Envia e-mail ao administrador de uma empresa (usado por webhooks/jobs, que não têm usuário logado).</summary>
public class TenantNotifier : ITenantNotifier
{
    private readonly IUserRepository _users;
    private readonly IEmailService _email;

    public TenantNotifier(IUserRepository users, IEmailService email)
    {
        _users = users;
        _email = email;
    }

    public async Task NotifyAdminAsync(Guid tenantId, (string Subject, string Html) template, CancellationToken cancellationToken = default)
    {
        var users = await _users.GetAllAcrossTenantsAsync(tenantId, cancellationToken);
        var admin = users.FirstOrDefault(u => u.IsActive && u.Profile == UserProfile.Admin);
        if (admin == null) return;
        await _email.SendAsync(admin.Email, admin.Name, template.Subject, template.Html, cancellationToken);
    }
}
