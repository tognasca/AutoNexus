using AutoNexus.Application.DTOs;
using AutoNexus.Application.Interfaces;
using AutoNexus.Domain.Interfaces;

namespace AutoNexus.Application.Services;

public class LookupService : ILookupService
{
    private readonly ILookupRepository _lookupRepository;

    public LookupService(ILookupRepository lookupRepository)
    {
        _lookupRepository = lookupRepository;
    }

    public async Task<IEnumerable<LookupItemDto>> GetVehicleTypesAsync(CancellationToken cancellationToken = default)
    {
        var items = await _lookupRepository.GetVehicleTypesAsync(true, cancellationToken);
        return items.Select(x => new LookupItemDto(x.Id, x.Name, null));
    }

    public async Task<IEnumerable<LookupItemDto>> GetBrands(CancellationToken cancellationToken = default)
    {
        var items = await _lookupRepository.GetBrandsAsync(true, cancellationToken);
        return items.Select(x => new LookupItemDto(x.Id, x.Name, null));
    }
    public async Task<IEnumerable<LookupItemDto>> GetModelsByBrand(Guid brandId, CancellationToken cancellationToken = default)
    {
        var models = await _lookupRepository.GetModelsByBrandAsync(brandId, true, cancellationToken);
        return models.Select(m => new LookupItemDto(m.Id, m.Name, null));
    }

    public async Task<IEnumerable<LookupItemDto>> GetCostCategoriesAsync(CancellationToken cancellationToken = default)
    {
        var items = await _lookupRepository.GetCostCategoriesAsync(true, cancellationToken);
        return items.Select(x => new LookupItemDto(x.Id, x.Name, x.Description));
    }

    public async Task<IEnumerable<LookupItemDto>> GetDocumentCategoriesAsync(CancellationToken cancellationToken = default)
    {
        var items = await _lookupRepository.GetDocumentCategoriesAsync(true, cancellationToken);
        return items.Select(x => new LookupItemDto(x.Id, x.Name, x.Description));
    }
}