using AutoNexus.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AutoNexus.Infrastructure.Data.Configurations;

public sealed class TenantWhatsAppContactConfiguration : IEntityTypeConfiguration<TenantWhatsAppContact>
{
    public void Configure(EntityTypeBuilder<TenantWhatsAppContact> builder)
    {
        builder.ToTable("tenant_whatsapp_contacts");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Name).HasMaxLength(120).IsRequired();
        builder.Property(x => x.PhoneNumber).HasMaxLength(15).IsRequired();
        builder.Property(x => x.IsDefault).IsRequired();
        builder.Property(x => x.IsActive).IsRequired();
        builder.Property(x => x.CreatedAt).IsRequired();
        builder.Property(x => x.UpdatedAt);
        builder.HasIndex(x => new { x.TenantId, x.IsActive });
        builder.HasIndex(x => new { x.TenantId, x.IsDefault });
    }
}