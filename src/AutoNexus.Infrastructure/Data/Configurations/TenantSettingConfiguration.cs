using AutoNexus.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AutoNexus.Infrastructure.Data.Configurations;

public class TenantSettingConfiguration : IEntityTypeConfiguration<TenantSetting>
{
    public void Configure(EntityTypeBuilder<TenantSetting> builder)
    {
        builder.ToTable("tenant_settings");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.CompanyName).HasMaxLength(200).IsRequired();
        builder.Property(x => x.LogoUrl).HasMaxLength(500);
        builder.Property(x => x.PrimaryColor).HasMaxLength(20).IsRequired();
        builder.Property(x => x.TimeZone).HasMaxLength(100).IsRequired();
        builder.Property(x => x.Currency).HasMaxLength(10).IsRequired();
        builder.Property(x => x.CreatedAt).IsRequired();
        builder.Property(x => x.UpdatedAt);

        // Uma linha de configuração por empresa, nunca duas — além do filtro
        // global (que impede ver a de outro tenant), este índice único
        // impede criar uma segunda linha para o mesmo tenant por engano.
        builder.HasIndex(x => x.TenantId).IsUnique();

        builder.HasData(new
        {
            Id = Guid.Parse("00000000-0000-0000-0000-0000000000b1"),
            TenantId = Tenant.DefaultTenantId,
            CompanyName = "Empresa Padrão",
            LogoUrl = (string?)null,
            PrimaryColor = "#15171B",
            TimeZone = "America/Sao_Paulo",
            Currency = "BRL",
            CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc),
            UpdatedAt = (DateTime?)null
        });
    }
}
