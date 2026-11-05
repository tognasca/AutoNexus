using AutoNexus.Infrastructure.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AutoNexus.Infrastructure.Migrations;

[DbContext(typeof(AutoNexusDbContext))]
[Migration("20261105143000_AssignWhatsAppContactToVehicle")]
public partial class AssignWhatsAppContactToVehicle : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<Guid>(
            name: "whatsAppContactId",
            table: "vehicles",
            type: "uuid",
            nullable: true);

        migrationBuilder.CreateIndex(
            name: "IX_vehicles_whatsAppContactId",
            table: "vehicles",
            column: "whatsAppContactId");

        migrationBuilder.AddForeignKey(
            name: "FK_vehicles_tenant_whatsapp_contacts_whatsAppContactId",
            table: "vehicles",
            column: "whatsAppContactId",
            principalTable: "tenant_whatsapp_contacts",
            principalColumn: "id",
            onDelete: ReferentialAction.SetNull);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropForeignKey(name: "FK_vehicles_tenant_whatsapp_contacts_whatsAppContactId", table: "vehicles");
        migrationBuilder.DropIndex(name: "IX_vehicles_whatsAppContactId", table: "vehicles");
        migrationBuilder.DropColumn(name: "whatsAppContactId", table: "vehicles");
    }
}