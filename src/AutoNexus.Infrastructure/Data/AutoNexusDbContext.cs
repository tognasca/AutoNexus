using AutoNexus.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace AutoNexus.Infrastructure.Data;

public class AutoNexusDbContext : DbContext
{
    public AutoNexusDbContext(DbContextOptions<AutoNexusDbContext> options) : base(options) { }

    public DbSet<Vehicle> Vehicles => Set<Vehicle>();
    public DbSet<VehicleType> VehicleTypes => Set<VehicleType>();
    public DbSet<VehiclePhoto> VehiclePhotos => Set<VehiclePhoto>();
    public DbSet<VehicleDocument> VehicleDocuments => Set<VehicleDocument>();
    public DbSet<DocumentCategory> DocumentCategories => Set<DocumentCategory>();
    public DbSet<Cost> Costs => Set<Cost>();
    public DbSet<CostCategory> CostCategories => Set<CostCategory>();
    public DbSet<FipeHistory> FipeHistories => Set<FipeHistory>();
    public DbSet<Trade> Trades => Set<Trade>();
    public DbSet<User> Users => Set<User>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<BuyerAccessLink> BuyerAccessLinks => Set<BuyerAccessLink>();
    public DbSet<ElectronicAcceptance> ElectronicAcceptances => Set<ElectronicAcceptance>();
    public DbSet<BankConfig> BankConfigs => Set<BankConfig>();
    public DbSet<CompanyDocument> CompanyDocuments => Set<CompanyDocument>();
    public DbSet<VehicleBrand> VehicleBrands => Set<VehicleBrand>();
    public DbSet<VehicleModel> VehicleModels => Set<VehicleModel>();
    public DbSet<Tenant> Tenants => Set<Tenant>();
    public DbSet<Plan> Plans => Set<Plan>();
    public DbSet<TenantSubscription> TenantSubscriptions => Set<TenantSubscription>();
    public DbSet<TenantSetting> TenantSettings => Set<TenantSetting>();



    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AutoNexusDbContext).Assembly);

        // Ajusta automaticamente o nome de todas as colunas para camelCase/snake_case
        foreach (var entity in modelBuilder.Model.GetEntityTypes())
        {
            foreach (var property in entity.GetProperties())
            {
                var propertyName = property.Name;
                // Garante que a primeira letra da coluna no PostgreSQL seja minúscula (ex: purchaseValue)
                var lowerCamelCase = char.ToLowerInvariant(propertyName[0]) + propertyName[1..];
                property.SetColumnName(lowerCamelCase);
            }
        }
    }
}
