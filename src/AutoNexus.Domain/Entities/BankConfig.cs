using System;

namespace AutoNexus.Domain.Entities;

public class BankConfig : EntityBase
{
    public string BankCode { get; private set; } = string.Empty;
    public string Name { get; private set; } = string.Empty;
    public decimal DefaultMonthlyRate { get; private set; }
    public string ApiUrl { get; private set; } = string.Empty;
    public string ApiKey { get; private set; } = string.Empty;
    public string? ApiSecret { get; private set; }
    public string? MerchantId { get; private set; }
    public bool IsActive { get; private set; }
    public bool IsSandbox { get; private set; }

    protected BankConfig() { }

    public BankConfig(
        string bankCode,
        string name,
        decimal defaultMonthlyRate,
        string apiUrl,
        string apiKey,
        string? apiSecret = null,
        string? merchantId = null,
        bool isSandbox = true)
    {
        BankCode = bankCode.ToLower().Trim();
        Name = name.Trim();
        DefaultMonthlyRate = defaultMonthlyRate;
        ApiUrl = apiUrl.Trim();
        ApiKey = apiKey.Trim();
        ApiSecret = apiSecret?.Trim();
        MerchantId = merchantId?.Trim();
        IsActive = true;
        IsSandbox = isSandbox;
    }

    public void UpdateCredentials(string apiUrl, string apiKey, string? apiSecret, string? merchantId, decimal rate, bool isSandbox)
    {
        ApiUrl = apiUrl.Trim();
        ApiKey = apiKey.Trim();
        ApiSecret = apiSecret?.Trim();
        MerchantId = merchantId?.Trim();
        DefaultMonthlyRate = rate;
        IsSandbox = isSandbox;
        UpdatedAt = DateTime.UtcNow;
    }

    public void SetActive(bool active)
    {
        IsActive = active;
        UpdatedAt = DateTime.UtcNow;
    }
}