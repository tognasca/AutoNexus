using AutoNexus.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AutoNexus.Infrastructure.Data.Configurations;

public class FipeHistoryConfiguration : IEntityTypeConfiguration<FipeHistory>
{
    public void Configure(EntityTypeBuilder<FipeHistory> builder)
    {
        builder.ToTable("fipe_histories");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.FipeValue).HasPrecision(18, 2).IsRequired();
        builder.Property(x => x.ReferenceMonth).IsRequired();
        builder.Property(x => x.ReferenceYear).IsRequired();
        builder.Property(x => x.ConsultationDate).IsRequired();
        builder.Property(x => x.Source).HasMaxLength(100);
        builder.Property(x => x.CreatedAt).IsRequired();
        builder.Property(x => x.UpdatedAt);

        builder.HasIndex(x => new { x.VehicleId, x.ReferenceMonth, x.ReferenceYear });
    }
}