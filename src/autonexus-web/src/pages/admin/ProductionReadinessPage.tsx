import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, CircleX, RefreshCw, ShieldCheck } from 'lucide-react';
import { MainLayout } from '../../components/layout/MainLayout';
import { superAdminService, ProductionReadiness } from '../../services/superAdminService';

interface Props { currentView?: string; onNavigate?: (view: string) => void; }

export function ProductionReadinessPage({ currentView, onNavigate }: Props) {
  const [data, setData] = useState<ProductionReadiness | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try { setData(await superAdminService.getProductionReadiness()); }
    catch (err) { setError(err instanceof Error ? err.message : 'Não foi possível consultar a preparação para produção.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  return (
    <MainLayout currentView={currentView} onNavigate={onNavigate}>
      <div className="space-y-6 p-4 sm:p-6 w-full max-w-5xl">
        <div className="flex items-start justify-between gap-4 border-b border-nexus-border pb-4">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2"><ShieldCheck className="w-6 h-6 text-emerald-400" />Preparação para Produção</h1>
            <p className="text-xs text-nexus-text-muted mt-1">Diagnóstico seguro do ambiente. Nenhum segredo ou valor sensível é exibido.</p>
          </div>
          <button onClick={load} disabled={loading} className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg disabled:opacity-50" aria-label="Atualizar diagnóstico"><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /></button>
        </div>
        {error && <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">{error}</div>}
        {loading && !data ? <div className="rounded-xl border border-nexus-border bg-nexus-card p-8 text-center text-slate-400">Verificando ambiente...</div> : data ? <>
          <div className={`rounded-xl border p-5 ${data.ready ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-amber-500/30 bg-amber-500/10'}`}>
            <div className="flex items-center gap-3">
              {data.ready ? <CheckCircle2 className="w-7 h-7 text-emerald-400" /> : <AlertTriangle className="w-7 h-7 text-amber-400" />}
              <div><h2 className="font-bold text-white">{data.ready ? 'Ambiente apto nos requisitos técnicos verificados' : 'Ainda existem requisitos para fechar a produção'}</h2><p className="text-xs text-slate-300 mt-1">Ambiente: {data.environment} · última verificação: {new Date(data.checkedAtUtc).toLocaleString('pt-BR')}</p></div>
            </div>
          </div>
          <div className="grid gap-3">{data.checks.map(check => <div key={check.name} className="rounded-xl border border-nexus-border bg-nexus-card p-4 flex items-start gap-3">
            {check.ok ? <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" /> : <CircleX className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />}
            <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="text-sm font-semibold text-white">{check.name}</span>{check.blocking && !check.ok && <span className="text-[10px] uppercase font-bold rounded-full px-2 py-0.5 bg-red-500/15 text-red-300 border border-red-500/20">Bloqueante</span>}{!check.blocking && !check.ok && <span className="text-[10px] uppercase font-bold rounded-full px-2 py-0.5 bg-amber-500/15 text-amber-300 border border-amber-500/20">Atenção</span>}</div>{!check.ok && <p className="text-xs text-slate-400 mt-1">{check.guidance}</p>}</div>
          </div>)}</div>
          <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 text-xs text-slate-300"><strong className="text-white">Importante:</strong> credenciais de gateway, JWT e e-mail continuam sendo configuradas por variável de ambiente/secret manager. A tela deliberadamente não armazena segredos no banco.</div>
        </> : null}
      </div>
    </MainLayout>
  );
}
