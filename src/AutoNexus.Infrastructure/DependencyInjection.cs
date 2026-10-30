using AutoNexus.Application.Interfaces;
using AutoNexus.Domain.Interfaces;
using AutoNexus.Infrastructure.Data;
using AutoNexus.Infrastructure.Integrations.Adapters;
using AutoNexus.Infrastructure.Repositories;
using AutoNexus.Infrastructure.Integrations;
using AutoNexus.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace AutoNexus.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("Connection string 'DefaultConnection' não encontrada.");

        services.AddDbContext<AutoNexusDbContext>(options =>
            options.UseNpgsql(connectionString));

        services.AddHttpContextAccessor();
        services.AddScoped<ITenantContext, TenantContext>();

        services.AddScoped<IUnitOfWork, UnitOfWork>();
        services.AddScoped<IVehicleRepository, VehicleRepository>();
        services.AddScoped<ILookupRepository, LookupRepository>();
        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<ITenantRepository, TenantRepository>();
        services.AddScoped<IAuditLogRepository, AuditLogRepository>();
        services.AddScoped<IPlanRepository, PlanRepository>();
        services.AddScoped<ITenantSubscriptionRepository, TenantSubscriptionRepository>();
        services.AddScoped<ITenantSettingRepository, TenantSettingRepository>();
        services.AddScoped<ITradeRepository, TradeRepository>();
        services.AddScoped<IDocumentRepository, DocumentRepository>();
        services.AddScoped<IBuyerLinkRepository, BuyerLinkRepository>();
        services.AddScoped<IAcceptanceRepository, AcceptanceRepository>();
        services.AddScoped<IBankConfigRepository, BankConfigRepository>();
        services.AddScoped<ICreditProposalRepository, CreditProposalRepository>();
        services.AddScoped<IFinancingProposalService, FinancingProposalService>();
        services.AddScoped<IPasswordHasher, PasswordHasher>();
        services.AddScoped<IJwtTokenGenerator, JwtTokenGenerator>();
        services.AddScoped<IBankAdapter, SantanderBankAdapter>();
        services.AddHttpClient("BvOpen", client => client.Timeout = TimeSpan.FromSeconds(30));
        services.AddScoped<IBvFinancingConditionsService, BvFinancingConditionsService>();
        services.AddScoped<IStorageService, LocalStorageService>();
        services.AddHttpClient<IFipeExternalService, BrasilApiFipeService>();
        services.AddScoped<ICompanyDocumentRepository, CompanyDocumentRepository>();

        services.AddScoped<IPaymentRepository, PaymentRepository>();
        services.AddScoped<IWebhookEventRepository, WebhookEventRepository>();
        services.AddScoped<ILegalDocumentRepository, LegalDocumentRepository>();
        services.AddScoped<IUserConsentRepository, UserConsentRepository>();
        services.AddHttpClient<IPaymentProvider, MercadoPagoPaymentProvider>();
        services.AddHttpClient<IEmailService, ResendEmailService>();

        return services;
    }
}
