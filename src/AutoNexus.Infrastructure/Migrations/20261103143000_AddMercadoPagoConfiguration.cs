using AutoNexus.Infrastructure.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AutoNexus.Infrastructure.Migrations;

[DbContext(typeof(AutoNexusDbContext))]
[Migration("20261103143000_AddMercadoPagoConfiguration")]
public partial class AddMercadoPagoConfiguration : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "mercado_pago_configuration",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                encryptedAccessToken = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: false),
                encryptedWebhookSecret = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: false),
                environment = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                configuredAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                createdAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                updatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
            },
            constraints: table => table.PrimaryKey("PK_mercado_pago_configuration", x => x.Id));
        migrationBuilder.CreateIndex(name: "IX_mercado_pago_configuration_configuredAtUtc", table: "mercado_pago_configuration", column: "configuredAtUtc");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(name: "mercado_pago_configuration");
    }
}
