
using AutoNexus.Application.DTOs;
using AutoNexus.Application.Interfaces;
using AutoNexus.Domain.Entities;
using AutoNexus.Domain.Interfaces;
using Microsoft.AspNetCore.Http;

namespace AutoNexus.Application.Services;

public class CompanyDocumentService : ICompanyDocumentService
{
    private readonly ICompanyDocumentRepository _repository;
    private readonly IStorageService _storageService;
    private readonly IUnitOfWork _unitOfWork;

    public CompanyDocumentService(
        ICompanyDocumentRepository repository, 
        IStorageService storageService, 
        IUnitOfWork unitOfWork)
    {
        _repository = repository;
        _storageService = storageService;
        _unitOfWork = unitOfWork;
    }

    public async Task<IEnumerable<CompanyDocumentDto>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        var docs = await _repository.GetAllAsync(cancellationToken);
        return docs.Select(d => new CompanyDocumentDto(
            d.Id, d.Title, d.Category, d.FileUrl, d.Amount, d.ReferenceDate, d.Notes, d.CreatedAt));
    }

    public async Task<CompanyDocumentDto> UploadAsync(
        string title, 
        string category, 
        decimal? amount, 
        DateTime? referenceDate, 
        string? notes, 
        IFormFile file, 
        CancellationToken cancellationToken = default)
    {
        // Converte o IFormFile para Stream e passa o nome do arquivo para o IStorageService
        using var stream = file.OpenReadStream();
        var fileUrl = await _storageService.SaveFileAsync(stream, file.FileName, "company-docs", cancellationToken);

        var doc = new CompanyDocument(title, category, fileUrl, amount, referenceDate, notes);
        await _repository.AddAsync(doc, cancellationToken);
        await _unitOfWork.CommitAsync(cancellationToken);

        return new CompanyDocumentDto(
            doc.Id, doc.Title, doc.Category, doc.FileUrl, doc.Amount, doc.ReferenceDate, doc.Notes, doc.CreatedAt);
    }

    public async Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var doc = await _repository.GetByIdAsync(id, cancellationToken);
        if (doc == null) throw new KeyNotFoundException("Documento não encontrado.");

        _repository.Delete(doc);
        await _unitOfWork.CommitAsync(cancellationToken);
    }
}