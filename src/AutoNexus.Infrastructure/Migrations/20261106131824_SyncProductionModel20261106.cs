using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AutoNexus.Infrastructure.Migrations
{
    public partial class SyncProductionModel20261106 : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Somente sincronização do snapshot do modelo.
            // Não modifica dados existentes.
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Nenhuma alteração de dados ou estrutura.
        }
    }
}