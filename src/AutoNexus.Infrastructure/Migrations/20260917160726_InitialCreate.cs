using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AutoNexus.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "audit_logs",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    userId = table.Column<Guid>(type: "uuid", nullable: true),
                    operation = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    resource = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    resourceId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    details = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: true),
                    executedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    createdAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_audit_logs", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "BankConfigs",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    bankCode = table.Column<string>(type: "text", nullable: false),
                    name = table.Column<string>(type: "text", nullable: false),
                    defaultMonthlyRate = table.Column<decimal>(type: "numeric", nullable: false),
                    apiUrl = table.Column<string>(type: "text", nullable: false),
                    apiKey = table.Column<string>(type: "text", nullable: false),
                    apiSecret = table.Column<string>(type: "text", nullable: true),
                    merchantId = table.Column<string>(type: "text", nullable: true),
                    isActive = table.Column<bool>(type: "boolean", nullable: false),
                    isSandbox = table.Column<bool>(type: "boolean", nullable: false),
                    createdAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BankConfigs", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "CompanyDocuments",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    title = table.Column<string>(type: "text", nullable: false),
                    category = table.Column<string>(type: "text", nullable: false),
                    fileUrl = table.Column<string>(type: "text", nullable: false),
                    amount = table.Column<decimal>(type: "numeric", nullable: true),
                    referenceDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    notes = table.Column<string>(type: "text", nullable: true),
                    createdAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CompanyDocuments", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "cost_categories",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    description = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: true),
                    isActive = table.Column<bool>(type: "boolean", nullable: false),
                    createdAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_cost_categories", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "document_categories",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    description = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: true),
                    isActive = table.Column<bool>(type: "boolean", nullable: false),
                    createdAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_document_categories", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "users",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    email = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    passwordHash = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    profile = table.Column<int>(type: "integer", nullable: false),
                    isActive = table.Column<bool>(type: "boolean", nullable: false),
                    createdAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_users", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "vehicle_types",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    description = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: true),
                    isActive = table.Column<bool>(type: "boolean", nullable: false),
                    createdAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_vehicle_types", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "vehicles",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    vehicleTypeId = table.Column<Guid>(type: "uuid", nullable: false),
                    brand = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    model = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    version = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    manufacturingYear = table.Column<int>(type: "integer", nullable: false),
                    modelYear = table.Column<int>(type: "integer", nullable: false),
                    plate = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    chassis = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: true),
                    renavam = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    mileage = table.Column<int>(type: "integer", nullable: false),
                    color = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    fuel = table.Column<int>(type: "integer", nullable: true),
                    transmission = table.Column<int>(type: "integer", nullable: true),
                    status = table.Column<int>(type: "integer", nullable: false),
                    purchaseValue = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    listedValue = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    saleValue = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
                    notes = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    soldByUserId = table.Column<Guid>(type: "uuid", nullable: true),
                    soldAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    createdAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_vehicles", x => x.id);
                    table.ForeignKey(
                        name: "FK_vehicles_users_soldByUserId",
                        column: x => x.soldByUserId,
                        principalTable: "users",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "FK_vehicles_vehicle_types_vehicleTypeId",
                        column: x => x.vehicleTypeId,
                        principalTable: "vehicle_types",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "BuyerAccessLinks",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    vehicleId = table.Column<Guid>(type: "uuid", nullable: false),
                    token = table.Column<string>(type: "text", nullable: false),
                    expiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    isRevoked = table.Column<bool>(type: "boolean", nullable: false),
                    createdByUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    buyerName = table.Column<string>(type: "text", nullable: true),
                    createdAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BuyerAccessLinks", x => x.id);
                    table.ForeignKey(
                        name: "FK_BuyerAccessLinks_vehicles_vehicleId",
                        column: x => x.vehicleId,
                        principalTable: "vehicles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "costs",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    vehicleId = table.Column<Guid>(type: "uuid", nullable: false),
                    costCategoryId = table.Column<Guid>(type: "uuid", nullable: false),
                    description = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: false),
                    value = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    costDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    responsibleUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    notes = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    createdAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_costs", x => x.id);
                    table.ForeignKey(
                        name: "FK_costs_cost_categories_costCategoryId",
                        column: x => x.costCategoryId,
                        principalTable: "cost_categories",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_costs_vehicles_vehicleId",
                        column: x => x.vehicleId,
                        principalTable: "vehicles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ElectronicAcceptances",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    vehicleId = table.Column<Guid>(type: "uuid", nullable: false),
                    buyerAccessLinkId = table.Column<Guid>(type: "uuid", nullable: true),
                    buyerName = table.Column<string>(type: "text", nullable: false),
                    buyerDocument = table.Column<string>(type: "text", nullable: false),
                    ipAddress = table.Column<string>(type: "text", nullable: false),
                    acceptedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    termVersion = table.Column<string>(type: "text", nullable: false),
                    createdAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ElectronicAcceptances", x => x.id);
                    table.ForeignKey(
                        name: "FK_ElectronicAcceptances_vehicles_vehicleId",
                        column: x => x.vehicleId,
                        principalTable: "vehicles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "fipe_histories",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    vehicleId = table.Column<Guid>(type: "uuid", nullable: false),
                    fipeValue = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    referenceMonth = table.Column<int>(type: "integer", nullable: false),
                    referenceYear = table.Column<int>(type: "integer", nullable: false),
                    consultationDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    source = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    createdAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_fipe_histories", x => x.id);
                    table.ForeignKey(
                        name: "FK_fipe_histories_vehicles_vehicleId",
                        column: x => x.vehicleId,
                        principalTable: "vehicles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "trades",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    receivedVehicleId = table.Column<Guid>(type: "uuid", nullable: false),
                    deliveredVehicleId = table.Column<Guid>(type: "uuid", nullable: false),
                    receivedVehicleFipe = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    deliveredVehicleFipe = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    receivedVehicleNegotiatedValue = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    deliveredVehicleNegotiatedValue = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    estimatedResaleCost = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    differenceValue = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    differencePaidByUs = table.Column<bool>(type: "boolean", nullable: false),
                    indicator = table.Column<int>(type: "integer", nullable: false),
                    tradeDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    responsibleUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    notes = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    createdAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_trades", x => x.id);
                    table.ForeignKey(
                        name: "FK_trades_vehicles_deliveredVehicleId",
                        column: x => x.deliveredVehicleId,
                        principalTable: "vehicles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_trades_vehicles_receivedVehicleId",
                        column: x => x.receivedVehicleId,
                        principalTable: "vehicles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "vehicle_documents",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    vehicleId = table.Column<Guid>(type: "uuid", nullable: false),
                    documentCategoryId = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    fileName = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    storagePath = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    mimeType = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    fileSize = table.Column<long>(type: "bigint", nullable: false),
                    uploadedByUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    notes = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    createdAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_vehicle_documents", x => x.id);
                    table.ForeignKey(
                        name: "FK_vehicle_documents_document_categories_documentCategoryId",
                        column: x => x.documentCategoryId,
                        principalTable: "document_categories",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_vehicle_documents_vehicles_vehicleId",
                        column: x => x.vehicleId,
                        principalTable: "vehicles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "vehicle_photos",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    vehicleId = table.Column<Guid>(type: "uuid", nullable: false),
                    fileName = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    storagePath = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    mimeType = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    fileSize = table.Column<long>(type: "bigint", nullable: false),
                    order = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    isMain = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    createdAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_vehicle_photos", x => x.id);
                    table.ForeignKey(
                        name: "FK_vehicle_photos_vehicles_vehicleId",
                        column: x => x.vehicleId,
                        principalTable: "vehicles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_audit_logs_executedAt",
                table: "audit_logs",
                column: "executedAt");

            migrationBuilder.CreateIndex(
                name: "IX_audit_logs_resource",
                table: "audit_logs",
                column: "resource");

            migrationBuilder.CreateIndex(
                name: "IX_BuyerAccessLinks_vehicleId",
                table: "BuyerAccessLinks",
                column: "vehicleId");

            migrationBuilder.CreateIndex(
                name: "IX_costs_costCategoryId",
                table: "costs",
                column: "costCategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_costs_vehicleId",
                table: "costs",
                column: "vehicleId");

            migrationBuilder.CreateIndex(
                name: "IX_ElectronicAcceptances_vehicleId",
                table: "ElectronicAcceptances",
                column: "vehicleId");

            migrationBuilder.CreateIndex(
                name: "IX_fipe_histories_vehicleId_referenceMonth_referenceYear",
                table: "fipe_histories",
                columns: new[] { "vehicleId", "referenceMonth", "referenceYear" });

            migrationBuilder.CreateIndex(
                name: "IX_trades_deliveredVehicleId",
                table: "trades",
                column: "deliveredVehicleId");

            migrationBuilder.CreateIndex(
                name: "IX_trades_receivedVehicleId",
                table: "trades",
                column: "receivedVehicleId");

            migrationBuilder.CreateIndex(
                name: "IX_users_email",
                table: "users",
                column: "email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_vehicle_documents_documentCategoryId",
                table: "vehicle_documents",
                column: "documentCategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_vehicle_documents_vehicleId",
                table: "vehicle_documents",
                column: "vehicleId");

            migrationBuilder.CreateIndex(
                name: "IX_vehicle_photos_vehicleId",
                table: "vehicle_photos",
                column: "vehicleId");

            migrationBuilder.CreateIndex(
                name: "IX_vehicles_brand",
                table: "vehicles",
                column: "brand");

            migrationBuilder.CreateIndex(
                name: "IX_vehicles_model",
                table: "vehicles",
                column: "model");

            migrationBuilder.CreateIndex(
                name: "IX_vehicles_plate",
                table: "vehicles",
                column: "plate");

            migrationBuilder.CreateIndex(
                name: "IX_vehicles_soldByUserId",
                table: "vehicles",
                column: "soldByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_vehicles_status",
                table: "vehicles",
                column: "status");

            migrationBuilder.CreateIndex(
                name: "IX_vehicles_vehicleTypeId",
                table: "vehicles",
                column: "vehicleTypeId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "audit_logs");

            migrationBuilder.DropTable(
                name: "BankConfigs");

            migrationBuilder.DropTable(
                name: "BuyerAccessLinks");

            migrationBuilder.DropTable(
                name: "CompanyDocuments");

            migrationBuilder.DropTable(
                name: "costs");

            migrationBuilder.DropTable(
                name: "ElectronicAcceptances");

            migrationBuilder.DropTable(
                name: "fipe_histories");

            migrationBuilder.DropTable(
                name: "trades");

            migrationBuilder.DropTable(
                name: "vehicle_documents");

            migrationBuilder.DropTable(
                name: "vehicle_photos");

            migrationBuilder.DropTable(
                name: "cost_categories");

            migrationBuilder.DropTable(
                name: "document_categories");

            migrationBuilder.DropTable(
                name: "vehicles");

            migrationBuilder.DropTable(
                name: "users");

            migrationBuilder.DropTable(
                name: "vehicle_types");
        }
    }
}
