import React, { useEffect, useState } from 'react';
import { request } from '../../services/api';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { MainLayout } from '../../components/layout/MainLayout';
import { Award, RefreshCw, Printer, ChevronDown, ChevronUp, Calendar, User } from 'lucide-react';

interface SoldVehicleDetail {
  vehicleId: string;
  brand: string;
  model: string;
  plate?: string;
  saleValue: number;
  soldByName: string;
  soldAt: string;
}

interface SellerCommission {
  sellerId: string;
  sellerName: string;
  totalSalesCount: number;
  totalSalesVolume: number;
  totalProfitGenerated: number;
  commissionRatePercentage: number;
  totalCommissionAmount: number;
  soldVehicles: SoldVehicleDetail[];
}

interface CommissionPageProps {
  currentView?: string;
  onNavigate?: (view: string) => void;
}

export function CommissionPage({ currentView, onNavigate }: CommissionPageProps) {
  const [commissions, setCommissions] = useState<SellerCommission[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSellerId, setExpandedSellerId] = useState<string | null>(null);

  const loadCommissions = async () => {
    setLoading(true);
    try {
      const data = await request<SellerCommission[]>('/reports/commissions');
      setCommissions(data);
    } catch (err) {
      console.error('Erro ao carregar comissões:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCommissions();
  }, []);

  const toggleExpand = (id: string) => {
    setExpandedSellerId(expandedSellerId === id ? null : id);
  };

  const totalCommissionsPaid = commissions.reduce((sum, c) => sum + c.totalCommissionAmount, 0);
  const totalVolumeAll = commissions.reduce((sum, c) => sum + c.totalSalesVolume, 0);
  const totalProfitAll = commissions.reduce((sum, c) => sum + c.totalProfitGenerated, 0);

  return (
    <MainLayout currentView={currentView} onNavigate={onNavigate}>
      {/* Container Full Width (100% da largura da tela) */}
      <div className="space-y-6 p-4 sm:p-6 w-full">
        
        {/* Cabeçalho */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-nexus-border pb-4 w-full">
          <div>
             <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Award className="w-6 h-6 text-amber-400" />
              Relatório de Comissões & Desempenho de Vendedores
            </h1>
            <p className="text-xs md:text-sm text-nexus-text-muted mt-1">
              Extrato detalhado com Vendedor, Data/Hora da venda, Lucro e Comissão.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadCommissions}
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
              Imprimir Extrato
            </button>
          </div>
        </div>

        {/* Cards Resumo (Largura Total) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
          <div className="bg-nexus-card border border-nexus-border p-4 rounded-xl">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Volume Total Vendido</p>
            <p className="text-2xl font-bold text-white mt-1">{formatCurrency(totalVolumeAll)}</p>
          </div>

          <div className="bg-nexus-card border border-nexus-border p-4 rounded-xl">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Lucro Gerado para a Loja</p>
            <p className="text-2xl font-bold text-emerald-400 mt-1">{formatCurrency(totalProfitAll)}</p>
          </div>

          <div className="bg-nexus-card border border-nexus-border p-4 rounded-xl">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total em Comissões (A Pagar)</p>
            <p className="text-2xl font-bold text-amber-400 mt-1">{formatCurrency(totalCommissionsPaid)}</p>
          </div>
        </div>

        {/* Tabela Principal (Largura Total) */}
        <div className="bg-nexus-card border border-nexus-border rounded-xl overflow-hidden shadow-sm w-full">
          {loading ? (
            <div className="p-8 text-center text-slate-400">Carregando comissões...</div>
          ) : commissions.length === 0 ? (
            <div className="p-8 text-center text-slate-400">Nenhuma venda registrada para cálculo de comissões.</div>
          ) : (
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead>
                  <tr className="border-b border-nexus-border bg-slate-950/60 text-slate-400 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Vendedor Responsável</th>
                    <th className="py-3.5 px-4">Qtd. Vendas</th>
                    <th className="py-3.5 px-4">Volume Vendido</th>
                    <th className="py-3.5 px-4">Lucro Gerado</th>
                    <th className="py-3.5 px-4">% Comissão</th>
                    <th className="py-3.5 px-4">Comissão A Pagar</th>
                    <th className="py-3.5 px-4 text-center">Ver Carros Vendidos</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-nexus-border text-slate-200">
                  {commissions.map((c) => (
                    <React.Fragment key={c.sellerId}>
                      <tr className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-white flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold text-xs shrink-0">
                            {c.sellerName.charAt(0).toUpperCase()}
                          </div>
                          {c.sellerName}
                        </td>
                        <td className="py-3.5 px-4 font-semibold">{c.totalSalesCount} veículo(s)</td>
                        <td className="py-3.5 px-4 font-medium text-slate-300">{formatCurrency(c.totalSalesVolume)}</td>
                        <td className="py-3.5 px-4 font-medium text-emerald-400">{formatCurrency(c.totalProfitGenerated)}</td>
                        <td className="py-3.5 px-4 text-slate-400">{c.commissionRatePercentage.toFixed(1)}% sob lucro</td>
                        <td className="py-3.5 px-4 font-bold text-amber-400 text-sm">
                          {formatCurrency(c.totalCommissionAmount)}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={() => toggleExpand(c.sellerId)}
                            className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors cursor-pointer"
                            title="Expandir/recolher histórico do vendedor"
                          >
                            {expandedSellerId === c.sellerId ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </td>
                      </tr>

                      {/* Sub-tabela Expandida de Vendas */}
                      {expandedSellerId === c.sellerId && c.soldVehicles?.length > 0 && (
                        <tr className="bg-slate-950/80">
                          <td colSpan={7} className="p-4 border-l-2 border-blue-500">
                            <div className="space-y-2">
                              <p className="font-bold text-blue-400 text-xs uppercase tracking-wider flex items-center gap-1.5">
                                <User className="w-3.5 h-3.5" /> Histórico de Vendas Fechadas por {c.sellerName}
                              </p>
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                {c.soldVehicles.map((item, idx) => (
                                  <div key={idx} className="bg-slate-900 border border-slate-800 p-3 rounded-lg flex justify-between items-center text-xs">
                                    <div>
                                      <p className="font-bold text-white">{item.brand} {item.model}</p>
                                      {item.plate && <p className="text-[10px] text-slate-400 font-mono">Placa: {item.plate}</p>}
                                      <p className="text-[10px] text-blue-300 flex items-center gap-1 mt-1">
                                        <Calendar className="w-3 h-3 shrink-0" /> Vendido em: {formatDateTime(item.soldAt)}
                                      </p>
                                    </div>
                                    <div className="text-right ml-2">
                                      <span className="text-[10px] text-slate-500 block">Valor da Venda</span>
                                      <span className="font-bold text-emerald-400">{formatCurrency(item.saleValue)}</span>
                                    </div>
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
          )}
        </div>

      </div>
    </MainLayout>
  );
}