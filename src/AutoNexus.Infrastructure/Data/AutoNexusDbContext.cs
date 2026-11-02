using System.Reflection;
using AutoNexus.Domain.Entities;
using AutoNexus.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace AutoNexus.Infrastructure.Data;

public class AutoNexusDbContext : DbContext
{
    private readonly ITenantContext _tenantContext;
    public AutoNexusDbContext(DbContextOptions<AutoNexusDbContext> options, ITenantContext tenantContext) : base(options) { _tenantContext = tenantContext; }
    public DbSet<Tenant> Tenants => Set<Tenant>();
    public DbSet<Vehicle> Vehicles => Set<Vehicle>();
    public DbSet<VehicleType> VehicleTypes => Set<VehicleType>();
    public DbSet<VehiclePhoto> VehiclePhotos => Set<VehiclePhoto>();
    public DbSet<VehicleDocument> VehicleDocuments => Set<VehicleDocument>();
    public DbSet<DocumentCategory> DocumentCategories => Set<DocumentCategory>();
    public DbSet<Cost> Costs => Set<Cost>();
    public DbSet<CostCategory> CostCategories => Set<CostCategory>();
    public DbSet<FipeHistory> FipeHistories => Set<FipeHistory>();
    public DbSet<Trade> Trades => Set<Trade>();
    public DbSet<Lead> Leads => Set<Lead>();
    public DbSet<User> Users => Set<User>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<BuyerAccessLink> BuyerAccessLinks => Set<BuyerAccessLink>();
    public DbSet<ElectronicAcceptance> ElectronicAcceptances => Set<ElectronicAcceptance>();
    public DbSet<BankConfig> BankConfigs => Set<BankConfig>();
    public DbSet<CreditProposalRecord> CreditProposals => Set<CreditProposalRecord>();
    public DbSet<CompanyDocument> CompanyDocuments => Set<CompanyDocument>();
    public DbSet<VehicleBrand> VehicleBrands => Set<VehicleBrand>();
    public DbSet<VehicleModel> VehicleModels => Set<VehicleModel>();
    public DbSet<Payment> Payments => Set<Payment>();
    public DbSet<WebhookEvent> WebhookEvents => Set<WebhookEvent>();
    public DbSet<LegalDocument> LegalDocuments => Set<LegalDocument>();
    public DbSet<UserConsent> UserConsents => Set<UserConsent>();
    public DbSet<Plan> Plans => Set<Plan>();
    public DbSet<TenantSubscription> TenantSubscriptions => Set<TenantSubscription>();
    public DbSet<TenantSetting> TenantSettings => Set<TenantSetting>();
    public DbSet<PremiumCatalogPublication> PremiumCatalogPublications => Set<PremiumCatalogPublication>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder); modelBuilder.ApplyConfigurationsFromAssembly(typeof(AutoNexusDbContext).Assembly);
        modelBuilder.Entity<CreditProposalRecord>().ToTable("credit_proposals").HasIndex(x => x.ProposalNumber);
        modelBuilder.Entity<CreditProposalRecord>().HasIndex(x => x.Status);
        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            if (!typeof(TenantOwnedEntityBase).IsAssignableFrom(entityType.ClrType)) continue;
            modelBuilder.Entity(entityType.ClrType).Property(nameof(TenantOwnedEntityBase.TenantId)).IsRequired().HasDefaultValue(Tenant.DefaultTenantId);
            var alreadyHasTenantIdIndex = entityType.GetIndexes().Any(i => i.Properties.Count == 1 && i.Properties[0].Name == nameof(TenantOwnedEntityBase.TenantId));
            if (!alreadyHasTenantIdIndex) modelBuilder.Entity(entityType.ClrType).HasIndex(nameof(TenantOwnedEntityBase.TenantId));
            typeof(AutoNexusDbContext).GetMethod(nameof(ApplyTenantQueryFilter), BindingFlags.NonPublic | BindingFlags.Instance)!.MakeGenericMethod(entityType.ClrType).Invoke(this, new object[] { modelBuilder });
        }
        foreach (var entity in modelBuilder.Model.GetEntityTypes()) foreach (var property in entity.GetProperties()) { var n = property.Name; property.SetColumnName(char.ToLowerInvariant(n[0]) + n[1..]); }
    }

    private void ApplyTenantQueryFilter<TEntity>(ModelBuilder modelBuilder) where TEntity : TenantOwnedEntityBase => modelBuilder.Entity<TEntity>().HasQueryFilter(entity => !_tenantContext.HasHttpContext || (_tenantContext.HasTenant && entity.TenantId == _tenantContext.TenantId));
    public override int SaveChanges() { StampTenantId(); return base.SaveChanges(); }
    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default) { StampTenantId(); return await base.SaveChangesAsync(cancellationToken); }
    private void StampTenantId() { if (!_tenantContext.HasTenant) return; foreach (var entry in ChangeTracker.Entries<TenantOwnedEntityBase>()) if (entry.State == EntityState.Added && entry.Entity.TenantId == Guid.Empty) entry.Entity.TenantId = _tenantContext.TenantId; }
}
