import { useEffect, useState } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import { dashboardService, type DashboardSummary } from '../services/dashboardService';
import { tenantSettingsService, type TenantSettings } from '../services/tenantSettingsService';
import { Building2, CheckCircle2, Circle, ExternalLink, Palette, Car, MessageCircle, Globe2, ArrowRight } from 'lucide-react';

interface OnboardingPageProps { currentView?: string; onNavigate?: (view: string) => void; }

export function OnboardingPage({ currentView, onNavigate }: OnboardingPageProps) {
  const [settings, setSettings] = useState<TenantSettings | null>(null);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([tenantSettingsService.get(), dashboardService.getSummary()])
      .then(([tenant, dashboard]) => { setSettings(tenant); setSummary(dashboard); })
      .catch(error => console.error('Erro ao carregar onboarding:', error))
      .finally(() => setLoading(false));
  }, []);

  const steps = settings ? [
    { label: 'Nome da empresa configurado', done: Boolean(settings.companyName?.trim()), view: 'tenant-settings', icon: Building2 },
    { label: 'Logo e identidade visual configurados', done: Boolean(settings.logoUrl?.trim()) && Boolean(settings.primaryColor), view: 'tenant-settings', icon: Palette },
    { label: 'WhatsApp comercial configurado', done: Boolean(settings.whatsappNumber?.trim()), view: 'tenant-settings', icon: MessageCircle },
    { label: 'Primeiros veículos cadastrados', done: Boolean(summary && summary.kpis.vehiclesForSale > 0), view: 'vehicles', icon: Car },
  ] : [];

  const completed = steps.filter(x => x.done).length;
  const progress = steps.length ? Math.round((completed / steps.length) * 100) : 0;

  return <MainLayout currentView={currentView} onNavigate={onNavigate}>
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-950/60 to-slate-900 p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div><p className="text-xs uppercase tracking-[0.2em] text-blue-400 font-bold">Primeiros passos</p><h1 className="mt-2 text-2xl md:text-3xl font-black text-white">Deixe sua loja pronta para vender.</h1><p className="mt-2 text-sm text-slate-400 max-w-2xl">Configure a identidade da empresa, publique o estoque e coloque o catálogo para trabalhar por você.</p></div>
          <div className="text-left md:text-right"><div className="text-3xl font-black text-white">{progress}%</div><div className="text-xs text-slate-500">configuração concluída</div></div>
        </div>
        <div className="mt-6 h-2 rounded-full bg-slate-800 overflow-hidden"><div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${progress}%` }} /></div>
      </div>

      {loading ? <div className="rounded-2xl border border-nexus-border bg-nexus-card p-10 text-center text-slate-400">Verificando sua configuração...</div> : <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <section className="lg:col-span-2 rounded-2xl border border-nexus-border bg-nexus-card p-5 md:p-6"><h2 className="text-base font-bold text-white">Checklist da sua loja</h2><div className="mt-5 space-y-3">
          {steps.map(step => { const Icon = step.icon; return <button key={step.label} onClick={() => onNavigate?.(step.view)} className="w-full flex items-center gap-4 rounded-xl border border-slate-800 bg-slate-950/40 p-4 text-left hover:border-blue-500/40 transition-colors">
            {step.done ? <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" /> : <Circle className="w-5 h-5 text-slate-600 shrink-0" />}<Icon className="w-5 h-5 text-slate-400 shrink-0" /><span className={`flex-1 text-sm font-medium ${step.done ? 'text-slate-300' : 'text-white'}`}>{step.label}</span><ArrowRight className="w-4 h-4 text-slate-600" />
          </button>; })}
        </div></section>

        <section className="rounded-2xl border border-nexus-border bg-nexus-card p-5 md:p-6 space-y-4"><h2 className="text-base font-bold text-white">Próximos passos</h2>
          <button onClick={() => onNavigate?.('catalog')} className="w-full rounded-xl border border-slate-800 bg-slate-950/40 p-4 text-left hover:border-blue-500/40"><Globe2 className="w-5 h-5 text-blue-400 mb-2" /><span className="block text-sm font-bold text-white">Abrir catálogo</span><span className="text-xs text-slate-500">Veja exatamente o que seu cliente encontra.</span></button>
          <button onClick={() => onNavigate?.('commercial')} className="w-full rounded-xl border border-slate-800 bg-slate-950/40 p-4 text-left hover:border-blue-500/40"><MessageCircle className="w-5 h-5 text-emerald-400 mb-2" /><span className="block text-sm font-bold text-white">Central comercial</span><span className="text-xs text-slate-500">Atalhos para estoque, catálogo e atendimento.</span></button>
          <a href="/demo" target="_blank" rel="noreferrer" className="w-full flex items-center justify-between rounded-xl bg-blue-600 hover:bg-blue-500 px-4 py-3 text-sm font-bold text-white">Ver demonstração <ExternalLink className="w-4 h-4" /></a>
        </section>
      </div>}
    </div>
  </MainLayout>;
}
