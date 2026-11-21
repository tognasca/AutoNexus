import { useEffect, useState } from 'react';
import { request } from '../../services/api';

type Status = 'pending' | 'processing' | 'completed';
type Source = 'manual' | 'external';
interface Entry { status: Status; source: Source; evidence: string | null; verifiedAt: string; userName: string }
const steps = [
  ['signature', 'Assinatura'],
  ['inspection', 'Vistoria'],
  ['confirmation', 'Confirmação da transferência'],
] as const;
const statuses = { pending: 'Pendente', processing: 'Em processamento', completed: 'Concluída' };

export function TransferTracking({ vehicleId }: { vehicleId: string }) {
  const url = `/launch/vehicles/${vehicleId}/transfer`;
  const [entries, setEntries] = useState<Record<string, Entry> | null>(null);
  const [step, setStep] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>('pending');
  const [source, setSource] = useState<Source>('manual');
  const [evidence, setEvidence] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    request<Record<string, Entry>>(url)
      .then(data => { if (active) setEntries(data); })
      .catch(err => { if (active) setError(err.message); });
    return () => { active = false; };
  }, [url]);

  return <section className="space-y-3 rounded-xl border border-slate-700 p-4">
    <h3 className="font-semibold">Acompanhamento da transferência</h3>
    {error && <p role="alert" className="text-sm text-rose-300">{error}</p>}
    {!entries && !error && <p role="status">Carregando etapas…</p>}
    {entries && steps.map(([id, label]) => {
      const entry = entries[id];
      return <div key={id} className="space-y-2 border-b border-slate-800 pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h4 className="text-sm font-medium">{label} · {statuses[entry?.status ?? 'pending']}</h4>
          <button type="button" disabled={busy} className="rounded bg-slate-800 px-3 py-2 text-sm" onClick={() => {
            setStep(step === id ? null : id); setStatus(entry?.status ?? 'pending');
            setSource(entry?.source ?? 'manual'); setEvidence(entry?.evidence ?? ''); setError('');
          }}>{step === id ? 'Cancelar' : 'Registrar verificação'}</button>
        </div>
        {entry && <p className="break-words text-xs text-slate-400">
          {entry.source === 'manual' ? 'Informação manual' : 'Consulta externa registrada pela loja'} · {new Date(entry.verifiedAt).toLocaleString('pt-BR')} · {entry.userName}
          {entry.evidence && <span className="block">Comprovante ou protocolo: {entry.evidence}</span>}
        </p>}
        {step === id && <form className="grid gap-2" onSubmit={async event => {
          event.preventDefault(); setBusy(true); setError('');
          try {
            setEntries(await request<Record<string, Entry>>(url, {
              method: 'PUT', body: JSON.stringify({ step: id, status, source, evidence }),
            }));
            setStep(null);
          } catch (err) { setError(err instanceof Error ? err.message : 'Falha ao registrar verificação.'); }
          finally { setBusy(false); }
        }}>
          <label className="text-sm">Situação<select value={status} onChange={e => setStatus(e.target.value as Status)} className="ml-2 rounded bg-slate-950 p-2">
            <option value="pending">Pendente</option><option value="processing">Em processamento</option><option value="completed">Concluída</option>
          </select></label>
          <label className="text-sm">Origem<select value={source} onChange={e => setSource(e.target.value as Source)} className="ml-2 rounded bg-slate-950 p-2">
            <option value="manual">Informação manual</option><option value="external">Consulta externa</option>
          </select></label>
          <label className="text-sm">Protocolo ou referência do comprovante<input value={evidence} maxLength={300}
            required={status === 'completed' || source === 'external'} onChange={e => setEvidence(e.target.value)}
            className="mt-1 w-full rounded bg-slate-950 p-2" /></label>
          <button disabled={busy} className="justify-self-start rounded bg-blue-600 px-3 py-2 text-sm">Salvar verificação</button>
        </form>}
      </div>;
    })}
  </section>;
}
