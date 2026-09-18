import { useState, useEffect } from 'react';
import type { LookupItem } from '../../types/lookup';
import { FuelType, TransmissionType, type CreateVehicleInput } from '../../types/vehicle';
import { CurrencyInput } from '../ui/CurrencyInput';
import { X, Sparkles, Loader2 } from 'lucide-react';
import { catalogService } from '../../services/catalogService';
import { lookupService } from '../../services/lookupService';

// Opções estáticas para atributos genéricos
const VEHICLE_VERSIONS = [
  "1.0 Flex", "1.0 Turbo Flex", "1.3 Flex", "1.4 Flex", "1.6 16V Flex", "1.8 Flex", "2.0 16V Flex",
  "2.0 Turbo", "2.8 Turbo Diesel 4x4", "3.0 V6 Turbo", "Híbrido Flex (HEV)", "Elétrico 100% (EV)",
  "LT 1.0", "LTZ Turbo", "Premier", "Comfortline", "Highline", "XEi 2.0", "Altis Premium", "SRV 4x4", "Limited 4x4"
];

const VEHICLE_COLORS = ["Preto", "Branco", "Prata", "Cinza", "Vermelho", "Azul", "Verde", "Amarelo", "Marrom", "Bege", "Dourado", "Outra"];
const VEHICLE_YEARS = Array.from({ length: new Date().getFullYear() + 2 - 1970 }, (_, i) => (new Date().getFullYear() + 1) - i);

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

  // Estados dos Dropdowns vindos do PostgreSQL
  const [brands, setBrands] = useState<LookupItem[]>([]);
  const [models, setModels] = useState<LookupItem[]>([]);
  const [loadingBrands, setLoadingBrands] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);
  const [selectedBrandId, setSelectedBrandId] = useState<string>('');

  const [form, setForm] = useState<CreateVehicleInput>({
    vehicleTypeId: vehicleTypes[0]?.id || '',
    brand: '',
    model: '',
    version: VEHICLE_VERSIONS[0],
    manufacturingYear: new Date().getFullYear(),
    modelYear: new Date().getFullYear(),
    plate: '',
    chassis: '',
    Renavam: '',
    mileage: 0,
    color: VEHICLE_COLORS[0],
    fuel: FuelType.Flex,
    transmission: TransmissionType.Automatico,
    PurchaseValue: 0,
    ListedValue: 0,
    notes: '',
  });

  // Busca as Marcas salvas no Banco de Dados PostgreSQL quando o modal abre
  useEffect(() => {
    if (isOpen) {
      loadBrandsFromDb();
    }
  }, [isOpen]);

  const loadBrandsFromDb = async () => {
    try {
      setLoadingBrands(true);
      const data = await lookupService.getBrands();
      setBrands(data);

      if (data.length > 0) {
        const firstBrand = data[0];
        setSelectedBrandId(firstBrand.id);
        setForm(prev => ({ ...prev, brand: firstBrand.name }));
        loadModelsFromDb(firstBrand.id, firstBrand.name);
      }
    } catch (err) {
      console.error('Erro ao carregar marcas do banco de dados:', err);
    } finally {
      setLoadingBrands(false);
    }
  };

  const loadModelsFromDb = async (brandId: string, brandName: string) => {
    try {
      setLoadingModels(true);
      const data = await lookupService.getModelsByBrand(brandId);
      setModels(data);

      if (data.length > 0) {
        setForm(prev => ({ ...prev, brand: brandName, model: data[0].name }));
      } else {
        setForm(prev => ({ ...prev, brand: brandName, model: '' }));
      }
    } catch (err) {
      console.error('Erro ao carregar modelos do banco de dados:', err);
    } finally {
      setLoadingModels(false);
    }
  };

  const handleBrandChange = (brandId: string) => {
    setSelectedBrandId(brandId);
    const selectedBrand = brands.find(b => b.id === brandId);
    if (selectedBrand) {
      loadModelsFromDb(brandId, selectedBrand.name);
    }
  };

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
        color: form.color ?? '',
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
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors cursor-pointer">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm font-medium">
              {error}
            </div>
          )}

          {/* DROPDOWNS DINÂMICOS DO BANCO DE DADOS: Tipo, Marca e Modelo */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Tipo *</label>
              <select
                value={form.vehicleTypeId}
                onChange={(e) => setForm({ ...form, vehicleTypeId: e.target.value })}
                className="w-full bg-nexus-dark border border-nexus-border rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-nexus-accent cursor-pointer"
                required
              >
                {vehicleTypes.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                Marca (Banco) {loadingBrands && '⌛'} *
              </label>
              <select
                value={selectedBrandId}
                onChange={(e) => handleBrandChange(e.target.value)}
                disabled={loadingBrands || brands.length === 0}
                className="w-full bg-nexus-dark border border-nexus-border rounded-lg p-2.5 text-sm text-emerald-400 font-bold focus:outline-none focus:border-nexus-accent cursor-pointer disabled:opacity-50"
                required
              >
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                Modelo (Banco) {loadingModels && '⌛'} *
              </label>
              <select
                value={form.model}
                onChange={(e) => setForm({ ...form, model: e.target.value })}
                disabled={loadingModels || models.length === 0}
                className="w-full bg-nexus-dark border border-nexus-border rounded-lg p-2.5 text-sm text-emerald-400 font-bold focus:outline-none focus:border-nexus-accent cursor-pointer disabled:opacity-50"
                required
              >
                {models.map((m) => (
                  <option key={m.id} value={m.name}>{m.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* DROPDOWNS: Versão, Ano Fab., Ano Mod., Placa */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Versão</label>
              <select
                value={form.version}
                onChange={(e) => setForm({ ...form, version: e.target.value })}
                className="w-full bg-nexus-dark border border-nexus-border rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-nexus-accent cursor-pointer"
              >
                {VEHICLE_VERSIONS.map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Ano Fab.</label>
              <select
                value={form.manufacturingYear}
                onChange={(e) => setForm({ ...form, manufacturingYear: Number(e.target.value) })}
                className="w-full bg-nexus-dark border border-nexus-border rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-nexus-accent cursor-pointer font-semibold"
              >
                {VEHICLE_YEARS.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Ano Mod.</label>
              <select
                value={form.modelYear}
                onChange={(e) => setForm({ ...form, modelYear: Number(e.target.value) })}
                className="w-full bg-nexus-dark border border-nexus-border rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-nexus-accent cursor-pointer font-semibold"
              >
                {VEHICLE_YEARS.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Placa</label>
              <input
                type="text"
                value={form.plate}
                onChange={(e) => setForm({ ...form, plate: e.target.value.toUpperCase() })}
                placeholder="ABC1D23"
                className="w-full bg-nexus-dark border border-nexus-border rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-nexus-accent font-mono uppercase"
              />
            </div>
          </div>

          {/* DROPDOWNS: KM, Cor, Câmbio */}
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
              <select
                value={form.color}
                onChange={(e) => setForm({ ...form, color: e.target.value })}
                className="w-full bg-nexus-dark border border-nexus-border rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-nexus-accent cursor-pointer"
              >
                {VEHICLE_COLORS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Câmbio</label>
              <select
                value={form.transmission}
                onChange={(e) => setForm({ ...form, transmission: Number(e.target.value) as TransmissionType })}
                className="w-full bg-nexus-dark border border-nexus-border rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-nexus-accent cursor-pointer"
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
                className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-400 hover:text-amber-300 transition-colors disabled:opacity-50 cursor-pointer"
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
              className="px-4 py-2.5 text-sm font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-nexus-accent hover:bg-nexus-accent-hover text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-2"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? 'Salvando...' : 'Salvar Veículo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}