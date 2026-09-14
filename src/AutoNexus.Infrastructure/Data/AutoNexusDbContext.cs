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

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AutoNexusDbContext).Assembly);
    }
}
