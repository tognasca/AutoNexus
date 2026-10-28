using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AutoNexus.Infrastructure.Migrations
{
    public partial class PersistCreditProposals : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "credit_proposals",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    createdAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    tenantId = table.Column<Guid>(type: "uuid", nullable: false, defaultValue: new Guid("00000000-0000-0000-0000-000000000001")),
                    bankId = table.Column<string>(type: "text", nullable: false),
                    bankName = table.Column<string>(type: "text", nullable: false),
                    customerName = table.Column<string>(type: "text", nullable: false),
                    customerCpf = table.Column<string>(type: "text", nullable: false),
                    vehicleName = table.Column<string>(type: "text", nullable: false),
                    financedAmount = table.Column<decimal>(type: "numeric", nullable: false),
                    months = table.Column<int>(type: "integer", nullable: false),
                    installmentValue = table.Column<decimal>(type: "numeric", nullable: false),
                    status = table.Column<string>(type: "text", nullable: false),
                    proposalNumber = table.Column<string>(type: "text", nullable: true),
                    message = table.Column<string>(type: "text", nullable: false),
                    requestDataJson = table.Column<string>(type: "text", nullable: false),
                    privacyConsent = table.Column<bool>(type: "boolean", nullable: false),
                    statusUpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_credit_proposals", x => x.id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_credit_proposals_tenantId",
                table: "credit_proposals",
                column: "tenantId");

            migrationBuilder.CreateIndex(
                name: "IX_credit_proposals_proposalNumber",
                table: "credit_proposals",
                column: "proposalNumber");

            migrationBuilder.CreateIndex(
                name: "IX_credit_proposals_status",
                table: "credit_proposals",
                column: "status");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "credit_proposals");
        }
    }
}