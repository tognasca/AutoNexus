import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { CurrencyInput } from '../ui/CurrencyInput';
import { request } from '../../services/api';
import { User, CheckCircle2, X } from 'lucide-react';

interface SellerOption {
  id: string;
  name: string;
}

export function VehicleSaleModal({ vehicle, isOpen, onClose, onSaleCompleted }: any) {
  const { user } = useAuth(); // Usuário logado
  const [saleValue, setSaleValue] = useState<number>(vehicle?.listedValue || vehicle?.purchaseValue || 0);
  const [selectedSellerId, setSelectedSellerId] = useState<string>(user?.id || '');
  const [sellers, setSellers] = useState<SellerOption[]>([]);
  const [loading, setLoading] = useState(false);

  // Carrega a lista de vendedores da loja
  useEffect(() => {
    const fetchSellers = async () => {
      try {
        const data = await request<SellerOption[]>('/users');
        setSellers(data || []);
      } catch {
        // Fallback para o próprio usuário logado
        if (user) setSellers([{ id: user.userId, name: user.name }]);
      }
    };
    if (isOpen) fetchSellers();
  }, [isOpen, user]);

  const handleConfirmSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSellerId) {
      alert('Selecione o Vendedor responsável pela venda.');
      return;
    }

    setLoading(true);
    try {
      await request(`/vehicles/${vehicle.id}/sell`, {
        method: 'POST',
        body: JSON.stringify({
          saleValue: Number(saleValue),
          soldByUserId: selectedSellerId, // <-- Grava o Vendedor no banco!
          soldAt: new Date().toISOString()
        })
      });

      onSaleCompleted();
      onClose();
    } catch (err) {
      alert('Erro ao confirmar venda do veículo.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !vehicle) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md text-slate-100 shadow-2xl p-6 space-y-4">
        
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <h3 className="font-bold text-base text-emerald-400 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" /> Confirmar Venda do Veículo
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleConfirmSale} className="space-y-4 text-xs">
          <div>
            <p className="text-slate-400">Veículo:</p>
            <p className="text-sm font-bold text-white">{vehicle.brand} {vehicle.model} - {vehicle.plate}</p>
          </div>

          {/* Seleção do Vendedor Responsável */}
          <div>
            <label className="text-slate-400 block mb-1 flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-blue-400" /> Vendedor Responsável *
            </label>
            <select
              value={selectedSellerId}
              onChange={e => setSelectedSellerId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
              required
            >
              <option value="">-- Selecione o Vendedor --</option>
              {sellers.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* Valor Real de Venda */}
          <div>
            <label className="text-slate-400 block mb-1">Valor Final da Venda (R$) *</label>
            <CurrencyInput value={saleValue} onChange={setSaleValue} />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl disabled:opacity-50"
            >
              {loading ? 'Confirmando...' : 'Confirmar Venda'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}