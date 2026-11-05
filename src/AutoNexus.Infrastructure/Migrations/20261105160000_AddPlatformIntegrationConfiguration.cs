using AutoNexus.Infrastructure.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AutoNexus.Infrastructure.Migrations;

[DbContext(typeof(AutoNexusDbContext))]
[Migration("20261105160000_AddPlatformIntegrationConfiguration")]
public partial class AddPlatformIntegrationConfiguration : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "platform_integration_configurations",
            columns: table => new
            {
                id = table.Column<Guid>(type: "uuid", nullable: false),
                encryptedResendApiKey = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: true),
                resendFromEmail = table.Column<string>(type: "character varying(320)", maxLength: 320, nullable: true),
                resendFromName = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                encryptedBvAccessToken = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: true),
                encryptedBvCommercialPartnerCode = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: true),
                bvFinancingConditionsEndpoint = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                configuredAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                createdAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                updatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
            },
            constraints: table => table.PrimaryKey("PK_platform_integration_configurations", x => x.id));
        migrationBuilder.CreateIndex(
            name: "IX_platform_integration_configurations_configuredAtUtc",
            table: "platform_integration_configurations",
            column: "configuredAtUtc");
    }

    protected override void Down(MigrationBuilder migrationBuilder) =>
        migrationBuilder.DropTable(name: "platform_integration_configurations");
}