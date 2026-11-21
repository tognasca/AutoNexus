using AutoNexus.Infrastructure.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

namespace AutoNexus.Infrastructure.Migrations;

[DbContext(typeof(AutoNexusDbContext))]
[Migration("20261121180000_RevendaOperations")]
public sealed class RevendaOperations : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<decimal>("consignmentPayout", "vehicles", type: "numeric(18,2)", nullable: true);
        migrationBuilder.AddColumn<string>("transferTracking", "vehicles", type: "text", nullable: true);
        migrationBuilder.AddColumn<string>("externalId", "leads", type: "character varying(160)", maxLength: 160, nullable: true);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn("consignmentPayout", "vehicles");
        migrationBuilder.DropColumn("transferTracking", "vehicles");
        migrationBuilder.DropColumn("externalId", "leads");
    }
}
