import { useState, useEffect } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import { VehicleCard } from '../components/vehicles/VehicleCard';
import { VehicleFilters } from '../components/vehicles/VehicleFilters';
import { VehicleModal } from '../components/vehicles/VehicleModal';
import { VehiclePhotosModal } from '../components/vehicles/VehiclePhotosModal';
import { VehicleCostsModal } from '../components/vehicles/VehicleCostsModal';
import { VehicleFipeModal } from '../components/vehicles/VehicleFipeModal';
import { VehicleDocumentsModal } from '../components/vehicles/VehicleDocumentsModal';
import { VehicleSaleModal } from '../components/vehicles/VehicleSaleModal';
import { TradeNegotiationModal } from '../components/vehicles/TradeNegotiationModal';
import { vehicleService } from '../services/vehicleService';
import { lookupService } from '../services/lookupService';
import { VehicleStatus, type VehicleSummary, type CreateVehicleInput } from '../types/vehicle';
import type { LookupItem } from '../types/lookup';
import { Plus, Loader2 } from 'lucide-react';

export function VehiclesPage({ currentView, onNavigate }: { currentView?: string; onNavigate?: (view: string) => void }) {
  const [vehicles, setVehicles] = useState<VehicleSummary[]>([]);
  const [vehicleTypes, setVehicleTypes] = useState<LookupItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Modais
  const [selectedVehicleForPhotos, setSelectedVehicleForPhotos] = useState<VehicleSummary | null>(null);
  const [isPhotosModalOpen, setIsPhotosModalOpen] = useState(false);

  const [selectedVehicleForCosts, setSelectedVehicleForCosts] = useState<VehicleSummary | null>(null);
  const [isCostsModalOpen, setIsCostsModalOpen] = useState(false);

  const [selectedVehicleForFipe, setSelectedVehicleForFipe] = useState<VehicleSummary | null>(null);
  const [isFipeModalOpen, setIsFipeModalOpen] = useState(false);

  const [selectedVehicleForDocs, setSelectedVehicleForDocs] = useState<VehicleSummary | null>(null);
  const [isDocsModalOpen, setIsDocsModalOpen] = useState(false);

  const [selectedVehicleForSale, setSelectedVehicleForSale] = useState<VehicleSummary | null>(null);
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);

  const [selectedVehicleForTrade, setSelectedVehicleForTrade] = useState<VehicleSummary | null>(null);
  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);

  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<string | undefined>();
  const [selectedStatus, setSelectedStatus] = useState<VehicleStatus | undefined>();

  const loadData = async () => {
    try {
      setLoading(true);
      const [typesRes, vehiclesRes] = await Promise.all([
        lookupService.getVehicleTypes(),
        vehicleService.getAll({
          search,
          vehicleTypeId: selectedType,
          status: selectedStatus,
        }),
      ]);
      setVehicleTypes(typesRes);
      setVehicles(vehiclesRes.items);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search, selectedType, selectedStatus]);

  const handleCreateVehicle = async (data: CreateVehicleInput) => {
    await vehicleService.create(data);
  };

  const handleDeleteVehicle = async (vehicle: VehicleSummary) => {
    try {
      await vehicleService.delete(vehicle.id);
      await loadData();
    } catch (err) {
      alert('Erro ao excluir o veículo do estoque.');
    }
  };

  return (
    <MainLayout currentView={currentView} onNavigate={onNavigate}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white">Estoque de Veículos</h1>
          <p className="text-xs md:text-sm text-slate-400">Gerencie todos os veículos cadastrados no sistema.</p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-nexus-accent hover:bg-nexus-accent-hover text-white px-4 py-2.5 rounded-lg text-sm font-semibold shadow-lg shadow-blue-500/20 transition-all active:scale-95 cursor-pointer"
        >
          <Plus size={18} />
          Cadastrar Veículo
        </button>
      </div>

      <VehicleFilters
        vehicleTypes={vehicleTypes}
        selectedType={selectedType}
        selectedStatus={selectedStatus}
        search={search}
        onTypeChange={setSelectedType}
        onStatusChange={setSelectedStatus}
        onSearchChange={setSearch}
      />

      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 text-slate-500 gap-3">
          <Loader2 className="animate-spin text-nexus-accent" size={32} />
          <span className="text-sm">Carregando estoque...</span>
        </div>
      ) : vehicles.length === 0 ? (
        <div className="bg-nexus-card border border-nexus-border rounded-xl p-12 text-center">
          <p className="text-slate-400 text-base mb-4">Nenhum veículo encontrado com os filtros atuais.</p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 bg-nexus-border hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer"
          >
            <Plus size={16} />
            Cadastrar o primeiro veículo
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {vehicles.map((v) => (
            <VehicleCard
              key={v.id}
              vehicle={v}
              onManagePhotos={(veh) => { setSelectedVehicleForPhotos(veh); setIsPhotosModalOpen(true); }}
              onManageCosts={(veh) => { setSelectedVehicleForCosts(veh); setIsCostsModalOpen(true); }}
              onManageFipe={(veh) => { setSelectedVehicleForFipe(veh); setIsFipeModalOpen(true); }}
              onManageDocuments={(veh) => { setSelectedVehicleForDocs(veh); setIsDocsModalOpen(true); }}
              onSellVehicle={(veh) => { setSelectedVehicleForSale(veh); setIsSaleModalOpen(true); }}
              onTradeVehicle={(veh) => { setSelectedVehicleForTrade(veh); setIsTradeModalOpen(true); }}
              onDeleteVehicle={handleDeleteVehicle}
            />
          ))}
        </div>
      )}

      {/* Modais */}
      {vehicleTypes.length > 0 && (
        <VehicleModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={loadData}
          vehicleTypes={vehicleTypes}
          onCreate={handleCreateVehicle}
        />
      )}

      <VehiclePhotosModal
        isOpen={isPhotosModalOpen}
        vehicle={selectedVehicleForPhotos}
        onClose={() => setIsPhotosModalOpen(false)}
        onPhotosUpdated={loadData}
      />

      <VehicleCostsModal
        isOpen={isCostsModalOpen}
        vehicle={selectedVehicleForCosts}
        onClose={() => setIsCostsModalOpen(false)}
        onCostsUpdated={loadData}
      />

      <VehicleFipeModal
        isOpen={isFipeModalOpen}
        vehicle={selectedVehicleForFipe}
        onClose={() => setIsFipeModalOpen(false)}
        onFipeUpdated={loadData}
      />

      <VehicleDocumentsModal
        isOpen={isDocsModalOpen}
        vehicle={selectedVehicleForDocs}
        onClose={() => setIsDocsModalOpen(false)}
      />

      <VehicleSaleModal
        isOpen={isSaleModalOpen}
        vehicle={selectedVehicleForSale}
        onClose={() => setIsSaleModalOpen(false)}
        onSaleCompleted={loadData}
      />

      <TradeNegotiationModal
        isOpen={isTradeModalOpen}
        vehicle={selectedVehicleForTrade}
        vehicleTypes={vehicleTypes}
        onClose={() => setIsTradeModalOpen(false)}
        onTradeCompleted={loadData}
      />

    </MainLayout>
  );
}