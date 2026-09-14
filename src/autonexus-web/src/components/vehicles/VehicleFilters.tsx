import type { LookupItem } from '../../types/lookup';
import { VehicleStatus } from '../../types/vehicle';
import { Search } from 'lucide-react';

interface VehicleFiltersProps {
  vehicleTypes: LookupItem[];
  selectedType?: string;
  selectedStatus?: VehicleStatus;
  search: string;
  onTypeChange: (typeId?: string) => void;
  onStatusChange: (status?: VehicleStatus) => void;
  onSearchChange: (search: string) => void;
}

export function VehicleFilters({
  vehicleTypes,
  selectedType,
  selectedStatus,
  search,
  onTypeChange,
  onStatusChange,
  onSearchChange,
}: VehicleFiltersProps) {
  return (
    <div className="bg-nexus-card border border-nexus-border rounded-xl p-4 mb-6 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Buscar por marca, modelo ou placa..."
          className="w-full pl-10 pr-4 py-2 bg-nexus-dark border border-nexus-border rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-nexus-accent transition-colors"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <select
          value={selectedType || ''}
          onChange={(e) => onTypeChange(e.target.value || undefined)}
          className="bg-nexus-dark border border-nexus-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-nexus-accent"
        >
          <option value="">Todos os Tipos</option>
          {vehicleTypes.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>

        <select
          value={selectedStatus !== undefined ? selectedStatus.toString() : ''}
          onChange={(e) => onStatusChange(e.target.value ? (Number(e.target.value) as VehicleStatus) : undefined)}
          className="bg-nexus-dark border border-nexus-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-nexus-accent"
        >
          <option value="">Todos os Status</option>
          <option value={VehicleStatus.AVenda}>À Venda</option>
          <option value={VehicleStatus.EmTroca}>Em Troca</option>
          <option value={VehicleStatus.Vendido}>Vendido</option>
        </select>
      </div>
    </div>
  );
}
