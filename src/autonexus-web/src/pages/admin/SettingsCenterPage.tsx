import { OpenAiIntegration } from '../../components/admin/OpenAiIntegration';
import { useAuth } from '../../contexts/AuthContext';
import { canAccessView } from '../../utils/permissions';
import { MainLayout } from '../../components/layout/MainLayout';
import { Building2, CreditCard, FileText, Globe2, ShieldCheck, ArrowRight } from 'lucide-react';
interface Props { currentView?: string; onNavigate?: (view: string) => void; }
export function SettingsCenterPage({ currentView, onNavigate }: Props) {
  const { user } = useAuth();
  const items = [
    { title: 'Minha primeira venda', text: 'Checklist da loja, importação de estoque e catálogo.', icon: Building2, view: 'onboarding' },
    { title: 'Minha Empresa', text: 'Nome, logo, cor, WhatsApp e dados operacionais.', icon: Building2, view: 'tenant-settings' },
    { title: 'Usuários e perfis', text: 'Controle quem acessa cada área do AT Motors.', icon: ShieldCheck, view: 'users' },
    { title: 'Documentos da empresa', text: 'Centralize os documentos usados na operação.', icon: FileText, view: 'company-documents' },
    { title: 'Minha assinatura', text: 'Consulte plano, ciclo e situação da assinatura.', icon: CreditCard, view: 'subscription' },
    { title: 'Catálogo Premium', text: 'Configure publicação em domínio próprio quando disponível no plano Premium.', icon: Globe2, view: 'premium-catalog' },
  ];
  return <MainLayout currentView={currentView} onNavigate={onNavigate}><div className="max-w-5xl mx-auto space-y-6"><div><p className="text-xs uppercase tracking-[0.2em] text-blue-400 font-bold">Configurações</p><h1 className="mt-2 text-2xl md:text-3xl font-black text-white">Central da sua empresa</h1><p className="mt-2 text-sm text-slate-400">Um único lugar para encontrar as configurações que já existem no AT Motors.</p></div><div className="grid grid-cols-1 md:grid-cols-2 gap-4">{items.filter(item => canAccessView(user?.profile, item.view)).map(item => { const Icon = item.icon; return <button key={item.view} onClick={() => onNavigate?.(item.view)} className="flex items-start gap-4 rounded-2xl border border-nexus-border bg-nexus-card p-5 text-left hover:border-blue-500/40 transition-colors"><div className="rounded-xl bg-blue-500/10 p-3 text-blue-400"><Icon className="w-5 h-5"/></div><div className="flex-1"><h2 className="text-sm font-bold text-white">{item.title}</h2><p className="mt-1 text-xs leading-5 text-slate-500">{item.text}</p></div><ArrowRight className="w-4 h-4 text-slate-600 mt-1"/></button>; })}</div>
    {user?.profile === 1 && <section className="space-y-3" aria-labelledby="integration-title">
      <h2 id="integration-title" className="text-lg font-bold text-white">Integrações</h2>
      <OpenAiIntegration />
      <button type="button" onClick={() => onNavigate?.('bank-configs')}
        className="w-full rounded-xl border border-nexus-border bg-nexus-card p-5 text-left text-white">
        <span className="block font-semibold">Financeiras</span>
        <span className="text-sm text-slate-400">Bancos e condições de financiamento</span>
      </button>
    </section>}
  </div></MainLayout>;
}
