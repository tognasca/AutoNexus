using AutoNexus.Domain.Entities;
using AutoNexus.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AutoNexus.Infrastructure.Data.Configurations;

public class TenantSubscriptionConfiguration : IEntityTypeConfiguration<TenantSubscription>
{
    public void Configure(EntityTypeBuilder<TenantSubscription> builder)
    {
        builder.ToTable("tenant_subscriptions");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.PlanId).IsRequired();
        builder.Property(x => x.Status).HasConversion<int>().IsRequired();
        builder.Property(x => x.StartDate).IsRequired();
        builder.Property(x => x.EndDate);
        builder.Property(x => x.BillingCycle).HasConversion<int>().IsRequired();
        builder.Property(x => x.TrialEndsAt);
        builder.Property(x => x.CurrentPeriodEnd);
        builder.Property(x => x.CancelledAt);
        builder.Property(x => x.TrialReminderSentAt);
        builder.Property(x => x.RenewalReminderSentAt);
        builder.Property(x => x.ExternalSubscriptionId).HasMaxLength(200);
        builder.Property(x => x.PaymentProvider).HasMaxLength(50);
        builder.Property(x => x.CreatedAt).IsRequired();

        builder.HasIndex(x => x.PlanId);
        builder.HasIndex(x => x.Status);
        builder.HasIndex(x => x.ExternalSubscriptionId);
        builder.Property(x => x.UpdatedAt);

        // Assinatura inicial do tenant padrão (o mesmo que já existia antes
        // do multi-tenancy) — sem isso, ele ficaria sem plano nenhum depois
        // desta etapa, o que quebraria qualquer tela que dependa de haver
        // uma assinatura. Plano Free, sempre ativo (nunca vai vencer sozinho
        // já que ainda não há cobrança de verdade).
        builder.HasData(new
        {
            Id = Guid.Parse("00000000-0000-0000-0000-0000000000a1"),
            TenantId = Tenant.DefaultTenantId,
            PlanId = PlanConfiguration.FreePlanId,
            Status = SubscriptionStatus.Active,
            BillingCycle = BillingCycle.Monthly,
            StartDate = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc),
            EndDate = (DateTime?)null,
            CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc),
            UpdatedAt = (DateTime?)null
        });
    }
}
