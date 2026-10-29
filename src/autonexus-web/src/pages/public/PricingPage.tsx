import { useEffect, useState } from 'react';
import { billingService, formatBRL } from '../../services/billingService';
import type { Plan } from '../../services/subscriptionService';
import { Check, Car, ShieldCheck, FileText, BarChart3 } from 'lucide-react';

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
    { icon: Car, title: 'Estoque e vendas', text: 'Cadastro de veículos, fotos, custos, compra, venda e troca em um só lugar.' },
    { icon: BarChart3, title: 'Relatórios e DRE', text: 'Acompanhe margem, comissões e resultado da loja.' },
    { icon: FileText, title: 'Documentos e portal', text: 'Documentos do veículo e portal do comprador com aceite eletrônico.' },
    { icon: ShieldCheck, title: 'Dados isolados', text: 'Cada empresa tem seus próprios dados, usuários e permissões.' },
  ];

  return (
    <div className="min-h-screen bg-nexus-dark text-slate-100">
      <header className="max-w-6xl mx-auto px-4 py-5 flex items-center justify-between">
        <a href="/" className="font-bold text-lg text-white">AutoNexus</a>
        <div className="space-x-4 text-sm">
          <a href="/entrar" className="text-slate-300 hover:text-white">Entrar</a>
          <a href="/cadastro" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold text-white">Começar teste grátis</a>
        </div>
      </header>

      <section className="max-w-4xl mx-auto px-4 pt-10 pb-12 text-center">
        <h1 className="text-3xl sm:text-4xl font-bold text-white">A gestão completa da sua loja de veículos</h1>
        <p className="mt-4 text-slate-400">Compra, venda e troca de veículos, financeiro e documentos num sistema profissional, acessível do computador e do celular.</p>
        <a href="/cadastro" className="inline-block mt-8 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-bold text-white">Testar grátis por 7 dias</a>
      </section>

      <section id="como-funciona" className="max-w-6xl mx-auto px-4 pb-14">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center rounded-3xl border border-nexus-border bg-nexus-card p-6 sm:p-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-400">Conheça o AutoNexus</p>
            <h2 className="mt-3 text-2xl sm:text-3xl font-bold text-white">Sua loja organizada em um só lugar</h2>
            <p className="mt-4 text-sm leading-6 text-slate-400">Veja como centralizar estoque, compras, vendas, trocas, documentos e resultados financeiros em uma plataforma feita para lojas de veículos.</p>
            <a href="#planos" className="inline-flex mt-6 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm">Ver planos e começar</a>
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
          <div key={title} className="bg-nexus-card border border-nexus-border rounded-xl p-5">
            <Icon className="w-6 h-6 text-blue-400" />
            <h3 className="mt-3 font-bold text-white text-sm">{title}</h3>
            <p className="mt-1 text-xs text-slate-400">{text}</p>
          </div>
        ))}
      </section>

      <section id="planos" className="max-w-6xl mx-auto px-4 pb-20">
        <h2 className="text-2xl font-bold text-center text-white">Planos</h2>
        <div className="flex justify-center mt-5">
          <div className="inline-flex bg-slate-900 border border-slate-800 rounded-lg p-1 text-xs">
            <button onClick={() => setAnnual(false)} className={`px-4 py-1.5 rounded-md font-semibold cursor-pointer ${!annual ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>Mensal</button>
            <button onClick={() => setAnnual(true)} className={`px-4 py-1.5 rounded-md font-semibold cursor-pointer ${annual ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>Anual</button>
          </div>
        </div>

        {error && <p className="text-center text-red-400 text-sm mt-6">{error}</p>}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-8">
          {plans.map(plan => {
            const price = annual && plan.annualPrice ? plan.annualPrice : plan.price;
            return (
              <div key={plan.id} className="bg-nexus-card border border-nexus-border rounded-2xl p-6 flex flex-col">
                <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                <p className="mt-3 text-3xl font-bold text-blue-400">{formatBRL(price)}</p>
                <p className="text-xs text-slate-500">por {annual && plan.annualPrice ? 'ano' : 'mês'}</p>
                <ul className="mt-5 space-y-2 text-xs text-slate-300 flex-1">
                  {plan.trialDays > 0 && <li className="flex gap-2"><Check className="w-4 h-4 text-emerald-400 shrink-0" />{plan.trialDays} dias de teste grátis</li>}
                  <li className="flex gap-2"><Check className="w-4 h-4 text-emerald-400 shrink-0" />{plan.maxUsers ? `Até ${plan.maxUsers} usuários` : 'Usuários conforme o plano'}</li>
                  <li className="flex gap-2"><Check className="w-4 h-4 text-emerald-400 shrink-0" />{plan.maxVehicles ? `Até ${plan.maxVehicles} veículos` : 'Veículos conforme o plano'}</li>
                  <li className="flex gap-2"><Check className="w-4 h-4 text-emerald-400 shrink-0" />Pix, cartão ou boleto</li>
                  <li className="flex gap-2"><Check className="w-4 h-4 text-emerald-400 shrink-0" />Cancele quando quiser</li>
                </ul>
                <a href={`/cadastro?plano=${plan.id}&ciclo=${annual ? 2 : 1}`}
                   className="mt-6 text-center px-4 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-xl font-bold text-white text-sm">
                  {plan.trialDays > 0 ? 'Começar teste grátis' : 'Assinar'}
                </a>
              </div>
            );
          })}
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
