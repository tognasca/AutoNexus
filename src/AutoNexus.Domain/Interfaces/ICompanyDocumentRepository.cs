using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using AutoNexus.Domain.Entities;
namespace AutoNexus.Domain.Interfaces;
public interface ICompanyDocumentRepository
{
    Task<IEnumerable<CompanyDocument>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<CompanyDocument?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task AddAsync(CompanyDocument document, CancellationToken cancellationToken = default);
    void Delete(CompanyDocument document);
}
