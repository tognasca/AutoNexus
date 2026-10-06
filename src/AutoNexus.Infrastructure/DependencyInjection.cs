using AutoNexus.Application.Interfaces;
using AutoNexus.Domain.Interfaces;
using AutoNexus.Infrastructure.Data;
using AutoNexus.Infrastructure.Integrations.Adapters;
using AutoNexus.Infrastructure.Repositories;
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

        // Multi-tenancy: ITenantContext precisa de acesso ao HttpContext para
        // ler o claim "tenant_id" do usuário autenticado (ver TenantContext).
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
        services.AddScoped<IBankConfigRepository, BankConfigRepository>(); // Registrado aqui
        services.AddScoped<IPasswordHasher, PasswordHasher>();
        services.AddScoped<IJwtTokenGenerator, JwtTokenGenerator>();
        services.AddScoped<IBankAdapter, SantanderBankAdapter>();
        services.AddScoped<IStorageService, LocalStorageService>();
        services.AddHttpClient<IFipeExternalService, BrasilApiFipeService>();
        services.AddScoped<ICompanyDocumentRepository, CompanyDocumentRepository>();
        

        return services;
    }
}