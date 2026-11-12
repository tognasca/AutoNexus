import { useEffect, useState } from 'react';
import atMotorsHero from '../../public/hero/atmotors-hero/hero-atmotor.png';
import atMotorsLogo from '../../public/ATlogo.png';
import atMotorsDemoVideo from '../../public/FinalAtMotorVideo.mp4';
import { billingService, formatBRL } from '../../services/billingService';
import type { Plan } from '../../services/subscriptionService';
import { ArrowRight, BarChart3, Car, Check, Crown, FileText, ShieldCheck, Sparkles, Users } from 'lucide-react';

/** Landing + página de planos. Preços/trial vêm do banco (API), nunca hardcoded aqui. */
export function PricingPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [annual, setAnnual] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const demoVideoUrl = (import.meta.env.VITE_DEMO_VIDEO_URL || '').trim() || atMotorsDemoVideo;

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

      <section className="relative isolate min-h-[720px] overflow-hidden border-y border-white/10 bg-[#020817] lg:min-h-[780px]">
        <img
          src={atMotorsHero}
          alt="Veículo premium em destaque ao entardecer"
          className="absolute inset-0 h-full w-full object-cover object-center"
          loading="eager"
          fetchPriority="high"
        />
        <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(90deg,rgba(2,8,23,.98)_0%,rgba(2,8,23,.91)_30%,rgba(2,8,23,.55)_56%,rgba(2,8,23,.08)_100%)]" />
        <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(0deg,rgba(2,8,23,.96)_0%,transparent_34%,rgba(2,8,23,.12)_100%)]" />
        <div aria-hidden="true" className="pointer-events-none absolute -right-28 top-20 h-[34rem] w-[34rem] rounded-full border border-cyan-300/20 shadow-[0_0_90px_rgba(0,174,255,.14)]" />
        <div className="relative mx-auto flex min-h-[720px] max-w-[1440px] flex-col justify-center px-5 pb-28 pt-16 sm:px-8 lg:min-h-[780px] lg:px-12 lg:pb-32">
          <div className="relative z-10 max-w-[680px]">
            <div className="inline-flex items-center gap-3 text-xs font-bold uppercase tracking-[0.38em] text-sky-300 sm:text-sm">
              <span className="h-px w-9 bg-cyan-300" />
              Plataforma completa para o setor automotivo
            </div>
            <h1 className="mt-7 max-w-[680px] text-[clamp(2.7rem,5.6vw,5.8rem)] font-black leading-[.98] tracking-[-.055em] text-white">
              Compre, venda, troque e gerencie
              <span className="mt-2 block bg-gradient-to-r from-cyan-300 via-sky-400 to-blue-500 bg-clip-text pb-2 text-transparent">veículos com inteligência.</span>
            </h1>
            <p className="mt-6 max-w-[590px] text-base leading-7 text-slate-200/90 sm:text-lg sm:leading-8">
              Mais que um marketplace: uma plataforma inteligente com estoque, gestão, avaliação, financiamento e indicadores para o seu negócio automotivo.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#planos" className="inline-flex min-h-14 items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-600 px-7 py-4 text-sm font-black text-white shadow-[0_12px_42px_rgba(0,130,255,.38)] transition-all hover:-translate-y-1 hover:brightness-110">
                <Car className="h-5 w-5" /> Conhecer a plataforma <ArrowRight className="h-5 w-5" />
              </a>
              <a href="/cadastro" className="inline-flex min-h-14 items-center justify-center gap-3 rounded-xl border border-white/35 bg-slate-950/35 px-7 py-4 text-sm font-bold text-white backdrop-blur-md transition-all hover:border-cyan-300 hover:bg-cyan-300/10">
                Anunciar agora
              </a>
            </div>
            <div className="mt-10 grid max-w-[620px] grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl border border-cyan-300/25 bg-[#06162a]/70 p-3 backdrop-blur-md"><Car className="h-6 w-6 text-cyan-300" /><p className="mt-2 text-xs font-bold text-white">Compra e venda</p></div>
              <div className="rounded-xl border border-cyan-300/25 bg-[#06162a]/70 p-3 backdrop-blur-md"><Users className="h-6 w-6 text-cyan-300" /><p className="mt-2 text-xs font-bold text-white">Troca inteligente</p></div>
              <div className="rounded-xl border border-cyan-300/25 bg-[#06162a]/70 p-3 backdrop-blur-md"><BarChart3 className="h-6 w-6 text-cyan-300" /><p className="mt-2 text-xs font-bold text-white">Gestão completa</p></div>
              <div className="rounded-xl border border-cyan-300/25 bg-[#06162a]/70 p-3 backdrop-blur-md"><Sparkles className="h-6 w-6 text-cyan-300" /><p className="mt-2 text-xs font-bold text-white">Avaliação por IA</p></div>
            </div>
          </div>

          <div className="absolute bottom-7 right-8 z-10 hidden items-center gap-3 rounded-2xl border border-white/20 bg-[#06162a]/75 px-5 py-4 text-white shadow-2xl backdrop-blur-xl lg:flex">
            <ShieldCheck className="h-7 w-7 text-cyan-300" />
            <div><p className="text-xs font-extrabold">Sua operação conectada</p><p className="mt-1 text-[10px] text-slate-300">Estoque • Comercial • Financeiro</p></div>
          </div>
        </div>
      </section>

      <section id="como-funciona" className="max-w-6xl mx-auto px-4 pt-14 pb-14 sm:pt-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center rounded-3xl border border-nexus-border bg-nexus-card p-6 sm:p-8 shadow-xl shadow-black/10">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-400">Conheça o AT MOTORS</p>
            <h2 className="mt-3 text-2xl sm:text-3xl font-bold text-white">Sua loja organizada em um só lugar</h2>
            <p className="mt-4 text-sm leading-6 text-slate-400">Veja como centralizar estoque, compras, vendas, trocas, documentos e resultados financeiros em uma plataforma feita para lojas de veículos.</p>
            <a href="#planos" className="inline-flex items-center gap-2 mt-6 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-colors">Ver planos e começar <ArrowRight className="h-4 w-4" /></a>
          </div>
          <div className="aspect-video overflow-hidden rounded-2xl border border-nexus-border bg-slate-950 flex items-center justify-center">
            <video
              className="w-full h-full object-contain"
              aria-label="Vídeo demonstrativo do AT MOTORS"
              controls
              playsInline
              preload="none"
              poster={atMotorsHero}
              src={demoVideoUrl}
            >
              Seu navegador não conseguiu reproduzir o vídeo demonstrativo.
            </video>
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
