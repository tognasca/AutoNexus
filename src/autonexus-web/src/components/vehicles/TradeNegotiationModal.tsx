import { useState } from 'react';
import { tradeService, type CreateTradeInput } from '../../services/tradeService';
import type { LookupItem } from '../../types/lookup';
import type { VehicleSummary } from '../../types/vehicle';
import { FuelType, TransmissionType } from '../../types/vehicle';
import { CurrencyInput } from '../ui/CurrencyInput';
import { formatCurrency } from '../../utils/formatters';
import { X, ArrowLeftRight, Calculator, Loader2 } from 'lucide-react';

interface TradeNegotiationModalProps {
  isOpen: boolean;
  vehicle: VehicleSummary | null;
  vehicleTypes: LookupItem[];
  onClose: () => void;
  onTradeCompleted: () => void;
}

export function TradeNegotiationModal({ isOpen, vehicle, vehicleTypes, onClose, onTradeCompleted }: TradeNegotiationModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [recBrand, setRecBrand] = useState('');
  const [recModel, setRecModel] = useState('');
  const [recVersion] = useState('');
  const [recYearFab] = useState(new Date().getFullYear());
  const [recYearMod, setRecYearMod] = useState(new Date().getFullYear());
  const [recTypeId, setRecTypeId] = useState(vehicleTypes[0]?.id || '');
  const [recPurchaseVal, setRecPurchaseVal] = useState(0);

  const [delivFipe, setDelivFipe] = useState(vehicle?.purchaseValue || 0);
  const [recFipe, setRecFipe] = useState(0);
  const [delivNegotiated, setDelivNegotiated] = useState(vehicle?.listedValue || vehicle?.purchaseValue || 0);
  const [recNegotiated] = useState(0);
  const [estimatedResaleCost, setEstimatedResaleCost] = useState(0);
  const [differenceVal, setDifferenceVal] = useState(0);
  const [differencePaidByUs, setDifferencePaidByUs] = useState(false);
  const [notes] = useState('');

  if (!isOpen || !vehicle) return null;

  const resultReceived = recFipe - estimatedResaleCost;
  const resultDelivered = delivFipe + (differencePaidByUs ? differenceVal : 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recBrand || !recModel || !recTypeId) {
      setError('Preencha a Marca, Modelo e Tipo do veículo recebido.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const input: CreateTradeInput = {
        deliveredVehicleId: vehicle.id,
        receivedVehicle: {
          vehicleTypeId: recTypeId,
          brand: recBrand,
          model: recModel,
          version: recVersion,
          manufacturingYear: recYearFab,
          modelYear: recYearMod,
          mileage: 0,
          fuel: FuelType.Flex,
          transmission: TransmissionType.Automatico,
          purchaseValue: recPurchaseVal,
          listedValue: recNegotiated,
        },
        receivedVehicleFipe: recFipe,
        deliveredVehicleFipe: delivFipe,
        receivedVehicleNegotiatedValue: recNegotiated,
        deliveredVehicleNegotiatedValue: delivNegotiated,
        estimatedResaleCost: estimatedResaleCost,
        differenceValue: differenceVal,
        differencePaidByUs: differencePaidByUs,
        tradeDate: new Date().toISOString(),
        notes: notes,
      };

      await tradeService.createTrade(input);
      onTradeCompleted();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao registrar operação de troca.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-nexus-card border border-nexus-border rounded-2xl w-full max-w-5xl overflow-hidden my-8 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-nexus-border">
          <div className="flex items-center gap-2">
            <ArrowLeftRight size={20} className="text-amber-400" />
            <h2 className="text-lg font-bold text-white">Registrar Operação de Troca</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors cursor-pointer">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Lado 1: Veículo Entregue */}
            <div className="p-4 bg-slate-900/60 border border-amber-500/30 rounded-xl space-y-3">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
                1. Veículo Entregue (Nosso Estoque)
              </span>

              <div className="p-3 bg-nexus-dark border border-nexus-border rounded-lg">
                <p className="text-sm font-bold text-white">{vehicle.brand} {vehicle.model} {vehicle.version}</p>
                <p className="text-xs text-slate-400">Ano: {vehicle.modelYear} • Placa: {vehicle.plate || 'N/A'}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">FIPE Entregue (R$)</label>
                  <CurrencyInput
                    value={delivFipe}
                    onChange={(val) => setDelivFipe(val)}
                    placeholder="R$ 0,00"
                    className="w-full bg-nexus-dark border border-nexus-border rounded-lg p-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Valor na Troca (R$)</label>
                  <CurrencyInput
                    value={delivNegotiated}
                    onChange={(val) => setDelivNegotiated(val)}
                    placeholder="R$ 0,00"
                    className="w-full bg-nexus-dark border border-nexus-border rounded-lg p-2 text-xs text-white"
                  />
                </div>
              </div>
            </div>

            {/* Lado 2: Veículo Recebido */}
            <div className="p-4 bg-slate-900/60 border border-blue-500/30 rounded-xl space-y-3">
              <span className="text-xs font-bold text-blue-400 uppercase tracking-wider block">
                2. Veículo Recebido (Novo Entrada)
              </span>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Marca *</label>
                  <input
                    type="text"
                    value={recBrand}
                    onChange={(e) => setRecBrand(e.target.value)}
                    placeholder="Ex: Honda"
                    className="w-full bg-nexus-dark border border-nexus-border rounded-lg p-2 text-xs text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Modelo *</label>
                  <input
                    type="text"
                    value={recModel}
                    onChange={(e) => setRecModel(e.target.value)}
                    placeholder="Ex: Civic"
                    className="w-full bg-nexus-dark border border-nexus-border rounded-lg p-2 text-xs text-white"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Tipo *</label>
                  <select
                    value={recTypeId}
                    onChange={(e) => setRecTypeId(e.target.value)}
                    className="w-full bg-nexus-dark border border-nexus-border rounded-lg p-2 text-xs text-white"
                  >
                    {vehicleTypes.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Ano Mod.</label>
                  <input
                    type="number"
                    value={recYearMod}
                    onChange={(e) => setRecYearMod(Number(e.target.value))}
                    className="w-full bg-nexus-dark border border-nexus-border rounded-lg p-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">FIPE Recebido (R$)</label>
                  <CurrencyInput
                    value={recFipe}
                    onChange={(val) => setRecFipe(val)}
                    placeholder="R$ 0,00"
                    className="w-full bg-nexus-dark border border-nexus-border rounded-lg p-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Valor de Entrada (R$)</label>
                  <CurrencyInput
                    value={recPurchaseVal}
                    onChange={(val) => setRecPurchaseVal(val)}
                    placeholder="R$ 0,00"
                    className="w-full bg-nexus-dark border border-nexus-border rounded-lg p-2 text-xs text-white"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Ajustes Financeiros */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-900/40 p-4 border border-nexus-border rounded-xl">
            <div>
              <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Custo Estimado Revenda (R$)</label>
              <CurrencyInput
                value={estimatedResaleCost}
                onChange={(val) => setEstimatedResaleCost(val)}
                placeholder="R$ 0,00"
                className="w-full bg-nexus-dark border border-nexus-border rounded-lg p-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Diferença Torna (R$)</label>
              <CurrencyInput
                value={differenceVal}
                onChange={(val) => setDifferenceVal(val)}
                placeholder="R$ 0,00"
                className="w-full bg-nexus-dark border border-nexus-border rounded-lg p-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Quem pagou a diferença?</label>
              <select
                value={differencePaidByUs ? 'us' : 'client'}
                onChange={(e) => setDifferencePaidByUs(e.target.value === 'us')}
                className="w-full bg-nexus-dark border border-nexus-border rounded-lg p-2 text-xs text-white"
              >
                <option value="client">Cliente nos pagou a torna</option>
                <option value="us">Nós pagamos a torna ao cliente</option>
              </select>
            </div>
          </div>

          {/* CARD TRANSPARENTE DE CÁLCULO */}
          <div className="bg-nexus-dark border border-blue-500/30 rounded-xl p-5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-2">
              <Calculator size={16} />
              Transparência da Avaliação da Troca
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              <div className="space-y-1 font-mono p-3 bg-slate-900 rounded-lg border border-nexus-border">
                <p className="text-slate-400 font-sans font-bold mb-1">Resultado Veículo Recebido:</p>
                <div className="flex justify-between"><span>  FIPE Recebido:</span><span>{formatCurrency(recFipe)}</span></div>
                <div className="flex justify-between text-red-400"><span>- Custo Est. Revenda:</span><span>{formatCurrency(estimatedResaleCost)}</span></div>
                <div className="flex justify-between font-bold border-t border-slate-700 pt-1 text-emerald-400"><span>= Resultado Recebido:</span><span>{formatCurrency(resultReceived)}</span></div>
              </div>

              <div className="space-y-1 font-mono p-3 bg-slate-900 rounded-lg border border-nexus-border">
                <p className="text-slate-400 font-sans font-bold mb-1">Resultado Veículo Entregue:</p>
                <div className="flex justify-between"><span>  FIPE Entregue:</span><span>{formatCurrency(delivFipe)}</span></div>
                <div className="flex justify-between text-amber-400"><span>+ Torna Paga:</span><span>{formatCurrency(differencePaidByUs ? differenceVal : 0)}</span></div>
                <div className="flex justify-between font-bold border-t border-slate-700 pt-1 text-blue-400"><span>= Resultado Entregue:</span><span>{formatCurrency(resultDelivered)}</span></div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-nexus-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-400 hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-sm font-bold transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-2 shadow-lg shadow-amber-500/20"
            >
              {submitting ? <Loader2 size={18} className="animate-spin" /> : <ArrowLeftRight size={18} />}
              Confirmar Operação de Troca
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
