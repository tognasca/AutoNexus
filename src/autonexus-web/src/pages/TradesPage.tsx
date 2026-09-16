import { useState, useEffect } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import { tradeService, type TradeItem } from '../services/tradeService';
import { formatCurrency, formatDate } from '../utils/formatters';
import { ArrowLeftRight, Calendar, Loader2 } from 'lucide-react';

export function TradesPage({ currentView, onNavigate }: { currentView?: string; onNavigate?: (view: string) => void }) {
  const [trades, setTrades] = useState<TradeItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTrades = async () => {
    try {
      setLoading(true);
      const data = await tradeService.getAll();
      setTrades(data);
    } catch (err) {
      console.error('Erro ao carregar trocas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrades();
  }, []);

  return (
    <MainLayout currentView={currentView} onNavigate={onNavigate}>
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
           <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <ArrowLeftRight className="text-amber-400" size={24} />
            Histórico de Trocas
          </h1>
          <p className="text-xs md:text-sm text-slate-400">Operações de troca com cálculo transparente.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 text-slate-500 gap-3">
          <Loader2 className="animate-spin text-nexus-accent" size={32} />
          <span className="text-sm">Carregando trocas...</span>
        </div>
      ) : trades.length === 0 ? (
        <div className="bg-nexus-card border border-nexus-border rounded-xl p-12 text-center text-slate-400">
          <ArrowLeftRight size={48} className="mx-auto mb-3 opacity-30 text-amber-400" />
          <p className="text-base font-medium">Nenhuma operação de troca realizada.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {trades.map((trade) => (
            <div key={trade.id} className="bg-nexus-card border border-nexus-border rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-nexus-border pb-3 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <Calendar size={14} />
                  <span>Data: {formatDate(trade.tradeDate)}</span>
                </div>
                <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  TROCA CONCLUÍDA
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-3 bg-slate-900 rounded-lg border border-nexus-border">
                  <span className="text-[10px] text-amber-400 font-bold uppercase block mb-1">Entregue (Saída)</span>
                  <p className="text-sm font-bold text-white">{trade.deliveredVehicleName}</p>
                  <p className="text-slate-400 mt-1">FIPE: {formatCurrency(trade.deliveredVehicleFipe)}</p>
                </div>

                <div className="p-3 bg-slate-900 rounded-lg border border-nexus-border">
                  <span className="text-[10px] text-blue-400 font-bold uppercase block mb-1">Recebido (Entrada)</span>
                  <p className="text-sm font-bold text-white">{trade.receivedVehicleName}</p>
                  <p className="text-slate-400 mt-1">FIPE: {formatCurrency(trade.receivedVehicleFipe)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </MainLayout>
  );
}
