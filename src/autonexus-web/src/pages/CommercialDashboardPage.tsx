import { useEffect, useMemo, useState } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import { dashboardService, type DashboardSummary } from '../services/dashboardService';
import { catalogService, type PublicStoreInfo } from '../services/catalogService';
import { formatCurrency, formatDate } from '../utils/formatters';
import { ArrowRight, BarChart3, Car, CheckCircle2, ExternalLink, Globe2, Loader2, MessageCircle, Sparkles, TrendingUp } from 'lucide-react';

interface Props { currentView?: string; onNavigate?: (view: string) => void; }

export function CommercialDashboardPage({ currentView, onNavigate }: Props) {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [store, setStore] = useState<PublicStoreInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      dashboardService.getSummary(),
      catalogService.getPublicCatalog('current').catch(() => ({ items: [], store: undefined })),
    ]).then(([dashboard, catalog]) => {
      setSummary(dashboard);
      setStore(catalog.store || null);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const whatsapp = store?.whatsappNumber?.replace(/\D/g, '');
  const catalogUrl = store?.slug ? `${window.location.origin}/loja/${store.slug}` : `${window.location.origin}/catalogo`;
  const recentSales = useMemo(() => summary?.recentActivities.filter(x => /vend|sale/i.test(x.operationType) || /vend|sale/i.test(x.status)) ?? [], [summary]);
  const commercialSignal = summary ? (summary.kpis.vehiclesForSale > 0 ? 'Estoque pronto para venda' : 'Comece cadastrando seu primeiro veículo') : 'Preparando indicadores';

  if (loading) return <MainLayout currentView={currentView} onNavigate={onNavigate}><div className="min-h-[50vh] flex items-center justify-center text-slate-400 gap-2"><Loader2 className="animate-spin text-blue-400"/>Carregando painel comercial...</div></MainLayout>;

  return <MainLayout currentView={currentView} onNavigate={onNavigate}>
    <div className="max-w-7xl mx-auto space-y-6">
      <section className="rounded-3xl border border-blue-500/20 bg-gradient-to-br from-blue-950/60 via-slate-900 to-slate-950 p-6 md:p-8">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-blue-300"><Sparkles className="h-3.5 w-3.5"/>Painel comercial</div>
            <h1 className="mt-4 text-2xl md:text-4xl font-black tracking-tight text-white">Transforme seu estoque em oportunidades de venda.</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">Uma visão rápida do que está disponível, do valor do estoque e dos próximos caminhos para vender mais.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/20 px-5 py-4 min-w-[220px]"><p className="text-[10px] uppercase tracking-wider text-slate-500">Sinal comercial</p><p className="mt-1 font-bold text-white">{commercialSignal}</p></div>
        </div>
      </section>

      {!summary ? <div className="rounded-2xl border border-red-500/20 bg-red-950/20 p-5 text-sm text-red-300">Não foi possível carregar os indicadores comerciais.</div> : <>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <Metric icon={Car} label="Veículos à venda" value={String(summary.kpis.vehiclesForSale)} accent="text-blue-400" />
          <Metric icon={TrendingUp} label="Valor anunciado" value={formatCurrency(summary.kpis.totalStockListedValue)} accent="text-emerald-400" />
          <Metric icon={BarChart3} label="Margem potencial" value={formatCurrency(summary.kpis.estimatedPotentialMargin)} accent="text-amber-400" />
          <Metric icon={CheckCircle2} label="Vendidos" value={String(summary.kpis.vehiclesSold)} accent="text-violet-400" />
        </div>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 rounded-2xl border border-nexus-border bg-nexus-card p-5 md:p-6">
            <div className="flex items-center justify-between gap-3"><div><h2 className="font-bold text-white">Próximas ações de venda</h2><p className="mt-1 text-xs text-slate-500">Atalhos para tirar o cliente da intenção e levar para a conversa.</p></div><TrendingUp className="h-5 w-5 text-blue-400"/></div>
            <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3">
              <Action title="Escolher veículo" text="Abra o estoque e encontre o carro certo para o cliente." icon={Car} onClick={() => onNavigate?.('vehicles')} />
              <Action title="Compartilhar catálogo" text="Mostre sua vitrine com a identidade da loja." icon={Globe2} onClick={() => onNavigate?.('catalog')} />
              <Action title="Simular proposta" text="Quando houver interesse, avance para a simulação." icon={ArrowRight} onClick={() => onNavigate?.('simulator')} />
            </div>
          </div>

          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/20 p-5 md:p-6">
            <h2 className="font-bold text-white">Atendimento</h2>
            <p className="mt-1 text-xs leading-5 text-slate-500">Use o WhatsApp comercial configurado para continuar a negociação.</p>
            {whatsapp ? <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer" className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-3 text-sm font-bold text-white"><MessageCircle className="h-4 w-4"/>Abrir WhatsApp <ExternalLink className="h-4 w-4"/></a> : <button onClick={() => onNavigate?.('tenant-settings')} className="mt-5 w-full rounded-xl bg-slate-800 hover:bg-slate-700 px-4 py-3 text-sm font-bold text-white">Configurar WhatsApp</button>}
          </div>
        </section>

        <section className="rounded-2xl border border-nexus-border bg-nexus-card p-5 md:p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3"><div><h2 className="font-bold text-white">Últimas movimentações</h2><p className="mt-1 text-xs text-slate-500">Use o histórico existente como sinal do ritmo comercial da loja.</p></div><button onClick={() => onNavigate?.('dashboard')} className="text-xs font-bold text-blue-400 hover:text-blue-300">Ver dashboard completo</button></div>
          {summary.recentActivities.length === 0 ? <p className="mt-5 text-sm text-slate-500">Ainda não há movimentações registradas.</p> : <div className="mt-5 overflow-x-auto"><table className="w-full text-left text-xs"><thead className="text-[10px] uppercase text-slate-500 border-b border-nexus-border"><tr><th className="py-3 pr-3">Veículo</th><th className="py-3 pr-3">Operação</th><th className="py-3 pr-3">Data</th><th className="py-3 text-right">Valor</th></tr></thead><tbody className="divide-y divide-nexus-border">{summary.recentActivities.slice(0, 8).map((item, index) => <tr key={`${item.vehicleId}-${index}`}><td className="py-3 pr-3 font-semibold text-white">{item.vehicleName}</td><td className="py-3 pr-3 text-slate-400">{item.operationType}</td><td className="py-3 pr-3 text-slate-500">{formatDate(item.date)}</td><td className="py-3 text-right font-bold text-emerald-400">{formatCurrency(item.value)}</td></tr>)}</tbody></table></div>}
        </section>

        <section className="rounded-2xl border border-nexus-border bg-nexus-card p-5 md:p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"><div><h2 className="font-bold text-white">Sua vitrine digital</h2><p className="mt-1 text-xs text-slate-500">{recentSales.length > 0 ? 'Há sinais recentes de venda no histórico.' : 'Deixe o catálogo pronto para compartilhar quando surgir uma oportunidade.'}</p></div><a href={catalogUrl} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-xl border border-nexus-border bg-slate-900 px-4 py-3 text-xs font-bold text-white hover:border-blue-500/40">Abrir catálogo <ExternalLink className="h-4 w-4"/></a></div>
        </section>
      </>}
    </div>
  </MainLayout>;
}

function Metric({ icon: Icon, label, value, accent }: { icon: typeof Car; label: string; value: string; accent: string }) {
  return <div className="rounded-2xl border border-nexus-border bg-nexus-card p-5"><div className="flex items-center justify-between gap-3"><span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</span><Icon className={`h-5 w-5 ${accent}`}/></div><p className="mt-3 text-2xl font-black text-white">{value}</p></div>;
}

function Action({ title, text, icon: Icon, onClick }: { title: string; text: string; icon: typeof Car; onClick: () => void }) {
  return <button onClick={onClick} className="rounded-xl border border-nexus-border bg-slate-950/40 p-4 text-left hover:border-blue-500/40 transition-colors group"><Icon className="h-5 w-5 text-blue-400"/><h3 className="mt-3 text-sm font-bold text-white">{title}</h3><p className="mt-1 text-[11px] leading-5 text-slate-500">{text}</p><span className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold text-blue-400">Abrir <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform"/></span></button>;
}
