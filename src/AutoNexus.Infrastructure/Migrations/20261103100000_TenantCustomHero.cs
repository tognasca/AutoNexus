using AutoNexus.Infrastructure.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable
namespace AutoNexus.Infrastructure.Migrations;
[DbContext(typeof(AutoNexusDbContext))]
[Migration("20261103100000_TenantCustomHero")]
public partial class TenantCustomHero : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<string>(name: "heroImageUrl", table: "tenant_settings", type: "character varying(500)", maxLength: 500, nullable: true);
        migrationBuilder.AddColumn<string>(name: "heroTemplateKey", table: "tenant_settings", type: "character varying(40)", maxLength: 40, nullable: true);
    }
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(name: "heroImageUrl", table: "tenant_settings");
        migrationBuilder.DropColumn(name: "heroTemplateKey", table: "tenant_settings");
    }
}