namespace AutoNexus.Domain.Entities;

public sealed record VehicleFinancials(decimal Purchase, decimal Expenses, decimal TotalCost,
    decimal? Revenue, decimal? Profit, decimal? MarginPercentage)
{
    public static VehicleFinancials Calculate(decimal purchase, decimal expenses, decimal? revenue)
    {
        var cost = purchase + expenses;
        var profit = revenue - cost;
        return new(purchase, expenses, cost, revenue, profit,
            revenue > 0 ? Math.Round(profit!.Value / revenue.Value * 100m, 2) : null);
    }
}
