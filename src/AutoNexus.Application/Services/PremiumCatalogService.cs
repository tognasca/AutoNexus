using System.IO.Compression;
using System.Text;
using System.Text.Json;
using AutoNexus.Application.DTOs;
using AutoNexus.Application.Interfaces;
using AutoNexus.Domain.Entities;
using AutoNexus.Domain.Interfaces;

namespace AutoNexus.Application.Services;

public sealed class PremiumCatalogService : IPremiumCatalogService
{
    private const string PremiumName = "Premium";
    private readonly IPremiumCatalogPublicationRepository _publicationRepository;
    private readonly ITenantContext _tenantContext;
    private readonly ITenantSubscriptionRepository _subscriptionRepository;
    private readonly IPlanRepository _planRepository;
    private readonly ITenantRepository _tenantRepository;
    private readonly ITenantSettingRepository _settingRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly Microsoft.Extensions.Configuration.IConfiguration _configuration;

    public PremiumCatalogService(IPremiumCatalogPublicationRepository publicationRepository, ITenantContext tenantContext, ITenantSubscriptionRepository subscriptionRepository, IPlanRepository planRepository, ITenantRepository tenantRepository, ITenantSettingRepository settingRepository, IUnitOfWork unitOfWork, Microsoft.Extensions.Configuration.IConfiguration configuration)
    {
        _publicationRepository = publicationRepository; _tenantContext = tenantContext; _subscriptionRepository = subscriptionRepository; _planRepository = planRepository; _tenantRepository = tenantRepository; _settingRepository = settingRepository; _unitOfWork = unitOfWork; _configuration = configuration;
    }

    public async Task<PremiumCatalogPublicationDto?> GetPublicationAsync(CancellationToken cancellationToken = default)
    {
        EnsureTenant(); await EnsurePremiumAsync(cancellationToken); var entity = await _publicationRepository.GetAsync(_tenantContext.TenantId, cancellationToken); return entity == null ? null : Map(entity);
    }

    public async Task<PremiumCatalogPublicationDto> SavePublicationAsync(SavePremiumCatalogPublicationDto dto, CancellationToken cancellationToken = default)
    {
        EnsureTenant(); await EnsurePremiumAsync(cancellationToken); var entity = await _publicationRepository.GetAsync(_tenantContext.TenantId, cancellationToken);
        if (entity == null) { entity = new PremiumCatalogPublication(_tenantContext.TenantId, dto.Domain); await _publicationRepository.AddAsync(entity, cancellationToken); } else { entity.SetDomain(dto.Domain); entity.Activate(); _publicationRepository.Update(entity); }
        await _unitOfWork.CommitAsync(cancellationToken); return Map(entity);
    }

    public async Task<byte[]> GeneratePackageAsync(CancellationToken cancellationToken = default)
    {
        EnsureTenant(); await EnsurePremiumAsync(cancellationToken);
        var publication = await _publicationRepository.GetAsync(_tenantContext.TenantId, cancellationToken) ?? throw new InvalidOperationException("Configure o domínio próprio antes de gerar o catálogo.");
        var tenant = await _tenantRepository.GetByIdAsync(_tenantContext.TenantId, cancellationToken) ?? throw new InvalidOperationException("Empresa não encontrada.");
        var settings = await _settingRepository.GetCurrentAsync(cancellationToken);
        var apiBaseUrl = (_configuration["Application:Url"] ?? _configuration["ApplicationUrl"] ?? string.Empty).TrimEnd('/');
        if (string.IsNullOrWhiteSpace(apiBaseUrl)) throw new InvalidOperationException("Application:Url não está configurada no AutoNexus.");
        var config = "window.__AUTONEXUS_CONFIG__=" + JsonSerializer.Serialize(new { apiBaseUrl, store = tenant.Slug, domain = publication.Domain, companyName = settings?.CompanyName ?? tenant.Name, logoUrl = settings?.LogoUrl, primaryColor = settings?.PrimaryColor ?? "#2563eb", whatsappNumber = settings?.WhatsAppNumber }) + ";";
        using var stream = new MemoryStream();
        using (var archive = new ZipArchive(stream, ZipArchiveMode.Create, true)) { Add(archive, "index.html", StaticIndex()); Add(archive, "config.js", config); Add(archive, "assets/catalog.css", StaticCss()); Add(archive, "assets/catalog.js", StaticJs()); Add(archive, "README-INSTALACAO.txt", InstallationReadme(publication.Domain)); }
        publication.MarkGenerated(); _publicationRepository.Update(publication); await _unitOfWork.CommitAsync(cancellationToken); return stream.ToArray();
    }

