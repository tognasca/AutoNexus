using AutoNexus.Infrastructure.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AutoNexus.Infrastructure.Migrations;

[DbContext(typeof(AutoNexusDbContext))]
[Migration("20261105140000_TenantWhatsAppContacts")]
public partial class TenantWhatsAppContacts : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "tenant_whatsapp_contacts",
            columns: table => new
            {
                id = table.Column<Guid>(type: "uuid", nullable: false),
                name = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                phoneNumber = table.Column<string>(type: "character varying(15)", maxLength: 15, nullable: false),
                isDefault = table.Column<bool>(type: "boolean", nullable: false),
                isActive = table.Column<bool>(type: "boolean", nullable: false),
                tenantId = table.Column<Guid>(type: "uuid", nullable: false, defaultValue: new Guid("00000000-0000-0000-0000-000000000001")),
                createdAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                updatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_tenant_whatsapp_contacts", x => x.id);
            });
        migrationBuilder.CreateIndex(name: "IX_tenant_whatsapp_contacts_tenantId_isActive", table: "tenant_whatsapp_contacts", columns: new[] { "tenantId", "isActive" });
        migrationBuilder.CreateIndex(name: "IX_tenant_whatsapp_contacts_tenantId_isDefault", table: "tenant_whatsapp_contacts", columns: new[] { "tenantId", "isDefault" });
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(name: "tenant_whatsapp_contacts");
    }
}