using AutoNexus.Infrastructure.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AutoNexus.Infrastructure.Migrations;

[DbContext(typeof(AutoNexusDbContext))]
[Migration("20261103120000_FixTenantWhatsAppColumnCase")]
public partial class FixTenantWhatsAppColumnCase : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.RenameColumn(
            name: "WhatsAppNumber",
            table: "tenant_settings",
            newName: "whatsAppNumber");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.RenameColumn(
            name: "whatsAppNumber",
            table: "tenant_settings",
            newName: "WhatsAppNumber");
    }
}
