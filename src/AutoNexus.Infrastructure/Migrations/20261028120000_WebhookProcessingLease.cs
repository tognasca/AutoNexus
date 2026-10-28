using System;
using AutoNexus.Infrastructure.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AutoNexus.Infrastructure.Migrations
{
    [DbContext(typeof(AutoNexusDbContext))]
    [Migration("20261028120000_WebhookProcessingLease")]
    public partial class WebhookProcessingLease : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "isProcessing",
                table: "webhook_events",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "processingStartedAt",
                table: "webhook_events",
                type: "timestamp with time zone",
                nullable: true);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "isProcessing",
                table: "webhook_events");

            migrationBuilder.DropColumn(
                name: "processingStartedAt",
                table: "webhook_events");
        }
    }
}
