using AutoNexus.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AutoNexus.Infrastructure.Data.Configurations;

public class PlanConfiguration : IEntityTypeConfiguration<Plan>
{
    // Ids fixos para poder referenciar de forma previsível (ex.: o plano Free
    // usado ao criar automaticamente a assinatura de um tenant novo).
    public static readonly Guid FreePlanId = Guid.Parse("00000000-0000-0000-0000-0000000000f1");
    public static readonly Guid BasicPlanId = Guid.Parse("00000000-0000-0000-0000-0000000000f2");
    public static readonly Guid ProfessionalPlanId = Guid.Parse("00000000-0000-0000-0000-0000000000f3");
    public static readonly Guid EnterprisePlanId = Guid.Parse("00000000-0000-0000-0000-0000000000f4");

    public void Configure(EntityTypeBuilder<Plan> builder)
    {
        builder.ToTable("plans");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Name).HasMaxLength(100).IsRequired();
        builder.Property(x => x.Price).HasColumnType("decimal(10,2)").IsRequired();
        builder.Property(x => x.IsActive).IsRequired();
        builder.Property(x => x.CreatedAt).IsRequired();
        builder.Property(x => x.UpdatedAt);

        var seedDate = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc);

        builder.HasData(
            new { Id = FreePlanId, Name = "Free", Price = 0m, IsActive = true, MaxUsers = (int?)2, MaxVehicles = (int?)10, MaxStorageMb = (int?)500, CreatedAt = seedDate, UpdatedAt = (DateTime?)null },
            new { Id = BasicPlanId, Name = "Basic", Price = 99m, IsActive = true, MaxUsers = (int?)5, MaxVehicles = (int?)50, MaxStorageMb = (int?)2000, CreatedAt = seedDate, UpdatedAt = (DateTime?)null },
            new { Id = ProfessionalPlanId, Name = "Professional", Price = 299m, IsActive = true, MaxUsers = (int?)20, MaxVehicles = (int?)500, MaxStorageMb = (int?)10000, CreatedAt = seedDate, UpdatedAt = (DateTime?)null },
            new { Id = EnterprisePlanId, Name = "Enterprise", Price = 999m, IsActive = true, MaxUsers = (int?)null, MaxVehicles = (int?)null, MaxStorageMb = (int?)null, CreatedAt = seedDate, UpdatedAt = (DateTime?)null }
        );
    }
}
