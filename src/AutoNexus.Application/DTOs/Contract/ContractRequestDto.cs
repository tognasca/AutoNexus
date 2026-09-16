namespace AutoNexus.Application.DTOs.Contract;

public class ContractRequestDto
{
    public string CustomerName { get; set; } = string.Empty;
    public string CustomerDocument { get; set; } = string.Empty;
    public string? CustomerRg { get; set; }
    public string CustomerPhone { get; set; } = string.Empty;
    public string? CustomerEmail { get; set; }
    public string? CustomerAddress { get; set; }
    public decimal SaleValue { get; set; }
    public decimal EntryValue { get; set; }
    public bool HasTrade { get; set; }
    public string? TradeBrand { get; set; }
    public string? TradeModel { get; set; }
    public int TradeYear { get; set; }
    public string? TradeColor { get; set; }
    public string? TradePlate { get; set; }
    public string? TradeChassi { get; set; }
    public string? TradeRenavam { get; set; }
    public int TradeMileage { get; set; }
    public decimal TradeValue { get; set; }
    public decimal FinancedValue { get; set; }
    public int InstallmentsCount { get; set; }
    public decimal InstallmentValue { get; set; }
    public string PaymentMethod { get; set; } = "PIX / Transferência";
    public string? Notes { get; set; }
    public bool IsProposal { get; set; }
}