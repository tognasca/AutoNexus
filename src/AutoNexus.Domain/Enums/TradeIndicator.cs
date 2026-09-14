namespace AutoNexus.Domain.Enums;

/// <summary>
/// REQUISITO PENDENTE — definir limites de classificação da troca.
/// Os critérios exatos para Verde, Amarelo e Vermelho ainda serão
/// definidos como regra de negócio (Seção 15 do README).
/// </summary>
public enum TradeIndicator
{
    Pendente = 0,
    Vantajosa = 1,
    Neutra = 2,
    Desfavoravel = 3
}