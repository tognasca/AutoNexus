using System.Reflection;
using AutoNexus.Domain.Entities;
using AutoNexus.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace AutoNexus.Infrastructure.Data;

public class AutoNexusDbContext : DbContext
{
    private readonly ITenantContext _tenantContext;

    public AutoNexusDbContext(DbContextOptions<AutoNexusDbContext> options, ITenantContext tenantContext)
        : base(options)
    {
        _tenantContext = tenantContext;
    }

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
    public DbSet<User> Users => Set<User>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<BuyerAccessLink> BuyerAccessLinks => Set<BuyerAccessLink>();
    public DbSet<ElectronicAcceptance> ElectronicAcceptances => Set<ElectronicAcceptance>();
    public DbSet<BankConfig> BankConfigs => Set<BankConfig>();
    public DbSet<CompanyDocument> CompanyDocuments => Set<CompanyDocument>();
    public DbSet<VehicleBrand> VehicleBrands => Set<VehicleBrand>();
    public DbSet<VehicleModel> VehicleModels => Set<VehicleModel>();
    public DbSet<Plan> Plans => Set<Plan>();
    public DbSet<TenantSubscription> TenantSubscriptions => Set<TenantSubscription>();
    public DbSet<TenantSetting> TenantSettings => Set<TenantSetting>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AutoNexusDbContext).Assembly);

        // --- Multi-tenancy: aplicado de forma centralizada para TODA entidade
        // que herdar de TenantOwnedEntityBase, sem precisar configurar
        // manualmente em cada Configuration/Controller (ver ITenantContext).
        //
        // Para cada entidade tenant-owned:
        //  1) TenantId é obrigatório e ganha um índice (consultas por tenant
        //     são, de longe, as mais frequentes do sistema);
        //  2) TenantId ganha um valor padrão de coluna igual ao tenant padrão
        //     — isso faz com que a migration que adiciona essa coluna já
        //     preencha automaticamente todas as linhas hoje existentes com o
        //     tenant padrão, sem precisar de um passo manual de backfill;
        //  3) um Global Query Filter garante que nenhuma consulta LINQ feita
        //     através deste DbContext — em nenhum repositório, service ou
        //     controller — pode retornar linhas de outro tenant, mesmo que o
        //     autor da consulta esqueça de filtrar manualmente.
        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            if (!typeof(TenantOwnedEntityBase).IsAssignableFrom(entityType.ClrType))
                continue;

            modelBuilder.Entity(entityType.ClrType)
                .Property(nameof(TenantOwnedEntityBase.TenantId))
                .IsRequired()
                .HasDefaultValue(Tenant.DefaultTenantId);

            // Algumas entidades (ex.: TenantSettings, uma linha por empresa)
            // já declaram seu próprio índice único em TenantId na própria
            // Configuration — nesse caso não criamos um segundo índice
            // genérico aqui por cima, para não arriscar o EF Core tratar as
            // duas chamadas de HasIndex como a mesma configuração e uma
            // sobrescrever a outra.
            var alreadyHasTenantIdIndex = entityType.GetIndexes()
                .Any(i => i.Properties.Count == 1 && i.Properties[0].Name == nameof(TenantOwnedEntityBase.TenantId));

            if (!alreadyHasTenantIdIndex)
            {
                modelBuilder.Entity(entityType.ClrType)
                    .HasIndex(nameof(TenantOwnedEntityBase.TenantId));
            }

            typeof(AutoNexusDbContext)
                .GetMethod(nameof(ApplyTenantQueryFilter), BindingFlags.NonPublic | BindingFlags.Instance)!
                .MakeGenericMethod(entityType.ClrType)
                .Invoke(this, new object[] { modelBuilder });
        }

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

    // Precisa ser genérico (Entity<TEntity>().HasQueryFilter requer um tipo
    // concreto, não aceita Type em tempo de execução) — por isso é chamado
    // via reflection dentro do loop acima, uma vez para cada entidade
    // tenant-owned.
    private void ApplyTenantQueryFilter<TEntity>(ModelBuilder modelBuilder)
        where TEntity : TenantOwnedEntityBase
    {
        modelBuilder.Entity<TEntity>().HasQueryFilter(entity =>
            !_tenantContext.HasTenant || entity.TenantId == _tenantContext.TenantId);
    }

    public override int SaveChanges()
    {
        StampTenantId();
        return base.SaveChanges();
    }

    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        StampTenantId();
        return await base.SaveChangesAsync(cancellationToken);
    }

    // Preenche automaticamente o TenantId de qualquer entidade nova sendo
    // inserida nesta unidade de trabalho — nenhum repositório, service ou
    // controller precisa (nem deve) definir TenantId manualmente.
    //
    // Entidades criadas fora de uma requisição autenticada (seed/migração na
    // inicialização) não são tocadas aqui: nesses casos HasTenant é false, e
    // quem estiver semeando dados é responsável por atribuir um TenantId
    // explicitamente (ver DbInitializer), já que o setter é internal e
    // acessível apenas dentro de AutoNexus.Infrastructure.
    private void StampTenantId()
    {
        if (!_tenantContext.HasTenant) return;

        foreach (var entry in ChangeTracker.Entries<TenantOwnedEntityBase>())
        {
            if (entry.State == EntityState.Added && entry.Entity.TenantId == Guid.Empty)
            {
                entry.Entity.TenantId = _tenantContext.TenantId;
            }
        }
    }
}
