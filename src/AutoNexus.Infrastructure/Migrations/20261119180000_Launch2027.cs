using AutoNexus.Infrastructure.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
namespace AutoNexus.Infrastructure.Migrations;
[DbContext(typeof(AutoNexusDbContext))]
[Migration("20261119180000_Launch2027")]
public class Launch2027 : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<decimal>(name: "budget", table: "leads", type: "numeric(18,2)", nullable: true);
        migrationBuilder.AddColumn<int>(name: "preferredTransmission", table: "leads", type: "integer", nullable: true);
        migrationBuilder.AddColumn<string>(name: "preferredModels", table: "leads", type: "character varying(500)", nullable: true);
        migrationBuilder.AddColumn<string>(name: "shareTokenHash", table: "leads", type: "character varying(64)", nullable: true);
        migrationBuilder.AddColumn<string>(name: "proposalSnapshot", table: "leads", type: "text", nullable: true);
        migrationBuilder.AddColumn<DateTime>(name: "shareExpiresAt", table: "leads", type: "timestamp with time zone", nullable: true);
        migrationBuilder.AddColumn<string>(name: "buyerResponse", table: "leads", type: "character varying(600)", nullable: true);
        migrationBuilder.AddColumn<DateTime>(name: "buyerRespondedAt", table: "leads", type: "timestamp with time zone", nullable: true);
        migrationBuilder.AddColumn<Guid>(name: "reservedForLeadId", table: "vehicles", type: "uuid", nullable: true);
        migrationBuilder.AddColumn<Guid>(name: "reservedByUserId", table: "vehicles", type: "uuid", nullable: true);
        migrationBuilder.AddColumn<DateTime>(name: "reservationExpiresAt", table: "vehicles", type: "timestamp with time zone", nullable: true);
        migrationBuilder.AddColumn<string>(name: "deliveryChecklist", table: "vehicles", type: "text", nullable: true);
    }
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn("budget", "leads");
        migrationBuilder.DropColumn("preferredTransmission", "leads");
        migrationBuilder.DropColumn("preferredModels", "leads");
        migrationBuilder.DropColumn("shareTokenHash", "leads");
        migrationBuilder.DropColumn("proposalSnapshot", "leads");
        migrationBuilder.DropColumn("shareExpiresAt", "leads");
        migrationBuilder.DropColumn("buyerResponse", "leads");
        migrationBuilder.DropColumn("buyerRespondedAt", "leads");
        migrationBuilder.DropColumn("reservedForLeadId", "vehicles");
        migrationBuilder.DropColumn("reservedByUserId", "vehicles");
        migrationBuilder.DropColumn("reservationExpiresAt", "vehicles");
        migrationBuilder.DropColumn("deliveryChecklist", "vehicles");
    }
}
