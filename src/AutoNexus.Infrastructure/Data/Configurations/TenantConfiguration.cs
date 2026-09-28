using AutoNexus.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AutoNexus.Infrastructure.Data.Configurations;

public class TenantConfiguration : IEntityTypeConfiguration<Tenant>
{
    public void Configure(EntityTypeBuilder<Tenant> builder)
    {
        builder.ToTable("tenants");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Name).HasMaxLength(200).IsRequired();
        builder.Property(x => x.Slug).HasMaxLength(100).IsRequired();
        builder.Property(x => x.IsActive).IsRequired();
        builder.Property(x => x.CreatedAt).IsRequired();
        builder.Property(x => x.UpdatedAt);

        builder.HasIndex(x => x.Slug).IsUnique();

        // Tenant padrão: recebe automaticamente todos os dados que já
        // existiam no banco antes da introdução do multi-tenancy (ver
        // Tenant.DefaultTenantId e o valor padrão de coluna aplicado a toda
        // entidade TenantOwnedEntityBase em AutoNexusDbContext.OnModelCreating).
        // Usamos HasData (em vez de invocar o construtor) porque o construtor
        // público não permite escolher o Id — e aqui ele precisa ser fixo e
        // previsível em qualquer ambiente.
        builder.HasData(new
        {
            Id = Tenant.DefaultTenantId,
            Name = "Empresa Padrão",
            Slug = "default",
            IsActive = true,
            CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc),
            UpdatedAt = (DateTime?)null
        });
    }
}
