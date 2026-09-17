
using AutoNexus.Application.DTOs;
using Microsoft.AspNetCore.Http;
namespace AutoNexus.Application.Interfaces;

public interface ICompanyDocumentService
{
    Task<IEnumerable<CompanyDocumentDto>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<CompanyDocumentDto> UploadAsync(string title, string category, decimal? amount, DateTime? referenceDate, string? notes, IFormFile file, CancellationToken cancellationToken = default);
    Task DeleteAsync(Guid id, CancellationToken cancellationToken = default);
}
