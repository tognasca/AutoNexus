import { VehicleStatus, type VehicleSummary } from '../../types/vehicle';
import { formatCurrency } from '../../utils/formatters';
import { Gauge, Calendar, Car, Camera, DollarSign, TrendingUp, ArrowLeftRight, CheckCircle2, FileText } from 'lucide-react';

interface VehicleCardProps {
  vehicle: VehicleSummary;
  onManagePhotos: (vehicle: VehicleSummary) => void;
  onManageCosts: (vehicle: VehicleSummary) => void;
  onManageFipe: (vehicle: VehicleSummary) => void;
  onManageDocuments: (vehicle: VehicleSummary) => void;
  onSellVehicle: (vehicle: VehicleSummary) => void;
  onTradeVehicle: (vehicle: VehicleSummary) => void;
}

export function VehicleCard({
  vehicle,
  onManagePhotos,
  onManageCosts,
  onManageFipe,
  onManageDocuments,
  onSellVehicle,
  onTradeVehicle,
}: VehicleCardProps) {
  const getStatusBadge = (status: VehicleStatus) => {
    switch (status) {
      case VehicleStatus.AVenda:
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">À Venda</span>;
      case VehicleStatus.EmTroca:
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">Em Troca</span>;
      case VehicleStatus.Vendido:
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Vendido</span>;
      default:
        return null;
    }
  };

  return (
    <div className="bg-nexus-card border border-nexus-border rounded-xl overflow-hidden hover:border-nexus-accent/50 transition-all duration-300 flex flex-col group">
      <div className="relative h-48 bg-slate-900 flex items-center justify-center overflow-hidden">
        {vehicle.mainPhotoUrl ? (
          <img
            src={vehicle.mainPhotoUrl}
            alt={`${vehicle.brand} ${vehicle.model}`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-nexus-text-muted">
            <Car size={48} className="stroke-[1.5] mb-2 text-slate-700" />
            <span className="text-xs">Sem foto</span>
          </div>
        )}

        <div className="absolute top-3 left-3">{getStatusBadge(vehicle.status)}</div>

        <div className="absolute bottom-3 right-3 flex items-center gap-1.5">
          <button
            onClick={() => onManageDocuments(vehicle)}
            title="Documentos e Laudos"
            className="p-1.5 bg-black/60 hover:bg-nexus-accent backdrop-blur-md rounded-lg text-white text-xs font-medium flex items-center gap-1 transition-all shadow-md cursor-pointer"
          >
            <FileText size={14} />
          </button>

          <button
            onClick={() => onManageFipe(vehicle)}
            title="Tabela FIPE"
            className="p-1.5 bg-black/60 hover:bg-blue-600 backdrop-blur-md rounded-lg text-white text-xs font-medium flex items-center gap-1 transition-all shadow-md cursor-pointer"
          >
            <TrendingUp size={14} />
          </button>

          <button
            onClick={() => onManageCosts(vehicle)}
            title="Gestão de Custos"
            className="p-1.5 bg-black/60 hover:bg-emerald-600 backdrop-blur-md rounded-lg text-white text-xs font-medium flex items-center gap-1 transition-all shadow-md cursor-pointer"
          >
            <DollarSign size={14} />
          </button>

          <button
            onClick={() => onManagePhotos(vehicle)}
            title="Gerenciar Fotos"
            className="p-1.5 bg-black/60 hover:bg-indigo-600 backdrop-blur-md rounded-lg text-white text-xs font-medium flex items-center gap-1 transition-all shadow-md cursor-pointer"
          >
            <Camera size={14} />
          </button>
        </div>
      </div>

      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-baseline justify-between mb-1">
            <span className="text-xs font-semibold tracking-wider uppercase text-nexus-accent">
              {vehicle.brand}
            </span>
            {vehicle.plate && (
              <span className="text-[10px] bg-nexus-border px-1.5 py-0.5 rounded text-slate-400 font-mono">
                {vehicle.plate}
              </span>
            )}
          </div>

          <h3 className="text-base font-bold text-white mb-2 line-clamp-1">
            {vehicle.model} {vehicle.version && <span className="font-normal text-slate-400 text-xs">{vehicle.version}</span>}
          </h3>

          <div className="grid grid-cols-2 gap-2 text-xs text-nexus-text-muted mb-3">
            <div className="flex items-center gap-1.5">
              <Calendar size={14} className="text-slate-500" />
              <span>{vehicle.manufacturingYear}/{vehicle.modelYear}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Gauge size={14} className="text-slate-500" />
              <span>{vehicle.mileage.toLocaleString('pt-BR')} km</span>
            </div>
          </div>
        </div>

        {vehicle.status !== VehicleStatus.Vendido && (
          <div className="grid grid-cols-2 gap-2 my-2 pt-2 border-t border-nexus-border/60">
            <button
              onClick={() => onTradeVehicle(vehicle)}
              className="py-1.5 px-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1 cursor-pointer"
            >
              <ArrowLeftRight size={12} />
              Troca
            </button>
            <button
              onClick={() => onSellVehicle(vehicle)}
              className="py-1.5 px-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1 cursor-pointer"
            >
              <CheckCircle2 size={12} />
              Vender
            </button>
          </div>
        )}

        <div className="pt-2 border-t border-nexus-border flex items-end justify-between">
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-medium block">Preço Anunciado</span>
            <span className="text-lg font-bold text-emerald-400">
              {formatCurrency(vehicle.listedValue || vehicle.purchaseValue)}
            </span>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-500 uppercase font-medium block">Compra</span>
            <span className="text-xs font-medium text-slate-400">
              {formatCurrency(vehicle.purchaseValue)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
