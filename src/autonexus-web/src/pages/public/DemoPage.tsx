import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';
import { commercialTour } from './commercialTour';

function readStage() {
  return Math.max(0, commercialTour.findIndex(stage => '#' + stage.id === window.location.hash));
}

export function DemoPage() {
  const [stage, setStage] = useState(readStage);
  const [finished, setFinished] = useState(false);
  const current = commercialTour[stage];

  useEffect(() => {
    const sync = () => { setStage(readStage()); setFinished(false); };
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, []);

  function goTo(index: number) {
    window.history.replaceState(null, '', '#' + commercialTour[index].id);
    setStage(index);
    setFinished(false);
  }

  return <main className="min-h-screen bg-[#06111f] text-white">
    <div className="mx-auto max-w-6xl space-y-7 px-4 py-6 sm:p-10">
      <header className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <a href="/" className="inline-flex items-center gap-2 text-slate-300"><ArrowLeft size={18} /> AT Motors</a>
        <a href="/#agendar" className="font-semibold text-cyan-300 underline">Agendar demonstração</a>
      </header>
      <div>
        <h1 className="text-3xl font-bold sm:text-5xl">Do WhatsApp à entrega</h1>
        <p className="mt-3 text-slate-300">Em cerca de cinco minutos, acompanhe uma venda em uma loja fictícia. As ações alteram somente esta demonstração.</p>
      </div>
      <nav aria-label="Etapas da demonstração" className="flex flex-wrap gap-2">
        {commercialTour.map((item, index) => <button key={item.id} type="button" onClick={() => goTo(index)}
          aria-current={stage === index ? 'step' : undefined}
          className="rounded-lg border border-slate-700 px-3 py-2 text-sm aria-[current=step]:border-cyan-300 aria-[current=step]:text-cyan-200">
          {index + 1}. {item.title}
        </button>)}
      </nav>
      <article className="space-y-4 rounded-2xl border border-slate-700 bg-slate-900 p-4 sm:p-6" aria-labelledby="tour-stage">
        <div aria-live="polite">
          <h2 id="tour-stage" className="text-2xl font-bold">{current.title}</h2>
          <p className="mt-2 text-slate-300">{current.details}</p>
        </div>
        <img key={current.id} src={current.image} alt={current.alt} className="w-full rounded-lg border border-slate-700" />
        {finished ? <div className="space-y-3 rounded-xl bg-emerald-950 p-4">
          <p role="status" className="flex items-center gap-2 font-semibold"><CheckCircle2 size={20} /> Venda de exemplo concluída.</p>
          <div className="flex flex-wrap gap-4"><a href="/#agendar" className="font-semibold text-cyan-300 underline">Agendar uma conversa</a>
            <a href="/cadastro" className="font-semibold text-cyan-300 underline">Cadastrar minha loja</a>
            <button onClick={() => goTo(0)} className="underline">Recomeçar</button></div>
        </div> : <div className="flex flex-wrap gap-3">
          {stage > 0 && <button onClick={() => goTo(stage - 1)} className="rounded-lg border border-slate-600 px-4 py-3">Voltar</button>}
          <button onClick={() => stage === commercialTour.length - 1 ? setFinished(true) : goTo(stage + 1)}
            className="inline-flex items-center gap-2 rounded-lg bg-cyan-400 px-4 py-3 font-bold text-slate-950">
            {current.action} <ArrowRight size={18} />
          </button>
        </div>}
      </article>
    </div>
  </main>;
}
