import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import {
  Search, Gauge, Fuel, Cog, MessageCircle, X,
  ChevronLeft, ChevronRight, Car, FileText, ShieldCheck, Sparkles,
  ExternalLink, SlidersHorizontal, Heart, Menu, ArrowRight, Phone,
  CheckCircle2
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
  const [model, setModel] = useState('ALL');
  const [year, setYear] = useState('ALL');
  const [price, setPrice] = useState('ALL');
  const [sort, setSort] = useState('recent');
  const [showAdvanced, setShowAdvanced] = useState(false);
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
        if (!cancelled) { setStore(data.store); setVehicles(data.items); }
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Não foi possível carregar o catálogo desta loja.');
      } finally { if (!cancelled) setLoading(false); }
    };
    load();
    return () => { cancelled = true; };
  }, [storeSlug]);

  const brands = useMemo(() => Array.from(new Set(vehicles.map(v => v.brand).filter(Boolean))).sort(), [vehicles]);
  const models = useMemo(() => Array.from(new Set(vehicles.filter(v => brand === 'ALL' || (v.brand || '').toLowerCase() === brand.toLowerCase()).map(v => v.model).filter(Boolean))).sort(), [vehicles, brand]);
  const years = useMemo(() => Array.from(new Set(vehicles.map(v => String(v.modelYear || v.manufacturingYear || '')).filter(x => x !== ''))).sort((a,b) => Number(b)-Number(a)), [vehicles]);
  const filteredVehicles = useMemo(() => {
    const term = search.trim().toLowerCase();
    const result = vehicles.filter(v => {
      const matchesBrand = brand === 'ALL' || (v.brand || '').toLowerCase() === brand.toLowerCase();
      const matchesModel = model === 'ALL' || (v.model || '').toLowerCase() === model.toLowerCase();
      const matchesYear = year === 'ALL' || String(v.modelYear || v.manufacturingYear) === year;
      const amount = Number(v.listedValue ?? v.ListedValue ?? 0);
      const matchesPrice = price === 'ALL' || (price === 'under50' && amount > 0 && amount < 50000) || (price === '50to100' && amount >= 50000 && amount <= 100000) || (price === '100to150' && amount > 100000 && amount <= 150000) || (price === 'over150' && amount > 150000);
      if (!matchesBrand || !matchesModel || !matchesYear || !matchesPrice) return false;
      if (!term) return true;
      return [v.brand, v.model, v.version, v.color].some(value => String(value || '').toLowerCase().includes(term));
    });
    return [...result].sort((a,b) => sort === 'priceAsc'
      ? Number(a.listedValue ?? a.ListedValue ?? 0) - Number(b.listedValue ?? b.ListedValue ?? 0)
      : sort === 'priceDesc'
        ? Number(b.listedValue ?? b.ListedValue ?? 0) - Number(a.listedValue ?? a.ListedValue ?? 0)
        : new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  }, [vehicles, search, brand, model, year, price, sort]);

  const accent = store?.primaryColor || '#0878ed';
  const whatsapp = (store?.whatsappNumber || '').replace(/\D/g, '');
  const initials = (store?.name || 'LO').trim().split(/\s+/).slice(0, 2).map(x => x[0]).join('').toUpperCase();

  const getFuelName = (fuel?: number | string) => {
    if (typeof fuel === 'string') return ({ Gasolina: 'Gasolina', Etanol: 'Etanol', Flex: 'Flex', Diesel: 'Diesel', Hibrido: 'Híbrido', Híbrido: 'Híbrido', Eletrico: 'Elétrico', Elétrico: 'Elétrico' } as Record<string, string>)[fuel] || fuel;
    return ({ 1: 'Gasolina', 2: 'Etanol', 3: 'Flex', 4: 'Diesel', 5: 'Híbrido', 6: 'Elétrico' } as Record<number, string>)[fuel || 3] || 'Flex';
  };
  const getTransmissionName = (value?: number | string) => {
    if (typeof value === 'string') return ({ Manual: 'Manual', Automatico: 'Automático', Automático: 'Automático', CVT: 'CVT' } as Record<string, string>)[value] || value;
    return ({ 1: 'Manual', 2: 'Automático', 3: 'CVT' } as Record<number, string>)[value || 2] || 'Automático';
  };
  const openDetails = async (id: string) => {
    try { setPhotoIndex(0); setSelectedVehicle(await catalogService.getPublicVehicle(id, store?.slug || storeSlug)); }
    catch (e) { console.error('Erro ao carregar detalhes do veículo:', e); }
  };
  const contactWhatsApp = (vehicle?: any) => {
    const destination = (vehicle?.whatsappNumber || selectedVehicle?.whatsappNumber || whatsapp || '').replace(/\\D/g, '');
    if (!destination) return;
    const priceValue = Number(vehicle?.listedValue ?? vehicle?.ListedValue ?? selectedVehicle?.listedValue ?? 0);
    const name = vehicle ? `${vehicle.brand} ${vehicle.model} ${vehicle.modelYear || ''}` : `${selectedVehicle?.brand} ${selectedVehicle?.model}`;
    const message = `Olá! Vi no catálogo da ${store?.name || 'loja'} o veículo *${name.trim()}*${priceValue > 0 ? ` (${formatCurrency(priceValue)})` : ''} e gostaria de mais informações.`;
    window.open(`https://wa.me/${destination}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
  };
  const photos = selectedVehicle?.photos?.length ? selectedVehicle.photos.map(p => getPhotoUrl(p.storagePath || p.url)).filter(Boolean) : [getPhotoUrl(selectedVehicle?.mainPhotoUrl)].filter(Boolean);
  const resetFilters = () => { setSearch(''); setBrand('ALL'); setModel('ALL'); setYear('ALL'); setPrice('ALL'); setSort('recent'); };

  return (
    <div className="min-h-screen bg-[#f5f7fa] text-slate-900" style={{ '--store-accent': accent } as CSSProperties}>
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#031326] text-white shadow-lg">
        <div className="mx-auto flex min-h-[60px] max-w-[1600px] items-center justify-between gap-4 px-4 sm:px-8">
          <a href="#inicio" className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-12 shrink-0 items-center justify-center overflow-hidden">
              {store?.logoUrl ? <img src={getPhotoUrl(store.logoUrl)} alt={store.name} className="h-full w-full object-contain" /> : <span className="text-xl font-black tracking-tight">{initials}</span>}
            </div>
            <div className="min-w-0"><div className="truncate text-base font-black uppercase tracking-wide">{store?.name || 'Sua Loja'}</div><div className="text-[9px] font-semibold uppercase tracking-[.28em] text-slate-400">Veículos</div></div>
          </a>
          <nav className="hidden items-center gap-7 text-xs font-semibold lg:flex">
            <a href="#inicio" className="flex items-center gap-2 border-b-2 border-transparent py-5 text-slate-200 hover:text-white"><Car size={17}/> Início</a>
            <a href="#veiculos" className="flex items-center gap-2 border-b-2 py-5" style={{ color: '#ffc64a', borderColor: '#ffc64a' }}><Car size={17}/> Veículos</a>
            <a href="#veiculos" className="flex items-center gap-2 py-5 text-slate-200 hover:text-white"><FileText size={17}/> Financiamento</a>
            <a href="#rodape" className="flex items-center gap-2 py-5 text-slate-200 hover:text-white"><SlidersHorizontal size={17}/> Atendimento</a>
          </nav>
          <div className="flex items-center gap-3">
            {whatsapp && <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer" className="hidden items-center gap-2 rounded-lg bg-[#ffc64a] px-3 py-2 text-xs font-bold text-slate-950 sm:inline-flex"><Phone size={14}/> Fale conosco</a>}
            {onNavigate && <button onClick={() => onNavigate('dashboard')} className="rounded-lg border border-white/15 px-3 py-2 text-xs text-white">Voltar</button>}
            <button className="rounded-lg p-2 text-slate-200 lg:hidden" aria-label="Menu"><Menu size={21}/></button>
          </div>
        </div>
      </header>

      <main id="inicio">
        <section className="relative isolate min-h-[300px] overflow-hidden bg-[#061a2d] text-white sm:min-h-[330px] lg:min-h-[300px]">
          {(store?.heroImageUrl || vehicles[0]?.mainPhotoUrl) && <img src={getPhotoUrl(store?.heroImageUrl || vehicles[0]?.mainPhotoUrl)} alt="Imagem principal da loja" className="absolute inset-0 h-full w-full object-cover object-center"/>}
          <div className="absolute inset-0 bg-gradient-to-r from-[#020d19]/95 via-[#020d19]/75 to-[#020d19]/10"/>
          <div className="relative mx-auto flex min-h-[300px] max-w-[1600px] items-center px-5 py-9 sm:min-h-[330px] sm:px-8 lg:min-h-[300px]">
            <div className="max-w-2xl">
              <p className="mb-2 text-xs font-bold uppercase tracking-[.18em] text-white sm:text-sm">{store?.welcomeText?.trim() || `Bem-vindo à ${store?.name || 'sua loja'}`}</p>
              <h1 className="max-w-2xl text-3xl font-black leading-[1.08] tracking-tight sm:text-4xl lg:text-[42px]">{store?.heroTitle?.trim() || 'Seu próximo carro pode estar aqui.'}</h1>
              <p className="mt-3 max-w-xl text-xs leading-5 text-slate-200 sm:text-sm">Encontre o veículo ideal com praticidade, transparência e atendimento especializado.</p>
              <div className="mt-7 flex flex-wrap gap-4 text-[10px] font-semibold sm:gap-6 sm:text-xs">
                <div className="flex items-center gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-lg border border-amber-400 text-amber-300"><ShieldCheck size={17}/></span><span>Veículos<br/><b className="text-slate-300">selecionados</b></span></div>
                <div className="flex items-center gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-lg border border-amber-400 text-amber-300"><CheckCircle2 size={17}/></span><span>Atendimento<br/><b className="text-slate-300">especializado</b></span></div>
                <div className="flex items-center gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-lg border border-amber-400 text-amber-300"><MessageCircle size={17}/></span><span>Contato<br/><b className="text-slate-300">direto</b></span></div>
              </div>
            </div>
            <div className="absolute bottom-5 right-6 hidden items-center gap-3 rounded-xl border border-white/10 bg-[#06182b]/90 px-5 py-3 shadow-xl xl:flex"><Car className="text-amber-400" size={27}/><span className="text-xs font-semibold">{vehicles.length} veículos<br/><span className="text-slate-400">no estoque</span></span><ArrowRight className="text-amber-400" size={18}/></div>
          </div>
        </section>

        <div className="mx-auto max-w-[1500px] space-y-4 px-4 py-4 sm:px-8 sm:py-5">
          <section aria-label="Marcas disponíveis" className="flex items-center gap-3 overflow-x-auto rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
            <button onClick={() => {setBrand('ALL');setModel('ALL');}} className={`min-w-[135px] rounded-lg border px-3 py-2 text-left text-xs font-semibold ${brand === 'ALL' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600'}`}>Todas as marcas <span className="block pt-1 text-[10px] font-normal text-slate-400">{brands.length} marcas</span></button>
            {brands.map((b) => <button key={b} onClick={() => {setBrand(b);setModel('ALL');}} className={`flex min-w-[88px] flex-col items-center justify-center gap-1 rounded-lg border px-3 py-2 text-center ${brand === b ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-50'}`}><span className="flex h-7 items-center text-sm font-black tracking-tight">{b.length > 12 ? b.slice(0,11) : b}</span><span className="text-[9px] text-slate-400">{vehicles.filter(v => v.brand === b).length} veículos</span></button>)}
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
            <div className="grid gap-2 md:grid-cols-[1.2fr_1fr_1fr_auto]">
              <label className="text-[10px] font-medium text-slate-500">Modelo
                <select value={model} onChange={e=>setModel(e.target.value)} className="mt-1 block h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none focus:border-blue-500"><option value="ALL">Todos os modelos</option>{models.map(m=><option key={m} value={m}>{m}</option>)}</select>
              </label>
              <label className="text-[10px] font-medium text-slate-500">Ano
                <select value={year} onChange={e=>setYear(e.target.value)} className="mt-1 block h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none focus:border-blue-500"><option value="ALL">Todos os anos</option>{years.map(y=><option key={y} value={y}>{y}</option>)}</select>
              </label>
              <label className="text-[10px] font-medium text-slate-500">Preço
                <select value={price} onChange={e=>setPrice(e.target.value)} className="mt-1 block h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none focus:border-blue-500"><option value="ALL">Todos os preços</option><option value="under50">Até R$ 50 mil</option><option value="50to100">R$ 50 a 100 mil</option><option value="100to150">R$ 100 a 150 mil</option><option value="over150">Acima de R$ 150 mil</option></select>
              </label>
              <div className="flex items-end gap-2"><button onClick={()=>setShowAdvanced(v=>!v)} className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50"><SlidersHorizontal size={16}/> Filtros</button><button onClick={()=>document.getElementById('veiculos')?.scrollIntoView({behavior:'smooth'})} className="flex h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 text-xs font-bold text-white hover:bg-blue-700"><Search size={15}/> Buscar</button></div>
            </div>
            {showAdvanced && <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-3"><label className="text-[10px] font-medium text-slate-500">Busca livre<input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Marca, modelo, versão ou cor" className="mt-1 block h-9 min-w-[220px] rounded-lg border border-slate-200 px-3 text-xs text-slate-800 outline-none focus:border-blue-500"/></label><button onClick={resetFilters} className="mt-4 text-xs font-semibold text-blue-600 hover:underline">Limpar filtros</button></div>}
          </section>

          <section id="veiculos" className="scroll-mt-20">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <div><h2 className="flex items-center gap-2 text-lg font-black text-slate-900 sm:text-xl"><Car className="text-blue-600" size={23}/> Veículos em estoque</h2><p className="mt-1 text-xs text-slate-500">Confira nossa seleção de veículos disponíveis para pronta entrega.</p></div>
              <label className="flex items-center gap-2 text-[11px] font-semibold text-slate-700">Ordenar por:
                <select value={sort} onChange={e=>setSort(e.target.value)} className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-normal"><option value="recent">Mais recentes</option><option value="priceAsc">Menor preço</option><option value="priceDesc">Maior preço</option></select>
              </label>
            </div>
            {loading ? <div className="flex min-h-48 items-center justify-center text-sm text-slate-500">Carregando estoque...</div> : error ? <div className="rounded-xl border border-rose-200 bg-rose-50 p-8 text-center text-sm text-rose-700">{error}</div> : filteredVehicles.length === 0 ? <div className="rounded-xl border border-slate-200 bg-white p-12 text-center"><Car size={42} className="mx-auto mb-3 text-blue-500"/><h3 className="font-bold">Nenhum veículo encontrado</h3><p className="mt-1 text-sm text-slate-500">Ajuste os filtros para ver outros veículos.</p><button onClick={resetFilters} className="mt-3 text-xs font-bold text-blue-600">Limpar filtros</button></div> : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                {filteredVehicles.map((vehicle) => {
                  const photo=getPhotoUrl(vehicle.mainPhotoUrl||vehicle.MainPhotoUrl);
                  const amount=Number(vehicle.listedValue??vehicle.ListedValue??0);
                  return <article key={vehicle.id} className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
                    <button onClick={()=>openDetails(vehicle.id)} className="relative block h-40 w-full overflow-hidden bg-slate-100 text-left sm:h-32 lg:h-36">
                      {photo?<img src={photo} alt={`${vehicle.brand} ${vehicle.model}`} className="h-full w-full object-cover transition duration-500 group-hover:scale-105"/>:<div className="flex h-full items-center justify-center text-slate-400"><Car size={42}/></div>}
                      <span className="absolute left-2 top-2 rounded-full bg-blue-600 px-2.5 py-1 text-[9px] font-bold text-white">Disponível</span>
                      <span className="absolute right-2 top-2 rounded-full bg-black/40 p-1.5 text-white"><Heart size={14}/></span>
                    </button>
                    <div className="space-y-2.5 p-3">
                      <div><h3 className="truncate text-xs font-black text-slate-900">{vehicle.brand} {vehicle.model}</h3><p className="truncate text-[10px] text-slate-500">{vehicle.version||'Versão não informada'} · {vehicle.manufacturingYear||vehicle.modelYear}/{vehicle.modelYear}</p></div>
                      <div className="grid grid-cols-2 gap-y-1.5 border-t border-slate-100 pt-2 text-[9px] text-slate-500"><span className="flex items-center gap-1"><Fuel size={11}/>{getFuelName(vehicle.fuel)}</span><span className="flex items-center gap-1"><Cog size={11}/>{getTransmissionName(vehicle.transmission)}</span><span className="col-span-2 flex items-center gap-1"><Gauge size={11}/>{Number(vehicle.mileage||0).toLocaleString('pt-BR')} km</span></div>
                      <div className="border-t border-slate-100 pt-2"><p className="text-[9px] text-slate-500">Preço</p><strong className="text-base font-black text-slate-900">{amount>0?formatCurrency(amount):'Consulte'}</strong></div>
                      <div className="grid grid-cols-2 gap-1.5"><button onClick={()=>openDetails(vehicle.id)} className="flex items-center justify-center gap-1 rounded-md bg-[#061a32] px-2 py-2 text-[9px] font-bold text-white hover:bg-blue-900">Ver detalhes <ArrowRight size={11}/></button>{(vehicle.whatsappNumber || whatsapp)?<button onClick={()=>contactWhatsApp(vehicle)} className="flex items-center justify-center gap-1 rounded-md border border-blue-200 px-1.5 py-2 text-[9px] font-semibold text-blue-700 hover:bg-blue-50"><MessageCircle size={11}/> WhatsApp</button>:<button onClick={()=>openDetails(vehicle.id)} className="rounded-md border border-slate-200 px-1.5 py-2 text-[9px] font-semibold text-slate-700">Detalhes</button>}</div>
                    </div>
                  </article>;
                })}
              </div>
            )}
          </section>
        </div>
      </main>

      <footer id="rodape" className="mt-7 bg-[#031326] text-white">
        <div className="mx-auto grid max-w-[1500px] gap-5 px-5 py-6 sm:grid-cols-3 sm:px-8">
          <div className="flex items-center gap-3"><ShieldCheck className="text-blue-400" size={30}/><div><strong className="text-xs">Veículos selecionados</strong><p className="text-[10px] text-slate-400">Informações do estoque da loja.</p></div></div>
          <div className="flex items-center gap-3"><MessageCircle className="text-blue-400" size={30}/><div><strong className="text-xs">Atendimento especializado</strong><p className="text-[10px] text-slate-400">Nossa equipe está pronta para atender.</p></div></div>
          <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-3"><Phone className="text-blue-400" size={28}/><div><strong className="text-xs">Fale com a equipe</strong><p className="text-[10px] text-slate-400">Tire suas dúvidas sobre os veículos.</p></div></div>{whatsapp&&<a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer" className="rounded-lg bg-amber-400 px-3 py-2 text-[10px] font-black text-slate-950">Fale agora <ArrowRight size={12} className="inline"/></a>}</div>
        </div>
        <div className="border-t border-white/10 px-5 py-3 text-center text-[10px] text-slate-500">{store?.name||'Sua loja'} · Catálogo de veículos</div>
      </footer>

      {selectedVehicle && <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/80 p-2 backdrop-blur-sm sm:p-4">
        <div className="my-auto max-h-[96dvh] w-full max-w-5xl overflow-hidden rounded-2xl border border-white/10 bg-slate-900 text-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 sm:px-6"><div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-widest text-blue-400">{selectedVehicle.brand}</p><h2 className="truncate text-lg font-black">{selectedVehicle.model} {selectedVehicle.version}</h2></div><button onClick={()=>setSelectedVehicle(null)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"><X size={20}/></button></div>
          <div className="max-h-[calc(96dvh-60px)] overflow-y-auto p-4 sm:p-6"><div className="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
            <div className="space-y-3"><div className="relative aspect-[16/10] overflow-hidden rounded-xl border border-white/10 bg-slate-950">{photos[photoIndex]?<img src={photos[photoIndex]} alt={`${selectedVehicle.brand} ${selectedVehicle.model}`} className="h-full w-full object-contain"/>:<div className="flex h-full items-center justify-center"><Car size={60}/></div>}{photos.length>1&&<><button onClick={()=>setPhotoIndex(i=>i>0?i-1:photos.length-1)} className="absolute left-3 top-1/2 rounded-full bg-black/60 p-2"><ChevronLeft size={20}/></button><button onClick={()=>setPhotoIndex(i=>i<photos.length-1?i+1:0)} className="absolute right-3 top-1/2 rounded-full bg-black/60 p-2"><ChevronRight size={20}/></button></>}</div>{photos.length>1&&<div className="flex gap-2 overflow-x-auto">{photos.map((p,i)=><button key={p+i} onClick={()=>setPhotoIndex(i)} className={`h-14 w-20 shrink-0 overflow-hidden rounded-lg border-2 ${i===photoIndex?'border-blue-500':'border-transparent opacity-60'}`}><img src={p} alt="Miniatura" className="h-full w-full object-cover"/></button>)}</div>}</div>
            <div className="space-y-5"><div><p className="text-xs text-slate-500">Preço</p><div className="text-3xl font-black text-blue-400">{Number(selectedVehicle.listedValue)>0?formatCurrency(Number(selectedVehicle.listedValue)):'Consulte'}</div></div><div className="grid grid-cols-2 gap-3 rounded-xl border border-white/10 bg-slate-950 p-4 text-xs"><div><span className="text-slate-500">Ano</span><p className="font-bold">{selectedVehicle.manufacturingYear}/{selectedVehicle.modelYear}</p></div><div><span className="text-slate-500">Km</span><p className="font-bold">{Number(selectedVehicle.mileage||0).toLocaleString('pt-BR')}</p></div><div><span className="text-slate-500">Câmbio</span><p className="font-bold">{getTransmissionName(selectedVehicle.transmission)}</p></div><div><span className="text-slate-500">Combustível</span><p className="font-bold">{getFuelName(selectedVehicle.fuel)}</p></div><div><span className="text-slate-500">Cor</span><p className="font-bold">{selectedVehicle.color||'Não informado'}</p></div></div>{selectedVehicle.notes&&<div><h3 className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider"><Sparkles size={14}/>Descrição</h3><p className="whitespace-pre-line rounded-xl border border-white/10 bg-slate-950 p-4 text-xs leading-5 text-slate-300">{selectedVehicle.notes}</p></div>}{selectedVehicle.documents?.length? <div className="space-y-2"><h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider"><ShieldCheck size={14}/>Documentos disponíveis</h3>{selectedVehicle.documents.map(doc=>{const url=getPhotoUrl(doc.fileUrl||doc.filePath);return <div key={doc.id} className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-slate-950 p-3 text-xs"><span className="flex min-w-0 items-center gap-2"><FileText size={16}/><span className="truncate">{doc.name||doc.documentType}</span></span>{url&&<a href={url} target="_blank" rel="noreferrer" className="text-blue-400"><ExternalLink size={15}/></a>}</div>})}</div>:null}{(selectedVehicle.whatsappNumber || whatsapp)&&<button onClick={()=>contactWhatsApp()} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-3 text-sm font-bold text-white"><MessageCircle size={18}/>Falar sobre este veículo</button>}</div>
          </div></div>
        </div>
      </div>}
    </div>
  );
}
