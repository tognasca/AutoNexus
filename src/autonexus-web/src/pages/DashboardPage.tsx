import { useState, useEffect } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import { dashboardService, type DashboardSummary } from '../services/dashboardService';
import { formatCurrency, formatDate } from '../utils/formatters';
import { LayoutDashboard, Car, ArrowLeftRight, CheckCircle2, Loader2 } from 'lucide-react';

export function DashboardPage({ currentView, onNavigate }: { currentView?: string; onNavigate?: (view: string) => void }) {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const data = await dashboardService.getSummary();
      setSummary(data);
    } catch (err) {
      console.error('Erro ao carregar dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  return (
    <MainLayout currentView={currentView} onNavigate={onNavigate}>
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
           <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <LayoutDashboard className="text-nexus-accent" size={24} />
            Dashboard Operacional
          </h1>
          <p className="text-xs md:text-sm text-slate-400">Métricas em tempo real calculadas a partir do estoque.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 text-slate-500 gap-3">
          <Loader2 className="animate-spin text-nexus-accent" size={32} />
          <span className="text-sm">Carregando indicadores...</span>
        </div>
      ) : !summary ? (
        <p className="text-slate-400 text-sm">Falha ao carregar indicadores.</p>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-nexus-card border border-nexus-border rounded-xl p-5 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">À Venda</span>
                <span className="text-3xl font-black text-blue-400">{summary.kpis.vehiclesForSale}</span>
              </div>
              <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400">
                <Car size={24} />
              </div>
            </div>

            <div className="bg-nexus-card border border-nexus-border rounded-xl p-5 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Em Troca</span>
                <span className="text-3xl font-black text-amber-400">{summary.kpis.vehiclesInTrade}</span>
              </div>
              <div className="p-3 bg-amber-500/10 rounded-xl text-amber-400">
                <ArrowLeftRight size={24} />
              </div>
            </div>

            <div className="bg-nexus-card border border-nexus-border rounded-xl p-5 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Vendidos</span>
                <span className="text-3xl font-black text-emerald-400">{summary.kpis.vehiclesSold}</span>
              </div>
              <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400">
                <CheckCircle2 size={24} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-nexus-card border border-nexus-border rounded-xl p-5 space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Custo do Estoque</span>
              <p className="text-xl font-bold text-white">{formatCurrency(summary.kpis.totalStockCost)}</p>
            </div>

            <div className="bg-nexus-card border border-nexus-border rounded-xl p-5 space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Valor Anunciado</span>
              <p className="text-xl font-bold text-emerald-400">{formatCurrency(summary.kpis.totalStockListedValue)}</p>
            </div>

            <div className="bg-nexus-card border border-nexus-border rounded-xl p-5 space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">FIPE Total</span>
              <p className="text-xl font-bold text-blue-400">{formatCurrency(summary.kpis.totalStockFipeValue)}</p>
            </div>

            <div className="bg-nexus-card border border-emerald-500/30 bg-emerald-500/5 rounded-xl p-5 space-y-1">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">Margem Potencial</span>
              <p className="text-2xl font-black text-emerald-400">{formatCurrency(summary.kpis.estimatedPotentialMargin)}</p>
            </div>
          </div>

          <div className="bg-nexus-card border border-nexus-border rounded-xl p-6 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">Últimas Atualizações no Estoque</h2>

            {summary.recentActivities.length === 0 ? (
              <p className="text-xs text-slate-500">Nenhuma atividade recente encontrada.</p>
            ) : (
              <div className="border border-nexus-border rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] border-b border-nexus-border">
                    <tr>
                      <th className="p-3">Veículo</th>
                      <th className="p-3">Operação</th>
                      <th className="p-3">Data</th>
                      <th className="p-3 text-right">Valor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-nexus-border text-slate-300">
                    {summary.recentActivities.map((act, index) => (
                      <tr key={index} className="hover:bg-slate-900/40 transition-colors">
                        <td className="p-3 font-semibold text-white">{act.vehicleName}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-nexus-border text-slate-300">
                            {act.operationType}
                          </span>
                        </td>
                        <td className="p-3 text-slate-400">{formatDate(act.date)}</td>
                        <td className="p-3 text-right font-bold text-emerald-400">{formatCurrency(act.value)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </MainLayout>
  );
}
