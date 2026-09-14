using AutoNexus.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AutoNexus.Infrastructure.Data.Configurations;

public class CostConfiguration : IEntityTypeConfiguration<Cost>
{
    public void Configure(EntityTypeBuilder<Cost> builder)
    {
        builder.ToTable("costs");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Description).HasMaxLength(250).IsRequired();
        builder.Property(x => x.Value).HasPrecision(18, 2).IsRequired();
        builder.Property(x => x.CostDate).IsRequired();
        builder.Property(x => x.ResponsibleUserId).IsRequired();
        builder.Property(x => x.Notes).HasMaxLength(1000);
        builder.Property(x => x.CreatedAt).IsRequired();
        builder.Property(x => x.UpdatedAt);

        builder.HasOne(x => x.CostCategory)
               .WithMany(c => c.Costs)
               .HasForeignKey(x => x.CostCategoryId)
               .OnDelete(DeleteBehavior.Restrict);
    }
}