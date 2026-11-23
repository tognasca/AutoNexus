import { useCallback, useEffect, useRef, useState } from 'react';
import { request } from '../../services/api';
import { vehicleService } from '../../services/vehicleService';
import { leadService, type LeadItem } from '../../services/leadService';
import type { VehicleSummary } from '../../types/vehicle';
import { AttendancePanel } from './AttendancePanel';
import { VehicleOperations } from '../vehicles/VehicleOperations';
interface WorkItem {
  id: string; kind: 'lead' | 'stock' | 'delivery'; title: string; leadId: string | null;
  vehicleId: string | null; vehicleName: string | null; responsibleName: string | null;
  score: number; reasons: string[]; stockDays: number | null; marginPercentage: number | null;
  nextContactAt: string | null;
  missingFields?: string[] | null;
}
interface WorkQueue { generatedAt: string; timeZone: string; total: number; items: WorkItem[] }
export function DailyWorkQueue({ isAdmin, onUpdated }: { isAdmin: boolean; onUpdated: () => void }) {
  const [mine, setMine] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [queue, setQueue] = useState<WorkQueue | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [lead, setLead] = useState<LeadItem | null>(null);
  const [vehicle, setVehicle] = useState<VehicleSummary | null>(null);
  const revision = useRef(0);
  const refresh = useCallback(async () => {
    const version = ++revision.current;
    try {
      const data = await request<WorkQueue>(`/daily-work?mine=${mine}`);
      if (version === revision.current) { setQueue(data); setError(''); }
    } catch (err) {
      if (version === revision.current) setError(err instanceof Error ? err.message : 'Não foi possível carregar as prioridades.');
    } finally { if (version === revision.current) setLoading(false); }
  }, [mine]);
  const invalidate = useCallback(() => { revision.current++; }, []);
  useEffect(() => {
    const version = ++revision.current;
    request<WorkQueue>(`/daily-work?mine=${mine}`)
      .then(data => { if (version === revision.current) { setQueue(data); setError(''); } })
      .catch(err => { if (version === revision.current) setError(err instanceof Error ? err.message : 'Falha ao carregar prioridades.'); })
      .finally(() => { if (version === revision.current) setLoading(false); });
    const focus = () => { void refresh(); };
    window.addEventListener('focus', focus);
    return () => { invalidate(); window.removeEventListener('focus', focus); };
  }, [mine, refresh, invalidate]);
  async function open(item: WorkItem) {
    setBusy(item.id); setError('');
    try {
      if (item.leadId) setLead(await request<LeadItem>(`/leads/${item.leadId}`));
      else if (item.vehicleId) setVehicle(await vehicleService.getById(item.vehicleId));
    } catch (err) { setError(err instanceof Error ? err.message : 'Falha ao abrir a ação.'); }
    finally { setBusy(null); }
  }
  async function contact(item: WorkItem) {
    if (!item.leadId) return;
    setBusy(item.id); setError('');
    try { await leadService.registerContact(item.leadId); onUpdated(); await refresh(); }
    catch (err) { setError(err instanceof Error ? err.message : 'Falha ao registrar contato.'); }
    finally { setBusy(null); }
  }
  function close() { setLead(null); setVehicle(null); onUpdated(); void refresh(); }
  return <section aria-labelledby="daily-work-title" className="space-y-3 rounded-xl border border-blue-500/30 bg-nexus-card p-4">
    <header className="flex flex-wrap items-start justify-between gap-3">
      <div><h2 id="daily-work-title" className="text-lg font-bold text-white">O que fazer hoje</h2>
        <p className="text-sm text-slate-400">Até 10 ações por urgência. Estoque compartilhado aparece para todos.</p></div>
      <div className="flex flex-wrap gap-2">
        {isAdmin && <button type="button" aria-pressed={!mine} onClick={() => { setLoading(true); setMine(!mine); }} className="rounded-lg bg-slate-800 px-3 py-2 text-sm text-white">{mine ? 'Meus atendimentos' : 'Toda a equipe'}</button>}
        <button type="button" disabled={loading || busy !== null} onClick={() => { setLoading(true); void refresh(); }} className="rounded-lg bg-slate-800 px-3 py-2 text-sm text-white disabled:opacity-50">Atualizar prioridades</button>
      </div>
    </header>
    {error && <p role="alert" className="text-sm text-rose-300">{error} Use Atualizar prioridades para tentar novamente.</p>}
    {loading ? <p role="status" className="text-sm text-slate-400">Atualizando prioridades...</p> : !error && <>
      <details className="text-xs text-slate-400"><summary className="cursor-pointer">{queue?.total ?? 0} ações encontradas · Como priorizamos</summary><p className="mt-2">Retornos de hoje no horário de Brasília, primeiro contato, 3 dias sem contato, 30 dias desde o cadastro do veículo ou margem estimada abaixo de 5%. Após um retorno vencido, registre a próxima data no atendimento.</p></details>
      <ol className="grid gap-3 lg:grid-cols-3">
        {queue?.items.slice(0, expanded ? 10 : 3).map((item, index) => <li key={item.id} className="min-w-0 space-y-2 rounded-lg border border-slate-700 p-3">
          <h3 className="break-words font-semibold text-white">{index + 1}. {item.title}</h3>
          <p className="text-xs text-slate-400">{[item.vehicleName, item.responsibleName].filter(Boolean).join(' · ')}</p>
          <ul className="flex flex-wrap gap-1">{item.reasons.map(reason => <li key={reason} className="rounded bg-amber-500/10 px-2 py-1 text-xs text-amber-200">{reason}</li>)}</ul>
          {item.nextContactAt && <p className="text-xs text-slate-300">Retorno: {new Date(item.nextContactAt).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}</p>}
          {item.marginPercentage !== null && <p className="text-xs text-slate-400">Margem estimada: {item.marginPercentage.toLocaleString('pt-BR')}%</p>}
          <div className="flex flex-wrap gap-2">
            <button type="button" disabled={busy !== null} onClick={() => void open(item)} className="rounded-lg bg-blue-600 px-3 py-2 text-sm text-white disabled:opacity-50">{busy === item.id ? 'Aguarde...' : item.kind === 'lead' ? (item.missingFields?.length ? 'Completar contato' : 'Atender cliente') : item.kind === 'delivery' ? 'Conferir entrega' : 'Revisar veículo'}</button>
            {item.leadId && !item.missingFields?.includes("telefone") && <button type="button" disabled={busy !== null} onClick={() => void contact(item)} className="rounded-lg bg-slate-800 px-3 py-2 text-sm text-white disabled:opacity-50">Registrar contato realizado</button>}
          </div>
        </li>)}
      </ol>
      {(queue?.items.length ?? 0) > 3 && <button type="button" aria-expanded={expanded} onClick={() => setExpanded(!expanded)} className="rounded-lg bg-slate-800 px-3 py-2 text-sm text-white">{expanded ? 'Mostrar apenas 3 prioridades' : `Mostrar mais prioridades (${queue!.items.length - 3})`}</button>}
      {!queue?.items.length && <p role="status" className="py-4 text-sm text-emerald-300">Nenhuma prioridade pelos critérios atuais. Seus atendimentos continuam disponíveis abaixo.</p>}
    </>}
    {lead && <AttendancePanel key={lead.id} lead={lead} onClose={close} onUpdated={() => { onUpdated(); void refresh(); }} />}
    {vehicle && <VehicleOperations key={vehicle.id} vehicle={vehicle} onClose={close} />}
  </section>;
}