    private async Task EnsurePremiumAsync(CancellationToken cancellationToken)
    {
        var subscription = await _subscriptionRepository.GetCurrentAsync(cancellationToken);
        if (subscription == null) throw new UnauthorizedAccessException("A publicação em hospedagem própria está disponível exclusivamente no plano Premium.");
        var plan = await _planRepository.GetByIdAsync(subscription.PlanId, cancellationToken);
        if (plan == null || !plan.IsActive || !string.Equals(plan.Name.Trim(), PremiumName, StringComparison.OrdinalIgnoreCase)) throw new UnauthorizedAccessException("A publicação em hospedagem própria está disponível exclusivamente no plano Premium.");
    }

    private void EnsureTenant() { if (!_tenantContext.HasTenant) throw new UnauthorizedAccessException("Empresa não identificada."); }
    private static PremiumCatalogPublicationDto Map(PremiumCatalogPublication entity) => new(entity.Domain, entity.IsActive, entity.LastGeneratedAt);
    private static void Add(ZipArchive archive, string name, string content) { var entry = archive.CreateEntry(name, CompressionLevel.Fastest); using var writer = new StreamWriter(entry.Open(), new UTF8Encoding(false)); writer.Write(content); }
    private static string StaticIndex() => """
        <!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Catálogo</title><link rel="stylesheet" href="assets/catalog.css"></head><body><div id="app"><div class="loading">Carregando catálogo...</div></div><script src="config.js"></script><script src="assets/catalog.js"></script></body></html>
        """;
    private static string StaticCss() => """
        body{margin:0;font-family:Arial,sans-serif;background:#f8fafc;color:#0f172a}.loading{text-align:center;padding:60px}.top{padding:24px;background:var(--accent);color:#fff}.wrap{max-width:1200px;margin:auto;padding:24px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:20px}.card{background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px #0001}.card img{width:100%;height:210px;object-fit:cover}.body{padding:16px}.price{font-weight:800;font-size:20px}.empty{text-align:center;padding:64px}.btn{display:inline-block;border-radius:10px;padding:10px 16px;background:var(--accent);color:#fff;text-decoration:none}footer{text-align:center;padding:30px;color:#64748b}
        """;
    private static string StaticJs() => """
        (()=>{const c=window.__AUTONEXUS_CONFIG__||{};document.documentElement.style.setProperty('--accent',c.primaryColor||'#2563eb');const root=document.getElementById('app');const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));const money=v=>v==null?'Consultar':Number(v).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});async function load(){try{const r=await fetch(`${c.apiBaseUrl}/api/public/catalog?store=${encodeURIComponent(c.store)}`);if(!r.ok)throw 0;const d=await r.json(),s=d.store||{};root.innerHTML=`<header class="top"><div class="wrap"><h1>${esc(s.name)}</h1><p>Catálogo de veículos</p></div></header><main class="wrap"><div class="grid">${(d.items||[]).map(v=>`<article class="card">${v.mainPhotoUrl?`<img src="${esc(v.mainPhotoUrl)}" alt="${esc(v.brand)} ${esc(v.model)}">`:''}<div class="body"><h2>${esc(v.brand)} ${esc(v.model)}</h2><p>${esc(v.version||'')} · ${esc(v.modelYear||v.manufacturingYear||'')}</p><p class="price">${money(v.listedValue)}</p>${s.whatsappNumber?`<a class="btn" href="https://wa.me/${String(s.whatsappNumber).replace(/\D/g,'')}?text=${encodeURIComponent('Olá! Tenho interesse no veículo '+(v.brand||'')+' '+(v.model||''))}" target="_blank" rel="noopener">Tenho interesse</a>`:''}</div></article>`).join('')}</div>${!(d.items||[]).length?'<div class="empty">Nenhum veículo disponível no momento.</div>':''}</main><footer>Catálogo atualizado automaticamente pelo AutoNexus.</footer>`}catch{root.innerHTML='<div class="empty">Não foi possível carregar o catálogo. Tente novamente mais tarde.</div>'}}load()})();
        """;
    private static string InstallationReadme(string domain) => $"CATÁLOGO PREMIUM AUTONEXUS\r\n\r\nDomínio configurado: {domain}\r\n\r\n1. Extraia todos os arquivos na pasta pública.\r\n2. Aponte o domínio para essa pasta.\r\n3. Mantenha HTTPS ativo.\r\n4. O catálogo consulta a API AutoNexus e atualiza estoque, preços, fotos e WhatsApp automaticamente.\r\n5. Não existem credenciais privadas neste pacote.\r\n";
}
