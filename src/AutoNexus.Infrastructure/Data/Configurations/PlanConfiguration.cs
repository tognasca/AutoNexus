using AutoNexus.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AutoNexus.Infrastructure.Data.Configurations;

public class PlanConfiguration : IEntityTypeConfiguration<Plan>
{
    // Ids fixos para poder referenciar de forma previsível (ex.: o plano Free
    // usado ao criar automaticamente a assinatura de um tenant novo).
    // Os Ids fixos antigos foram MANTIDOS (apenas renomeados/reprecificados)
    // para não quebrar assinaturas já existentes que apontam para eles:
    //   f1 (era Free)         -> STARTER
    //   f2 (era Basic)        -> PROFISSIONAL
    //   f3 (era Professional) -> PREMIUM
    //   f4 (era Enterprise)   -> mantido, porém INATIVO (legado — não é mais oferecido,
    //                            mas não pode ser apagado se algum tenant ainda aponta para ele)
    public static readonly Guid FreePlanId = Guid.Parse("00000000-0000-0000-0000-0000000000f1");
    public static readonly Guid BasicPlanId = Guid.Parse("00000000-0000-0000-0000-0000000000f2");
    public static readonly Guid ProfessionalPlanId = Guid.Parse("00000000-0000-0000-0000-0000000000f3");
    public static readonly Guid EnterprisePlanId = Guid.Parse("00000000-0000-0000-0000-0000000000f4");

    // Atalhos com os nomes novos (os campos acima ficam por compatibilidade).
    public static Guid StarterPlanId => FreePlanId;
    public static Guid ProfissionalPlanId => BasicPlanId;
    public static Guid PremiumPlanId => ProfessionalPlanId;

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

        builder.Property(x => x.AnnualPrice).HasColumnType("decimal(10,2)");
        builder.Property(x => x.TrialDays).IsRequired();

        // PREÇOS INICIAIS definidos pelo dono do produto (R$, BRL) — ficam no
        // banco, não no código: o SuperAdmin pode alterar via
        // PUT /api/superadmin/plans/{id} sem deploy.
        // LIMITES (MaxUsers/MaxVehicles/MaxStorageMb): propositalmente NULL
        // (= ilimitado) — os limites por plano ainda não foram definidos pelo
        // negócio e não foram inventados. Configure-os no painel SuperAdmin.
        builder.HasData(
            new { Id = FreePlanId, Name = "Starter", Price = 49.90m, AnnualPrice = (decimal?)499.00m, TrialDays = 7, IsActive = true, MaxUsers = (int?)null, MaxVehicles = (int?)null, MaxStorageMb = (int?)null, CreatedAt = seedDate, UpdatedAt = (DateTime?)null },
            new { Id = BasicPlanId, Name = "Profissional", Price = 99.90m, AnnualPrice = (decimal?)999.00m, TrialDays = 7, IsActive = true, MaxUsers = (int?)null, MaxVehicles = (int?)null, MaxStorageMb = (int?)null, CreatedAt = seedDate, UpdatedAt = (DateTime?)null },
            new { Id = ProfessionalPlanId, Name = "Premium", Price = 199.90m, AnnualPrice = (decimal?)1999.00m, TrialDays = 7, IsActive = true, MaxUsers = (int?)null, MaxVehicles = (int?)null, MaxStorageMb = (int?)null, CreatedAt = seedDate, UpdatedAt = (DateTime?)null },
            new { Id = EnterprisePlanId, Name = "Enterprise (legado)", Price = 0m, AnnualPrice = (decimal?)null, TrialDays = 0, IsActive = false, MaxUsers = (int?)null, MaxVehicles = (int?)null, MaxStorageMb = (int?)null, CreatedAt = seedDate, UpdatedAt = (DateTime?)null }
        );
    }
}
