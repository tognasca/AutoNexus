using AutoNexus.Domain.Entities;
using AutoNexus.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace AutoNexus.Infrastructure.Data.Seeds;

public static class DbInitializer
{
    public static async Task SeedAsync(AutoNexusDbContext context)
    {
        await context.Database.MigrateAsync();

        // 1. Tipos de Veículos Iniciais (Seção 5)
        if (!await context.VehicleTypes.AnyAsync())
        {
            var vehicleTypes = new List<VehicleType>
            {
                new("Carro", "Automóveis de passeio"),
                new("Moto", "Motocicletas e ciclomotores"),
                new("Caminhão", "Veículos pesados e de carga"),
                new("Jetski", "Motos aquáticas"),
                new("Outros", "Demais categorias de veículos")
            };
            await context.VehicleTypes.AddRangeAsync(vehicleTypes);
        }

        // 2. Categorias de Custos Iniciais (Seção 8)
        if (!await context.CostCategories.AnyAsync())
        {
            var costCategories = new List<CostCategory>
            {
                new("Compra", "Valor de aquisição inicial"),
                new("Manutenção", "Revisão e manutenção preventiva"),
                new("Reparo", "Consertos mecânicos e elétricos"),
                new("Peças", "Substituição de componentes"),
                new("Pintura", "Serviços de pintura"),
                new("Funilaria", "Lanternagem e martelinho de ouro"),
                new("Documentação", "Emplacamento, IPVA, taxas e transferência"),
                new("Taxas", "Taxas operacionais e administrativas"),
                new("Transporte", "Frete e guincho"),
                new("Outro", "Outros custos operacionais")
            };
            await context.CostCategories.AddRangeAsync(costCategories);
        }

        // 3. Categorias de Documentos Iniciais (Seção 7)
        if (!await context.DocumentCategories.AnyAsync())
        {
            var docCategories = new List<DocumentCategory>
            {
                new("Laudo", "Laudo cautelar e pericial"),
                new("Documento do Veículo", "CRLV e documentação oficial"),
                new("Transferência", "Comprovante de transferência/ATPV-e"),
                new("Documento de Leilão", "Termos e notas de leilão"),
                new("Recibos", "Recibos de pagamento"),
                new("Comprovantes", "Comprovantes diversos"),
                new("Outros", "Demais documentos anexos")
            };
            await context.DocumentCategories.AddRangeAsync(docCategories);
        }

        // 4. Usuário Admin Inicial (Senha padrão: Admin@123456)
        if (!await context.Users.AnyAsync(u => u.Email == "admin@autonexus.com"))
        {
            var adminPasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@123456", workFactor: 12);
            var adminUser = new User("Administrador", "admin@autonexus.com", adminPasswordHash, UserProfile.Admin);
            await context.Users.AddAsync(adminUser);
        }


        if (!await context.Set<BankConfig>().AnyAsync())
        {
            var defaultBanks = new List<BankConfig>
    {
        new("santander", "Santander Financiamentos", 1.49m, "https://api.santander.com.br/sandbox", "SANDBOX_KEY_SANTANDER", "SANDBOX_SECRET", "STORE_123", true),
        new("itau", "Itaú Veículos", 1.55m, "https://api.itau.com.br/sandbox", "SANDBOX_KEY_ITAU", "SANDBOX_SECRET", "STORE_123", true),
        new("bv", "Banco BV", 1.79m, "https://api.bv.com.br/sandbox", "SANDBOX_KEY_BV", "SANDBOX_SECRET", "STORE_123", true),
        new("bradesco", "Bradesco Financiamentos", 1.62m, "https://api.bradesco.com.br/sandbox", "SANDBOX_KEY_BRADESCO", "SANDBOX_SECRET", "STORE_123", true)
    };

            await context.Set<BankConfig>().AddRangeAsync(defaultBanks);
            await context.SaveChangesAsync();
        }
        await context.SaveChangesAsync();
    }
}