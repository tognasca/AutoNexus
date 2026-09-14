using AutoNexus.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AutoNexus.Infrastructure.Data.Configurations;

public class AuditLogConfiguration : IEntityTypeConfiguration<AuditLog>
{
    public void Configure(EntityTypeBuilder<AuditLog> builder)
    {
        builder.ToTable("audit_logs");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Operation).HasMaxLength(100).IsRequired();
        builder.Property(x => x.Resource).HasMaxLength(100).IsRequired();
        builder.Property(x => x.ResourceId).HasMaxLength(100);
        builder.Property(x => x.Details).HasMaxLength(4000);
        builder.Property(x => x.ExecutedAt).IsRequired();
        builder.Property(x => x.CreatedAt).IsRequired();
        builder.Property(x => x.UpdatedAt);

        builder.HasIndex(x => x.ExecutedAt);
        builder.HasIndex(x => x.Resource);
    }
}