import { useEffect, useState } from 'react';
import { request } from '../services/api';
import { getPhotoUrl } from '../services/catalogService';

interface Proposal { store: string; logo?: string; color?: string; contact?: string; buyer: string; vehicle: string; photos: string[]; value: number; downPayment?: number; trade?: string; expiresAt: string; generatedAt: string }
const money = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export function PublicProposalPage() {
  const token = window.location.pathname.split('/').pop() || '';
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [error, setError] = useState('');
  const [comment, setComment] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const meta = document.createElement('meta'); meta.name = 'referrer'; meta.content = 'no-referrer'; document.head.appendChild(meta);
    const controller = new AbortController();
    request<Proposal>(`/launch/proposals/${encodeURIComponent(token)}`, { signal: controller.signal }).then(setProposal)
      .catch(err => { if (!controller.signal.aborted) setError(err.message); });
    return () => { controller.abort(); meta.remove(); };
  }, [token]);
  async function respond(action: string) {
    setBusy(true); setError(''); setNotice('');
    try {
      await request(`/launch/proposals/${encodeURIComponent(token)}/response`, { method: 'POST', body: JSON.stringify({ action, message: comment }) });
      setNotice('Seu retorno foi registrado. A loja continuará o atendimento.');
    } catch (err) { setError(err instanceof Error ? err.message : 'Não foi possível registrar seu retorno.'); }
    finally { setBusy(false); }
  }
  return <main className="min-h-screen bg-slate-100 px-4 py-8 text-slate-900">
    <div className="mx-auto max-w-3xl space-y-5">
      {error && <p role="alert" className="rounded-xl bg-rose-100 p-4 text-rose-800">{error}</p>}
      {!proposal && !error && <p role="status">Carregando proposta…</p>}
      {proposal && <>
        <header className="flex items-center gap-4">{proposal.logo && <img referrerPolicy="no-referrer" src={getPhotoUrl(proposal.logo)} alt="" className="h-16 w-20 object-contain" />}<div><p className="text-sm">{proposal.store}</p><h1 className="text-2xl font-bold">Sua proposta, {proposal.buyer}</h1></div></header>
        <section className="overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="flex snap-x gap-2 overflow-x-auto">{proposal.photos.map((photo, index) => <img key={index} referrerPolicy="no-referrer" src={getPhotoUrl(photo)} alt={proposal.vehicle} className="h-64 w-full shrink-0 snap-center object-contain sm:h-80" />)}</div>
          <div className="space-y-4 p-5 sm:p-8"><h2 className="text-2xl font-bold">{proposal.vehicle}</h2><p className="text-3xl font-bold">{money(proposal.value)}</p>
            {proposal.downPayment != null && <p>Entrada proposta de {money(proposal.downPayment)}</p>}
            {proposal.trade && <p className="whitespace-pre-wrap">Troca em avaliação: {proposal.trade}</p>}
            <p className="text-sm text-slate-600">Válida até {new Date(proposal.expiresAt).toLocaleString('pt-BR')}. Disponibilidade, troca e condições comerciais dependem da confirmação da loja.</p>
            <p className="text-sm text-slate-600">Seu retorno demonstra interesse e permite continuar a negociação.</p>
          </div>
        </section>
        <section className="space-y-3 rounded-2xl bg-white p-5">
          <label className="block text-sm">Dúvida ou ajuste desejado<textarea maxLength={500} rows={3} value={comment} onChange={e => setComment(e.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 p-3" /></label>
          <div className="flex flex-wrap gap-3"><button disabled={busy} onClick={() => void respond('interested')} className="rounded-lg bg-slate-900 px-5 py-3 text-white disabled:opacity-50">Tenho interesse</button><button disabled={busy || !comment.trim()} onClick={() => void respond('adjustment')} className="rounded-lg border border-slate-300 px-5 py-3 disabled:opacity-50">Solicitar ajuste</button>
            {proposal.contact && <a href={`https://wa.me/${proposal.contact.replace(/\D/g, '')}?text=${encodeURIComponent('Olá! Gostaria de conversar sobre a proposta do ' + proposal.vehicle)}`} target="_blank" rel="noreferrer" className="rounded-lg bg-emerald-700 px-5 py-3 text-white">Falar com a loja</a>}
          </div>{notice && <p role="status" className="text-emerald-800">{notice}</p>}
        </section>
      </>}
    </div>
  </main>;
}
