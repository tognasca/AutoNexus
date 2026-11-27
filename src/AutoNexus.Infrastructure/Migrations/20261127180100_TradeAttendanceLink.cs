using AutoNexus.Infrastructure.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

namespace AutoNexus.Infrastructure.Migrations;

[DbContext(typeof(AutoNexusDbContext))]
[Migration("20261127180100_TradeAttendanceLink")]
public sealed class TradeAttendanceLink : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder) =>
        migrationBuilder.AddColumn<Guid>("leadId", "trades", type: "uuid", nullable: true);

    protected override void Down(MigrationBuilder migrationBuilder) =>
        migrationBuilder.DropColumn("leadId", "trades");
}
