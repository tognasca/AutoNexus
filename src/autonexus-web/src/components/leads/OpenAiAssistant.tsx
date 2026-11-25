import { useEffect, useState } from 'react';
import { request } from '../../services/api';
import { leadService, type LeadItem } from '../../services/leadService';
import type { Settings } from '../../pages/admin/OpenAiSettings';

interface Draft { name: string; phone: string; notes: string; message: string }

export function OpenAiAssistant({ lead, onUpdated }: { lead: LeadItem; onUpdated: (lead: LeadItem) => void }) {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [source, setSource] = useState('');
  const [draft, setDraft] = useState<Draft | null>(null);
  const [action, setAction] = useState('extract');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const refresh = () => request<Settings>('/ai/settings').then(setSettings);
  useEffect(() => { void refresh().catch(() => setError('Não foi possível carregar a configuração de IA.')); }, []);
  async function generate(nextAction: string) {
    setBusy(true); setError(''); setMessage(''); setDraft(null); setAction(nextAction);
    try {
      setDraft(await request<Draft>('/ai/generate', { method: 'POST',
        body: JSON.stringify({ leadId: lead.id, action: nextAction, text: nextAction === 'extract' ? source : null }) }));
    } catch (err) { setError(err instanceof Error ? err.message : 'Falha ao gerar rascunho.'); }
    finally { await refresh().catch(() => {}); setBusy(false); }
  }
  const digits = lead.phone.replace(/\D/g, '');
  const phone = digits.length === 10 || digits.length === 11 ? '55' + digits : digits;
  return <section className="mt-5 space-y-3 rounded-xl border border-violet-800 p-4">
    <h3 className="font-semibold">Assistente IA · OpenAI</h3>
    {settings && <p className="text-sm text-slate-400">
      {settings.enabled && settings.configured ? 'Habilitado' : 'Desabilitado'} · {settings.used}/{settings.monthlyLimit} tentativas em {settings.month} (UTC).
      Cada tentativa conta no limite mensal, inclusive falhas. A cobrança ocorre na conta OpenAI da empresa.
    </p>}
    {error && <p role="alert" className="text-sm text-rose-300">{error}</p>}
    {message && <p role="status" className="text-sm text-emerald-300">{message}</p>}
    {settings?.configured && settings.enabled && <>
      <p className="text-sm text-slate-400">Cole uma mensagem para preparar os dados do cliente. Confira os campos antes de aplicar. Para gerar proposta, salve primeiro as condições no atendimento.</p>
      <label className="block text-sm">Mensagem do cliente
        <textarea disabled={busy} maxLength={6000} rows={3} value={source} onChange={e => setSource(e.target.value)}
          className="mt-1 w-full rounded-lg bg-slate-950 p-3" />
      </label>
      <div className="flex flex-wrap gap-2">
        <button disabled={busy || !source.trim()} type="button" onClick={() => void generate('extract')}
          className="rounded-lg bg-violet-700 px-4 py-2 disabled:opacity-50">Preparar cadastro</button>
        <button disabled={busy} type="button" onClick={() => void generate('proposal')}
          className="rounded-lg bg-violet-700 px-4 py-2 disabled:opacity-50">Preparar proposta salva</button>
      </div>
    </>}
    {busy && <p role="status" className="text-sm text-slate-400">Processando…</p>}
    {draft && action === 'extract' && <form className="space-y-3" onSubmit={async event => {
      event.preventDefault(); setBusy(true); setError('');
      try {
        const updated = await leadService.update(lead.id, {
          name: draft.name.trim() || lead.name, phone: draft.phone.trim() || lead.phone,
          notes: draft.notes.trim() || lead.notes, email: lead.email, source: lead.source,
          vehicleId: lead.vehicleId, assignedToUserId: lead.assignedToUserId,
        });
        onUpdated(updated); setDraft(null); setMessage('Dados conferidos e aplicados ao atendimento.');
      } catch (err) { setError(err instanceof Error ? err.message : 'Falha ao aplicar dados.'); }
      finally { setBusy(false); }
    }}>
      <fieldset disabled={busy} className="space-y-3">
        <p className="text-sm text-amber-300">Revise o rascunho. Campos vazios preservam o cadastro atual. O resumo preenchido substitui as observações atuais.</p>
        <label className="block text-sm">Nome<input maxLength={160} value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} className="mt-1 w-full rounded-lg bg-slate-950 p-3" /></label>
        <label className="block text-sm">Telefone<input maxLength={30} value={draft.phone} onChange={e => setDraft({ ...draft, phone: e.target.value })} className="mt-1 w-full rounded-lg bg-slate-950 p-3" /></label>
        <label className="block text-sm">Resumo / observações<textarea maxLength={2000} value={draft.notes} onChange={e => setDraft({ ...draft, notes: e.target.value })} className="mt-1 w-full rounded-lg bg-slate-950 p-3" /></label>
        <button className="rounded-lg bg-violet-700 px-4 py-2">Confirmar e aplicar dados</button>
      </fieldset>
    </form>}
    {draft && action === 'proposal' && <div className="space-y-3">
      <label className="block text-sm">Revise a proposta<textarea maxLength={6000} rows={6} value={draft.message} onChange={e => setDraft({ ...draft, message: e.target.value })}
        className="mt-1 w-full rounded-lg bg-slate-950 p-3" /></label>
      {draft.message.trim() && <a href={`https://wa.me/${phone}?text=${encodeURIComponent(draft.message)}`} target="_blank" rel="noreferrer"
        className="inline-block rounded-lg bg-emerald-700 px-4 py-3 text-sm">Abrir proposta no WhatsApp</a>}
    </div>}
  </section>;
}
