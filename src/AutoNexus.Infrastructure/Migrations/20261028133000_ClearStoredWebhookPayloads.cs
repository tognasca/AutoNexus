using AutoNexus.Infrastructure.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AutoNexus.Infrastructure.Migrations
{
    [DbContext(typeof(AutoNexusDbContext))]
    [Migration("20261028133000_ClearStoredWebhookPayloads")]
    public partial class ClearStoredWebhookPayloads : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Webhook bodies may contain personal data. The event metadata remains
            // sufficient for deduplication and operational diagnostics.
            migrationBuilder.Sql("UPDATE webhook_events SET \"rawPayload\" = NULL WHERE \"rawPayload\" IS NOT NULL;");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Intentionally irreversible: previously stored payloads are not restored.
        }
    }
}