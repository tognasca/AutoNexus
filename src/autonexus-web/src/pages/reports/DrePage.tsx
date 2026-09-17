import React, { useEffect, useState } from 'react';
import { reportService, DreSummary } from '../../services/reportService';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { MainLayout } from '../../components/layout/MainLayout';
import { Layers, TrendingUp, TrendingDown, ChevronDown, ChevronUp, Printer, RefreshCw, User, Calendar } from 'lucide-react';

interface DrePageProps {
  currentView?: string;
  onNavigate?: (view: string) => void;
}

export function DrePage({ currentView, onNavigate }: DrePageProps) {
  const [data, setData] = useState<DreSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedVehicleId, setExpandedVehicleId] = useState<string | null>(null);

  const loadReport = async () => {
    setLoading(true);
    try {
      const summary = await reportService.getDreReport();
      setData(summary);
    } catch (err) {
      console.error('Erro ao carregar relatório DRE:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, []);

  const toggleExpand = (id: string) => {
    setExpandedVehicleId(expandedVehicleId === id ? null : id);
  };

  return (
    <MainLayout currentView={currentView} onNavigate={onNavigate}>
      {/* w-full para usar 100% da largura da tela sem limitação */}
      <div className="space-y-6 p-4 sm:p-6 w-full">
        
        {/* Cabeçalho */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-nexus-border pb-4">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Layers className="w-6 h-6 text-blue-500" />
              DRE & Demonstrativo de Lucratividade por Veículo
            </h1>
            <p className="text-xs text-nexus-text-muted mt-1">
              Análise detalhada de receita, custos de aquisição, despesas operacionais e margem líquida por veículo.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadReport}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-colors cursor-pointer"
              title="Atualizar Dados"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-xs transition-colors shadow-sm cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              Imprimir DRE
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
            <span className="text-sm font-medium">Calculando indicadores financeiros do estoque...</span>
          </div>
        ) : !data ? (
          <div className="p-8 text-center text-slate-400 bg-nexus-card rounded-xl border border-nexus-border">
            Não foi possível carregar os dados do relatório DRE.
          </div>
        ) : (
          <>
            {/* Cards de Métricas Consolidadas (Largura Total) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
              <div className="bg-nexus-card border border-nexus-border p-4 rounded-xl">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Receita Potencial / Realizada</p>
                <p className="text-2xl font-bold text-white mt-1">{formatCurrency(data.totalRevenue)}</p>
                <p className="text-[10px] text-slate-500 mt-1">Soma de Vendas e Preços Anunciados</p>
              </div>

              <div className="bg-nexus-card border border-nexus-border p-4 rounded-xl">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Despesas Operacionais / Custos</p>
                <p className="text-2xl font-bold text-amber-400 mt-1">{formatCurrency(data.totalDirectExpenses)}</p>
                <p className="text-[10px] text-slate-500 mt-1">Manutenção, Funilaria e Oficina</p>
              </div>

              <div className="bg-nexus-card border border-nexus-border p-4 rounded-xl">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Lucro Líquido do Estoque</p>
                <p className={`text-2xl font-bold mt-1 ${data.totalNetProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {formatCurrency(data.totalNetProfit)}
                </p>
                <p className="text-[10px] text-slate-500 mt-1">Resultado final após custos do ativo</p>
              </div>

              <div className="bg-nexus-card border border-nexus-border p-4 rounded-xl">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Margem Média Geral</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-2xl font-bold ${data.averageMarginPercentage >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {data.averageMarginPercentage.toFixed(2)}%
                  </span>
                  {data.averageMarginPercentage >= 0 ? (
                    <TrendingUp className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <TrendingDown className="w-5 h-5 text-rose-400" />
                  )}
                </div>
                <p className="text-[10px] text-slate-500 mt-1">Retorno sobre o faturamento</p>
              </div>
            </div>

            {/* Tabela de Veículos no DRE (Espaçada e em Largura Total) */}
            <div className="bg-nexus-card border border-nexus-border rounded-xl overflow-hidden shadow-sm w-full">
              <div className="p-4 border-b border-nexus-border bg-slate-900/50 flex justify-between items-center">
                <h3 className="font-semibold text-sm text-white">Detalhamento por Veículo ({data.totalVehiclesCount})</h3>
                <span className="text-xs text-slate-400">Ordenado por Lucro Líquido</span>
              </div>

              <div className="overflow-x-auto w-full">
                <table className="w-full text-left text-xs whitespace-nowrap">
                  <thead>
                    <tr className="border-b border-nexus-border bg-slate-950/60 text-slate-400 uppercase tracking-wider">
                      <th className="py-3.5 px-4">Veículo</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4">Vendedor Responsável</th>
                      <th className="py-3.5 px-4">Data / Hora Venda</th>
                      <th className="py-3.5 px-4">Valor Compra</th>
                      <th className="py-3.5 px-4">Custos Extras</th>
                      <th className="py-3.5 px-4">Custo Base Total</th>
                      <th className="py-3.5 px-4">Valor Venda/Anunciado</th>
                      <th className="py-3.5 px-4">Lucro Líquido</th>
                      <th className="py-3.5 px-4">Margem (%)</th>
                      <th className="py-3.5 px-4 text-center">Custos</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-nexus-border text-slate-200">
                    {data.vehicles.map((v) => (
                      <React.Fragment key={v.vehicleId}>
                        <tr className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-white">
                            {v.brand} {v.model}
                            {v.plate && (
                              <span className="ml-2 font-mono text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
                                {v.plate}
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                              v.status === 'Vendido' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                            }`}>
                              {v.status}
                            </span>
                          </td>

                          {/* COLUNA: VENDEDOR */}
                          <td className="py-3.5 px-4 font-semibold">
                            {v.status === 'Vendido' ? (
                              <span className="text-white flex items-center gap-1.5">
                                <User className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                                {v.soldByName || 'Vendedor Sistema'}
                              </span>
                            ) : (
                              <span className="text-slate-500 text-[10px] italic">Em estoque</span>
                            )}
                          </td>

                          {/* COLUNA: DATA / HERA DA VENDA */}
                          <td className="py-3.5 px-4 text-slate-300 font-mono">
                            {v.status === 'Vendido' ? (
                              <span className="text-blue-300 flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                                {v.soldAt ? formatDateTime(v.soldAt) : '-'}
                              </span>
                            ) : (
                              <span className="text-slate-500 text-[10px] italic">-</span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-slate-300">{formatCurrency(v.PurchaseValue)}</td>
                          <td className="py-3.5 px-4 font-medium text-amber-400">{formatCurrency(v.totalDirectCosts)}</td>
                          <td className="py-3.5 px-4 text-slate-300 font-medium">{formatCurrency(v.totalCostBase)}</td>
                          <td className="py-3.5 px-4 font-bold text-blue-400">{formatCurrency(v.targetOrSaleValue)}</td>
                          <td className={`py-3.5 px-4 font-bold text-sm ${v.profitOrMargin >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {formatCurrency(v.profitOrMargin)}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`inline-flex items-center gap-1 font-bold px-2.5 py-0.5 rounded-full text-[10px] ${v.marginPercentage >= 0 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                              {v.marginPercentage >= 0 ? '+' : ''}{v.marginPercentage.toFixed(2)}%
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            {v.costs.length > 0 ? (
                              <button
                                onClick={() => toggleExpand(v.vehicleId)}
                                className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors cursor-pointer"
                                title="Ver custos deste veículo"
                              >
                                {expandedVehicleId === v.vehicleId ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </button>
                            ) : (
                              <span className="text-[10px] text-slate-600">-</span>
                            )}
                          </td>
                        </tr>

                        {/* Detalhamento Expandido de Custos */}
                        {expandedVehicleId === v.vehicleId && v.costs.length > 0 && (
                          <tr className="bg-slate-950/80">
                            <td colSpan={11} className="p-4 border-l-2 border-amber-500">
                              <div className="space-y-2">
                                <p className="font-bold text-amber-400 text-xs uppercase tracking-wider">
                                  Detalhamento de Custos Operacionais - {v.brand} {v.model}
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                  {v.costs.map((c, idx) => (
                                    <div key={idx} className="bg-slate-900 border border-slate-800 p-2.5 rounded-lg flex justify-between items-center text-xs">
                                      <div>
                                        <p className="font-medium text-slate-200">{c.description}</p>
                                        <p className="text-[10px] text-slate-500">{c.categoryName}</p>
                                      </div>
                                      <span className="font-bold text-amber-400">{formatCurrency(c.value)}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
}