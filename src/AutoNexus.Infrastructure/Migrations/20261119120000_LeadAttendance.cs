using AutoNexus.Infrastructure.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

namespace AutoNexus.Infrastructure.Migrations;

[DbContext(typeof(AutoNexusDbContext))]
[Migration("20261119120000_LeadAttendance")]
public class LeadAttendance : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<decimal>(name: "offerValue", table: "leads", type: "numeric(18,2)", nullable: true);
        migrationBuilder.AddColumn<decimal>(name: "downPayment", table: "leads", type: "numeric(18,2)", nullable: true);
        migrationBuilder.AddColumn<string>(name: "tradeDescription", table: "leads", type: "character varying(500)", nullable: true);
        migrationBuilder.AddColumn<DateTime>(name: "nextContactAt", table: "leads", type: "timestamp with time zone", nullable: true);
        migrationBuilder.AddColumn<DateOnly>(name: "offerValidUntil", table: "leads", type: "date", nullable: true);
    }
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn("offerValue", "leads");
        migrationBuilder.DropColumn("downPayment", "leads");
        migrationBuilder.DropColumn("tradeDescription", "leads");
        migrationBuilder.DropColumn("nextContactAt", "leads");
        migrationBuilder.DropColumn("offerValidUntil", "leads");
    }
}
