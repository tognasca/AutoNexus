import { useState } from 'react';
import type { LookupItem } from '../../types/lookup';
import { FuelType, TransmissionType, type CreateVehicleInput } from '../../types/vehicle';
import { CurrencyInput } from '../ui/CurrencyInput';
import { X, Sparkles } from 'lucide-react';
import { catalogService } from '../../services/catalogService';

interface VehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  vehicleTypes: LookupItem[];
  onCreate: (data: CreateVehicleInput) => Promise<void>;
}

export function VehicleModal({ isOpen, onClose, onSuccess, vehicleTypes, onCreate }: VehicleModalProps) {
  const [loading, setLoading] = useState(false);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<CreateVehicleInput>({
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
    notes: '',
  });

  if (!isOpen) return null;

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
      if (!form.brand || !form.model || !form.vehicleTypeId || form.PurchaseValue <= 0) {
        throw new Error('Preencha os campos obrigatórios (Tipo, Marca, Modelo e Valor de Compra).');
      }

      await onCreate(form);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao cadastrar veículo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-nexus-card border border-nexus-border rounded-2xl w-full max-w-2xl overflow-hidden my-8">
        <div className="flex items-center justify-between px-6 py-4 border-b border-nexus-border">
          <h2 className="text-lg font-bold text-white">Cadastrar Novo Veículo</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Tipo *</label>
              <select
                value={form.vehicleTypeId}
                onChange={(e) => setForm({ ...form, vehicleTypeId: e.target.value })}
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
                onChange={(e) => setForm({ ...form, brand: e.target.value })}
                placeholder="Ex: Toyota"
                className="w-full bg-nexus-dark border border-nexus-border rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-nexus-accent"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Modelo *</label>
              <input
                type="text"
                value={form.model}
                onChange={(e) => setForm({ ...form, model: e.target.value })}
                placeholder="Ex: Corolla"
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
                onChange={(e) => setForm({ ...form, version: e.target.value })}
                placeholder="Ex: XEi 2.0"
                className="w-full bg-nexus-dark border border-nexus-border rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-nexus-accent"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Ano Fab.</label>
              <input
                type="number"
                value={form.manufacturingYear}
                onChange={(e) => setForm({ ...form, manufacturingYear: Number(e.target.value) })}
                className="w-full bg-nexus-dark border border-nexus-border rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-nexus-accent"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Ano Mod.</label>
              <input
                type="number"
                value={form.modelYear}
                onChange={(e) => setForm({ ...form, modelYear: Number(e.target.value) })}
                className="w-full bg-nexus-dark border border-nexus-border rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-nexus-accent"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Placa</label>
              <input
                type="text"
                value={form.plate}
                onChange={(e) => setForm({ ...form, plate: e.target.value.toUpperCase() })}
                placeholder="ABC1D23"
                className="w-full bg-nexus-dark border border-nexus-border rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-nexus-accent"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">KM</label>
              <input
                type="number"
                value={form.mileage}
                onChange={(e) => setForm({ ...form, mileage: Number(e.target.value) })}
                className="w-full bg-nexus-dark border border-nexus-border rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-nexus-accent"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Cor</label>
              <input
                type="text"
                value={form.color}
                onChange={(e) => setForm({ ...form, color: e.target.value })}
                placeholder="Ex: Preto"
                className="w-full bg-nexus-dark border border-nexus-border rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-nexus-accent"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Câmbio</label>
              <select
                value={form.transmission}
                onChange={(e) => setForm({ ...form, transmission: Number(e.target.value) as TransmissionType })}
                className="w-full bg-nexus-dark border border-nexus-border rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-nexus-accent"
              >
                <option value={TransmissionType.Automatico}>Automático</option>
                <option value={TransmissionType.Manual}>Manual</option>
                <option value={TransmissionType.CVT}>CVT</option>
              </select>
            </div>
          </div>

          {/* Máscara de Reais (R$) nos Valores */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Valor de Compra (R$) *</label>
              <CurrencyInput
                value={form.PurchaseValue}
                onChange={(val) => setForm({ ...form, PurchaseValue: val })}
                placeholder="R$ 0,00"
                className="w-full bg-nexus-dark border border-nexus-border rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-nexus-accent"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Valor Anunciado (R$)</label>
              <CurrencyInput
                value={form.ListedValue || 0}
                onChange={(val) => setForm({ ...form, ListedValue: val })}
                placeholder="R$ 0,00"
                className="w-full bg-nexus-dark border border-nexus-border rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-nexus-accent"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-400 uppercase">
                Observações / Descrição do Anúncio
              </label>
              <button
                type="button"
                onClick={handleGenerateAiDescription}
                disabled={isGeneratingAi}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-400 hover:text-amber-300 transition-colors disabled:opacity-50"
              >
                <Sparkles size={14} />
                {isGeneratingAi ? 'Gerando com IA...' : '✨ Gerar Descrição com IA'}
              </button>
            </div>
            <textarea
              rows={4}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Detalhes adicionais sobre o estado do veículo ou descrição gerada por IA..."
              className="w-full bg-nexus-dark border border-nexus-border rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-nexus-accent"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-nexus-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-semibold text-slate-400 hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-nexus-accent hover:bg-nexus-accent-hover text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
            >
              {loading ? 'Salvando...' : 'Salvar Veículo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}