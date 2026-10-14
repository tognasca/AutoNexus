using System.Security.Claims;
using AutoNexus.Application.Interfaces;
using AutoNexus.Application.Services;

namespace AutoNexus.Api.Middleware;

/// <summary>
/// Bloqueia (HTTP 402) o uso do sistema por empresas sem assinatura válida
/// (trial vencido, cancelada e já sem período pago, suspensa). Rotas de
/// login, assinatura/faturamento, termos e webhooks continuam liberadas
/// para o cliente conseguir regularizar. Roda no backend — não depende do frontend.
/// </summary>
public class SubscriptionAccessMiddleware
{
    private static readonly string[] AllowedPrefixes =
    {
        "/api/auth", "/api/password", "/api/billing", "/api/subscription", "/api/legal", "/api/webhooks",
        "/api/signup", "/api/tenant-settings", "/api/superadmin", "/api/public", "/api/portal", "/health"
    };

    private readonly RequestDelegate _next;

    public SubscriptionAccessMiddleware(RequestDelegate next) => _next = next;

    public async Task InvokeAsync(HttpContext context, ISubscriptionAccessService access)
    {
        var path = context.Request.Path.Value ?? string.Empty;
        var needsCheck = path.StartsWith("/api/", StringComparison.OrdinalIgnoreCase)
            && context.User.Identity?.IsAuthenticated == true
            && !context.User.IsInRole("SuperAdmin")
            && !AllowedPrefixes.Any(p => path.StartsWith(p, StringComparison.OrdinalIgnoreCase));

        if (needsCheck)
        {
            var result = await access.EvaluateAsync(context.RequestAborted);
            if (!result.Allowed)
            {
                context.Response.StatusCode = StatusCodes.Status402PaymentRequired;
                await context.Response.WriteAsJsonAsync(new { message = result.Message, subscriptionRequired = true });
                return;
            }
        }

        await _next(context);
    }
}

/// <summary>Converte "limite do plano atingido" em HTTP 403 com mensagem amigável (sem stack trace).</summary>
public class PlanLimitExceptionMiddleware
{
    private readonly RequestDelegate _next;

    public PlanLimitExceptionMiddleware(RequestDelegate next) => _next = next;

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (PlanLimitExceededException ex)
        {
            context.Response.StatusCode = StatusCodes.Status403Forbidden;
            await context.Response.WriteAsJsonAsync(new { message = ex.Message, planLimitReached = true });
        }
    }
}
