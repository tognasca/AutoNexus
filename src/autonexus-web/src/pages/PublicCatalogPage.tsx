import { useEffect, useState } from 'react';
import {
    Search, Calendar, Gauge, Fuel, Cog, MessageCircle,
    X, ChevronLeft, ChevronRight, ShieldCheck,
    Car, FileText, Sparkles, ExternalLink
} from 'lucide-react';
import { catalogService, getPhotoUrl, type PublicVehicleDetail } from '../services/catalogService';
import { formatCurrency } from '../utils/formatters';

export function PublicCatalogPage({ onNavigate }: { currentView?: string; onNavigate?: (view: string) => void }) {
    const [vehicles, setVehicles] = useState<any[]>([]);
    const [filteredVehicles, setFilteredVehicles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedBrand, setSelectedBrand] = useState('ALL');

    // Modal de Detalhes
    const [selectedVehicle, setSelectedVehicle] = useState<PublicVehicleDetail | null>(null);
    const [activePhotoIndex, setActivePhotoIndex] = useState(0);

    const WHATSAPP_NUMBER = "5511999999999";

    useEffect(() => {
        fetchCatalog();
    }, []);''

    useEffect(() => {
        let result = vehicles;

        if (selectedBrand !== 'ALL') {
            result = result.filter(v => (v.brand || '').toLowerCase() === selectedBrand.toLowerCase());
        }

        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            result = result.filter(v =>
                (v.brand || '').toLowerCase().includes(term) ||
                (v.model || '').toLowerCase().includes(term) ||
                (v.version || '').toLowerCase().includes(term)
            );
        }

        setFilteredVehicles(result);
    }, [searchTerm, selectedBrand, vehicles]);

    const fetchCatalog = async () => {
        try {
            setLoading(true);
            const data = await catalogService.getPublicCatalog();
            setVehicles(data);
            setFilteredVehicles(data);
        } catch (err) {
            console.error('Erro ao carregar catálogo público:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDetails = async (vehicleId: string) => {
        try {
            setActivePhotoIndex(0);
            const detail = await catalogService.getPublicVehicle(vehicleId);
            setSelectedVehicle(detail);
        } catch (err) {
            console.error('Erro ao buscar detalhes do veículo:', err);
        }
    };

    const getFuelName = (fuel?: number) => {
        switch (fuel) {
            case 1: return 'Gasolina';
            case 2: return 'Etanol';
            case 3: return 'Flex';
            case 4: return 'Diesel';
            case 5: return 'Híbrido';
            case 6: return 'Elétrico';
            default: return 'Flex';
        }
    };

    const getTransmissionName = (transmission?: number) => {
        switch (transmission) {
            case 1: return 'Manual';
            case 2: return 'Automático';
            case 3: return 'CVT';
            default: return 'Automático';
        }
    };

    const handleWhatsAppContact = (vehicle: any) => {
        const price = vehicle.listedValue || vehicle.ListedValue || vehicle.purchaseValue || vehicle.PurchaseValue || 0;
        const text = `Olá! Vi no catálogo o veículo *${vehicle.brand} ${vehicle.model} ${vehicle.modelYear || ''}* no valor de ${formatCurrency(price)} e gostaria de mais informações!`;
        window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`, '_blank');
    };

    const uniqueBrands = Array.from(new Set(vehicles.map(v => v.brand).filter(Boolean)));

    // Lista de fotos do veículo selecionado
    const vehiclePhotos = selectedVehicle?.photos && selectedVehicle.photos.length > 0
        ? selectedVehicle.photos.map(p => getPhotoUrl(p.storagePath || p.url))
        : [getPhotoUrl(selectedVehicle?.mainPhotoUrl)];

    return (
        <div className="min-h-screen bg-[#0B0F19] text-white">

            {/* Header Superior */}
            <header className="bg-nexus-card border-b border-nexus-border sticky top-0 z-40 shadow-xl">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-nexus-accent rounded-xl flex items-center justify-center font-black text-xl text-white shadow-lg shadow-blue-500/30">
                            AN
                        </div>
                        <div>
                            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400">
                                AutoNexus Motors
                            </h1>
                            <p className="text-xs text-slate-400">Catálogo Oficial de Veículos</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {onNavigate && (
                            <button
                                onClick={() => onNavigate('dashboard')}
                                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                            >
                                Voltar ao Painel
                            </button>
                        )}
                        <a
                            href={`https://wa.me/${WHATSAPP_NUMBER}`}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white px-4 py-2 rounded-full font-bold text-xs transition-all shadow-lg shadow-emerald-900/30 cursor-pointer"
                        >
                            <MessageCircle size={16} />
                            <span>WhatsApp</span>
                        </a>
                    </div>
                </div>
            </header>

            {/* Conteúdo do Catálogo */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

                {/* Filtros e Busca */}
                <div className="bg-gradient-to-r from-slate-900 via-nexus-card to-slate-900 border border-nexus-border rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
                    <div className="relative z-10 max-w-3xl space-y-4">
                        <h2 className="text-2xl sm:text-4xl font-extrabold text-white leading-tight">
                            Encontre o veículo ideal para a sua garagem
                        </h2>

                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2">
                            <div className="sm:col-span-8 relative">
                                <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Busque por marca, modelo ou versão..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full bg-slate-950 border border-nexus-border rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-nexus-accent"
                                />
                            </div>

                            <div className="sm:col-span-4">
                                <select
                                    value={selectedBrand}
                                    onChange={(e) => setSelectedBrand(e.target.value)}
                                    className="w-full bg-slate-950 border border-nexus-border rounded-xl px-3 py-3 text-sm text-white focus:outline-none focus:border-nexus-accent cursor-pointer"
                                >
                                    <option value="ALL">Todas as Marcas ({vehicles.length})</option>
                                    {uniqueBrands.map(b => (
                                        <option key={b} value={b}>{b}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Listagem de Veículos */}
                {loading ? (
                    <div className="p-20 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
                        <div className="w-8 h-8 border-4 border-nexus-accent border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-sm font-medium">Carregando estoque atualizado...</p>
                    </div>
                ) : filteredVehicles.length === 0 ? (
                    <div className="bg-nexus-card border border-nexus-border rounded-2xl p-12 text-center text-slate-400">
                        <Car size={48} className="mx-auto mb-3 opacity-30 text-nexus-accent" />
                        <h3 className="text-lg font-bold text-white">Nenhum veículo encontrado</h3>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredVehicles.map((vehicle) => {
                            const photoPath = vehicle.mainPhotoUrl || vehicle.MainPhotoUrl;
                            const photoFullUrl = getPhotoUrl(photoPath);
                            const price = Number(vehicle.listedValue ?? vehicle.ListedValue ?? vehicle.purchaseValue ?? vehicle.PurchaseValue ?? 0);

                            return (
                                <div
                                    key={vehicle.id}
                                    className="bg-nexus-card border border-nexus-border rounded-2xl overflow-hidden hover:border-nexus-accent/50 transition-all duration-300 flex flex-col group shadow-lg"
                                >
                                    {/* Foto da Vitrine */}
                                    <div className="relative h-48 bg-slate-950 overflow-hidden cursor-pointer" onClick={() => handleOpenDetails(vehicle.id)}>
                                        {photoPath ? (
                                            <img
                                                src={photoFullUrl}
                                                alt={`${vehicle.brand} ${vehicle.model}`}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                onError={(e) => {
                                                    // Tratamento se a foto não for encontrada no disco
                                                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80';
                                                }}
                                            />
                                        ) : (
                                            <div className="w-full h-full flex flex-col items-center justify-center text-slate-600">
                                                <Car size={40} className="mb-1 stroke-[1.5]" />
                                                <span className="text-[10px] uppercase tracking-wider font-semibold">Sem foto cadastrada</span>
                                            </div>
                                        )}

                                        <div className="absolute top-3 left-3 bg-nexus-accent text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow-md">
                                            {vehicle.modelYear}
                                        </div>
                                    </div>

                                    {/* Informações do Veículo */}
                                    <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                                        <div>
                                            <span className="text-[10px] font-bold tracking-wider uppercase text-nexus-accent block mb-0.5">
                                                {vehicle.brand}
                                            </span>
                                            <h3 className="text-base font-bold text-white leading-tight line-clamp-1">
                                                {vehicle.model} {vehicle.version && <span className="font-normal text-slate-400 text-xs">{vehicle.version}</span>}
                                            </h3>

                                            <div className="grid grid-cols-2 gap-2 text-xs text-slate-400 mt-3 pt-3 border-t border-nexus-border/60">
                                                <div className="flex items-center gap-1.5">
                                                    <Gauge size={14} className="text-slate-500" />
                                                    <span>{Number(vehicle.mileage || 0).toLocaleString('pt-BR')} km</span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <Cog size={14} className="text-slate-500" />
                                                    <span>{getTransmissionName(vehicle.transmission)}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <Fuel size={14} className="text-slate-500" />
                                                    <span>{getFuelName(vehicle.fuel)}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <Calendar size={14} className="text-slate-500" />
                                                    <span>{vehicle.manufacturingYear}/{vehicle.modelYear}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pt-3 border-t border-nexus-border space-y-3">
                                            <div className="flex items-baseline justify-between">
                                                <span className="text-[10px] text-slate-500 uppercase font-medium">Preço</span>
                                                <span className="text-lg font-extrabold text-emerald-400">
                                                    {formatCurrency(price)}
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-2 gap-2">
                                                <button
                                                    onClick={() => handleOpenDetails(vehicle.id)}
                                                    className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                                                >
                                                    <FileText size={14} />
                                                    Detalhes
                                                </button>

                                                <button
                                                    onClick={() => handleWhatsAppContact(vehicle)}
                                                    className="py-2.5 px-3 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer shadow-md"
                                                >
                                                    <MessageCircle size={14} />
                                                    WhatsApp
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>

            {/* MODAL DE DETALHES COM GALERIA DE FOTOS E DOCUMENTOS REAIS */}
            {selectedVehicle && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-nexus-card border border-nexus-border rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl my-8">

                        <div className="flex items-center justify-between px-6 py-4 border-b border-nexus-border">
                            <div>
                                <span className="text-xs font-bold text-nexus-accent uppercase tracking-wider">{selectedVehicle.brand}</span>
                                <h2 className="text-xl font-bold text-white">{selectedVehicle.model} {selectedVehicle.version}</h2>
                            </div>
                            <button
                                onClick={() => setSelectedVehicle(null)}
                                className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">

                            {/* GALERIA DE FOTOS */}
                            <div className="space-y-3">
                                <div className="relative aspect-[16/9] bg-slate-950 rounded-2xl overflow-hidden border border-nexus-border flex items-center justify-center">
                                    {vehiclePhotos[activePhotoIndex] ? (
                                        <img
                                            src={vehiclePhotos[activePhotoIndex]}
                                            alt={`${selectedVehicle.brand} ${selectedVehicle.model}`}
                                            className="w-full h-full object-contain"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80';
                                            }}
                                        />
                                    ) : (
                                        <div className="flex flex-col items-center justify-center text-slate-600">
                                            <Car size={64} className="mb-2" />
                                            <p className="text-xs">Sem foto disponível</p>
                                        </div>
                                    )}

                                    {vehiclePhotos.length > 1 && (
                                        <>
                                            <button
                                                onClick={() => setActivePhotoIndex((prev) => (prev > 0 ? prev - 1 : vehiclePhotos.length - 1))}
                                                className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-black/60 hover:bg-black/90 text-white rounded-full backdrop-blur-md transition-colors cursor-pointer"
                                            >
                                                <ChevronLeft size={20} />
                                            </button>
                                            <button
                                                onClick={() => setActivePhotoIndex((prev) => (prev < vehiclePhotos.length - 1 ? prev + 1 : 0))}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-black/60 hover:bg-black/90 text-white rounded-full backdrop-blur-md transition-colors cursor-pointer"
                                            >
                                                <ChevronRight size={20} />
                                            </button>
                                        </>
                                    )}
                                </div>

                                {vehiclePhotos.length > 1 && (
                                    <div className="flex items-center gap-2 overflow-x-auto pb-2">
                                        {vehiclePhotos.map((photoUrl, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => setActivePhotoIndex(idx)}
                                                className={`w-20 h-14 rounded-lg overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${activePhotoIndex === idx ? 'border-nexus-accent scale-105 shadow-md' : 'border-slate-800 opacity-60 hover:opacity-100'
                                                    }`}
                                            >
                                                <img src={photoUrl} alt="Thumbnail" className="w-full h-full object-cover" />
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* SEÇÃO DE DOCUMENTOS E LAUDOS CADASTRADOS (APENAS SE EXISTIREM DOCUMENTOS MARCADOS COM SHOW_IN_CATALOG = TRUE) */}
                            {selectedVehicle.documents && selectedVehicle.documents.filter((d: any) => d.showInCatalog !== false).length > 0 && (
                                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-3">
                                    <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                                        <ShieldCheck size={16} className="text-emerald-400" />
                                        Laudos e Documentação Aprovada deste Veículo
                                    </h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-300">
                                        {selectedVehicle.documents.filter((d: any) => d.showInCatalog !== false).map((doc: any, idx: number) => {
                                            const docUrl = getPhotoUrl(doc.fileUrl || doc.filePath || doc.storagePath);
                                            return (
                                                <div key={doc.id || idx} className="flex items-center justify-between bg-slate-950 p-3 rounded-xl border border-slate-800">
                                                    <div className="flex items-center gap-2.5">
                                                        <FileText size={18} className="text-blue-400 shrink-0" />
                                                        <div>
                                                            <p className="font-bold text-white">{doc.name || doc.documentType}</p>
                                                            <p className="text-[10px] text-emerald-400">✅ Verificado e Aprovado</p>
                                                        </div>
                                                    </div>
                                                    {docUrl && (
                                                        <a
                                                            href={docUrl}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                                                        >
                                                            <span>Visualizar</span>
                                                            <ExternalLink size={12} />
                                                        </a>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Ficha Técnica */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950 p-4 rounded-2xl border border-nexus-border">
                                <div>
                                    <span className="text-[10px] text-slate-500 uppercase font-semibold block">Ano Fab./Mod.</span>
                                    <span className="text-sm font-bold text-white">{selectedVehicle.manufacturingYear}/{selectedVehicle.modelYear}</span>
                                </div>
                                <div>
                                    <span className="text-[10px] text-slate-500 uppercase font-semibold block">Quilometragem</span>
                                    <span className="text-sm font-bold text-white">{Number(selectedVehicle.mileage || 0).toLocaleString('pt-BR')} km</span>
                                </div>
                                <div>
                                    <span className="text-[10px] text-slate-500 uppercase font-semibold block">Câmbio</span>
                                    <span className="text-sm font-bold text-white">{getTransmissionName(selectedVehicle.transmission)}</span>
                                </div>
                                <div>
                                    <span className="text-[10px] text-slate-500 uppercase font-semibold block">Combustível</span>
                                    <span className="text-sm font-bold text-white">{getFuelName(selectedVehicle.fuel)}</span>
                                </div>
                            </div>

                            {/* Descrição */}
                            {selectedVehicle.notes && (
                                <div className="space-y-2">
                                    <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                                        <Sparkles size={14} className="text-amber-400" />
                                        Descrição do Veículo
                                    </h4>
                                    <div className="bg-slate-950 border border-nexus-border rounded-2xl p-4 text-xs text-slate-300 whitespace-pre-line leading-relaxed">
                                        {selectedVehicle.notes}
                                    </div>
                                </div>
                            )}

                            {/* Rodapé do Modal */}
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-nexus-border">
                                <div>
                                    <span className="text-xs text-slate-400 block">Preço do Veículo</span>
                                    <span className="text-2xl font-black text-emerald-400">
                                        {formatCurrency(Number(selectedVehicle.listedValue || selectedVehicle.purchaseValue || 0))}
                                    </span>
                                </div>

                                <button
                                    onClick={() => handleWhatsAppContact(selectedVehicle)}
                                    className="w-full sm:w-auto px-6 py-3 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold rounded-xl text-sm transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                                >
                                    <MessageCircle size={18} />
                                    Falar sobre este Veículo
                                </button>
                            </div>

                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}