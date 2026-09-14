import { useState } from 'react';
import { tradeService, type CompleteSaleInput } from '../../services/tradeService';
import type { VehicleSummary } from '../../types/vehicle';
import { CurrencyInput } from '../ui/CurrencyInput';
import { formatCurrency } from '../../utils/formatters';
import { X, CheckCircle2, DollarSign, Loader2, User, CreditCard } from 'lucide-react';

interface VehicleSaleModalProps {
  isOpen: boolean;
  vehicle: VehicleSummary | null;
  onClose: () => void;
  onSaleCompleted: () => void;
}

export function VehicleSaleModal({ isOpen, vehicle, onClose, onSaleCompleted }: VehicleSaleModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<CompleteSaleInput>({
    saleValue: vehicle?.listedValue || vehicle?.purchaseValue || 0,
    buyerName: '',
    paymentMethod: 'À Vista / Pix',
    notes: '',
  });

  if (!isOpen || !vehicle) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.saleValue <= 0) {
      setError('Informe um valor de venda válido.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await tradeService.completeSale(vehicle.id, form);
      onSaleCompleted();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao finalizar venda.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-nexus-card border border-nexus-border rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-nexus-border">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={20} className="text-emerald-400" />
            <h2 className="text-lg font-bold text-white">Finalizar Venda</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors cursor-pointer">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="p-3 bg-slate-900/60 border border-nexus-border rounded-xl">
            <p className="text-xs font-semibold text-nexus-accent uppercase tracking-wider">{vehicle.brand}</p>
            <p className="text-base font-bold text-white">{vehicle.model} {vehicle.version}</p>
            <p className="text-xs text-slate-400 mt-0.5">Placa: {vehicle.plate || 'N/A'}</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Valor de Venda (R$) *</label>
            <CurrencyInput
              value={form.saleValue}
              onChange={(val) => setForm({ ...form, saleValue: val })}
              placeholder="R$ 0,00"
              className="w-full bg-nexus-dark border border-nexus-border rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-nexus-accent"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Nome do Comprador</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input
                type="text"
                value={form.buyerName}
                onChange={(e) => setForm({ ...form, buyerName: e.target.value })}
                placeholder="Ex: João da Silva"
                className="w-full pl-10 pr-4 py-2.5 bg-nexus-dark border border-nexus-border rounded-lg text-sm text-white focus:outline-none focus:border-nexus-accent"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Forma de Pagamento</label>
            <div className="relative">
              <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <select
                value={form.paymentMethod}
                onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 bg-nexus-dark border border-nexus-border rounded-lg text-sm text-white focus:outline-none focus:border-nexus-accent"
              >
                <option value="À Vista / Pix">À Vista / Pix</option>
                <option value="Financiamento Bancário">Financiamento Bancário</option>
                <option value="Cartão de Crédito">Cartão de Crédito</option>
                <option value="Transferência Bancária">Transferência Bancária</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Observações</label>
            <textarea
              rows={2}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Notas adicionais sobre a venda..."
              className="w-full bg-nexus-dark border border-nexus-border rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-nexus-accent"
            />
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
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-2 shadow-lg shadow-emerald-600/20"
            >
              {submitting ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
              Confirmar Venda
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
