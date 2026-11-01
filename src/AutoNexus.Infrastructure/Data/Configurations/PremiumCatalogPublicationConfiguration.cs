using AutoNexus.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AutoNexus.Infrastructure.Data.Configurations;

public sealed class PremiumCatalogPublicationConfiguration : IEntityTypeConfiguration<PremiumCatalogPublication>
{
    public void Configure(EntityTypeBuilder<PremiumCatalogPublication> builder)
    {
        builder.ToTable("premium_catalog_publications");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Domain).HasMaxLength(253).IsRequired();
        builder.HasIndex(x => x.TenantId).IsUnique();
        builder.HasIndex(x => x.Domain).IsUnique();
        builder.Property(x => x.IsActive).IsRequired();
        builder.HasOne<AutoNexus.Domain.Entities.Tenant>()
            .WithMany()
            .HasForeignKey(x => x.TenantId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
