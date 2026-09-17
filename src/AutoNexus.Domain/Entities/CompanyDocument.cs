using System;
namespace AutoNexus.Domain.Entities;
public class CompanyDocument : EntityBase
{
    public string Title { get; private set; } = string.Empty;
    public string Category { get; private set; } = string.Empty;
    public string FileUrl { get; private set; } = string.Empty;
    public decimal? Amount { get; private set; }
    public DateTime? ReferenceDate { get; private set; }
    public string? Notes { get; private set; }

    protected CompanyDocument() { }

    public CompanyDocument(string title, string category, string fileUrl, decimal? amount, DateTime? referenceDate, string? notes)
    {
        Title = title.Trim();
        Category = category.Trim();
        FileUrl = fileUrl.Trim();
        Amount = amount;
        ReferenceDate = referenceDate;
        Notes = notes?.Trim();
    }
}
