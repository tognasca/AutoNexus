using AutoNexus.Infrastructure.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

namespace AutoNexus.Infrastructure.Migrations;
[DbContext(typeof(AutoNexusDbContext))]
[Migration("20261119160000_StoreAppearance")]
public class StoreAppearance : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<string>("storeTemplate", "tenant_settings", type: "character varying(30)", maxLength: 30, nullable: false, defaultValue: "premium");
        migrationBuilder.AddColumn<string>("panelDensity", "tenant_settings", type: "character varying(30)", maxLength: 30, nullable: false, defaultValue: "comfortable");
    }
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn("storeTemplate", "tenant_settings");
        migrationBuilder.DropColumn("panelDensity", "tenant_settings");
    }
}
