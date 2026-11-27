import { useEffect, useState } from 'react';
import { CheckCircle2, Circle } from 'lucide-react';
import { StockImport } from '../components/onboarding/StockImport';
import { MainLayout } from '../components/layout/MainLayout';
import { firstSaleSteps, getStoreSetup, type StoreSetup } from '../services/storeSetupService';

interface OnboardingPageProps { currentView?: string; onNavigate?: (view: string) => void }

export function OnboardingPage({ currentView, onNavigate }: OnboardingPageProps) {
  const [setup, setSetup] = useState<StoreSetup | null>(null);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  const refresh = () => { setError(''); setRevision(value => value + 1); };

  useEffect(() => {
    const controller = new AbortController();
    getStoreSetup(controller.signal).then(data => {
      if (!controller.signal.aborted) setSetup(data);
    }).catch(() => {
      if (!controller.signal.aborted) setError('Não foi possível atualizar o progresso da loja.');
    });
    return () => controller.abort();
  }, [revision]);

  const steps = setup ? firstSaleSteps(setup) : [];
  const completed = steps.filter(step => step.done).length;
  const next = steps.find(step => !step.done);

  return <MainLayout currentView={currentView} onNavigate={onNavigate}>
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="rounded-2xl border border-blue-500/30 bg-blue-950/40 p-5 sm:p-8">
        <h1 className="text-3xl font-bold text-white">Minha primeira venda</h1>
        <p className="mt-2 text-sm text-slate-300">Do primeiro veículo no estoque ao fechamento da venda.</p>
        {setup && <>
          <p className="mt-4 text-sm text-slate-200" aria-live="polite">{completed} de {steps.length} etapas concluídas</p>
          <progress aria-label="Progresso da primeira venda" value={completed} max={steps.length}
            className="mt-2 h-2 w-full accent-blue-500" />
          {setup.hasSale && <p className="mt-3 font-semibold text-emerald-300">Primeira venda registrada!</p>}
          {next && <p className="mt-3 text-sm text-blue-200">Próxima etapa: {next.label}</p>}
        </>}
      </header>

      {error && <p role="alert" className="text-rose-300">{error} <button onClick={refresh} className="underline">Tentar novamente</button></p>}
      {!setup && !error && <p role="status" className="text-slate-300">Verificando o progresso da loja…</p>}
      {setup && <>
        <ol className="space-y-3">
          {steps.map(step => <li key={step.label}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-nexus-border bg-nexus-card p-4">
            <span className="flex items-center gap-3 text-white">
              {step.done ? <CheckCircle2 aria-hidden="true" className="text-emerald-400" /> : <Circle aria-hidden="true" className="text-slate-400" />}
              <span>{step.label}<span className="ml-2 text-xs text-slate-400">{step.done ? 'Concluída' : 'Pendente'}</span></span>
            </span>
            {!step.done && (step.href
              ? <a href={step.href} className="text-sm font-semibold text-blue-300 underline">{step.action}</a>
              : <button onClick={() => onNavigate?.(step.view!)} className="text-sm font-semibold text-blue-300 underline">{step.action}</button>)}
          </li>)}
        </ol>

        <div className="flex flex-wrap gap-4 text-sm">
          <a href={setup.catalogPath} target="_blank" rel="noreferrer" className="text-blue-300 underline">Conferir vitrine da loja</a>
          <button onClick={() => onNavigate?.('vehicles')} className="text-blue-300 underline">Cadastrar veículo manualmente</button>
          <a href="/demo" target="_blank" rel="noreferrer" className="text-blue-300 underline">Ver demonstração</a>
        </div>
        <details className="space-y-3 rounded-xl border border-nexus-border bg-nexus-card p-4 text-slate-200">
          <summary className="cursor-pointer font-semibold">Configuração da loja</summary>
          <p className="text-sm">{setup.companyName}</p>
          <ul className="space-y-2 text-sm">
            <li><button onClick={() => onNavigate?.('tenant-settings')} className="text-blue-300 underline">Identidade visual e WhatsApp</button>
              {' · '}{setup.identityReady && setup.contactReady ? 'Configurados' : 'Pendentes'}</li>
            <li><button onClick={() => onNavigate?.('users')} className="text-blue-300 underline">Equipe</button>
              {' · '}{setup.teamCount} usuários ativos</li>
          </ul>
        </details>
      </>}
      <section id="importar-estoque" className="scroll-mt-6" aria-label="Importação do estoque">
        <StockImport onImported={refresh} />
      </section>
    </div>
  </MainLayout>;
}
