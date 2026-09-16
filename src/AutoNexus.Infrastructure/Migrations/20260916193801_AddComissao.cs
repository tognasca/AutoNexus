using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AutoNexus.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddComissao : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "SoldAt",
                table: "vehicles",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "SoldByUserId",
                table: "vehicles",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_vehicles_SoldByUserId",
                table: "vehicles",
                column: "SoldByUserId");

            migrationBuilder.AddForeignKey(
                name: "FK_vehicles_users_SoldByUserId",
                table: "vehicles",
                column: "SoldByUserId",
                principalTable: "users",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_vehicles_users_SoldByUserId",
                table: "vehicles");

            migrationBuilder.DropIndex(
                name: "IX_vehicles_SoldByUserId",
                table: "vehicles");

            migrationBuilder.DropColumn(
                name: "SoldAt",
                table: "vehicles");

            migrationBuilder.DropColumn(
                name: "SoldByUserId",
                table: "vehicles");
        }
    }
}
