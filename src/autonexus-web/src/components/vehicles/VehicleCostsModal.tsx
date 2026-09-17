import { useState, useEffect } from 'react';
import { costService, type VehicleCostSummary, type CreateCostInput } from '../../services/costService';
import { lookupService } from '../../services/lookupService';
import type { LookupItem } from '../../types/lookup';
import type { VehicleSummary } from '../../types/vehicle';
import { CurrencyInput } from '../ui/CurrencyInput';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { X, Plus, Trash2, Loader2, Receipt, Calculator } from 'lucide-react';

interface VehicleCostsModalProps {
  isOpen: boolean;
  vehicle: VehicleSummary | null;
  onClose: () => void;
  onCostsUpdated: () => void;
}

export function VehicleCostsModal({ isOpen, vehicle, onClose, onCostsUpdated }: VehicleCostsModalProps) {
  const [summary, setSummary] = useState<VehicleCostSummary | null>(null);
  const [categories, setCategories] = useState<LookupItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<CreateCostInput>({
    costCategoryId: '',
    description: '',
    value: 0,
    costDate: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const loadData = async () => {
    if (!vehicle) return;
    try {
      setLoading(true);
      setError(null);
      const [summaryRes, categoriesRes] = await Promise.all([
        costService.getSummary(vehicle.id),
        lookupService.getCostCategories(),
      ]);
      setSummary(summaryRes);
      setCategories(categoriesRes);

      if (categoriesRes.length > 0 && !form.costCategoryId) {
        setForm((prev) => ({ ...prev, costCategoryId: categoriesRes[0].id }));
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar custos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && vehicle) {
      loadData();
    }
  }, [isOpen, vehicle]);

  if (!isOpen || !vehicle) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.costCategoryId || !form.description || form.value <= 0) {
      setError('Preencha a categoria, descrição e um valor maior que zero.');
      return;
    }

    try {
      setSubmitting(true);
      await costService.addCost(vehicle.id, form);
      setForm({
        costCategoryId: categories[0]?.id || '',
        description: '',
        value: 0,
        costDate: new Date().toISOString().split('T')[0],
        notes: '',
      });
      await loadData();
      onCostsUpdated();
    } catch (err: any) {
      setError(err.message || 'Erro ao lançar custo.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (costId: string) => {
    if (!confirm('Deseja realmente remover esta despesa?')) return;
    try {
      setError(null);
      await costService.deleteCost(vehicle.id, costId);
      await loadData();
      onCostsUpdated();
    } catch (err: any) {
      setError(err.message || 'Erro ao excluir custo.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-nexus-card border border-nexus-border rounded-2xl w-full max-w-4xl overflow-hidden my-8 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-nexus-border">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Calculator size={20} className="text-emerald-400" />
              Gestão de Custos
            </h2>
            <p className="text-xs text-slate-400">
              {vehicle.brand} {vehicle.model} {vehicle.plate ? `• ${vehicle.plate}` : ''}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors cursor-pointer">
            <X size={20} />
          </button>
        </div>

        {/* Resumo Financeiro Formatado em R$ */}
        <div className="p-6 border-b border-nexus-border bg-slate-900/40 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-nexus-dark border border-nexus-border rounded-xl p-4">
            <span className="text-[10px] uppercase font-semibold text-slate-500 block mb-1">Aquisição</span>
            <span className="text-xl font-bold text-white">{formatCurrency(summary?.PurchaseValue)}</span>
          </div>

          <div className="bg-nexus-dark border border-nexus-border rounded-xl p-4">
            <span className="text-[10px] uppercase font-semibold text-slate-500 block mb-1">Outras Despesas</span>
            <span className="text-xl font-bold text-amber-400">+{formatCurrency(summary?.totalAdditionalCosts)}</span>
          </div>

          <div className="bg-nexus-dark border border-emerald-500/30 bg-emerald-500/5 rounded-xl p-4">
            <span className="text-[10px] uppercase font-semibold text-emerald-400 block mb-1">Custo Total Atual</span>
            <span className="text-2xl font-black text-emerald-400">{formatCurrency(summary?.totalVehicleCost)}</span>
          </div>
        </div>

        <div className="p-6 flex-1 overflow-y-auto space-y-6">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Lançamento com Máscara BRL */}
          <form onSubmit={handleSubmit} className="bg-slate-900/60 border border-nexus-border rounded-xl p-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-nexus-accent mb-2">Lançar Nova Despesa</h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Categoria *</label>
                <select
                  value={form.costCategoryId}
                  onChange={(e) => setForm({ ...form, costCategoryId: e.target.value })}
                  className="w-full bg-nexus-dark border border-nexus-border rounded-lg p-2 text-xs text-white focus:outline-none focus:border-nexus-accent"
                  required
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Descrição *</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Ex: Troca de óleo e filtro"
                  className="w-full bg-nexus-dark border border-nexus-border rounded-lg p-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-nexus-accent"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Valor (R$) *</label>
                <CurrencyInput
                  value={form.value}
                  onChange={(val) => setForm({ ...form, value: val })}
                  placeholder="R$ 0,00"
                  className="w-full bg-nexus-dark border border-nexus-border rounded-lg p-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-nexus-accent"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Data *</label>
                <input
                  type="date"
                  value={form.costDate}
                  onChange={(e) => setForm({ ...form, costDate: e.target.value })}
                  className="w-full bg-nexus-dark border border-nexus-border rounded-lg p-2 text-xs text-white focus:outline-none focus:border-nexus-accent"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5 shadow-md"
              >
                {submitting ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                Adicionar Despesa
              </button>
            </div>
          </form>

          {/* Tabela com Datas DD/MM/AAAA e Valores R$ */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Histórico de Despesas</h3>

            {loading ? (
              <div className="flex flex-col items-center justify-center h-32 text-slate-500 gap-2">
                <Loader2 className="animate-spin text-nexus-accent" size={24} />
                <span className="text-xs">Carregando custos...</span>
              </div>
            ) : summary?.costs.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-nexus-border rounded-xl text-slate-500">
                <Receipt size={32} className="mx-auto mb-2 opacity-50" />
                <p className="text-xs">Nenhuma despesa adicional registrada além do valor de compra.</p>
              </div>
            ) : (
              <div className="border border-nexus-border rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] border-b border-nexus-border">
                    <tr>
                      <th className="p-3">Data</th>
                      <th className="p-3">Categoria</th>
                      <th className="p-3">Descrição</th>
                      <th className="p-3 text-right">Valor</th>
                      <th className="p-3 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-nexus-border text-slate-300">
                    {summary?.costs.map((cost) => (
                      <tr key={cost.id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="p-3 whitespace-nowrap text-slate-400">
                          {formatDate(cost.costDate)}
                        </td>
                        <td className="p-3 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-nexus-border text-blue-400">
                            {cost.costCategoryName}
                          </span>
                        </td>
                        <td className="p-3 font-medium text-white">{cost.description}</td>
                        <td className="p-3 text-right font-bold text-amber-400 whitespace-nowrap">
                          {formatCurrency(cost.value)}
                        </td>
                        <td className="p-3 text-center whitespace-nowrap">
                          <button
                            onClick={() => handleDelete(cost.id)}
                            className="p-1.5 hover:bg-red-500/10 text-slate-500 hover:text-red-400 rounded transition-colors cursor-pointer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
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
