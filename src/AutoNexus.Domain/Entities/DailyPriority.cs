namespace AutoNexus.Domain.Entities;

/// <summary>Transparent daily work rules. Scheduled future contacts are respected.</summary>
public sealed record DailyPriority(int Score, IReadOnlyList<string> Reasons)
{
    public static DailyPriority ForLead(DateTime now, DateTime endOfDay, DateTime createdAt,
        DateTime? lastContact, DateTime? nextContact, bool closed, int stockDays, decimal? margin)
    {
        if (closed || nextContact > endOfDay) return new(0, []);
        var reasons = new List<string>();
        var score = 0;
        if (nextContact <= endOfDay) { score = nextContact < now ? 100 : 90; reasons.Add(nextContact < now ? "Retorno vencido" : "Retorno hoje"); }
        var idle = Math.Max(0, (int)(now - (lastContact ?? createdAt)).TotalDays);
        if (lastContact == null) { score = Math.Max(score, 85); reasons.Add("Primeiro contato pendente"); }
        else if (idle >= 3) { score = Math.Max(score, 60 + Math.Min(idle, 20)); reasons.Add($"Sem contato há {idle} dias"); }
        if (score == 0) return new(0, []);
        if (stockDays >= 30) { score += 5; reasons.Add($"Estoque há {stockDays} dias"); }
        if (margin < 5) { score += 5; reasons.Add("Revisar margem estimada abaixo de 5%"); }
        return new(score, reasons);
    }

    public static DailyPriority ForStock(int stockDays, decimal? margin, bool deliveryPending)
    {
        if (deliveryPending) return new(95, ["Entrega com etapas pendentes"]);
        var reasons = new List<string>();
        var score = 0;
        if (stockDays >= 30) { score = 40 + Math.Min(stockDays / 30, 10); reasons.Add($"Estoque há {stockDays} dias"); }
        if (margin < 5) { score += 10; reasons.Add("Revisar margem estimada abaixo de 5%"); }
        return new(score, reasons);
    }
}
