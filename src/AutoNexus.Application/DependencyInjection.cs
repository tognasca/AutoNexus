using AutoNexus.Application.Interfaces;
using AutoNexus.Application.Services;
using AutoNexus.Domain.Interfaces;
using Microsoft.Extensions.DependencyInjection;
namespace AutoNexus.Application;
public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddScoped<IVehicleService, VehicleService>(); services.AddScoped<ILookupService, LookupService>(); services.AddScoped<IAuthService, AuthService>(); services.AddScoped<ICostService, CostService>(); services.AddScoped<IFipeService, FipeService>(); services.AddScoped<ITradeService, TradeService>(); services.AddScoped<IDocumentService, DocumentService>(); services.AddScoped<IPortalService, PortalService>(); services.AddScoped<IDashboardService, DashboardService>(); services.AddScoped<IReportService, ReportService>(); services.AddScoped<IContractService, ContractService>(); services.AddHttpClient("BankCreditClient"); services.AddScoped<IBankCreditService, CreditService>(); services.AddScoped<IBankConfigService, BankConfigService>(); services.AddScoped<ICompanyDocumentService, CompanyDocumentService>(); services.AddScoped<IAiDescriptionService, AiDescriptionService>(); services.AddScoped<IFeedExportService, FeedExportService>(); services.AddScoped<ISuperAdminService, SuperAdminService>(); services.AddScoped<IAuditLogService, AuditLogService>(); services.AddScoped<ITenantNotifier, TenantNotifier>(); services.AddScoped<IPlanLimitService, PlanLimitService>(); services.AddScoped<ISubscriptionAccessService, SubscriptionAccessService>(); services.AddScoped<IBillingService, BillingService>(); services.AddScoped<IBillingMaintenanceService, BillingMaintenanceService>(); services.AddScoped<ISignupService, SignupService>(); services.AddScoped<ILegalService, LegalService>(); services.AddScoped<IPasswordService, PasswordService>(); services.AddScoped<ITenantSettingService, TenantSettingService>(); services.AddScoped<ISubscriptionService, SubscriptionService>(); services.AddScoped<IPremiumCatalogService, PremiumCatalogService>(); services.AddScoped<IPremiumCatalogAccess, PremiumCatalogAccess>(); return services;
    }
}
