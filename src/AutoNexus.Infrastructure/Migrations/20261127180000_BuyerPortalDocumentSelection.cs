using AutoNexus.Infrastructure.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

namespace AutoNexus.Infrastructure.Migrations;

[DbContext(typeof(AutoNexusDbContext))]
[Migration("20261127180000_BuyerPortalDocumentSelection")]
public sealed class BuyerPortalDocumentSelection : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder) =>
        migrationBuilder.AddColumn<Guid[]>("sharedDocumentIds", "BuyerAccessLinks", type: "uuid[]", nullable: true);

    protected override void Down(MigrationBuilder migrationBuilder) =>
        migrationBuilder.DropColumn("sharedDocumentIds", "BuyerAccessLinks");
}
