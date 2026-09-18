import { useState, useEffect } from 'react';
import { CurrencyInput } from '../ui/CurrencyInput';
import { X, CheckCircle2, Loader2 } from 'lucide-react';
import { request } from '../../services/api';
import type { VehicleSummary } from '../../types/vehicle';

interface VehicleSaleModalProps {
  isOpen: boolean;
  vehicle: VehicleSummary | null;
  onClose: () => void;
  onSaleCompleted: () => void;
}

export function VehicleSaleModal({ isOpen, vehicle, onClose, onSaleCompleted }: VehicleSaleModalProps) {
  const [saleValue, setSaleValue] = useState<number>(0);
  const [soldAt, setSoldAt] = useState<string>(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (vehicle) {
      const initialVal = vehicle.saleValue || vehicle.listedValue || vehicle.purchaseValue || 0;
      setSaleValue(Number(initialVal));
    }
  }, [vehicle]);

  if (!isOpen || !vehicle) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const val = Number(saleValue);
    if (val <= 0) {
      setError('O valor de venda deve ser maior que R$ 0,00.');
      return;
    }

    try {
      setLoading(true);
      
      // Envia as chaves em ambos os formatos para garantir compatibilidade
      await request(`/vehicles/${vehicle.id}/sell`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          saleValue: val,
          SaleValue: val,
          soldAt: soldAt ? new Date(soldAt).toISOString() : new Date().toISOString()
        }),
      });

      onSaleCompleted();
      onClose();
    } catch (err: any) {
      console.error('Erro ao realizar venda:', err);
      setError(err.message || 'Erro ao registrar venda do veículo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-nexus-card border border-nexus-border rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-nexus-border">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <CheckCircle2 className="text-emerald-400" size={20} />
            Confirmar Venda do Veículo
          </h2>
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

          <div className="bg-slate-900/60 border border-slate-800 p-3.5 rounded-xl">
            <p className="text-xs font-semibold text-nexus-accent uppercase tracking-wider">{vehicle.brand}</p>
            <h3 className="text-base font-bold text-white">{vehicle.model} {vehicle.version}</h3>
            <p className="text-xs text-slate-400 font-mono mt-0.5">{vehicle.plate || 'SEM PLACA'} • {vehicle.modelYear}</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-emerald-400 uppercase mb-1">
              Valor Final da Venda (R$) *
            </label>
            <CurrencyInput
              value={saleValue}
              onChange={(val) => setSaleValue(val)}
              className="w-full bg-nexus-dark border border-emerald-500/40 rounded-lg p-2.5 text-base text-white font-bold focus:outline-none focus:border-emerald-400"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
              Data da Venda
            </label>
            <input
              type="date"
              value={soldAt}
              onChange={(e) => setSoldAt(e.target.value)}
              className="w-full bg-nexus-dark border border-nexus-border rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-nexus-accent"
              required
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
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-900/20"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? 'Confirmando...' : 'Confirmar Venda'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}