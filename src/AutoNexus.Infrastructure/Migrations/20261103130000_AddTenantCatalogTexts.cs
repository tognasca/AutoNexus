using AutoNexus.Infrastructure.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AutoNexus.Infrastructure.Migrations;

[DbContext(typeof(AutoNexusDbContext))]
[Migration("20261103130000_AddTenantCatalogTexts")]
public partial class AddTenantCatalogTexts : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<string>(name: "welcomeText", table: "tenant_settings", type: "character varying(120)", maxLength: 120, nullable: true);
        migrationBuilder.AddColumn<string>(name: "heroTitle", table: "tenant_settings", type: "character varying(180)", maxLength: 180, nullable: true);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(name: "welcomeText", table: "tenant_settings");
        migrationBuilder.DropColumn(name: "heroTitle", table: "tenant_settings");
    }
}
