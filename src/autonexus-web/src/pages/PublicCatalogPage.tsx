import { useEffect, useState } from 'react';
import { Search, Calendar, Gauge, Fuel, Cog, MessageCircle, AlertCircle } from 'lucide-react';
import { catalogService } from '../services/catalogService';
import type { VehicleSummary } from '../types/vehicle';
import { FuelType, TransmissionType } from '../types/vehicle';

export function PublicCatalogPage() {
    const [vehicles, setVehicles] = useState<VehicleSummary[]>([]);
    const [filteredVehicles, setFilteredVehicles] = useState<VehicleSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Número de WhatsApp da Loja (Substitua pelo número real da sua loja)
    const WHATSAPP_NUMBER = "5511999999999";

    useEffect(() => {
        fetchCatalog();
    }, []);

    useEffect(() => {
        // Filtro local simples por busca textual (Marca ou Modelo)
        if (!searchTerm) {
            setFilteredVehicles(vehicles);
        } else {
            const lowerTerm = searchTerm.toLowerCase();
            const filtered = vehicles.filter(v =>
                v.brand.toLowerCase().includes(lowerTerm) ||
                v.model.toLowerCase().includes(lowerTerm) ||
                (v.version && v.version.toLowerCase().includes(lowerTerm))
            );
            setFilteredVehicles(filtered);
        }
    }, [searchTerm, vehicles]);

    const fetchCatalog = async () => {
        try {
            setLoading(true);
            // O serviço usa o endpoint /api/public/catalog
            const data = await catalogService.getPublicCatalog();
            // data já retorna apenas veículos com status "AVenda" do backend
            setVehicles(data as unknown as VehicleSummary[]);
        } catch (err) {
            setError('Não foi possível carregar o catálogo no momento. Tente novamente mais tarde.');
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    const getFuelName = (fuel?: FuelType) => {
        switch (fuel) {
            case FuelType.Gasolina: return 'Gasolina';
            case FuelType.Etanol: return 'Etanol';
            case FuelType.Flex: return 'Flex';
            case FuelType.Diesel: return 'Diesel';
            case FuelType.Hibrido: return 'Híbrido';
            case FuelType.Eletrico: return 'Elétrico';
            default: return 'Não informado';
        }
    };

    const getTransmissionName = (transmission?: TransmissionType) => {
        switch (transmission) {
            case TransmissionType.Manual: return 'Manual';
            case TransmissionType.Automatico: return 'Automático';
            case TransmissionType.CVT: return 'CVT';
            default: return 'Não informado';
        }
    };

    const handleWhatsAppClick = (vehicle: VehicleSummary) => {
        const text = `Olá! Vi o ${vehicle.brand} ${vehicle.model} ${vehicle.modelYear} no catálogo e gostaria de mais informações.`;
        const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
        window.open(url, '_blank');
    };

    return (
        // <MainLayout currentView={currentView} onNavigate={onNavigate}>
            <div className="min-h-screen bg-[#0B0F19] text-white">
                {/* Header Público */}
                <header className="bg-nexus-card border-b border-nexus-border sticky top-0 z-50">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-nexus-accent rounded-xl flex items-center justify-center">
                                <span className="text-xl font-black text-white">AN</span>
                            </div>
                            <div>
                                <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                                    AutoNexus Motors
                                </h1>
                                <p className="text-xs text-slate-400 font-medium">Catálogo Oficial</p>
                            </div>
                        </div>
                        <a
                            href={`https://wa.me/${WHATSAPP_NUMBER}`}
                            target="_blank"
                            rel="noreferrer"
                            className="hidden sm:flex items-center gap-2 bg-[#25D366]/10 text-[#25D366] px-4 py-2 rounded-full font-medium text-sm hover:bg-[#25D366]/20 transition-colors"
                        >
                            <MessageCircle size={18} />
                            Fale Conosco
                        </a>
                    </div>
                </header>

                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Barra de Busca */}
                    <div className="mb-10">
                        <div className="relative max-w-2xl mx-auto">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Search className="h-5 w-5 text-slate-400" />
                            </div>
                            <input
                                type="text"
                                placeholder="Busque por marca ou modelo... (Ex: Honda Civic)"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="block w-full pl-12 pr-4 py-4 bg-nexus-card border border-nexus-border rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:border-nexus-accent focus:ring-1 focus:ring-nexus-accent shadow-lg transition-all"
                            />
                        </div>
                    </div>

                    {/* Estados de Carregamento e Erro */}
                    {loading && (
                        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                            <div className="w-10 h-10 border-4 border-nexus-accent border-t-transparent rounded-full animate-spin mb-4"></div>
                            <p>Carregando veículos...</p>
                        </div>
                    )}

                    {error && (
                        <div className="flex flex-col items-center justify-center py-20 text-red-400">
                            <AlertCircle size={48} className="mb-4 opacity-50" />
                            <p>{error}</p>
                        </div>
                    )}

                    {!loading && !error && filteredVehicles.length === 0 && (
                        <div className="text-center py-20">
                            <h3 className="text-xl font-medium text-slate-300">Nenhum veículo encontrado</h3>
                            <p className="text-slate-500 mt-2">Tente buscar por outro modelo ou marca.</p>
                        </div>
                    )}

                    {/* Grid de Veículos */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredVehicles.map((vehicle) => (
                            <div key={vehicle.id} className="bg-nexus-card border border-nexus-border rounded-2xl overflow-hidden hover:border-nexus-accent/50 transition-colors group flex flex-col">

                                {/* Foto do Veículo */}
                                <div className="aspect-[4/3] bg-nexus-dark relative overflow-hidden">
                                    {vehicle.mainPhotoUrl ? (
                                        <img
                                            src={vehicle.mainPhotoUrl}
                                            alt={`${vehicle.brand} ${vehicle.model}`}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-500">
                                            <span className="text-4xl font-bold opacity-10 uppercase tracking-widest">{vehicle.brand}</span>
                                            <span className="text-sm font-medium mt-2">Sem foto disponível</span>
                                        </div>
                                    )}
                                    <div className="absolute top-3 left-3 bg-nexus-accent text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                                        {vehicle.modelYear}
                                    </div>
                                </div>

                                {/* Detalhes do Veículo */}
                                <div className="p-5 flex-1 flex flex-col">
                                    <div className="mb-4">
                                        <h3 className="text-lg font-bold text-white leading-tight mb-1 truncate">
                                            {vehicle.brand} {vehicle.model}
                                        </h3>
                                        {vehicle.version && (
                                            <p className="text-sm text-slate-400 truncate">{vehicle.version}</p>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 gap-y-3 gap-x-2 mb-6">
                                        <div className="flex items-center gap-1.5 text-slate-300 text-sm">
                                            <Gauge size={16} className="text-slate-500" />
                                            <span>{vehicle.mileage.toLocaleString('pt-BR')} km</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-slate-300 text-sm">
                                            <Cog size={16} className="text-slate-500" />
                                            <span>{getTransmissionName(vehicle.transmission as TransmissionType)}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-slate-300 text-sm">
                                            <Fuel size={16} className="text-slate-500" />
                                            <span>{getFuelName(vehicle.fuel as FuelType)}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-slate-300 text-sm">
                                            <Calendar size={16} className="text-slate-500" />
                                            <span>{vehicle.manufacturingYear}/{vehicle.modelYear}</span>
                                        </div>
                                    </div>

                                    <div className="mt-auto">
                                        <div className="text-2xl font-bold text-white mb-4">
                                            {formatCurrency(vehicle.ListedValue || 0)}
                                        </div>

                                        <button
                                            onClick={() => handleWhatsAppClick(vehicle)}
                                            className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
                                        >
                                            <MessageCircle size={20} />
                                            Tenho Interesse
                                        </button>
                                    </div>
                                </div>

                            </div>
                        ))}
                    </div>
                </main>
            </div>
        // </MainLayout>
    );
}