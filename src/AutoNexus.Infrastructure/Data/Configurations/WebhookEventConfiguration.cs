using AutoNexus.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AutoNexus.Infrastructure.Data.Configurations;

public class WebhookEventConfiguration : IEntityTypeConfiguration<WebhookEvent>
{
    public void Configure(EntityTypeBuilder<WebhookEvent> builder)
    {
        builder.ToTable("webhook_events");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Provider).HasMaxLength(50).IsRequired();
        builder.Property(x => x.ExternalEventId).HasMaxLength(200).IsRequired();
        builder.Property(x => x.EventType).HasMaxLength(100);
        builder.Property(x => x.ProcessingError).HasMaxLength(1000);
        builder.Property(x => x.ReceivedAt).IsRequired();
        builder.Property(x => x.CreatedAt).IsRequired();
        builder.Property(x => x.UpdatedAt);

        // Índice único: é isso que garante, no banco, que o mesmo evento do
        // gateway nunca é processado duas vezes (requisito 5 do documento
        // original) — mesmo que duas requisições cheguem ao mesmo tempo.
        builder.HasIndex(x => new { x.Provider, x.ExternalEventId }).IsUnique();
    }
}
