using AutoNexus.Infrastructure.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AutoNexus.Infrastructure.Migrations;

[DbContext(typeof(AutoNexusDbContext))]
[Migration("20261102110000_TenantLeadsCrm")]
public partial class TenantLeadsCrm : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "leads",
            columns: table => new
            {
                id = table.Column<Guid>(type: "uuid", nullable: false),
                tenantId = table.Column<Guid>(type: "uuid", nullable: false, defaultValue: new Guid("00000000-0000-0000-0000-000000000001")),
                name = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: false),
                phone = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                email = table.Column<string>(type: "character varying(254)", maxLength: 254, nullable: true),
                source = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                notes = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                status = table.Column<int>(type: "integer", nullable: false),
                vehicleId = table.Column<Guid>(type: "uuid", nullable: true),
                assignedToUserId = table.Column<Guid>(type: "uuid", nullable: true),
                lastContactAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                createdAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                updatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("pk_leads", x => x.id);
                table.ForeignKey("fk_leads_tenants_tenantId", x => x.tenantId, "tenants", "id", onDelete: ReferentialAction.Cascade);
                table.ForeignKey("fk_leads_vehicles_vehicleId", x => x.vehicleId, "vehicles", "id", onDelete: ReferentialAction.SetNull);
                table.ForeignKey("fk_leads_users_assignedToUserId", x => x.assignedToUserId, "Users", "id", onDelete: ReferentialAction.SetNull);
            });

        migrationBuilder.CreateIndex(name: "ix_leads_tenantId", table: "leads", column: "tenantId");
        migrationBuilder.CreateIndex(name: "ix_leads_tenantId_status", table: "leads", columns: new[] { "tenantId", "status" });
        migrationBuilder.CreateIndex(name: "ix_leads_tenantId_createdAt", table: "leads", columns: new[] { "tenantId", "createdAt" });
        migrationBuilder.CreateIndex(name: "ix_leads_phone", table: "leads", column: "phone");
        migrationBuilder.CreateIndex(name: "ix_leads_vehicleId", table: "leads", column: "vehicleId");
        migrationBuilder.CreateIndex(name: "ix_leads_assignedToUserId", table: "leads", column: "assignedToUserId");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(name: "leads");
    }
}
