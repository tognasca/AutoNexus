using System.Globalization;
using System.Text;
using AutoNexus.Application.DTOs;
using AutoNexus.Application.Interfaces;
using AutoNexus.Domain.Entities;
using AutoNexus.Domain.Enums;
using AutoNexus.Domain.Interfaces;

namespace AutoNexus.Application.Services;

/// <summary>
/// Cadastro público (self-service): empresa + administrador + aceite dos
/// documentos legais + assinatura em trial — tudo numa única transação (ou
/// cria tudo, ou nada — nunca uma conta pela metade).
/// </summary>
public class SignupService : ISignupService
{
    private readonly ITenantRepository _tenants;
    private readonly IUserRepository _users;
    private readonly IPlanRepository _plans;
    private readonly ITenantSubscriptionRepository _subs;
    private readonly ITenantSettingRepository _settings;
    private readonly ILegalDocumentRepository _legal;
    private readonly IUserConsentRepository _consents;
    private readonly IPasswordHasher _hasher;
    private readonly IJwtTokenGenerator _jwt;
    private readonly IAuditLogService _audit;
    private readonly IEmailService _email;
    private readonly IUnitOfWork _uow;

    public SignupService(ITenantRepository tenants, IUserRepository users, IPlanRepository plans, ITenantSubscriptionRepository subs,
        ITenantSettingRepository settings, ILegalDocumentRepository legal, IUserConsentRepository consents, IPasswordHasher hasher,
        IJwtTokenGenerator jwt, IAuditLogService audit, IEmailService email, IUnitOfWork uow)
    {
        _tenants = tenants; _users = users; _plans = plans; _subs = subs; _settings = settings; _legal = legal;
        _consents = consents; _hasher = hasher; _jwt = jwt; _audit = audit; _email = email; _uow = uow;
    }

    public async Task<SignupResultDto> SignupAsync(SignupDto dto, string? ipAddress, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(dto.CompanyName)) throw new ArgumentException("Informe o nome da empresa.");
        if (string.IsNullOrWhiteSpace(dto.AdminName)) throw new ArgumentException("Informe o seu nome.");
        if (string.IsNullOrWhiteSpace(dto.AdminEmail) || !dto.AdminEmail.Contains('@')) throw new ArgumentException("Informe um e-mail válido.");
        if (string.IsNullOrEmpty(dto.AdminPassword) || dto.AdminPassword.Length < 8) throw new ArgumentException("A senha deve ter pelo menos 8 caracteres.");
        if (!dto.AcceptTermsOfUse || !dto.AcceptPrivacyPolicy || !dto.AcceptCookiePolicy)
            throw new ArgumentException("É necessário aceitar os Termos de Uso, a Política de Privacidade e a Política de Cookies.");

        var plan = await _plans.GetByIdAsync(dto.PlanId, ct);
        if (plan == null || !plan.IsActive) throw new KeyNotFoundException("Plano não encontrado.");
        if (dto.Cycle == BillingCycle.Annual && !plan.AnnualPrice.HasValue) throw new ArgumentException("Este plano não oferece cobrança anual.");

        if (await _users.EmailExistsAsync(dto.AdminEmail, ct)) throw new InvalidOperationException("Já existe um usuário cadastrado com este e-mail.");

        var docs = new List<LegalDocument>();
        foreach (var type in new[] { LegalDocumentType.TermsOfUse, LegalDocumentType.PrivacyPolicy, LegalDocumentType.CookiePolicy })
            docs.Add(await _legal.GetActiveAsync(type, ct) ?? throw new InvalidOperationException("Documentos legais ainda não publicados."));

        var baseSlug = Slugify(dto.CompanyName);
        var slug = baseSlug;
        for (var i = 2; await _tenants.SlugExistsAsync(slug, ct); i++) slug = $"{baseSlug}-{i}";

        var tenant = new Tenant(dto.CompanyName, slug);
        await _tenants.AddAsync(tenant, ct);

        var admin = new User(dto.AdminName, dto.AdminEmail, _hasher.Hash(dto.AdminPassword), UserProfile.Admin);
        await _users.AddForTenantAsync(admin, tenant.Id, ct);
        await _settings.AddForTenantAsync(new TenantSetting(dto.CompanyName), tenant.Id, ct);

        foreach (var doc in docs)
            await _consents.AddForTenantAsync(new UserConsent(admin.Id, doc.Type, doc.Version, ipAddress), tenant.Id, ct);

        // Plano sem trial configurado → conta nasce "Expired": o primeiro acesso já cai na tela de assinatura.
        var subscription = new TenantSubscription(plan.Id,
            plan.TrialDays > 0 ? SubscriptionStatus.Trialing : SubscriptionStatus.Expired, dto.Cycle, plan.TrialDays);
        await _subs.AddForTenantAsync(subscription, tenant.Id, ct);

        await _audit.LogForTenantAsync(tenant.Id, admin.Id, "CriarEmpresa", "Tenant", tenant.Id.ToString(),
            $"Cadastro self-service, plano {plan.Name}, aceite de termos v{docs[0].Version}/privacidade v{docs[1].Version}/cookies v{docs[2].Version}", ct);

        await _uow.CommitAsync(ct);

        var welcome = EmailTemplates.CadastroConfirmado(tenant.Name);
        await _email.SendAsync(admin.Email, admin.Name, welcome.Subject, welcome.Html, ct);
        if (plan.TrialDays > 0 && subscription.TrialEndsAt.HasValue)
        {
            var trial = EmailTemplates.TrialIniciado(plan.Name, plan.TrialDays, subscription.TrialEndsAt.Value);
            await _email.SendAsync(admin.Email, admin.Name, trial.Subject, trial.Html, ct);
        }

        var token = _jwt.GenerateToken(admin);
        return new SignupResultDto(new LoginResponseDto(token, admin.Id, admin.Name, admin.Email, admin.Profile, tenant.Id), plan.TrialDays);
    }

    private static string Slugify(string text)
    {
        var normalized = text.Trim().ToLowerInvariant().Normalize(NormalizationForm.FormD);
        var sb = new StringBuilder();
        foreach (var c in normalized)
        {
            if (CharUnicodeInfo.GetUnicodeCategory(c) == UnicodeCategory.NonSpacingMark) continue;
            sb.Append(char.IsLetterOrDigit(c) ? c : '-');
        }
        var slug = System.Text.RegularExpressions.Regex.Replace(sb.ToString(), "-+", "-").Trim('-');
        return string.IsNullOrEmpty(slug) ? "empresa" : slug;
    }
}
