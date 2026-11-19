import { useEffect, useState } from 'react';
import { request } from '../../services/api';
import { TransmissionType } from '../../types/vehicle';

interface LeadLaunch {
  budget: number | null; preferredTransmission: number | null; preferredModels: string | null;
  buyerResponse: string | null; buyerRespondedAt: string | null; shareExpiresAt: string | null; shareActive: boolean;
  reservation: { reservedForLeadId: string | null; reservedByUserId: string | null; reservationExpiresAt: string | null; active: boolean } | null;
}
export function LaunchLeadTools({ leadId, vehicleId, onVehicleChanged }: {
  leadId: string; vehicleId?: string | null; onVehicleChanged: () => void;
}) {
  const [data, setData] = useState<LeadLaunch | null>(null);
  const [budget, setBudget] = useState('');
  const [transmission, setTransmission] = useState('');
  const [models, setModels] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [link, setLink] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  async function load() {
    const next = await request<LeadLaunch>(`/launch/leads/${leadId}`);
    setData(next);
    return next;
  }
  useEffect(() => {
    let active = true;
    request<LeadLaunch>(`/launch/leads/${leadId}`).then(next => {
      if (!active) return;
      setData(next); setBudget(next.budget?.toString() ?? '');
      setTransmission(next.preferredTransmission?.toString() ?? ''); setModels(next.preferredModels ?? '');
    }).catch(err => { if (active) setError(err.message); });
    return () => { active = false; };
  }, [leadId]);

  async function run(action: () => Promise<void>) {
    setBusy(true); setError(''); setNotice('');
    try { await action(); await load(); }
    catch (err) { setError(err instanceof Error ? err.message : 'Não foi possível concluir a operação.'); }
    finally { setBusy(false); }
  }
  return <section className="mt-5 space-y-4 rounded-xl border border-slate-700 p-4">
    <h3 className="font-semibold">Proposta digital, reserva e preferências</h3>
    <p className="text-sm text-slate-400">Salve os dados e as condições do atendimento antes de publicar a proposta.</p>
    {error && <p role="alert" className="text-sm text-rose-300">{error}</p>}
    {notice && <p role="status" className="text-sm text-emerald-300">{notice}</p>}
    <fieldset disabled={busy} className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <button type="button" className="rounded-lg bg-blue-600 px-4 py-2" onClick={() => void run(async () => {
          const published = await request<{ path: string }>(`/launch/leads/${leadId}/proposal`, { method: 'POST' });
          setLink(window.location.origin + published.path); setNotice('Nova proposta publicada. O link anterior foi invalidado.');
        })}>Publicar proposta com link</button>
        {data?.shareActive && <button type="button" className="rounded-lg border border-slate-600 px-4 py-2"
          onClick={() => void run(async () => {
            await request(`/launch/leads/${leadId}/proposal`, { method: 'DELETE' }); setLink(''); setNotice('Link revogado.');
          })}>Revogar link</button>}
        <button type="button" className="rounded-lg border border-slate-600 px-4 py-2" onClick={() => void run(async () => { await load(); setNotice('Retorno do comprador atualizado.'); })}>Consultar retorno</button>
      </div>
      {link && <label className="block text-sm">Link da proposta
        <input readOnly value={link} onFocus={e => e.target.select()} className="mt-1 w-full rounded-lg bg-slate-950 p-3" />
        <a href={link} target="_blank" rel="noreferrer" className="mt-2 inline-block underline">Conferir proposta</a>
      </label>}
      {data?.shareExpiresAt && <p className="text-xs text-slate-400">Validade do último link: {new Date(data.shareExpiresAt).toLocaleString('pt-BR')}</p>}
      {data?.buyerResponse && <div className="rounded-lg bg-emerald-950 p-3 text-sm">
        <p>{data.buyerResponse}</p><p className="text-xs text-slate-400">{data.buyerRespondedAt && new Date(data.buyerRespondedAt).toLocaleString('pt-BR')}</p>
      </div>}
      {vehicleId && <div className="space-y-3 border-t border-slate-700 pt-4">
        <h4 className="font-semibold">Reserva do veículo</h4>
        {data?.reservation?.active ? <><p className="text-sm text-amber-300">Reservado até {new Date(data.reservation.reservationExpiresAt!).toLocaleString('pt-BR')}
          {data.reservation.reservedForLeadId !== leadId && ' para outro atendimento'}.</p>
          <button type="button" onClick={() => void run(async () => {
            await request(`/launch/vehicles/${vehicleId}/reserve`, { method: 'DELETE' }); onVehicleChanged(); setNotice('Reserva cancelada.');
          })} className="rounded-lg border border-slate-600 px-4 py-2">Cancelar reserva</button></> :
          <form onSubmit={event => { event.preventDefault(); void run(async () => {
            await request(`/launch/vehicles/${vehicleId}/reserve`, { method: 'POST', body: JSON.stringify({ leadId, expiresAt: new Date(expiresAt).toISOString() }) });
            onVehicleChanged(); setNotice('Reserva registrada.');
          }); }} className="flex flex-wrap items-end gap-3">
            <label className="text-sm">Prazo da reserva, até 7 dias<input type="datetime-local" required value={expiresAt}
              onChange={e => setExpiresAt(e.target.value)} className="mt-1 block rounded-lg bg-slate-950 p-3" /></label>
            <button className="rounded-lg bg-amber-700 px-4 py-3">Reservar veículo</button>
          </form>}
      </div>}
      <form onSubmit={event => { event.preventDefault(); void run(async () => {
        await request(`/launch/leads/${leadId}/preferences`, { method: 'PUT', body: JSON.stringify({
          budget: budget ? Number(budget) : null, transmission: transmission ? Number(transmission) : null, models: models || null,
        }) }); setNotice('Preferências salvas. O estoque poderá localizar este interessado.');
      }); }} className="space-y-3 border-t border-slate-700 pt-4">
        <h4 className="font-semibold">O que o comprador procura</h4>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm">Orçamento máximo<input type="number" min="0.01" step="0.01" value={budget} onChange={e => setBudget(e.target.value)} className="mt-1 w-full rounded-lg bg-slate-950 p-3" /></label>
          <label className="text-sm">Câmbio<select value={transmission} onChange={e => setTransmission(e.target.value)} className="mt-1 w-full rounded-lg bg-slate-950 p-3">
            <option value="">Qualquer</option><option value={TransmissionType.Manual}>Manual</option><option value={TransmissionType.Automatico}>Automático</option><option value={TransmissionType.CVT}>CVT</option>
          </select></label>
        </div>
        <label className="block text-sm">Marcas ou modelos, separados por vírgula<input maxLength={500} value={models} onChange={e => setModels(e.target.value)} placeholder="Corolla, Civic, Honda" className="mt-1 w-full rounded-lg bg-slate-950 p-3" /></label>
        <button className="rounded-lg bg-blue-600 px-4 py-2">Salvar preferências</button>
      </form>
    </fieldset>
  </section>;
}
