import { useEffect, useState } from 'react';
import type { LookupItem } from '../../types/lookup';
import { FuelType, TransmissionType, VehicleStatus, type UpdateVehicleInput } from '../../types/vehicle';
import { CurrencyInput } from '../ui/CurrencyInput';
import { X, Sparkles, Loader2 } from 'lucide-react';
import { vehicleService } from '../../services/vehicleService';
import { catalogService } from '../../services/catalogService';

interface EditVehicleModalProps {
  isOpen: boolean;
  vehicleId: string | null;
  onClose: () => void;
  onSuccess: () => void;
  vehicleTypes: LookupItem[];
}

export function EditVehicleModal({ isOpen, vehicleId, onClose, onSuccess, vehicleTypes }: EditVehicleModalProps) {
  const [fetching, setFetching] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<UpdateVehicleInput>({
    id: '',
    vehicleTypeId: vehicleTypes[0]?.id || '',
    brand: '',
    model: '',
    version: '',
    manufacturingYear: new Date().getFullYear(),
    modelYear: new Date().getFullYear(),
    plate: '',
    chassis: '',
    Renavam: '',
    mileage: 0,
    color: '',
    fuel: FuelType.Flex,
    transmission: TransmissionType.Automatico,
    PurchaseValue: 0,
    ListedValue: 0,
    status: VehicleStatus.AVenda,
    notes: '',
  });

  useEffect(() => {
    if (isOpen && vehicleId) {
      loadVehicleData(vehicleId);
    }
  }, [isOpen, vehicleId]);

  const loadVehicleData = async (id: string) => {
    try {
      setFetching(true);
      setError(null);
      const vehicle = await vehicleService.getById(id);

      // Tratamento para garantir a leitura do valor de compra independente da nomenclatura do JSON
      const purchaseVal = Number(vehicle.purchaseValue ?? vehicle.PurchaseValue ?? 0);
      const listedVal = Number(vehicle.listedValue ?? vehicle.ListedValue ?? 0);

      setForm({
        id: vehicle.id,
        vehicleTypeId: vehicle.vehicleTypeId || vehicleTypes[0]?.id || '',
        brand: vehicle.brand || '',
        model: vehicle.model || '',
        version: vehicle.version || '',
        manufacturingYear: vehicle.manufacturingYear || new Date().getFullYear(),
        modelYear: vehicle.modelYear || new Date().getFullYear(),
        plate: vehicle.plate || '',
        chassis: vehicle.chassis || '',
        Renavam: vehicle.renavam || vehicle.Renavam || '',
        mileage: vehicle.mileage || 0,
        color: vehicle.color || '',
        fuel: vehicle.fuel ?? FuelType.Flex,
        transmission: vehicle.transmission ?? TransmissionType.Automatico,
        PurchaseValue: purchaseVal,
        ListedValue: listedVal,
        status: vehicle.status ?? VehicleStatus.AVenda,
        notes: vehicle.notes || '',
      });
    } catch (err: any) {
      console.error('Erro ao carregar veículo:', err);
      setError('Erro ao carregar dados do veículo para edição.');
    } finally {
      setFetching(false);
    }
  };

  if (!isOpen || !vehicleId) return null;

  const handleGenerateAiDescription = async () => {
    if (!form.brand || !form.model) {
      setError('Preencha ao menos Marca e Modelo antes de gerar a descrição com IA.');
      return;
    }

    try {
      setIsGeneratingAi(true);
      setError(null);
      const text = await catalogService.generateAiDescription({
        brand: form.brand,
        model: form.model,
        year: form.modelYear,
        price: form.ListedValue || form.PurchaseValue,
        mileage: form.mileage,
        color: form.color,
        fuelType: String(form.fuel),
        transmission: String(form.transmission),
      });
      setForm(prev => ({ ...prev, notes: text }));
    } catch (err: any) {
      alert("Não foi possível gerar a descrição automática.");
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!form.brand || !form.model || !form.vehicleTypeId) {
        throw new Error('Preencha os campos obrigatórios (Tipo, Marca e Modelo).');
      }

      const purchaseVal = Number(form.PurchaseValue ?? (form as any).purchaseValue ?? 0);
      if (purchaseVal <= 0) {
        throw new Error('O Valor de Compra deve ser maior que R$ 0,00.');
      }

      // Payload sanitizado garantindo números válidos para a API
      const payload: UpdateVehicleInput = {
        ...form,
        PurchaseValue: Number(form.PurchaseValue),
        ListedValue: Number(form.ListedValue || 0),
        mileage: Number(form.mileage || 0),
        manufacturingYear: Number(form.manufacturingYear),
        modelYear: Number(form.modelYear),
      };
      console.log(payload.PurchaseValue, payload.ListedValue, payload.mileage);
      await vehicleService.update(form.id, payload);
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Erro ao atualizar veículo:', err);
      setError(err.message || 'Erro ao atualizar dados do veículo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-nexus-card border border-nexus-border rounded-2xl w-full max-w-2xl overflow-hidden my-8 shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-nexus-border">
          <h2 className="text-lg font-bold text-white">Editar Veículo</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors cursor-pointer">
            <X size={20} />
          </button>
        </div>

        {fetching ? (
          <div className="p-12 flex flex-col items-center justify-center text-slate-400 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            <p className="text-sm font-medium">Carregando dados do veículo...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm font-medium">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Tipo *</label>
                <select
                  value={form.vehicleTypeId}
                  onChange={(e) => setForm(prev => ({ ...prev, vehicleTypeId: e.target.value }))}
                  className="w-full bg-nexus-dark border border-nexus-border rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-nexus-accent"
                  required
                >
                  {vehicleTypes.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Marca *</label>
                <input
                  type="text"
                  value={form.brand}
                  onChange={(e) => setForm(prev => ({ ...prev, brand: e.target.value }))}
                  className="w-full bg-nexus-dark border border-nexus-border rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-nexus-accent"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Modelo *</label>
                <input
                  type="text"
                  value={form.model}
                  onChange={(e) => setForm(prev => ({ ...prev, model: e.target.value }))}
                  className="w-full bg-nexus-dark border border-nexus-border rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-nexus-accent"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Versão</label>
                <input
                  type="text"
                  value={form.version}
                  onChange={(e) => setForm(prev => ({ ...prev, version: e.target.value }))}
                  className="w-full bg-nexus-dark border border-nexus-border rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-nexus-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Ano Fab.</label>
                <input
                  type="number"
                  value={form.manufacturingYear}
                  onChange={(e) => setForm(prev => ({ ...prev, manufacturingYear: Number(e.target.value) }))}
                  className="w-full bg-nexus-dark border border-nexus-border rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-nexus-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Ano Mod.</label>
                <input
                  type="number"
                  value={form.modelYear}
                  onChange={(e) => setForm(prev => ({ ...prev, modelYear: Number(e.target.value) }))}
                  className="w-full bg-nexus-dark border border-nexus-border rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-nexus-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Placa</label>
                <input
                  type="text"
                  value={form.plate}
                  onChange={(e) => setForm(prev => ({ ...prev, plate: e.target.value.toUpperCase() }))}
                  className="w-full bg-nexus-dark border border-nexus-border rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-nexus-accent"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm(prev => ({ ...prev, status: Number(e.target.value) as VehicleStatus }))}
                  className="w-full bg-nexus-dark border border-nexus-border rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-nexus-accent font-semibold"
                >
                  <option value={VehicleStatus.AVenda}>À Venda</option>
                  <option value={VehicleStatus.EmTroca}>Em Troca</option>
                  <option value={VehicleStatus.Vendido}>Vendido</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">KM</label>
                <input
                  type="number"
                  value={form.mileage}
                  onChange={(e) => setForm(prev => ({ ...prev, mileage: Number(e.target.value) }))}
                  className="w-full bg-nexus-dark border border-nexus-border rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-nexus-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Cor</label>
                <input
                  type="text"
                  value={form.color}
                  onChange={(e) => setForm(prev => ({ ...prev, color: e.target.value }))}
                  className="w-full bg-nexus-dark border border-nexus-border rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-nexus-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Câmbio</label>
                <select
                  value={form.transmission}
                  onChange={(e) => setForm(prev => ({ ...prev, transmission: Number(e.target.value) as TransmissionType }))}
                  className="w-full bg-nexus-dark border border-nexus-border rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-nexus-accent"
                >
                  <option value={TransmissionType.Automatico}>Automático</option>
                  <option value={TransmissionType.Manual}>Manual</option>
                  <option value={TransmissionType.CVT}>CVT</option>
                </select>
              </div>
            </div>

            {/* Valores de Compra e Anunciado com Atualização Funcional do Estado */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-amber-400 uppercase mb-1">
                  Valor de Compra (R$) *
                </label>
                <CurrencyInput
                  value={form.PurchaseValue}
                  onChange={(val) => setForm(prev => ({ ...prev, PurchaseValue: val }))}
                  className="w-full bg-nexus-dark border border-amber-500/40 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-amber-400 font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                  Valor Anunciado (R$)
                </label>
                <CurrencyInput
                  value={form.ListedValue || 0}
                  onChange={(val) => setForm(prev => ({ ...prev, ListedValue: val }))}
                  className="w-full bg-nexus-dark border border-nexus-border rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-nexus-accent"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-400 uppercase">
                  Observações / Descrição
                </label>
                <button
                  type="button"
                  onClick={handleGenerateAiDescription}
                  disabled={isGeneratingAi}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-400 hover:text-amber-300 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <Sparkles size={14} />
                  {isGeneratingAi ? 'Gerando com IA...' : '✨ Gerar Descrição com IA'}
                </button>
              </div>
              <textarea
                rows={4}
                value={form.notes}
                onChange={(e) => setForm(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full bg-nexus-dark border border-nexus-border rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-nexus-accent"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-nexus-border">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-sm font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-2"
              >
                {loading && <Loader2 size={16} className="animate-spin" />}
                {loading ? 'Salvando...' : 'Atualizar Veículo'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}