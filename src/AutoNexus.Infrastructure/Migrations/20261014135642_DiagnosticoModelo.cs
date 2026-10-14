using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AutoNexus.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class DiagnosticoModelo : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "passwordResetExpiresAt",
                table: "users",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "passwordResetTokenHash",
                table: "users",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "renewalReminderSentAt",
                table: "tenant_subscriptions",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.UpdateData(
                table: "tenant_subscriptions",
                keyColumn: "id",
                keyValue: new Guid("00000000-0000-0000-0000-0000000000a1"),
                column: "renewalReminderSentAt",
                value: null);

            migrationBuilder.CreateIndex(
                name: "IX_users_passwordResetTokenHash",
                table: "users",
                column: "passwordResetTokenHash");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_users_passwordResetTokenHash",
                table: "users");

            migrationBuilder.DropColumn(
                name: "passwordResetExpiresAt",
                table: "users");

            migrationBuilder.DropColumn(
                name: "passwordResetTokenHash",
                table: "users");

            migrationBuilder.DropColumn(
                name: "renewalReminderSentAt",
                table: "tenant_subscriptions");
        }
    }
}
