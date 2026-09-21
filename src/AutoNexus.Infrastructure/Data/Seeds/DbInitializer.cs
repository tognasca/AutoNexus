using AutoNexus.Domain.Entities;
using AutoNexus.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace AutoNexus.Infrastructure.Data.Seeds;

public static class DbInitializer
{
    public static async Task SeedAsync(AutoNexusDbContext context)
    {
        await context.Database.MigrateAsync();


        if (!await context.VehicleBrands.AnyAsync())
        {
            var brandData = new Dictionary<string, string[]>
            {
                ["Chevrolet"] = new[] { "Onix", "Tracker", "S10", "Cruze", "Spin", "Montana", "Equinox", "Celta", "Corsa", "Astra", "Vectra", "Prisma", "Cobalt", "Trailblazer" },
                ["Fiat"] = new[] { "Strada", "Toro", "Mobi", "Argo", "Cronos", "Pulse", "Fastback", "Uno", "Palio", "Siena", "Fiorino", "Ducato", "Idea", "Punto", "Doblò" },
                ["Volkswagen"] = new[] { "Gol", "Polo", "Nivus", "T-Cross", "Taos", "Amarok", "Saveiro", "Virtus", "Fox", "Voyage", "Jetta", "Golf", "Tiguan", "Up!" },
                ["Toyota"] = new[] { "Corolla", "Corolla Cross", "Hilux", "SW4", "Yaris", "Etios", "RAV4", "Camry" },
                ["Hyundai"] = new[] { "HB20", "HB20S", "Creta", "Tucson", "Santa Fe", "IX35", "Azera", "HR" },
                ["Ford"] = new[] { "Ka", "EcoSport", "Ranger", "Fiesta", "Focus", "Fusion", "Territory", "Maverick", "Bronco", "Mustang" },
                ["Honda"] = new[] { "Civic", "Fit", "HR-V", "City", "WR-V", "CR-V", "ZR-V" },
                ["Jeep"] = new[] { "Renegade", "Compass", "Commander", "Grand Cherokee", "Wrangler" },
                ["Renault"] = new[] { "Kwid", "Sandero", "Duster", "Logan", "Captur", "Oroch", "Master", "Kardian", "Clio" },
                ["Nissan"] = new[] { "Kicks", "Versa", "March", "Frontier", "Sentra" },
                ["BYD"] = new[] { "Dolphin", "Dolphin Mini", "Song Plus", "Yuan Plus", "Seal", "King", "Tan", "Han" },
                ["GWM"] = new[] { "Haval H6", "Ora 03", "Tank 300" },
                ["BMW"] = new[] { "Série 3 (320i)", "Série 1", "X1", "X3", "X5", "X6", "M3", "M5" },
                ["Mercedes-Benz"] = new[] { "Classe A", "Classe C", "Classe E", "GLA", "GLC", "Sprinter" },
                ["Audi"] = new[] { "A3", "A4", "A5", "Q3", "Q5", "e-tron" },
                ["Peugeot"] = new[] { "208", "2008", "3008", "Partner", "Expert" },
                ["Citroën"] = new[] { "C3", "C4 Cactus", "Aircross", "Jumpy" },
                ["Caoa Chery"] = new[] { "Tiggo 2", "Tiggo 3x", "Tiggo 5x", "Tiggo 7", "Tiggo 8", "iCar", "Arrizo 6" },
                ["Mitsubishi"] = new[] { "L200 Triton", "ASX", "Eclipse Cross", "Pajero Full", "Outlander" },
                ["RAM"] = new[] { "Rampage", "1500", "2500", "3500" },
                ["Volvo"] = new[] { "XC40", "XC60", "XC90", "C40", "EX30" },
                ["Porsche"] = new[] { "911", "Macan", "Cayenne", "Panamera", "Taycan" }
            };

            int order = 1;
            foreach (var (brandName, models) in brandData)
            {
                var brand = new VehicleBrand(brandName, order++);
                context.VehicleBrands.Add(brand);

                foreach (var modelName in models)
                {
                    var model = new VehicleModel(brand.Id, modelName);
                    context.VehicleModels.Add(model);
                }
            }

            await context.SaveChangesAsync();
        }


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

        // 5. Usuário SuperAdmin inicial (dono do SaaS — TROQUE A SENHA em produção).
        // Deliberadamente SEM TenantId (fica em Guid.Empty, o valor padrão de
        // um Guid em C#): SuperAdmin não pertence a nenhuma empresa. Por isso
        // não usamos AnyAsync com IgnoreQueryFilters aqui — como estamos no
        // seed (fora de uma requisição HTTP), HasTenant já é false e o filtro
        // global não está ativo, então esta consulta já enxerga todos os
        // usuários normalmente.
        if (!await context.Users.AnyAsync(u => u.Email == "superadmin@autonexus.com"))
        {
            var superAdminPasswordHash = BCrypt.Net.BCrypt.HashPassword("SuperAdmin@123456", workFactor: 12);
            var superAdminUser = new User("Super Admin", "superadmin@autonexus.com", superAdminPasswordHash, UserProfile.SuperAdmin);
            await context.Users.AddAsync(superAdminUser);
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