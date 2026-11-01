import { useEffect, useState } from 'react';
import { billingService, formatBRL } from '../../services/billingService';
import type { Plan } from '../../services/subscriptionService';
import { ArrowRight, BarChart3, Car, Check, Crown, FileText, ShieldCheck, Sparkles, Users } from 'lucide-react';

/** Landing + página de planos. Preços/trial vêm do banco (API), nunca hardcoded aqui. */
export function PricingPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [annual, setAnnual] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const demoVideoUrl = (import.meta.env.VITE_DEMO_VIDEO_URL || '').trim();

  useEffect(() => {
    billingService.publicPlans().then(setPlans).catch(() => setError('Não foi possível carregar os planos agora. Tente novamente em instantes.'));
  }, []);

  const features = [
    { icon: Car, title: 'Estoque e vendas', text: 'Cadastro de veículos, fotos, custos, compras, vendas e trocas em um só lugar.' },
    { icon: BarChart3, title: 'Gestão financeira', text: 'Acompanhe margem, comissões, resultados e indicadores da operação.' },
    { icon: FileText, title: 'Documentos e portal', text: 'Organize documentos do veículo e facilite o atendimento ao comprador.' },
    { icon: ShieldCheck, title: 'Estrutura SaaS segura', text: 'Cada empresa trabalha com seus próprios dados, usuários e permissões.' },
  ];

  const getPlanPresentation = (name: string) => {
    const normalized = name.toLowerCase();

    if (normalized.includes('starter') || normalized.includes('inicial')) {
      return {
        label: 'Para começar',
        description: 'O essencial para colocar a operação da sua loja em ordem e profissionalizar a gestão.',
        icon: Sparkles,
        accent: 'border-slate-700',
        iconBg: 'bg-blue-500/10 text-blue-300',
      };
    }

    if (normalized.includes('profissional') || normalized.includes('professional')) {
      return {
        label: 'Mais escolhido',
        description: 'Para lojas que já vendem e precisam de mais controle sobre estoque, negócios e resultados.',
        icon: Crown,
        accent: 'border-blue-500/60 ring-1 ring-blue-500/20',
        iconBg: 'bg-blue-500/15 text-blue-300',
      };
    }

    if (normalized.includes('premium')) {
      return {
        label: 'Para crescer',
        description: 'Para operações que querem uma visão mais completa da loja e mais estrutura para escalar.',
        icon: BarChart3,
        accent: 'border-amber-400/40',
        iconBg: 'bg-amber-400/10 text-amber-300',
      };
    }

    return {
      label: 'Plano AutoNexus',
      description: 'Uma solução profissional para organizar a operação e acompanhar o negócio em um só lugar.',
      icon: Car,
      accent: 'border-slate-700',
      iconBg: 'bg-blue-500/10 text-blue-300',
    };
  };

  return (
    <div className="min-h-screen bg-nexus-dark text-slate-100">
      <header className="max-w-6xl mx-auto px-4 py-5 flex items-center justify-between">
        <a href="/" className="font-bold text-lg text-white">Auto<span className="text-blue-400">Nexus</span></a>
        <div className="flex items-center gap-4 text-sm">
          <a href="/entrar" className="text-slate-300 hover:text-white transition-colors">Entrar</a>
          <a href="/cadastro" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold text-white transition-colors">Começar teste grátis</a>
        </div>
      </header>

      <section className="max-w-4xl mx-auto px-4 pt-10 pb-12 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1.5 text-xs font-semibold text-blue-300">
          <Sparkles className="h-3.5 w-3.5" /> Feito para lojas de veículos
        </div>
        <h1 className="mt-5 text-3xl sm:text-5xl font-black tracking-tight text-white">Escolha o plano que acompanha sua loja</h1>
        <p className="mt-4 max-w-2xl mx-auto text-sm sm:text-base leading-7 text-slate-400">Tenha estoque, compras, vendas, trocas, financeiro, documentos e indicadores em uma única plataforma. Comece pequeno e evolua quando sua operação crescer.</p>
        <a href="#planos" className="inline-flex items-center gap-2 mt-7 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-bold text-white transition-colors">Ver planos <ArrowRight className="h-4 w-4" /></a>
      </section>

      <section id="como-funciona" className="max-w-6xl mx-auto px-4 pb-14">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center rounded-3xl border border-nexus-border bg-nexus-card p-6 sm:p-8 shadow-xl shadow-black/10">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-400">Conheça o AutoNexus</p>
            <h2 className="mt-3 text-2xl sm:text-3xl font-bold text-white">Sua loja organizada em um só lugar</h2>
            <p className="mt-4 text-sm leading-6 text-slate-400">Veja como centralizar estoque, compras, vendas, trocas, documentos e resultados financeiros em uma plataforma feita para lojas de veículos.</p>
            <a href="#planos" className="inline-flex items-center gap-2 mt-6 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-colors">Ver planos e começar <ArrowRight className="h-4 w-4" /></a>
          </div>
          <div className="aspect-video overflow-hidden rounded-2xl border border-nexus-border bg-slate-950 flex items-center justify-center">
            {demoVideoUrl ? (
              <video className="w-full h-full object-contain" controls preload="metadata" src={demoVideoUrl}>
                Seu navegador não conseguiu reproduzir o vídeo demonstrativo.
              </video>
            ) : (
              <div className="w-full h-full p-5 sm:p-7 flex flex-col justify-center">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400"><Car className="h-6 w-6" /></div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-400">Tour pela plataforma</p>
                    <p className="mt-1 font-semibold text-white">Veja o que você pode gerenciar</p>
                  </div>
                </div>
                <ol className="mt-5 space-y-3 text-sm text-slate-300">
                  <li className="flex items-start gap-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-800 text-xs font-bold text-blue-300">1</span><span><strong className="text-white">Estoque:</strong> cadastre veículos, fotos, características e valores de venda.</span></li>
                  <li className="flex items-start gap-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-800 text-xs font-bold text-blue-300">2</span><span><strong className="text-white">Negócios:</strong> organize compras, vendas, trocas e documentos.</span></li>
                  <li className="flex items-start gap-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-800 text-xs font-bold text-blue-300">3</span><span><strong className="text-white">Resultados:</strong> acompanhe indicadores e informações financeiras.</span></li>
                </ol>
                <p className="mt-5 border-t border-slate-800 pt-4 text-xs leading-5 text-slate-500">O vídeo gravado será exibido aqui quando VITE_DEMO_VIDEO_URL apontar para um MP4 público. Este guia provisório não é uma gravação da tela.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pb-14">
        {features.map(({ icon: Icon, title, text }) => (
          <div key={title} className="bg-nexus-card border border-nexus-border rounded-xl p-5 transition-transform hover:-translate-y-0.5">
            <Icon className="w-6 h-6 text-blue-400" />
            <h3 className="mt-3 font-bold text-white text-sm">{title}</h3>
            <p className="mt-1 text-xs leading-5 text-slate-400">{text}</p>
          </div>
        ))}
      </section>

      <section id="planos" className="max-w-6xl mx-auto px-4 pb-20">
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-400">Planos e preços</p>
          <h2 className="mt-2 text-2xl sm:text-3xl font-black text-white">Escolha como sua loja quer crescer</h2>
          <p className="mt-3 text-sm text-slate-400">Todos os valores são carregados do painel do AutoNexus. Sem preço escondido.</p>
        </div>

        <div className="flex justify-center mt-6">
          <div className="inline-flex bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs shadow-lg">
            <button onClick={() => setAnnual(false)} className={`px-5 py-2 rounded-lg font-semibold cursor-pointer transition-colors ${!annual ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'text-slate-400 hover:text-white'}`}>Mensal</button>
            <button onClick={() => setAnnual(true)} className={`px-5 py-2 rounded-lg font-semibold cursor-pointer transition-colors ${annual ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'text-slate-400 hover:text-white'}`}>Anual</button>
          </div>
        </div>

        {error && <p className="text-center text-red-400 text-sm mt-6">{error}</p>}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-8 items-stretch">
          {plans.map(plan => {
            const presentation = getPlanPresentation(plan.name);
            const PlanIcon = presentation.icon;
            const price = annual && plan.annualPrice ? plan.annualPrice : plan.price;
            const hasAnnual = Boolean(plan.annualPrice && plan.price > 0);
            const annualSaving = hasAnnual ? Math.round((1 - (plan.annualPrice! / (plan.price * 12))) * 100) : 0;
            const monthlyEquivalent = annual && plan.annualPrice ? plan.annualPrice / 12 : plan.price;
            const isProfessional = presentation.label === 'Mais escolhido';

            return (
              <article key={plan.id} className={`relative bg-nexus-card border rounded-2xl p-6 flex flex-col shadow-xl shadow-black/10 ${presentation.accent}`}>
                {isProfessional && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white shadow-lg shadow-blue-600/20">Mais escolhido</div>
                )}

                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">{presentation.label}</p>
                    <h3 className="mt-2 text-xl font-black text-white">{plan.name}</h3>
                  </div>
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${presentation.iconBg}`}><PlanIcon className="h-5 w-5" /></div>
                </div>

                <p className="mt-4 min-h-[60px] text-sm leading-5 text-slate-400">{presentation.description}</p>

                <div className="mt-5 border-t border-slate-800 pt-5">
                  <div className="flex items-end gap-2">
                    <p className="text-3xl font-black text-white">{formatBRL(price)}</p>
                    <p className="pb-1 text-xs text-slate-500">{annual && plan.annualPrice ? 'por ano' : 'por mês'}</p>
                  </div>
                  {annual && plan.annualPrice ? (
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                      <span className="text-slate-500">equivale a {formatBRL(monthlyEquivalent)}/mês</span>
                      {annualSaving > 0 && <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 font-bold text-emerald-400">Economize {annualSaving}%</span>}
                    </div>
                  ) : (
                    <p className="mt-1 text-xs text-slate-500">Cobrança mensal • sem fidelidade</p>
                  )}
                </div>

                <ul className="mt-6 space-y-3 text-xs text-slate-300 flex-1">
                  {plan.trialDays > 0 && <li className="flex items-start gap-2"><Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /><span><strong className="text-white">{plan.trialDays} dias grátis</strong> para testar a plataforma.</span></li>}
                  <li className="flex items-start gap-2"><Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /><span>Gestão de <strong className="text-white">estoque, compras, vendas e trocas</strong>.</span></li>
                  <li className="flex items-start gap-2"><Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /><span><strong className="text-white">Financeiro, relatórios e DRE</strong> para acompanhar o negócio.</span></li>
                  <li className="flex items-start gap-2"><Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /><span><strong className="text-white">Documentos e portal do comprador</strong>.</span></li>
                  <li className="flex items-start gap-2"><Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /><span>Ambiente separado por empresa e controle de usuários.</span></li>
                  <li className="flex items-start gap-2"><Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /><span>Pagamento por <strong className="text-white">Pix, cartão ou boleto</strong>, conforme o checkout disponível.</span></li>
                </ul>

                <a href={`/cadastro?plano=${plan.id}&ciclo=${annual ? 2 : 1}`} className={`mt-7 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-white text-sm transition-all ${isProfessional ? 'bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/20' : 'bg-slate-800 hover:bg-slate-700 border border-slate-700'}`}>
                  {plan.trialDays > 0 ? 'Começar teste grátis' : 'Assinar agora'}
                  <ArrowRight className="h-4 w-4" />
                </a>
              </article>
            );
          })}
        </div>

        <div className="mt-7 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-400">
          <div className="flex items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900/50 px-4 py-3"><ShieldCheck className="h-4 w-4 text-emerald-400" />Dados separados por empresa</div>
          <div className="flex items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900/50 px-4 py-3"><Users className="h-4 w-4 text-blue-400" />Acesso por perfil de usuário</div>
          <div className="flex items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900/50 px-4 py-3"><Car className="h-4 w-4 text-blue-400" />Feito para operação automotiva</div>
        </div>
      </section>

      <footer className="border-t border-nexus-border py-6 text-center text-xs text-slate-500 space-x-4">
        <a href="/termos" className="hover:text-slate-300">Termos de Uso</a>
        <a href="/privacidade" className="hover:text-slate-300">Política de Privacidade</a>
        <a href="/cookies" className="hover:text-slate-300">Política de Cookies</a>
      </footer>
    </div>
  );
}
