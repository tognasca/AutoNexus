using Microsoft.EntityFrameworkCore;
namespace AutoNexus.Api.Middleware;

public sealed class VehicleConcurrencyMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try { await next(context); }
        catch (DbUpdateConcurrencyException) when (!context.Response.HasStarted)
        {
            context.Response.StatusCode = StatusCodes.Status409Conflict;
            await context.Response.WriteAsJsonAsync(new { message = "O registro foi atualizado por outra pessoa. Recarregue os dados antes de continuar." });
        }
    }
}
