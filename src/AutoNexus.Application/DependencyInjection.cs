using AutoNexus.Application.Interfaces;
using AutoNexus.Application.Services;
using Microsoft.Extensions.DependencyInjection;

namespace AutoNexus.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddScoped<IVehicleService, VehicleService>();
        services.AddScoped<ILookupService, LookupService>();
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<ICostService, CostService>();
        services.AddScoped<IFipeService, FipeService>();
        services.AddScoped<ITradeService, TradeService>();
        services.AddScoped<IDocumentService, DocumentService>();
        services.AddScoped<IPortalService, PortalService>();
        services.AddScoped<IDashboardService, DashboardService>();
        return services;
    }
}
