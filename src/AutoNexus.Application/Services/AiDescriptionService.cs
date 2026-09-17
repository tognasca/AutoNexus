using System.Text;
using AutoNexus.Application.Interfaces;

namespace AutoNexus.Application.Services;

public class AiDescriptionService : IAiDescriptionService
{
    public string GenerateVehicleAdDescription(
        string brand, 
        string model, 
        int year, 
        decimal price, 
        decimal? fipePrice, 
        int mileage, 
        string color, 
        string fuelType, 
        string transmission, 
        List<string>? optionals)
    {
        var sb = new StringBuilder();

        sb.AppendLine($"🚗 {brand.ToUpper()} {model.ToUpper()} - {year}");
        
        if (fipePrice.HasValue && price < fipePrice.Value)
        {
            var discount = fipePrice.Value - price;
            sb.AppendLine($"🔥 IMPERDÍVEL: R$ {discount:N2} ABAIXO DA TABELA FIPE!");
        }

        sb.AppendLine("\n✨ DESTAQUES DO VEÍCULO:");
        sb.AppendLine($"• Ano: {year}");
        sb.AppendLine($"• Quilometragem: {mileage:N0} km");
        sb.AppendLine($"• Cor: {color}");
        sb.AppendLine($"• Combustível: {fuelType}");
        sb.AppendLine($"• Câmbio: {transmission}");
        
        if (optionals != null && optionals.Count > 0)
        {
            sb.AppendLine("\n🛠️ EQUIPAMENTOS E OPCIONAIS:");
            foreach (var opt in optionals)
            {
                sb.AppendLine($" ✔️ {opt}");
            }
        }

        sb.AppendLine("\n💎 DIFERENCIAIS DA NOSSA LOJA:");
        sb.AppendLine("✅ Veículo 100% periciado e aprovado");
        sb.AppendLine("✅ Garantia e procedência garantida");
        sb.AppendLine("✅ Aceitamos seu usado na troca com a melhor avaliação");
        sb.AppendLine("✅ Financiamento facilitado em até 60x sem burocracia");

        sb.AppendLine($"\n💰 VALOR PROMOCIONAL: R$ {price:N2}");
        sb.AppendLine("\n📲 Entre em contato agora mesmo via WhatsApp e agende seu Test-Drive!");

        return sb.ToString();
    }
}