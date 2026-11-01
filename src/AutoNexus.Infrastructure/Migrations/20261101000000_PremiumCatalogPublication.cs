using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AutoNexus.Infrastructure.Migrations;

public partial class PremiumCatalogPublication : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "premium_catalog_publications",
            columns: table => new
            {
                id = table.Column<Guid>(type: "uuid", nullable: false),
                tenant_id = table.Column<Guid>(type: "uuid", nullable: false),
                domain = table.Column<string>(type: "character varying(253)", maxLength: 253, nullable: false),
                is_active = table.Column<bool>(type: "boolean", nullable: false),
                last_generated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("pk_premium_catalog_publications", x => x.id);
                table.ForeignKey("fk_premium_catalog_publications_tenants_tenant_id", x => x.tenant_id, "tenants", "id", onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateIndex("ix_premium_catalog_publications_tenant_id", "premium_catalog_publications", "tenant_id", unique: true);
        migrationBuilder.CreateIndex("ix_premium_catalog_publications_domain", "premium_catalog_publications", "domain", unique: true);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(name: "premium_catalog_publications");
    }
}
