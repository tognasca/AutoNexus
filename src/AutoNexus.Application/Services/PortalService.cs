using AutoNexus.Application.DTOs;
using AutoNexus.Application.Interfaces;
using AutoNexus.Domain.Entities;
using AutoNexus.Domain.Enums;
using AutoNexus.Domain.Interfaces;

namespace AutoNexus.Application.Services;

public class PortalService : IPortalService
{
    private readonly IBuyerLinkRepository _buyerLinkRepository;
    private readonly IAcceptanceRepository _acceptanceRepository;
    private readonly IVehicleRepository _vehicleRepository;
    private readonly IDocumentRepository _documentRepository;
    private readonly IStorageService _storageService;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ITenantContext _tenantContext;

    public PortalService(
        IBuyerLinkRepository buyerLinkRepository,
        IAcceptanceRepository acceptanceRepository,
        IVehicleRepository vehicleRepository,
        IDocumentRepository documentRepository,
        IStorageService storageService,
        IUnitOfWork unitOfWork,
        ITenantContext tenantContext)
    {
        _buyerLinkRepository = buyerLinkRepository;
        _acceptanceRepository = acceptanceRepository;
        _vehicleRepository = vehicleRepository;
        _documentRepository = documentRepository;
        _storageService = storageService;
        _unitOfWork = unitOfWork;
        _tenantContext = tenantContext;
    }

    public async Task<BuyerLinkDto> CreateBuyerLinkAsync(Guid vehicleId, Guid createdByUserId, CreateBuyerLinkDto dto, CancellationToken cancellationToken = default)
    {
        var vehicle = await _vehicleRepository.GetByIdAsync(vehicleId, false, cancellationToken)
            ?? throw new KeyNotFoundException("Veículo não encontrado.");

        if (vehicle.Status != VehicleStatus.Vendido)
            throw new InvalidOperationException("Registre a venda antes de compartilhar o portal.");
        if (dto.ExpirationDays is < 1 or > 30 || dto.BuyerName?.Length > 160)
            throw new ArgumentException("Informe uma validade de 1 a 30 dias e um nome com até 160 caracteres.");
        var documentIds = dto.DocumentIds?.Distinct().ToArray() ?? [];
        var available = await _documentRepository.GetByVehicleIdAsync(vehicleId, cancellationToken);
        if (documentIds.Except(available.Select(doc => doc.Id)).Any())
            throw new ArgumentException("Selecione apenas documentos deste veículo.");

        var link = new BuyerAccessLink(vehicleId, createdByUserId, dto.ExpirationDays, dto.BuyerName, documentIds);
        await _buyerLinkRepository.AddAsync(link, cancellationToken);
        await _unitOfWork.CommitAsync(cancellationToken);

        var shareUrl = $"/portal/{link.Token}";
        return new BuyerLinkDto(
            link.Id, link.VehicleId, link.Token, shareUrl, link.ExpiresAt, link.IsValid(), link.BuyerName, link.CreatedAt
        );
    }

    public async Task<PortalVehicleDto> GetPortalDetailsAsync(string token, CancellationToken cancellationToken = default)
    {
        var link = await ValidateTokenAsync(token, cancellationToken);

        var vehicle = await _vehicleRepository.GetByIdAsync(link.VehicleId, includeDetails: true, cancellationToken);
        if (vehicle == null) throw new KeyNotFoundException("Veículo não encontrado.");

        var docs = await _documentRepository.GetByVehicleIdAsync(vehicle.Id, cancellationToken);

        var photos = vehicle.Photos
            .OrderByDescending(p => p.IsMain)
            .Select(p => new VehiclePhotoDto(p.Id, p.FileName, p.StoragePath, p.IsMain, p.Order));

        var docDtos = docs.Where(d => IsShared(link, d.Id)).Select(d => new PortalDocumentDto(
            d.Id, d.Name, d.DocumentCategory?.Name ?? "", d.FileName, d.FileSize
        ));

        var acceptance = await _acceptanceRepository.GetByVehicleIdAsync(vehicle.Id, cancellationToken);

        return new PortalVehicleDto(
            vehicle.Id,
            vehicle.Brand,
            vehicle.Model,
            vehicle.Version,
            vehicle.ModelYear,
            vehicle.Plate,
            vehicle.SaleValue ?? vehicle.ListedValue ?? 0,
            photos,
            docDtos,
            acceptance != null,
            acceptance?.AcceptedAt,
            acceptance?.BuyerAccessLinkId == link.Id ? acceptance?.BuyerName : null
        );
    }

