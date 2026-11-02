using AutoNexus.Infrastructure.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
#nullable disable
namespace AutoNexus.Infrastructure.Migrations;
[DbContext(typeof(AutoNexusDbContext))]
[Migration("20261101000000_PremiumCatalogPublication")]
public partial class PremiumCatalogPublication : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(name: "premium_catalog_publications", columns: table => new { id = table.Column<Guid>(type: "uuid", nullable: false), tenantId = table.Column<Guid>(type: "uuid", nullable: false, defaultValue: new Guid("00000000-0000-0000-0000-000000000001")), domain = table.Column<string>(type: "character varying(253)", maxLength: 253, nullable: false), isActive = table.Column<bool>(type: "boolean", nullable: false), lastGeneratedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true), createdAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false), updatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true) }, constraints: table => { table.PrimaryKey("pk_premium_catalog_publications", x => x.id); table.ForeignKey("fk_premium_catalog_publications_tenants_tenantId", x => x.tenantId, "tenants", "id", onDelete: ReferentialAction.Cascade); });
        migrationBuilder.CreateIndex("ix_premium_catalog_publications_tenantId", "premium_catalog_publications", "tenantId", unique: true);
        migrationBuilder.CreateIndex("ix_premium_catalog_publications_domain", "premium_catalog_publications", "domain", unique: true);
    }
    protected override void Down(MigrationBuilder migrationBuilder) => migrationBuilder.DropTable(name: "premium_catalog_publications");
}
