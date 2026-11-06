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

  const planBenefits = (name: string, maxVehicles: number | null, maxUsers: number | null) => {
    const key = name.toLowerCase();
    const base = [
      `Até ${maxVehicles ?? 'ilimitados'} veículos ativos e ${maxUsers ?? 'ilimitados'} usuários.`,
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
        <a href="/" aria-label="AutoNexus - início" className="flex shrink-0 items-center">
          <img src="/autonexus-logo.webp" alt="AutoNexus" className="h-14 w-auto max-w-36 object-contain sm:h-16 sm:max-w-44" />
        </a>
        <nav aria-label="Navegação principal" className="flex items-center gap-3 sm:gap-6 text-sm">
          <a href="#como-funciona" className="hidden text-slate-300 transition-colors hover:text-white md:inline">Como funciona</a>
          <a href="#planos" className="hidden text-slate-300 transition-colors hover:text-white sm:inline">Planos</a>
          <a href="/entrar" className="text-slate-200 transition-colors hover:text-white">Entrar</a>
          <a href="/cadastro" className="rounded-xl bg-blue-600 px-3 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-600/20 transition-colors hover:bg-blue-500 sm:px-5 sm:text-sm">Teste grátis</a>
        </nav>
      </header>

      <section className="relative isolate overflow-hidden border-b border-blue-400/10">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_70%_45%,rgba(14,92,205,0.23),transparent_55%),radial-gradient(ellipse_at_15%_20%,rgba(0,196,255,0.09),transparent_45%)]" />
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(59,130,246,0.14)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.14)_1px,transparent_1px)] [background-size:64px_64px] [mask-image:linear-gradient(to_bottom,transparent,black,transparent)]" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-8 px-4 pb-16 pt-12 sm:px-6 sm:pt-20 lg:grid-cols-[1.06fr_0.94fr] lg:gap-10 lg:pb-24 lg:pt-24">
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/25 bg-cyan-400/10 px-3 py-1.5 text-xs font-semibold text-cyan-200">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 motion-safe:animate-pulse" />
              Sua loja de veículos, no próximo nível
            </div>
            <h1 className="mt-7 text-4xl font-black leading-[1.08] tracking-tight text-white sm:text-5xl xl:text-6xl">
              Menos planilhas.<span className="block bg-gradient-to-r from-white via-blue-200 to-cyan-400 bg-clip-text text-transparent">Mais negócios.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-8 text-slate-300 sm:text-lg">
              Estoque, vendas, trocas, financeiro e catálogo da sua loja em um só lugar. Organize a operação e tenha mais tempo para vender.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a href="/cadastro" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-bold text-white shadow-xl shadow-blue-600/25 transition-all hover:-translate-y-0.5 hover:bg-blue-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300">Começar 7 dias grátis <ArrowRight className="h-4 w-4" /></a>
              <a href="#como-funciona" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-600/70 bg-white/5 px-5 py-3 font-semibold text-white transition-colors hover:bg-white/10">Conhecer a plataforma</a>
            </div>
            <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-400">
              <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-cyan-400" /> Sem fidelidade</span>
              <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-cyan-400" /> Catálogo exclusivo da loja</span>
              <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-cyan-400" /> Acesso pelo celular ou computador</span>
            </div>
          </div>
          <div className="relative mx-auto flex min-h-[330px] w-full max-w-xl items-center justify-center sm:min-h-[450px]" aria-label="Visão ilustrativa das funcionalidades AutoNexus">
            <div aria-hidden="true" className="absolute inset-8 rounded-full bg-blue-500/15 blur-[65px] motion-safe:animate-pulse" />
            <div aria-hidden="true" className="absolute h-[78%] w-[78%] rounded-full border border-cyan-400/20 motion-safe:animate-[spin_28s_linear_infinite]" />
            <div aria-hidden="true" className="absolute h-[96%] w-[96%] rounded-full border border-dashed border-blue-400/15 motion-safe:animate-[spin_42s_linear_infinite_reverse]" />
            <div className="relative w-[86%] max-w-[460px] overflow-hidden rounded-[28px] border border-blue-300/25 bg-[#08182d]/95 p-5 shadow-[0_0_90px_rgba(0,132,255,0.18)] backdrop-blur-xl sm:p-7 motion-safe:animate-[float_7s_ease-in-out_infinite]">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-2 text-sm font-bold text-white"><Car className="h-5 w-5 text-cyan-400" /> Central da sua loja</div>
                <span className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2 py-1 text-[10px] font-semibold text-emerald-300">Tudo conectado</span>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-blue-400/15 bg-blue-500/10 p-4"><Car className="mb-3 h-5 w-5 text-cyan-300" /><p className="text-sm font-bold text-white">Estoque</p><p className="mt-1 text-[11px] text-slate-400">Veículos e fotos</p></div>
                <div className="rounded-xl border border-blue-400/15 bg-blue-500/10 p-4"><BarChart3 className="mb-3 h-5 w-5 text-cyan-300" /><p className="text-sm font-bold text-white">Resultados</p><p className="mt-1 text-[11px] text-slate-400">Controle financeiro</p></div>
                <div className="rounded-xl border border-blue-400/15 bg-blue-500/10 p-4"><Users className="mb-3 h-5 w-5 text-cyan-300" /><p className="text-sm font-bold text-white">Clientes</p><p className="mt-1 text-[11px] text-slate-400">Negócios e contatos</p></div>
                <div className="rounded-xl border border-blue-400/15 bg-blue-500/10 p-4"><FileText className="mb-3 h-5 w-5 text-cyan-300" /><p className="text-sm font-bold text-white">Catálogo</p><p className="mt-1 text-[11px] text-slate-400">Compartilhe sua vitrine</p></div>
              </div>
              <div className="mt-4 flex items-center gap-2 rounded-xl border border-cyan-400/15 bg-cyan-400/5 px-4 py-3 text-xs text-cyan-100"><Sparkles className="h-4 w-4 shrink-0 text-cyan-400" /> Uma operação organizada, do primeiro contato à venda.</div>
            </div>
          </div>
        </div>
        <style>{`@keyframes float { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-14px) } } @media (prefers-reduced-motion: reduce) { .motion-safe\\:animate-\\[float_7s_ease-in-out_infinite\\] { animation: none !important; } }`}</style>
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
                  {plan.trialDays > 0 && <li className="flex items-start gap-2"><Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /><span><strong className="text-white">{plan.trialDays} dias grátis</strong> para testar a plataforma.</span></li>}
                  {planBenefits(plan.name, plan.maxVehicles, plan.maxUsers).map(benefit => (
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
