using AutoNexus.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AutoNexus.Infrastructure.Data.Configurations;

public class TradeConfiguration : IEntityTypeConfiguration<Trade>
{
    public void Configure(EntityTypeBuilder<Trade> builder)
    {
        builder.ToTable("trades");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.ReceivedVehicleFipe).HasPrecision(18, 2).IsRequired();
        builder.Property(x => x.DeliveredVehicleFipe).HasPrecision(18, 2).IsRequired();
        builder.Property(x => x.ReceivedVehicleNegotiatedValue).HasPrecision(18, 2).IsRequired();
        builder.Property(x => x.DeliveredVehicleNegotiatedValue).HasPrecision(18, 2).IsRequired();
        builder.Property(x => x.EstimatedResaleCost).HasPrecision(18, 2).IsRequired();
        builder.Property(x => x.DifferenceValue).HasPrecision(18, 2).IsRequired();
        builder.Property(x => x.DifferencePaidByUs).IsRequired();
        builder.Property(x => x.Indicator).HasConversion<int>().IsRequired();
        builder.Property(x => x.TradeDate).IsRequired();
        builder.Property(x => x.ResponsibleUserId).IsRequired();
        builder.Property(x => x.Notes).HasMaxLength(2000);
        builder.Property(x => x.CreatedAt).IsRequired();
        builder.Property(x => x.UpdatedAt);

        builder.HasOne(x => x.ReceivedVehicle)
               .WithMany()
               .HasForeignKey(x => x.ReceivedVehicleId)
               .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.DeliveredVehicle)
               .WithMany()
               .HasForeignKey(x => x.DeliveredVehicleId)
               .OnDelete(DeleteBehavior.Restrict);
    }
}