using AutoNexus.Infrastructure.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

namespace AutoNexus.Infrastructure.Migrations;

[DbContext(typeof(AutoNexusDbContext))]
[Migration("20261116170000_TrackVehicleTransfers")]
public partial class TrackVehicleTransfers : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<bool>(
            name: "transferStarted", table: "vehicles", type: "boolean",
            nullable: false, defaultValue: false);
        migrationBuilder.AddColumn<bool>(
            name: "transferSigned", table: "vehicles", type: "boolean",
            nullable: false, defaultValue: false);
        migrationBuilder.AddColumn<bool>(
            name: "transferInspected", table: "vehicles", type: "boolean",
            nullable: false, defaultValue: false);
        migrationBuilder.AddColumn<string>(
            name: "transferProtocol", table: "vehicles", type: "character varying(120)",
            nullable: true);
        migrationBuilder.AddColumn<DateOnly>(
            name: "transferCompletedOn", table: "vehicles", type: "date",
            nullable: true);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn("transferStarted", "vehicles");
        migrationBuilder.DropColumn("transferSigned", "vehicles");
        migrationBuilder.DropColumn("transferInspected", "vehicles");
        migrationBuilder.DropColumn("transferProtocol", "vehicles");
        migrationBuilder.DropColumn("transferCompletedOn", "vehicles");
    }
}
