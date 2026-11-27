import { useEffect, useState } from 'react';
import atMotorsHero from '../../public/hero/atmotors-hero/hero-atmotor.png';
import atMotorsLogo from '../../public/ATlogo.png';
import { commercialTour } from './commercialTour';
import { CommercialDemoContact } from './CommercialDemoContact';
import { billingService, formatBRL } from '../../services/billingService';
import type { Plan } from '../../services/subscriptionService';
import { ArrowRight, BarChart3, Car, Check, Crown, ShieldCheck, Sparkles, Users } from 'lucide-react';

/** Landing + página de planos. Preços/trial vêm do banco (API), nunca hardcoded aqui. */
export function PricingPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [annual, setAnnual] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    billingService.publicPlans().then(setPlans).catch(() => setError('Não foi possível carregar os planos agora. Tente novamente em instantes.'));
  }, []);

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
        label: 'Para equipes',
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
      label: 'Plano AT MOTORS',
      description: 'Uma solução profissional para organizar a operação e acompanhar o negócio em um só lugar.',
      icon: Car,
      accent: 'border-slate-700',
      iconBg: 'bg-blue-500/10 text-blue-300',
    };
  };

  const planBenefits = (name: string, maxVehicles: number | null, maxUsers: number | null, maxStorageMb: number | null) => {
    const key = name.toLowerCase();
    const storageLabel = maxStorageMb == null
      ? 'Armazenamento ilimitado.'
      : maxStorageMb >= 1024
        ? `Até ${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(maxStorageMb / 1024)} GB de armazenamento.`
        : `Até ${maxStorageMb} MB de armazenamento.`;
    const base = [
      maxVehicles != null ? `Até ${maxVehicles} veículos.` : 'Veículos ilimitados.',
      maxUsers != null ? `Até ${maxUsers} usuários.` : 'Usuários ilimitados.',
      storageLabel,
      'Estoque, compras, vendas, trocas e custos.',
      'Catálogo público exclusivo com WhatsApp.',
      'Financeiro básico, documentos e portal do comprador.',
    ];
    if (key.includes('profissional') || key.includes('professional') || key.includes('premium')) {
      base.push('DRE, relatórios completos, leads e funil comercial.');
      base.push('Simulação de financiamento e comissões.');
    }
    if (key.includes('premium')) {
      base.push('Personalização avançada do catálogo e indicadores comerciais.');
      base.push('Exportação de catálogo, integrações disponíveis e suporte prioritário.');
    }
    return base;
  };

  return (
    <div className="min-h-screen bg-nexus-dark text-slate-100">
      <header className="relative z-20 mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <a href="/" aria-label="AT MOTORS - início" className="flex w-44 shrink-0 items-center sm:w-52">
          <img src={atMotorsLogo} alt="AT MOTORS — Tecnologia que movimenta negócios" className="w-full object-contain" />
        </a>
        <nav aria-label="Navegação principal" className="flex items-center gap-3 sm:gap-6 text-sm">
          <a href="#como-funciona" className="hidden text-slate-300 transition-colors hover:text-white md:inline">Plataforma</a>
          <a href="#planos" className="hidden text-slate-300 transition-colors hover:text-white sm:inline">Planos</a>
          <a href="/entrar" className="text-slate-200 transition-colors hover:text-white">Entrar</a>
          <a href="/cadastro" className="rounded-lg bg-cyan-400 px-4 py-2.5 text-xs font-extrabold text-slate-950 shadow-lg shadow-cyan-500/20 transition-all hover:-translate-y-0.5 hover:bg-cyan-300 sm:px-5 sm:text-sm">Começar agora</a>
        </nav>
      </header>

      <section className="relative isolate overflow-hidden border-y border-white/10 bg-[#020817]">
        <img src={atMotorsHero} alt="" className="absolute inset-0 -z-20 h-full w-full object-cover object-center" fetchPriority="high" />
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-r from-slate-950 via-slate-950/90 to-slate-950/40" />
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-9 lg:py-28">
          <p className="text-sm font-bold text-cyan-300">Gestão para revendas de veículos</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-black leading-tight tracking-tight sm:text-6xl">
            Organize suas vendas do primeiro contato à entrega.
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-slate-200">
            Controle o estoque, acompanhe os atendimentos e envie propostas pelo WhatsApp. Depois da venda, acompanhe a transferência e compartilhe os documentos com o comprador.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a href="#agendar" className="rounded-xl bg-cyan-400 px-5 py-3 font-bold text-slate-950">Agendar demonstração</a>
            <a href="/demo" className="rounded-xl border border-slate-300 bg-slate-950/60 px-5 py-3 font-semibold text-white">Testar com dados de exemplo</a>
          </div>
        </div>
      </section>
      <section id="como-funciona" className="mx-auto max-w-6xl px-4 py-14">
        <h2 className="mb-6 text-3xl font-bold">Veja uma venda do início ao fim</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {commercialTour.map(stage => <a key={stage.id} href={`/demo#${stage.id}`}
            className="overflow-hidden rounded-xl border border-slate-700 bg-nexus-card hover:border-cyan-300 focus-visible:outline-2 focus-visible:outline-cyan-300">
            <img src={stage.image} alt={stage.alt} loading="lazy" className="aspect-video w-full border-b border-slate-700 bg-slate-950 object-cover object-top" />
            <div className="p-4"><h3 className="font-bold text-white">{stage.title}</h3><p className="mt-2 text-sm text-slate-300">{stage.description}</p></div>
          </a>)}
        </div>
        <p className="mt-3 text-sm text-slate-400">Telas do produto com dados fictícios.</p>
      </section>
      <section className="mx-auto max-w-6xl px-4 pb-14">
        <div className="rounded-2xl border border-slate-700 bg-nexus-card p-6 sm:p-8">
          <h2 className="text-2xl font-bold">Implantação assistida para sua loja</h2>
          <ul className="mt-4 grid gap-3 text-slate-200 sm:grid-cols-3">
            <li>Revisão e importação da sua planilha de estoque</li>
            <li>Configuração da vitrine e do WhatsApp comercial</li>
            <li>Treinamento inicial de um vendedor</li>
          </ul>
          <p className="mt-4 text-sm text-slate-400">Escopo e valor da implantação combinados com a loja.</p>
          <div className="mt-4 flex flex-wrap gap-4">
            <a href="/?interesse=implantacao#agendar" className="font-semibold text-cyan-300 underline">Consultar implantação</a>
            <a href="/?interesse=piloto#agendar" className="font-semibold text-cyan-300 underline">Tenho interesse no piloto</a>
          </div>
        </div>
      </section>
      <CommercialDemoContact />

      <section id="planos" className="max-w-6xl mx-auto px-4 pb-20">
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-400">Planos e preços</p>
          <h2 className="mt-2 text-2xl sm:text-3xl font-black text-white">Escolha como sua loja quer crescer</h2>
          <p className="mt-3 text-sm text-slate-400">Todos os valores são carregados do painel do AT MOTORS. Sem preço escondido.</p>
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
            const isProfessional = presentation.label === 'Para equipes';

            return (
              <article key={plan.id} className={`relative bg-nexus-card border rounded-2xl p-6 flex flex-col shadow-xl shadow-black/10 ${presentation.accent}`}>
                {isProfessional && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white shadow-lg shadow-blue-600/20">Para equipes</div>
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
                  {planBenefits(plan.name, plan.maxVehicles, plan.maxUsers, plan.maxStorageMb).map(benefit => (
                    <li key={benefit} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{benefit}</span>
                    </li>
                  ))}
                  <li className="flex items-start gap-2"><Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /><span>Pagamento por Pix, cartão ou boleto, conforme o checkout disponível.</span></li>
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
