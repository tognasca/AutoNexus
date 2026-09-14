using AutoNexus.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AutoNexus.Infrastructure.Data.Configurations;

public class VehicleConfiguration : IEntityTypeConfiguration<Vehicle>
{
    public void Configure(EntityTypeBuilder<Vehicle> builder)
    {
        builder.ToTable("vehicles");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Brand).HasMaxLength(100).IsRequired();
        builder.Property(x => x.Model).HasMaxLength(100).IsRequired();
        builder.Property(x => x.Version).HasMaxLength(100);
        builder.Property(x => x.ManufacturingYear).IsRequired();
        builder.Property(x => x.ModelYear).IsRequired();
        builder.Property(x => x.Plate).HasMaxLength(10);
        builder.Property(x => x.Chassis).HasMaxLength(30);
        builder.Property(x => x.Mileage).IsRequired();
        builder.Property(x => x.Color).HasMaxLength(50);
        builder.Property(x => x.Fuel).HasConversion<int>();
        builder.Property(x => x.Transmission).HasConversion<int>();
        builder.Property(x => x.Status).HasConversion<int>().IsRequired();
        builder.Property(x => x.PurchaseValue).HasPrecision(18, 2).IsRequired();
        builder.Property(x => x.ListedValue).HasPrecision(18, 2);
        builder.Property(x => x.SaleValue).HasPrecision(18, 2);
        builder.Property(x => x.Notes).HasMaxLength(2000);
        builder.Property(x => x.CreatedAt).IsRequired();
        builder.Property(x => x.UpdatedAt);

        // Relacionamento com VehicleType
        builder.HasOne(x => x.VehicleType)
               .WithMany(t => t.Vehicles)
               .HasForeignKey(x => x.VehicleTypeId)
               .OnDelete(DeleteBehavior.Restrict);

        // Relacionamentos 1:N
        builder.HasMany(x => x.Photos)
               .WithOne(p => p.Vehicle)
               .HasForeignKey(p => p.VehicleId)
               .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(x => x.Documents)
               .WithOne(d => d.Vehicle)
               .HasForeignKey(d => d.VehicleId)
               .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(x => x.Costs)
               .WithOne(c => c.Vehicle)
               .HasForeignKey(c => c.VehicleId)
               .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(x => x.FipeHistories)
               .WithOne(f => f.Vehicle)
               .HasForeignKey(f => f.VehicleId)
               .OnDelete(DeleteBehavior.Cascade);

        // Índices para buscas rápidas (Filtros Seção 24)
        builder.HasIndex(x => x.Status);
        builder.HasIndex(x => x.Plate);
        builder.HasIndex(x => x.Brand);
        builder.HasIndex(x => x.Model);
    }
}