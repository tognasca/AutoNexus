using AutoNexus.Domain.Enums;
using AutoNexus.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
namespace AutoNexus.Api.Services;

public sealed class ReservationExpiryService(IServiceScopeFactory scopes, ILogger<ReservationExpiryService> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(TimeSpan.FromMinutes(1));
        while (await timer.WaitForNextTickAsync(stoppingToken))
        {
            try {
                using var scope = scopes.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<AutoNexusDbContext>();
                await db.Vehicles.IgnoreQueryFilters()
                    .Where(x => x.Status == VehicleStatus.Reservado && x.ReservationExpiresAt <= DateTime.UtcNow)
                    .ExecuteUpdateAsync(s => s.SetProperty(x => x.Status, VehicleStatus.AVenda)
                        .SetProperty(x => x.ReservedForLeadId, (Guid?)null)
                        .SetProperty(x => x.ReservedByUserId, (Guid?)null)
                        .SetProperty(x => x.ReservationExpiresAt, (DateTime?)null)
                        .SetProperty(x => x.UpdatedAt, (DateTime?)DateTime.UtcNow), stoppingToken);
            } catch (Exception ex) when (!stoppingToken.IsCancellationRequested) {
                logger.LogError(ex, "Não foi possível liberar reservas vencidas.");
            }
        }
    }
}
