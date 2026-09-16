import { useState, useEffect } from 'react';
import { fipeService, type FipeSummary, type FipeLookupItem } from '../../services/fipeService';
import type { VehicleSummary } from '../../types/vehicle';
import { CurrencyInput } from '../ui/CurrencyInput';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { X, TrendingUp, RefreshCw, Plus, Calendar, History, ShieldAlert, Search, Loader2 } from 'lucide-react';

interface VehicleFipeModalProps {
  isOpen: boolean;
  vehicle: VehicleSummary | null;
  onClose: () => void;
  onFipeUpdated: () => void;
}

export function VehicleFipeModal({ isOpen, vehicle, onClose, onFipeUpdated }: VehicleFipeModalProps) {
  const [summary, setSummary] = useState<FipeSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'guided' | 'code' | 'manual'>('guided');

  const [brands, setBrands] = useState<FipeLookupItem[]>([]);
  const [models, setModels] = useState<FipeLookupItem[]>([]);
  const [years, setYears] = useState<FipeLookupItem[]>([]);

  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [selectedYear, setSelectedYear] = useState('');

  const [loadingBrands, setLoadingBrands] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);
  const [loadingYears, setLoadingYears] = useState(false);

  const [fipeCode, setFipeCode] = useState('');
  const [manualValue, setManualValue] = useState<number>(0);
  const [manualMonth, setManualMonth] = useState<number>(new Date().getMonth() + 1);
  const [manualYear, setManualYear] = useState<number>(new Date().getFullYear());
  const [manualNotes] = useState('');

  const loadData = async () => {
    if (!vehicle) return;
    try {
      setLoading(true);
      setError(null);
      const res = await fipeService.getSummary(vehicle.id);
      setSummary(res);
      await loadBrands();
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar FIPE.');
    } finally {
      setLoading(false);
    }
  };

  const loadBrands = async () => {
    if (!vehicle) return;
    try {
      setLoadingBrands(true);
      const res = await fipeService.getBrands(vehicle.id);
      setBrands(res);
    } catch (err) {
      console.error('Erro ao carregar marcas FIPE:', err);
    } finally {
      setLoadingBrands(false);
    }
  };

  useEffect(() => {
    if (isOpen && vehicle) {
      loadData();
    }
  }, [isOpen, vehicle]);

  const handleBrandChange = async (brandCode: string) => {
    setSelectedBrand(brandCode);
    setSelectedModel('');
    setSelectedYear('');
    setModels([]);
    setYears([]);

    if (!brandCode || !vehicle) return;
    try {
      setLoadingModels(true);
      const res = await fipeService.getModels(vehicle.id, brandCode);
      setModels(res);
    } catch (err: any) {
      setError('Erro ao carregar modelos para esta marca.');
    } finally {
      setLoadingModels(false);
    }
  };

  const handleModelChange = async (modelCode: string) => {
    setSelectedModel(modelCode);
    setSelectedYear('');
    setYears([]);

    if (!modelCode || !selectedBrand || !vehicle) return;
    try {
      setLoadingYears(true);
      const res = await fipeService.getYears(vehicle.id, selectedBrand, modelCode);
      setYears(res);
    } catch (err: any) {
      setError('Erro ao carregar anos para este modelo.');
    } finally {
      setLoadingYears(false);
    }
  };

  if (!isOpen || !vehicle) return null;

  const handleGuidedSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBrand || !selectedModel || !selectedYear) {
      setError('Selecione a Marca, o Modelo e o Ano do veículo.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await fipeService.fetchGuided(vehicle.id, vehicle.vehicleTypeName, selectedBrand, selectedModel, selectedYear);
      await loadData();
      onFipeUpdated();
    } catch (err: any) {
      setError(err.message || 'Falha ao buscar FIPE guiada.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fipeCode) {
      setError('Informe o código FIPE.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await fipeService.fetchFromBrasilApi(vehicle.id, fipeCode, vehicle.modelYear);
      await loadData();
      onFipeUpdated();
    } catch (err: any) {
      setError(err.message || 'Falha ao consultar código FIPE.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (manualValue <= 0) {
      setError('Informe um valor FIPE maior que zero.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await fipeService.addManual(vehicle.id, manualValue, manualMonth, manualYear, manualNotes);
      await loadData();
      onFipeUpdated();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar valor manual.');
    } finally {
      setSubmitting(false);
    }
  };

  const getMonthName = (m: number) => {
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return months[m - 1] || m;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-nexus-card border border-nexus-border rounded-2xl w-full max-w-3xl overflow-hidden my-8 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-nexus-border">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <TrendingUp size={20} className="text-blue-400" />
              Consulta e Histórico FIPE
            </h2>
            <p className="text-xs text-slate-400">
              {vehicle.brand} {vehicle.model} {vehicle.plate ? `• ${vehicle.plate}` : ''}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors cursor-pointer">
            <X size={20} />
          </button>
        </div>

        {/* Card Destaque Último FIPE em Reais */}
        <div className="p-6 border-b border-nexus-border bg-slate-900/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] uppercase font-semibold text-slate-500 block mb-1">Último Valor FIPE Registrado</span>
            <span className="text-3xl font-black text-blue-400">{formatCurrency(summary?.latestFipeValue)}</span>
            {summary?.latestReferenceMonth && (
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                <Calendar size={12} className="text-slate-500" />
                Referência: {getMonthName(summary.latestReferenceMonth)}/{summary.latestReferenceYear}
              </p>
            )}
          </div>

          <div className="text-right text-xs text-slate-500">
            <span className="block font-medium">Histórico Imutável</span>
            <span className="text-slate-300 font-semibold">Tabela FIPE Oficial</span>
          </div>
        </div>

        <div className="p-6 border-b border-nexus-border space-y-4">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm flex items-center gap-2">
              <ShieldAlert size={18} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveTab('guided')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'guided' ? 'bg-nexus-accent text-white' : 'bg-nexus-dark text-slate-400 border border-nexus-border'
              }`}
            >
              1. Buscar por Marca/Modelo/Ano
            </button>
            <button
              onClick={() => setActiveTab('code')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'code' ? 'bg-nexus-accent text-white' : 'bg-nexus-dark text-slate-400 border border-nexus-border'
              }`}
            >
              2. Código FIPE Direto
            </button>
            <button
              onClick={() => setActiveTab('manual')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'manual' ? 'bg-nexus-accent text-white' : 'bg-nexus-dark text-slate-400 border border-nexus-border'
              }`}
            >
              3. Lançamento Manual
            </button>
          </div>

          {activeTab === 'guided' && (
            <form onSubmit={handleGuidedSubmit} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Marca FIPE *</label>
                  <select
                    value={selectedBrand}
                    onChange={(e) => handleBrandChange(e.target.value)}
                    className="w-full bg-nexus-dark border border-nexus-border rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-nexus-accent"
                    disabled={loadingBrands}
                  >
                    <option value="">{loadingBrands ? 'Carregando...' : 'Selecione a Marca'}</option>
                    {brands.map((b) => (
                      <option key={b.code} value={b.code}>{b.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Modelo FIPE *</label>
                  <select
                    value={selectedModel}
                    onChange={(e) => handleModelChange(e.target.value)}
                    className="w-full bg-nexus-dark border border-nexus-border rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-nexus-accent"
                    disabled={!selectedBrand || loadingModels}
                  >
                    <option value="">{loadingModels ? 'Carregando...' : 'Selecione o Modelo'}</option>
                    {models.map((m) => (
                      <option key={m.code} value={m.code}>{m.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Ano / Combustível *</label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="w-full bg-nexus-dark border border-nexus-border rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-nexus-accent"
                    disabled={!selectedModel || loadingYears}
                  >
                    <option value="">{loadingYears ? 'Carregando...' : 'Selecione o Ano'}</option>
                    {years.map((y) => (
                      <option key={y.code} value={y.code}>{y.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submitting || !selectedYear}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-2 shadow-md"
                >
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                  Consultar e Gravar FIPE
                </button>
              </div>
            </form>
          )}

          {activeTab === 'code' && (
            <form onSubmit={handleCodeSubmit} className="flex flex-col sm:flex-row gap-3 items-end">
              <div className="flex-1">
                <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Código FIPE *</label>
                <input
                  type="text"
                  value={fipeCode}
                  onChange={(e) => setFipeCode(e.target.value)}
                  placeholder="Ex: 005323-6"
                  className="w-full bg-nexus-dark border border-nexus-border rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-nexus-accent"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-2 shadow-md shrink-0"
              >
                {submitting ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                Buscar por Código
              </button>
            </form>
          )}

          {/* Lançamento Manual com Máscara BRL */}
          {activeTab === 'manual' && (
            <form onSubmit={handleManualSubmit} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Valor (R$) *</label>
                <CurrencyInput
                  value={manualValue}
                  onChange={(val) => setManualValue(val)}
                  placeholder="R$ 0,00"
                  className="w-full bg-nexus-dark border border-nexus-border rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-nexus-accent"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Mês Ref. *</label>
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={manualMonth}
                  onChange={(e) => setManualMonth(Number(e.target.value))}
                  className="w-full bg-nexus-dark border border-nexus-border rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-nexus-accent"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Ano Ref. *</label>
                <input
                  type="number"
                  value={manualYear}
                  onChange={(e) => setManualYear(Number(e.target.value))}
                  className="w-full bg-nexus-dark border border-nexus-border rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-nexus-accent"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5 shadow-md"
              >
                {submitting ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                Salvar Manual
              </button>
            </form>
          )}
        </div>

        {/* Tabela de Histórico Formatado */}
        <div className="p-6 flex-1 overflow-y-auto">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
            <History size={16} />
            Histórico Mês a Mês
          </h3>

          {loading ? (
            <div className="flex flex-col items-center justify-center h-32 text-slate-500 gap-2">
              <Loader2 className="animate-spin text-nexus-accent" size={24} />
              <span className="text-xs">Carregando histórico...</span>
            </div>
          ) : summary?.history.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-nexus-border rounded-xl text-slate-500">
              <TrendingUp size={32} className="mx-auto mb-2 opacity-50" />
              <p className="text-xs">Nenhum histórico FIPE registrado para este veículo.</p>
            </div>
          ) : (
            <div className="border border-nexus-border rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] border-b border-nexus-border">
                  <tr>
                    <th className="p-3">Mês / Ano Ref.</th>
                    <th className="p-3">Data Consulta</th>
                    <th className="p-3">Fonte</th>
                    <th className="p-3 text-right">Valor FIPE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-nexus-border text-slate-300">
                  {summary?.history.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="p-3 font-semibold text-white">
                        {getMonthName(item.referenceMonth)}/{item.referenceYear}
                      </td>
                      <td className="p-3 text-slate-400">
                        {formatDateTime(item.consultationDate)}
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-nexus-border text-slate-300">
                          {item.source || 'FIPE'}
                        </span>
                      </td>
                      <td className="p-3 text-right font-bold text-blue-400">
                        {formatCurrency(item.fipeValue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-nexus-border flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-nexus-border hover:bg-slate-700 text-white rounded-lg text-sm font-semibold transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
