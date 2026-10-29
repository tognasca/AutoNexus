import { useState, useEffect } from 'react';
import type { LookupItem } from '../../types/lookup';
import { FuelType, TransmissionType, type CreateVehicleInput } from '../../types/vehicle';
import { CurrencyInput } from '../ui/CurrencyInput';
import { X, Sparkles, Loader2 } from 'lucide-react';
import { catalogService } from '../../services/catalogService';
import { fipeService, type FipeLookupItem } from '../../services/fipeService';

const VEHICLE_COLORS = ["Preto", "Branco", "Prata", "Cinza", "Vermelho", "Azul", "Verde", "Amarelo", "Marrom", "Bege", "Dourado", "Outra"];
const FALLBACK_YEARS = Array.from({ length: new Date().getFullYear() + 2 - 1970 }, (_, i) => (new Date().getFullYear() + 1) - i);

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

  // Catálogo FIPE atual com efeito cascata: Tipo -> Marca -> Modelo -> Ano/Combustível.
  const [brands, setBrands] = useState<FipeLookupItem[]>([]);
  const [models, setModels] = useState<FipeLookupItem[]>([]);
  const [years, setYears] = useState<FipeLookupItem[]>([]);
  const [selectedBrandCode, setSelectedBrandCode] = useState('');
  const [selectedModelCode, setSelectedModelCode] = useState('');
  const [selectedYearCode, setSelectedYearCode] = useState('');
  const [loadingBrands, setLoadingBrands] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);
  const [loadingYears, setLoadingYears] = useState(false);

  const defaultTypeName = vehicleTypes[0]?.name || 'Carro';

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
    color: VEHICLE_COLORS[0],
    fuel: FuelType.Flex,
    transmission: TransmissionType.Automatico,
    PurchaseValue: 0,
    ListedValue: 0,
    notes: '',
  });

  const selectedTypeName = vehicleTypes.find(t => t.id === form.vehicleTypeId)?.name || defaultTypeName;

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    setSelectedBrandCode('');
    setSelectedModelCode('');
    setSelectedYearCode('');
    setModels([]);
    setYears([]);
    loadFipeBrands(selectedTypeName);
  }, [isOpen, form.vehicleTypeId]);

  const loadFipeBrands = async (vehicleType: string) => {
    try {
      setLoadingBrands(true);
      setLoadingModels(false);
      setLoadingYears(false);
      const data = await fipeService.getCatalogBrands(vehicleType);
      setBrands(data);
      setModels([]);
      setYears([]);
      setSelectedBrandCode('');
      setSelectedModelCode('');
      setSelectedYearCode('');
      setForm(prev => ({ ...prev, brand: '', model: '', version: '' }));
    } catch (err: any) {
      console.error('Erro ao carregar catálogo FIPE:', err);
      setBrands([]);
      setError('Não foi possível carregar a lista atual de marcas. Tente novamente.');
    } finally {
      setLoadingBrands(false);
    }
  };

  const handleBrandChange = async (brandCode: string) => {
    const selectedBrand = brands.find(b => b.code === brandCode);
    setSelectedBrandCode(brandCode);
    setSelectedModelCode('');
    setSelectedYearCode('');
    setModels([]);
    setYears([]);
    setForm(prev => ({ ...prev, brand: selectedBrand?.name || '', model: '', version: '' }));

    if (!brandCode) return;
    try {
      setLoadingModels(true);
      setError(null);
      const data = await fipeService.getCatalogModels(selectedTypeName, brandCode);
      setModels(data);
    } catch (err: any) {
      console.error('Erro ao carregar modelos FIPE:', err);
      setError('Não foi possível carregar os modelos desta marca.');
    } finally {
      setLoadingModels(false);
    }
  };

  const handleModelChange = async (modelCode: string) => {
    const selectedModel = models.find(m => m.code === modelCode);
    setSelectedModelCode(modelCode);
    setSelectedYearCode('');
    setYears([]);
    setForm(prev => ({
      ...prev,
      model: selectedModel?.name || '',
      // A FIPE entrega a configuração/versão junto ao nome do modelo.
      version: selectedModel?.name || '',
    }));

    if (!modelCode || !selectedBrandCode) return;
    try {
      setLoadingYears(true);
      setError(null);
      const data = await fipeService.getCatalogYears(selectedTypeName, selectedBrandCode, modelCode);
      setYears(data);
    } catch (err: any) {
      console.error('Erro ao carregar anos FIPE:', err);
      setError('Não foi possível carregar os anos disponíveis para este modelo.');
    } finally {
      setLoadingYears(false);
    }
  };

  const handleYearChange = (yearCode: string) => {
    const selectedYear = years.find(y => y.code === yearCode);
    const yearMatch = selectedYear?.name.match(/\b(19|20)\d{2}\b/);
    const modelYear = yearMatch ? Number(yearMatch[0]) : new Date().getFullYear();

    setSelectedYearCode(yearCode);
    setForm(prev => ({
      ...prev,
      modelYear,
      manufacturingYear: prev.manufacturingYear > modelYear ? modelYear : prev.manufacturingYear,
    }));
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
      alert('Não foi possível gerar a descrição automática.');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!form.brand || !form.model || !form.vehicleTypeId || !selectedYearCode || form.PurchaseValue <= 0) {
        throw new Error('Preencha Tipo, Marca, Modelo, Ano/Modelo e Valor de Compra.');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overscroll-contain bg-black/70 p-2 backdrop-blur-sm sm:p-4">
      <div className="my-auto flex max-h-[calc(100dvh-1rem)] w-full min-w-0 max-w-2xl flex-col overflow-hidden rounded-2xl border border-nexus-border bg-nexus-card sm:max-h-[90dvh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-nexus-border">
          <div>
            <h2 className="text-lg font-bold text-white">Cadastrar Novo Veículo</h2>
            <p className="mt-1 text-[11px] text-slate-500">Catálogo atualizado pela Tabela FIPE • seleção em cascata</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors cursor-pointer">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain p-3 sm:p-6">
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
                className="w-full bg-nexus-dark border border-nexus-border rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-nexus-accent cursor-pointer"
                required
              >
                {vehicleTypes.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Marca FIPE {loadingBrands && '⌛'} *</label>
              <select
                value={selectedBrandCode}
                onChange={(e) => handleBrandChange(e.target.value)}
                disabled={loadingBrands || brands.length === 0}
                className="w-full bg-nexus-dark border border-nexus-border rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-nexus-accent cursor-pointer disabled:opacity-50"
                required
              >
                <option value="">{loadingBrands ? 'Carregando marcas...' : 'Selecione a marca'}</option>
                {brands.map((b) => <option key={b.code} value={b.code}>{b.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Modelo FIPE {loadingModels && '⌛'} *</label>
              <select
                value={selectedModelCode}
                onChange={(e) => handleModelChange(e.target.value)}
                disabled={!selectedBrandCode || loadingModels}
                className="w-full bg-nexus-dark border border-nexus-border rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-nexus-accent cursor-pointer disabled:opacity-50"
                required
              >
                <option value="">{loadingModels ? 'Carregando modelos...' : 'Selecione o modelo'}</option>
                {models.map((m) => <option key={m.code} value={m.code}>{m.name}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Ano / Modelo FIPE {loadingYears && '⌛'} *</label>
              <select
                value={selectedYearCode}
                onChange={(e) => handleYearChange(e.target.value)}
                disabled={!selectedModelCode || loadingYears}
                className="w-full bg-nexus-dark border border-nexus-border rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-nexus-accent cursor-pointer disabled:opacity-50"
                required
              >
                <option value="">{loadingYears ? 'Carregando anos...' : 'Selecione o ano/modelo'}</option>
                {years.map((y) => <option key={y.code} value={y.code}>{y.name}</option>)}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Versão / Configuração FIPE</label>
              <input
                type="text"
                value={form.version}
                readOnly
                title="A FIPE informa a configuração junto ao modelo selecionado."
                className="w-full bg-nexus-dark/70 border border-nexus-border rounded-lg p-2.5 text-sm text-slate-300 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Ano Fab.</label>
              <select
                value={form.manufacturingYear}
                onChange={(e) => setForm(prev => ({ ...prev, manufacturingYear: Number(e.target.value) }))}
                className="w-full bg-nexus-dark border border-nexus-border rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-nexus-accent cursor-pointer font-semibold"
              >
                {FALLBACK_YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Placa</label>
              <input
                type="text"
                value={form.plate}
                onChange={(e) => setForm(prev => ({ ...prev, plate: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 7) }))}
                placeholder="ABC1D23"
                maxLength={7}
                className="w-full bg-nexus-dark border border-nexus-border rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-nexus-accent font-mono uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">KM</label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9.]*"
                autoComplete="off"
                value={form.mileage ? form.mileage.toLocaleString('pt-BR') : ''}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, '');
                  setForm(prev => ({ ...prev, mileage: digits ? Number(digits) : 0 }));
                }}
                placeholder="Ex.: 85.000"
                aria-label="Quilometragem em quilômetros"
                className="w-full bg-nexus-dark border border-nexus-border rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-nexus-accent"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Cor</label>
              <select
                value={form.color}
                onChange={(e) => setForm(prev => ({ ...prev, color: e.target.value }))}
                className="w-full bg-nexus-dark border border-nexus-border rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-nexus-accent cursor-pointer"
              >
                {VEHICLE_COLORS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Câmbio</label>
              <select
                value={form.transmission}
                onChange={(e) => setForm(prev => ({ ...prev, transmission: Number(e.target.value) as TransmissionType }))}
                className="w-full bg-nexus-dark border border-nexus-border rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-nexus-accent cursor-pointer"
              >
                <option value={TransmissionType.Automatico}>Automático</option>
                <option value={TransmissionType.Manual}>Manual</option>
                <option value={TransmissionType.CVT}>CVT</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Combustível</label>
              <select
                value={form.fuel}
                onChange={(e) => setForm(prev => ({ ...prev, fuel: Number(e.target.value) as FuelType }))}
                className="w-full bg-nexus-dark border border-nexus-border rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-nexus-accent cursor-pointer"
              >
                {Object.entries(FuelType).filter(([key]) => Number.isNaN(Number(key))).map(([key, value]) => (
                  <option key={key} value={value}>{key}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Chassi</label>
              <input
                type="text"
                value={form.chassis}
                onChange={(e) => setForm(prev => ({ ...prev, chassis: e.target.value.toUpperCase().slice(0, 17) }))}
                maxLength={17}
                className="w-full bg-nexus-dark border border-nexus-border rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-nexus-accent font-mono uppercase"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Valor de Compra (R$) *</label>
              <CurrencyInput
                value={form.PurchaseValue}
                onChange={(val) => setForm(prev => ({ ...prev, PurchaseValue: val }))}
                placeholder="R$ 0,00"
                className="w-full bg-nexus-dark border border-nexus-border rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-nexus-accent"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Valor Anunciado (R$)</label>
              <CurrencyInput
                value={form.ListedValue || 0}
                onChange={(val) => setForm(prev => ({ ...prev, ListedValue: val }))}
                placeholder="R$ 0,00"
                className="w-full bg-nexus-dark border border-nexus-border rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-nexus-accent"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-400 uppercase">Observações / Descrição do Anúncio</label>
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
              placeholder="Detalhes adicionais sobre o estado do veículo ou descrição gerada por IA..."
              className="w-full bg-nexus-dark border border-nexus-border rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-nexus-accent"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-nexus-border">
            <button type="button" onClick={onClose} className="px-4 py-2.5 text-sm font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer">
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
