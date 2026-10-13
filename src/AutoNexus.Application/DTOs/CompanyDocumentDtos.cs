using System;
using Microsoft.AspNetCore.Http;

namespace AutoNexus.Application.DTOs;

public record CompanyDocumentDto(
    Guid Id, 
    string Title, 
    string Category, 
    string FileUrl, 
    decimal? Amount, 
    DateTime? ReferenceDate, 
    string? Notes, 
    DateTime CreatedAt
);

/// <summary>Dados mínimos para servir o arquivo via download autenticado.</summary>
public record CompanyDocumentFileDto(string FileName, string StoragePath);

public class UploadCompanyDocumentRequest
{
    public string Title { get; set; } = string.Empty;
    public string Category { get; set; } = "Despesas Fixas";
    public decimal? Amount { get; set; }
    public DateTime? ReferenceDate { get; set; }
    public string? Notes { get; set; }
    public IFormFile File { get; set; } = null!;
}