using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AutoNexus.Infrastructure.Migrations
{
    public partial class NormalizeLegalDocumentLineEndings : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Sincronização do modelo. Preserva os documentos existentes.
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Nenhuma alteração necessária.
        }
    }
}