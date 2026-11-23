using AutoNexus.Infrastructure.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

namespace AutoNexus.Infrastructure.Migrations;

[DbContext(typeof(AutoNexusDbContext))]
[Migration("20261119140000_TenantOpenAi")]
public class TenantOpenAi : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<string>(name: "openAiEncryptedKey", table: "tenant_settings", type: "text", nullable: true);
        migrationBuilder.AddColumn<string>(name: "openAiModel", table: "tenant_settings", type: "character varying(100)", nullable: false, defaultValue: "gpt-4.1-mini");
        migrationBuilder.AddColumn<bool>(name: "aiEnabled", table: "tenant_settings", type: "boolean", nullable: false, defaultValue: false);
        migrationBuilder.AddColumn<int>(name: "aiMonthlyLimit", table: "tenant_settings", type: "integer", nullable: false, defaultValue: 0);
        migrationBuilder.AddColumn<int>(name: "aiUsed", table: "tenant_settings", type: "integer", nullable: false, defaultValue: 0);
        migrationBuilder.AddColumn<string>(name: "aiUsageMonth", table: "tenant_settings", type: "text", nullable: false, defaultValue: "");
    }
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn("openAiEncryptedKey", "tenant_settings");
        migrationBuilder.DropColumn("openAiModel", "tenant_settings");
        migrationBuilder.DropColumn("aiEnabled", "tenant_settings");
        migrationBuilder.DropColumn("aiMonthlyLimit", "tenant_settings");
        migrationBuilder.DropColumn("aiUsed", "tenant_settings");
        migrationBuilder.DropColumn("aiUsageMonth", "tenant_settings");
    }
}
