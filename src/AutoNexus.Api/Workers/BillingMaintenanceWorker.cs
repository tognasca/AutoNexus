using AutoNexus.Application.Interfaces;

namespace AutoNexus.Api.Workers;

/// <summary>Executa periodicamente a rotina de trials (expirar vencidos e avisar os que estão terminando).</summary>
public class BillingMaintenanceWorker : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<BillingMaintenanceWorker> _logger;
    private readonly TimeSpan _interval;

    public BillingMaintenanceWorker(IServiceScopeFactory scopeFactory, ILogger<BillingMaintenanceWorker> logger, IConfiguration config)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
        _interval = TimeSpan.FromHours(Math.Max(1, config.GetValue("Billing:MaintenanceIntervalHours", 6)));
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        // pequena espera para a aplicação terminar de subir (migrations/seed)
        await Task.Delay(TimeSpan.FromSeconds(30), stoppingToken);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
                await scope.ServiceProvider.GetRequiredService<IBillingMaintenanceService>().RunAsync(stoppingToken);
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                _logger.LogError(ex, "Falha na rotina de manutenção de assinaturas.");
            }

            await Task.Delay(_interval, stoppingToken);
        }
    }
}
