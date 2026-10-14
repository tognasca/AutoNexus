using System.Security.Cryptography;
using System.Text;
using AutoNexus.Application.Interfaces;
using AutoNexus.Domain.Interfaces;
using Microsoft.Extensions.Configuration;

namespace AutoNexus.Application.Services;

public interface IPasswordService
{
    /// <summary>Sempre conclui sem erro, exista o e-mail ou não — não revela quais e-mails têm conta.</summary>
    Task RequestResetAsync(string email, CancellationToken cancellationToken = default);
    Task ResetAsync(string token, string newPassword, CancellationToken cancellationToken = default);
    Task ChangeAsync(string currentPassword, string newPassword, CancellationToken cancellationToken = default);
}

/// <summary>Recuperação e alteração de senha. Token aleatório de 256 bits, uso único, expira em 1 hora, guardado só como hash.</summary>
public class PasswordService : IPasswordService
{
    private const int MinPasswordLength = 8;
    private static readonly TimeSpan TokenLifetime = TimeSpan.FromHours(1);

    private readonly IUserRepository _users;
    private readonly IPasswordHasher _hasher;
    private readonly IEmailService _email;
    private readonly IAuditLogService _audit;
    private readonly ITenantContext _tenantContext;
    private readonly IUnitOfWork _uow;
    private readonly IConfiguration _config;

    public PasswordService(IUserRepository users, IPasswordHasher hasher, IEmailService email, IAuditLogService audit,
        ITenantContext tenantContext, IUnitOfWork uow, IConfiguration config)
    {
        _users = users; _hasher = hasher; _email = email; _audit = audit; _tenantContext = tenantContext; _uow = uow; _config = config;
    }

    public static string HashToken(string token) =>
        Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(token)));

    public async Task RequestResetAsync(string email, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(email)) return;

        var user = await _users.GetByEmailAsync(email, ct);
        if (user == null || !user.IsActive) return;

        var token = Convert.ToBase64String(RandomNumberGenerator.GetBytes(32)).Replace('+', '-').Replace('/', '_').TrimEnd('=');
        user.SetPasswordResetToken(HashToken(token), DateTime.UtcNow.Add(TokenLifetime));
        _users.Update(user);
        await _audit.LogForTenantAsync(user.TenantId, user.Id, "SolicitarRedefinicaoSenha", "User", user.Id.ToString(), null, ct);
        await _uow.CommitAsync(ct);

        var url = $"{(_config["Application:Url"] ?? string.Empty).TrimEnd('/')}/redefinir-senha?token={token}";
        var template = EmailTemplates.RecuperacaoSenha(url);
        await _email.SendAsync(user.Email, user.Name, template.Subject, template.Html, ct);
    }

    public async Task ResetAsync(string token, string newPassword, CancellationToken ct = default)
    {
        ValidateNewPassword(newPassword);
        if (string.IsNullOrWhiteSpace(token)) throw new InvalidOperationException(InvalidLinkMessage);

        var user = await _users.GetByPasswordResetTokenHashAsync(HashToken(token), ct);
        if (user == null || !user.IsActive || user.PasswordResetExpiresAt == null || user.PasswordResetExpiresAt < DateTime.UtcNow)
            throw new InvalidOperationException(InvalidLinkMessage);

        user.ChangePassword(_hasher.Hash(newPassword));
        _users.Update(user);
        await _audit.LogForTenantAsync(user.TenantId, user.Id, "RedefinirSenha", "User", user.Id.ToString(), null, ct);
        await _uow.CommitAsync(ct);
    }

    public async Task ChangeAsync(string currentPassword, string newPassword, CancellationToken ct = default)
    {
        if (_tenantContext.UserId == null) throw new InvalidOperationException("Faça login para alterar a senha.");
        ValidateNewPassword(newPassword);

        var user = await _users.GetByIdAsync(_tenantContext.UserId.Value, ct) ?? throw new KeyNotFoundException("Usuário não encontrado.");
        if (!_hasher.Verify(currentPassword ?? string.Empty, user.PasswordHash))
            throw new InvalidOperationException("Senha atual incorreta.");

        user.ChangePassword(_hasher.Hash(newPassword));
        _users.Update(user);
        await _audit.LogAsync("AlterarSenha", "User", user.Id.ToString(), null, ct);
        await _uow.CommitAsync(ct);
    }

    private const string InvalidLinkMessage = "Link inválido ou expirado. Solicite uma nova redefinição de senha.";

    private static void ValidateNewPassword(string? password)
    {
        if (string.IsNullOrEmpty(password) || password.Length < MinPasswordLength)
            throw new ArgumentException($"A senha deve ter pelo menos {MinPasswordLength} caracteres.");
    }
}
