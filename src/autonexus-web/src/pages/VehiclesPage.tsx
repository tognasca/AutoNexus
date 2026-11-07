import { useState, useEffect } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import { VehicleCard } from '../components/vehicles/VehicleCard';
import { VehicleFilters } from '../components/vehicles/VehicleFilters';
import { VehicleModal } from '../components/vehicles/VehicleModal';
import { EditVehicleModal } from '../components/vehicles/EditVehicleModal';
import { VehiclePhotosModal } from '../components/vehicles/VehiclePhotosModal';
import { VehicleCostsModal } from '../components/vehicles/VehicleCostsModal';
import { VehicleFipeModal } from '../components/vehicles/VehicleFipeModal';
import { VehicleDocumentsModal } from '../components/vehicles/VehicleDocumentsModal';
import { VehicleSaleModal } from '../components/vehicles/VehicleSaleModal';
import { TradeNegotiationModal } from '../components/vehicles/TradeNegotiationModal';
import { vehicleService } from '../services/vehicleService';
import { tenantSettingsService, type WhatsAppContact } from '../services/tenantSettingsService';
import { lookupService } from '../services/lookupService';
import { VehicleStatus, type VehicleSummary, type CreateVehicleInput } from '../types/vehicle';
import type { LookupItem } from '../types/lookup';
import { Plus, Loader2, CarFront, CheckCircle2, Clock3, AlertTriangle, History } from 'lucide-react';
import { VehicleHistoryModal } from '../components/vehicles/VehicleHistoryModal';

export function VehiclesPage({ currentView, onNavigate }: { currentView?: string; onNavigate?: (view: string) => void }) {
  const [vehicles, setVehicles] = useState<VehicleSummary[]>([]);
  const [vehicleTypes, setVehicleTypes] = useState<LookupItem[]>([]);
  const [whatsappContacts, setWhatsappContacts] = useState<WhatsAppContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [inventorySummary, setInventorySummary] = useState({ total: 0, available: 0, reserved: 0, sold: 0, over60Days: 0, over90Days: 0 });
  const [historyVehicle, setHistoryVehicle] = useState<VehicleSummary | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Modal de Edição
  const [editVehicleId, setEditVehicleId] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

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
      const summary = await vehicleService.getInventorySummary().catch(() => null);
      if (summary) setInventorySummary(summary);
      const contacts = await tenantSettingsService.getWhatsAppContacts().catch(() => []);
      setWhatsappContacts(contacts.filter(x => x.isActive));
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

  const handleOpenEdit = (vehicle: VehicleSummary) => {
    setEditVehicleId(vehicle.id);
    setIsEditModalOpen(true);
  };

  const handleDeleteVehicle = async (_vehicle: VehicleSummary) => {
    alert('Não é possível excluir veículos definitivamente. Utilize Registrar venda para manter o histórico da loja.');
  };

  return (
    <MainLayout currentView={currentView} onNavigate={onNavigate}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">Estoque de Veículos</h1>
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

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 mb-5">
        {[
          { label: 'Veículos no estoque', value: inventorySummary.total, icon: CarFront, tone: 'text-slate-200', border: 'border-slate-700' },
          { label: 'Disponíveis', value: inventorySummary.available, icon: CheckCircle2, tone: 'text-emerald-400', border: 'border-emerald-500/30' },
          { label: 'Reservados', value: inventorySummary.reserved, icon: Clock3, tone: 'text-violet-300', border: 'border-violet-500/30' },
          { label: 'Vendidos', value: inventorySummary.sold, icon: CheckCircle2, tone: 'text-blue-300', border: 'border-blue-500/30' },
          { label: 'Mais de 60 dias', value: inventorySummary.over60Days, icon: AlertTriangle, tone: 'text-amber-300', border: 'border-amber-500/30' },
          { label: 'Mais de 90 dias', value: inventorySummary.over90Days, icon: AlertTriangle, tone: 'text-rose-300', border: 'border-rose-500/30' },
        ].map(item => (
          <div key={item.label} className={`rounded-xl border ${item.border} bg-nexus-card p-3 flex items-center gap-3`}>
            <item.icon size={19} className={item.tone} />
            <div className="min-w-0"><div className="text-xl font-bold text-white">{item.value}</div><div className="text-[11px] text-slate-400">{item.label}</div></div>
          </div>
        ))}
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
            <div key={v.id} className="space-y-2">
            <VehicleCard
              vehicle={v}
              onEditVehicle={handleOpenEdit}
              onViewHistory={(veh) => setHistoryVehicle(veh)}
              onManagePhotos={(veh) => { setSelectedVehicleForPhotos(veh); setIsPhotosModalOpen(true); }}
              onManageCosts={(veh) => { setSelectedVehicleForCosts(veh); setIsCostsModalOpen(true); }}
              onManageFipe={(veh) => { setSelectedVehicleForFipe(veh); setIsFipeModalOpen(true); }}
              onManageDocuments={(veh) => { setSelectedVehicleForDocs(veh); setIsDocsModalOpen(true); }}
              onSellVehicle={(veh) => { setSelectedVehicleForSale(veh); setIsSaleModalOpen(true); }}
              onTradeVehicle={(veh) => { setSelectedVehicleForTrade(veh); setIsTradeModalOpen(true); }}
              onDeleteVehicle={handleDeleteVehicle}
            />
            <label className="block rounded-lg border border-nexus-border bg-nexus-card p-2 text-[11px] text-slate-400">
              WhatsApp responsável por este veículo
              <select value={v.whatsappContactId ?? ''} onChange={async e => { const contactId = e.target.value || null; try { await vehicleService.assignWhatsAppContact(v.id, contactId); setVehicles(items => items.map(item => item.id === v.id ? { ...item, whatsappContactId: contactId } : item)); } catch (err: any) { alert(err.message || 'Não foi possível atualizar o contato do veículo.'); } }} className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-2 py-2 text-xs text-white">
                <option value="">Usar WhatsApp principal da empresa</option>
                {whatsappContacts.map(contact => <option key={contact.id} value={contact.id}>{contact.name} · {contact.phoneNumber}</option>)}
              </select>
            </label>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Cadastro */}
      {vehicleTypes.length > 0 && (
        <VehicleModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={loadData}
          vehicleTypes={vehicleTypes}
          onCreate={handleCreateVehicle}
        />
      )}

      {/* Modal de Edição */}
      {vehicleTypes.length > 0 && (
        <EditVehicleModal
          isOpen={isEditModalOpen}
          vehicleId={editVehicleId}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditVehicleId(null);
          }}
          onSuccess={loadData}
          vehicleTypes={vehicleTypes}
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

      <VehicleHistoryModal vehicle={historyVehicle} onClose={() => setHistoryVehicle(null)} />

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