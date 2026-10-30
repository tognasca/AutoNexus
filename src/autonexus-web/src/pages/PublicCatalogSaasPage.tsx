import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import {
  Search, Gauge, Fuel, Cog, Calendar, MessageCircle, X,
  ChevronLeft, ChevronRight, Car, FileText, ShieldCheck, Sparkles,
  ExternalLink, MapPin
} from 'lucide-react';
import { catalogService, getPhotoUrl, type PublicStoreInfo, type PublicVehicleDetail } from '../services/catalogService';
import { formatCurrency } from '../utils/formatters';

interface PublicCatalogSaasPageProps {
  currentView?: string;
  onNavigate?: (view: string) => void;
}

export function PublicCatalogSaasPage({ onNavigate }: PublicCatalogSaasPageProps) {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [store, setStore] = useState<PublicStoreInfo | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [brand, setBrand] = useState('ALL');
  const [selectedVehicle, setSelectedVehicle] = useState<PublicVehicleDetail | null>(null);
  const [photoIndex, setPhotoIndex] = useState(0);

  const storeSlug = useMemo(() => {
    const match = window.location.pathname.match(/^\/loja\/([^/]+)/);
    return match?.[1] || new URLSearchParams(window.location.search).get('store') || (onNavigate ? 'current' : 'default');
  }, [onNavigate]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await catalogService.getPublicCatalog(storeSlug);
        if (!cancelled) {
          setStore(data.store);
          setVehicles(data.items);
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Não foi possível carregar o catálogo desta loja.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [storeSlug]);

  const filteredVehicles = useMemo(() => {
    const term = search.trim().toLowerCase();
    return vehicles.filter(v => {
      const matchesBrand = brand === 'ALL' || (v.brand || '').toLowerCase() === brand.toLowerCase();
      if (!matchesBrand) return false;
      if (!term) return true;
      return [v.brand, v.model, v.version, v.color].some(value => String(value || '').toLowerCase().includes(term));
    });
  }, [vehicles, search, brand]);

  const brands = useMemo(() => Array.from(new Set(vehicles.map(v => v.brand).filter(Boolean))), [vehicles]);
  const accent = store?.primaryColor || '#2563eb';
  const whatsapp = (store?.whatsappNumber || '').replace(/\D/g, '');

  const getFuelName = (fuel?: number | string) => {
    if (typeof fuel === 'string') {
      return ({ Gasolina: 'Gasolina', Etanol: 'Etanol', Flex: 'Flex', Diesel: 'Diesel', Hibrido: 'Híbrido', Híbrido: 'Híbrido', Eletrico: 'Elétrico', Elétrico: 'Elétrico' } as Record<string, string>)[fuel] || fuel;
    }
    return ({ 1: 'Gasolina', 2: 'Etanol', 3: 'Flex', 4: 'Diesel', 5: 'Híbrido', 6: 'Elétrico' } as Record<number, string>)[fuel || 3] || 'Flex';
  };

  const getTransmissionName = (value?: number | string) => {
    if (typeof value === 'string') return ({ Manual: 'Manual', Automatico: 'Automático', Automático: 'Automático', CVT: 'CVT' } as Record<string, string>)[value] || value;
    return ({ 1: 'Manual', 2: 'Automático', 3: 'CVT' } as Record<number, string>)[value || 2] || 'Automático';
  };

  const openDetails = async (id: string) => {
    try {
      setPhotoIndex(0);
      const detail = await catalogService.getPublicVehicle(id, store?.slug || storeSlug);
      setSelectedVehicle(detail);
    } catch (e) {
      console.error('Erro ao carregar detalhes do veículo:', e);
    }
  };

  const contactWhatsApp = (vehicle?: any) => {
    if (!whatsapp) return;
    const price = Number(vehicle?.listedValue ?? vehicle?.ListedValue ?? selectedVehicle?.listedValue ?? 0);
    const name = vehicle ? `${vehicle.brand} ${vehicle.model} ${vehicle.modelYear || ''}` : `${selectedVehicle?.brand} ${selectedVehicle?.model}`;
    const text = `Olá! Vi no catálogo da ${store?.name || 'loja'} o veículo *${name.trim()}*${price > 0 ? ` (${formatCurrency(price)})` : ''} e gostaria de mais informações.`;
    window.open(`https://wa.me/${whatsapp}?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  };

  const photos = selectedVehicle?.photos?.length
    ? selectedVehicle.photos.map(p => getPhotoUrl(p.storagePath || p.url)).filter(Boolean)
    : [getPhotoUrl(selectedVehicle?.mainPhotoUrl)].filter(Boolean);

  const initials = (store?.name || 'LO').trim().split(/\s+/).slice(0, 2).map(x => x[0]).join('').toUpperCase();

  return (
    <div className="min-h-screen bg-slate-950 text-white" style={{ '--store-accent': accent } as CSSProperties}>
      <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/90 backdrop-blur-xl">
        <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-3 px-4 py-2 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-white shadow-lg" style={{ borderColor: accent }}>
              {store?.logoUrl ? <img src={store.logoUrl} alt={store.name} className="h-full w-full object-contain" /> : <div className="flex h-full w-full items-center justify-center text-sm font-black text-white" style={{ backgroundColor: accent }}>{initials}</div>}
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-black sm:text-base">{store?.name || 'Catálogo de veículos'}</div>
              <div className="text-[10px] text-slate-400 sm:text-xs">Estoque oficial da loja</div>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {onNavigate && <button onClick={() => onNavigate('dashboard')} className="hidden rounded-lg bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-200 sm:block">Voltar</button>}
            {whatsapp && <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-bold text-white shadow-lg" style={{ backgroundColor: '#25D366' }}><MessageCircle size={15} /> <span className="hidden sm:inline">WhatsApp</span></a>}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-7 px-4 py-5 sm:px-6 sm:py-8">
        <section className="relative isolate min-h-[390px] overflow-hidden rounded-3xl border border-white/10 shadow-2xl sm:min-h-[440px]">
          {vehicles[0]?.mainPhotoUrl && <img src={getPhotoUrl(vehicles[0].mainPhotoUrl)} alt="Veículos em estoque" className="absolute inset-0 h-full w-full object-cover" />}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/85 to-slate-950/20" />
          <div className="absolute inset-0 opacity-60" style={{ background: `radial-gradient(circle at 85% 20%, ${accent}66, transparent 35%)` }} />
          <div className="relative flex min-h-[390px] items-center p-6 sm:min-h-[440px] sm:p-10 lg:p-14">
            <div className="max-w-3xl space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.16em] text-slate-200 sm:text-xs">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: accent }} />
                {vehicles.length} {vehicles.length === 1 ? 'veículo disponível' : 'veículos disponíveis'}
              </div>
              <div>
                <p className="mb-2 text-sm font-semibold" style={{ color: accent }}>Bem-vindo à {store?.name || 'nossa loja'}</p>
                <h1 className="text-4xl font-black leading-[1.02] tracking-tight sm:text-6xl">Seu próximo carro pode estar <span style={{ color: accent }}>aqui.</span></h1>
              </div>
              <p className="max-w-2xl text-sm leading-6 text-slate-200 sm:text-base">Confira o estoque atualizado, compare os veículos e fale diretamente com a equipe da loja pelo WhatsApp.</p>
              <div className="grid max-w-3xl grid-cols-1 gap-2 sm:grid-cols-12">
                <div className="relative sm:col-span-8">
                  <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Marca, modelo, versão ou cor..." className="w-full rounded-xl border border-white/10 bg-slate-950/90 py-3 pl-10 pr-4 text-sm text-white outline-none focus:border-[var(--store-accent)]" />
                </div>
                <select value={brand} onChange={e => setBrand(e.target.value)} className="rounded-xl border border-white/10 bg-slate-950/90 px-3 py-3 text-sm text-white outline-none focus:border-[var(--store-accent)] sm:col-span-4">
                  <option value="ALL">Todas as marcas</option>
                  {brands.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
            </div>
          </div>
        </section>

        {loading ? (
          <div className="flex min-h-48 items-center justify-center text-sm text-slate-400">Carregando estoque...</div>
        ) : error ? (
          <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-10 text-center text-sm text-rose-200">{error}</div>
        ) : filteredVehicles.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-12 text-center">
            <Car size={46} className="mx-auto mb-3" style={{ color: accent }} />
            <h2 className="text-lg font-bold">Nenhum veículo encontrado</h2>
            <p className="mt-2 text-sm text-slate-400">Ajuste os filtros ou aguarde a loja publicar novos veículos.</p>
          </div>
        ) : (
          <section>
            <div className="mb-4 flex items-end justify-between gap-3">
              <div><p className="text-xs font-bold uppercase tracking-[.18em]" style={{ color: accent }}>Estoque</p><h2 className="text-2xl font-black">Veículos disponíveis</h2></div>
              <span className="text-xs text-slate-500">{filteredVehicles.length} resultado(s)</span>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredVehicles.map(vehicle => {
                const photo = getPhotoUrl(vehicle.mainPhotoUrl || vehicle.MainPhotoUrl);
                const price = Number(vehicle.listedValue ?? vehicle.ListedValue ?? 0);
                return (
                  <article key={vehicle.id} className="group overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-xl transition hover:-translate-y-1 hover:border-white/20">
                    <button onClick={() => openDetails(vehicle.id)} className="relative block h-56 w-full overflow-hidden bg-slate-950 text-left sm:h-52">
                      {photo ? <img src={photo} alt={`${vehicle.brand} ${vehicle.model}`} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /> : <div className="flex h-full items-center justify-center text-slate-600"><Car size={48} /></div>}
                      <span className="absolute left-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-black text-white" style={{ backgroundColor: accent }}>{vehicle.modelYear}</span>
                    </button>
                    <div className="space-y-4 p-4">
                      <div><p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: accent }}>{vehicle.brand}</p><h3 className="mt-0.5 line-clamp-2 text-base font-bold">{vehicle.model} {vehicle.version && <span className="font-normal text-slate-400">{vehicle.version}</span>}</h3></div>
                      <div className="grid grid-cols-2 gap-2 border-y border-white/5 py-3 text-[11px] text-slate-400">
                        <span className="flex items-center gap-1.5"><Gauge size={13} />{Number(vehicle.mileage || 0).toLocaleString('pt-BR')} km</span>
                        <span className="flex items-center gap-1.5"><Cog size={13} />{getTransmissionName(vehicle.transmission)}</span>
                        <span className="flex items-center gap-1.5"><Fuel size={13} />{getFuelName(vehicle.fuel)}</span>
                        <span className="flex items-center gap-1.5"><Calendar size={13} />{vehicle.manufacturingYear}/{vehicle.modelYear}</span>
                      </div>
                      <div className="flex items-end justify-between gap-2"><div><p className="text-[10px] uppercase text-slate-500">Preço</p><strong className="text-lg" style={{ color: accent }}>{price > 0 ? formatCurrency(price) : 'Consulte'}</strong></div><button onClick={() => openDetails(vehicle.id)} className="rounded-xl px-3 py-2 text-xs font-bold text-white" style={{ backgroundColor: accent }}>Detalhes</button></div>
                      {whatsapp && <button onClick={() => contactWhatsApp(vehicle)} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] px-3 py-2.5 text-xs font-bold text-white"><MessageCircle size={15} /> Falar no WhatsApp</button>}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}
      </main>

      <footer className="mt-8 border-t border-white/10 bg-slate-950/80">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-7 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <span>{store?.name || 'Loja'} • Catálogo de veículos</span>
          <span className="flex items-center gap-1"><MapPin size={13} /> Atendimento direto com a loja</span>
        </div>
      </footer>

      {selectedVehicle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/80 p-2 backdrop-blur-md sm:p-4">
          <div className="my-auto max-h-[96dvh] w-full max-w-5xl overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-2xl sm:max-h-[92dvh]">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 sm:px-6 sm:py-4">
              <div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: accent }}>{selectedVehicle.brand}</p><h2 className="truncate text-lg font-black sm:text-xl">{selectedVehicle.model} {selectedVehicle.version}</h2></div>
              <button onClick={() => setSelectedVehicle(null)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"><X size={20} /></button>
            </div>
            <div className="max-h-[calc(96dvh-60px)] overflow-y-auto p-4 sm:max-h-[calc(92dvh-72px)] sm:p-6">
              <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
                <div className="space-y-3">
                  <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-white/10 bg-slate-950">
                    {photos[photoIndex] ? <img src={photos[photoIndex]} alt={`${selectedVehicle.brand} ${selectedVehicle.model}`} className="h-full w-full object-contain" /> : <div className="flex h-full items-center justify-center text-slate-600"><Car size={64} /></div>}
                    {photos.length > 1 && <><button onClick={() => setPhotoIndex(i => i > 0 ? i - 1 : photos.length - 1)} className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-2 text-white"><ChevronLeft size={20} /></button><button onClick={() => setPhotoIndex(i => i < photos.length - 1 ? i + 1 : 0)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-2 text-white"><ChevronRight size={20} /></button></>}
                  </div>
                  {photos.length > 1 && <div className="flex gap-2 overflow-x-auto pb-1">{photos.map((p, i) => <button key={p + i} onClick={() => setPhotoIndex(i)} className={`h-14 w-20 shrink-0 overflow-hidden rounded-lg border-2 ${i === photoIndex ? 'border-[var(--store-accent)]' : 'border-transparent opacity-60'}`}><img src={p} alt="Miniatura" className="h-full w-full object-cover" /></button>)}</div>}
                </div>

                <div className="space-y-5">
                  <div><p className="text-xs text-slate-500">Preço</p><div className="text-3xl font-black" style={{ color: accent }}>{Number(selectedVehicle.listedValue) > 0 ? formatCurrency(Number(selectedVehicle.listedValue)) : 'Consulte'}</div></div>
                  <div className="grid grid-cols-2 gap-3 rounded-2xl border border-white/10 bg-slate-950 p-4 text-xs">
                    <div><span className="text-slate-500">Ano</span><p className="font-bold">{selectedVehicle.manufacturingYear}/{selectedVehicle.modelYear}</p></div>
                    <div><span className="text-slate-500">Km</span><p className="font-bold">{Number(selectedVehicle.mileage || 0).toLocaleString('pt-BR')}</p></div>
                    <div><span className="text-slate-500">Câmbio</span><p className="font-bold">{getTransmissionName(selectedVehicle.transmission)}</p></div>
                    <div><span className="text-slate-500">Combustível</span><p className="font-bold">{getFuelName(selectedVehicle.fuel)}</p></div>
                    <div><span className="text-slate-500">Cor</span><p className="font-bold">{selectedVehicle.color || 'Não informado'}</p></div>
                  </div>
                  {selectedVehicle.notes && <div><h3 className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider"><Sparkles size={14} style={{ color: accent }} /> Descrição</h3><p className="whitespace-pre-line rounded-2xl border border-white/10 bg-slate-950 p-4 text-xs leading-5 text-slate-300">{selectedVehicle.notes}</p></div>}
                  {selectedVehicle.documents?.length ? <div className="space-y-2"><h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider"><ShieldCheck size={14} className="text-emerald-400" /> Documentos disponíveis</h3>{selectedVehicle.documents.map(doc => { const url = getPhotoUrl(doc.fileUrl || doc.filePath); return <div key={doc.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-slate-950 p-3 text-xs"><span className="flex min-w-0 items-center gap-2"><FileText size={16} className="shrink-0 text-slate-400" /><span className="truncate">{doc.name || doc.documentType}</span></span>{url && <a href={url} target="_blank" rel="noreferrer" className="shrink-0 text-blue-400"><ExternalLink size={15} /></a>}</div>; })}</div> : null}
                  {whatsapp && <button onClick={() => contactWhatsApp()} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-3 text-sm font-bold text-white shadow-lg"><MessageCircle size={18} /> Falar sobre este veículo</button>}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
