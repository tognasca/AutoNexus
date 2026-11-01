import { MainLayout } from '../components/layout/MainLayout';
import { Car, Globe2, Calculator, MessageCircle, Share2, ArrowRight, ExternalLink } from 'lucide-react';
import { useEffect, useState } from 'react';
import { tenantSettingsService, type TenantSettings } from '../services/tenantSettingsService';

interface Props { currentView?: string; onNavigate?: (view: string) => void; }
export function CommercialHubPage({ currentView, onNavigate }: Props) {
  const [settings, setSettings] = useState<TenantSettings | null>(null);
  useEffect(() => { tenantSettingsService.get().then(setSettings).catch(console.error); }, []);
  const whatsapp = settings?.whatsappNumber?.replace(/\D/g, '');
  const cards = [
    { title: 'Estoque', text: 'Cadastre, edite e organize os veículos que sua equipe está vendendo.', icon: Car, view: 'vehicles', action: 'Gerenciar estoque' },
    { title: 'Catálogo', text: 'Mostre seu estoque em uma vitrine profissional com a identidade da sua loja.', icon: Globe2, view: 'catalog', action: 'Abrir catálogo' },
    { title: 'Simulador', text: 'Faça simulações e transforme uma conversa de venda em uma proposta organizada.', icon: Calculator, view: 'simulator', action: 'Abrir simulador' },
  ];
  return <MainLayout currentView={currentView} onNavigate={onNavigate}>
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-950/50 to-slate-900 p-6 md:p-8"><p className="text-xs uppercase tracking-[0.2em] text-emerald-400 font-bold">Central comercial</p><h1 className="mt-2 text-2xl md:text-3xl font-black text-white">Tudo que o vendedor precisa para transformar interesse em venda.</h1><p className="mt-2 text-sm text-slate-400 max-w-3xl">Estoque, catálogo, simulação e WhatsApp ficam a poucos cliques.</p></div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">{cards.map(card => { const Icon = card.icon; return <button key={card.view} onClick={() => onNavigate?.(card.view)} className="rounded-2xl border border-nexus-border bg-nexus-card p-5 text-left hover:border-blue-500/40 transition-colors group"><Icon className="w-7 h-7 text-blue-400"/><h2 className="mt-4 text-base font-bold text-white">{card.title}</h2><p className="mt-2 text-xs leading-5 text-slate-500">{card.text}</p><span className="mt-5 inline-flex items-center gap-2 text-xs font-bold text-blue-400">{card.action}<ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform"/></span></button>; })}</div>
      <section className="rounded-2xl border border-nexus-border bg-nexus-card p-5 md:p-6"><div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5"><div><h2 className="text-base font-bold text-white">Atendimento pelo WhatsApp</h2><p className="mt-1 text-xs text-slate-500">Use o número comercial configurado em Minha Empresa.</p></div>{whatsapp ? <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-5 py-3 text-sm font-bold text-white"><MessageCircle className="w-4 h-4"/>Abrir WhatsApp <ExternalLink className="w-4 h-4"/></a> : <button onClick={() => onNavigate?.('tenant-settings')} className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 px-5 py-3 text-sm font-bold text-white"><MessageCircle className="w-4 h-4"/>Configurar WhatsApp</button>}</div></section>
      <section className="rounded-2xl border border-blue-500/20 bg-blue-950/20 p-5 md:p-6"><div className="flex items-start gap-4"><Share2 className="w-6 h-6 text-blue-400 shrink-0"/><div><h2 className="text-sm font-bold text-white">Dica de venda</h2><p className="mt-1 text-xs leading-5 text-slate-400">Compartilhe o link do veículo ou do catálogo antes de pedir dados. O cliente chega à conversa já vendo o produto que despertou interesse.</p></div></div></section>
    </div>
  </MainLayout>;
}