    public async Task<(byte[] FileBytes, string MimeType, string FileName)> DownloadPortalDocumentAsync(string token, Guid documentId, CancellationToken cancellationToken = default)
    {
        var link = await ValidateTokenAsync(token, cancellationToken);

        var doc = await _documentRepository.GetByIdAsync(documentId, cancellationToken);
        if (doc == null || doc.VehicleId != link.VehicleId || !IsShared(link, documentId))
            throw new KeyNotFoundException("Documento não encontrado ou não pertence a este veículo.");

        var bytes = await _storageService.GetFileBytesAsync(doc.StoragePath, cancellationToken);
        return (bytes, doc.MimeType, doc.FileName);
    }

    public async Task<(byte[] ZipBytes, string ZipFileName)> DownloadPortalZipAsync(string token, CancellationToken cancellationToken = default)
    {
        var link = await ValidateTokenAsync(token, cancellationToken);
        var vehicle = await _vehicleRepository.GetByIdAsync(link.VehicleId, false, cancellationToken);
        if (vehicle == null) throw new KeyNotFoundException("Veículo não encontrado.");

        var docs = await _documentRepository.GetByVehicleIdAsync(link.VehicleId, cancellationToken);
        var list = docs.Where(doc => IsShared(link, doc.Id)).ToList();
        if (!list.Any()) throw new InvalidOperationException("Este veículo não possui documentos cadastrados.");

        var filesToZip = list.Select((d, index) =>
            (d.StoragePath, $"{index + 1}_{Path.GetFileName(d.FileName.Replace('\\', '/'))}"));
        var zipBytes = await _storageService.CreateZipAsync(filesToZip, cancellationToken);

        var zipFileName = $"Documentos_{vehicle.Brand}_{vehicle.Model}_{vehicle.Plate ?? "Veiculo"}.zip";
        return (zipBytes, zipFileName);
    }

    public async Task<AcceptanceResultDto> SubmitAcceptanceAsync(string token, SubmitAcceptanceDto dto, string ipAddress, CancellationToken cancellationToken = default)
    {
        var link = await ValidateTokenAsync(token, cancellationToken);

        var document = new string((dto.BuyerDocument ?? "").Where(char.IsAsciiDigit).ToArray());
        if (string.IsNullOrWhiteSpace(dto.BuyerName) || dto.BuyerName.Length > 160 ||
            document.Length is not (11 or 14) || document.Distinct().Count() == 1)
            throw new ArgumentException("Informe o nome completo e um CPF ou CNPJ válido.");

        var existing = await _acceptanceRepository.GetByVehicleIdAsync(link.VehicleId, cancellationToken);
        if (existing != null)
            throw new InvalidOperationException("Este veículo já possui um aceite eletrônico registrado.");

        var acceptance = new ElectronicAcceptance(
            link.VehicleId,
            link.Id,
            dto.BuyerName,
            document,
            ipAddress,
            "v1.0 - Termo de Recebimento de Veículo e Documentos"
        );

        await _acceptanceRepository.AddAsync(acceptance, cancellationToken);
        await _unitOfWork.CommitAsync(cancellationToken);

        return new AcceptanceResultDto(
            acceptance.Id, acceptance.BuyerName, acceptance.AcceptedAt, acceptance.IpAddress, acceptance.TermVersion
        );
    }

    private static bool IsShared(BuyerAccessLink link, Guid documentId) =>
        link.SharedDocumentIds?.Contains(documentId) == true;

    private async Task<BuyerAccessLink> ValidateTokenAsync(string token, CancellationToken cancellationToken)
    {
        var link = await _buyerLinkRepository.GetByTokenAsync(token, cancellationToken);
        if (link == null || !link.IsValid())
            throw new UnauthorizedAccessException("Link do comprador inválido, expirado ou revogado.");

        _tenantContext.SetTenantFromValidatedPortalLink(link.TenantId);
        return link;
    }
}
