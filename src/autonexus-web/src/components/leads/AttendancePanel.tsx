import { request } from '../../services/api';
import { VehicleOperations } from '../vehicles/VehicleOperations';
import { LaunchLeadTools } from './LaunchLeadTools';
import { useEffect, useRef, useState } from 'react';
import { leadService, LeadStatus, type LeadItem, type AttendanceInput } from '../../services/leadService';
import { vehicleService } from '../../services/vehicleService';
import { VehicleStatus, type VehicleSummary } from '../../types/vehicle';
import { getFullPhotoUrl } from '../vehicles/VehiclePhotosModal';
import { OpenAiAssistant } from './OpenAiAssistant';
import { AttendanceFinancing } from './AttendanceFinancing';
import { AttendanceTools } from './AttendanceTools';
import { VehicleSaleModal } from '../vehicles/VehicleSaleModal';

const money = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const localTime = (value?: string | null) => {
  if (!value) return '';
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

export function AttendancePanel({ lead, onClose, onUpdated }: {
  lead: LeadItem; onClose: () => void; onUpdated: (lead: LeadItem) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [current, setCurrent] = useState(lead);
  const [contact, setContact] = useState({ name: lead.name, phone: lead.phone, externalId: lead.externalId ?? '' });
  const [vehicle, setVehicle] = useState<VehicleSummary | null>(null);
  const [form, setForm] = useState<AttendanceInput>({
    offerValue: lead.offerValue ?? null, downPayment: lead.downPayment ?? null,
    tradeDescription: lead.tradeDescription ?? '', nextContactAt: lead.nextContactAt ?? null,
    offerValidUntil: lead.offerValidUntil ?? null,
  });
  const [returnAt, setReturnAt] = useState(localTime(lead.nextContactAt));
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [operationsOpen, setOperationsOpen] = useState(false);
  const [selling, setSelling] = useState(false);
  useEffect(() => {
    dialog.current?.showModal();
    let active = true;
    if (lead.vehicleId) vehicleService.getById(lead.vehicleId)
      .then(data => {
        if (!active) return;
        const photos = data.photos as { storagePath: string; isMain: boolean }[] | undefined;
        const photo = photos?.find(item => item.isMain) ?? photos?.[0];
        setVehicle({ ...data, mainPhotoUrl: photo ? getFullPhotoUrl(photo.storagePath) : undefined });
      })
      .catch(() => { if (active) setError('Não foi possível carregar o veículo. Feche e reabra o atendimento para tentar novamente.'); });
    return () => { active = false; };
  }, [lead.vehicleId]);

  async function save() {
    setBusy(true); setError(''); setNotice('');
    try {
      const updated = await leadService.saveAttendance(lead.id, {
        ...form, nextContactAt: returnAt ? new Date(returnAt).toISOString() : null,
      });
      setCurrent(updated); onUpdated(updated); setNotice('Atendimento salvo.');
      return true;
    } catch (err) { setError(err instanceof Error ? err.message : 'Falha ao salvar.'); return false; }
    finally { setBusy(false); }
  }
  const phoneDigits = current.phone.replace(/\D/g, '');
  const phone = phoneDigits.length === 10 || phoneDigits.length === 11 ? '55' + phoneDigits : phoneDigits;
  const proposal = [
    `Olá, ${current.name}! Segue sua proposta.`,
    vehicle ? `${vehicle.brand} ${vehicle.model} ${vehicle.version ?? ''} · ${vehicle.modelYear}` : current.vehicleName ?? '',
    form.offerValue ? `Valor proposto: ${money(form.offerValue)}` : '',
    form.downPayment != null ? `Entrada: ${money(form.downPayment)}` : '',
    form.tradeDescription ? `Troca em avaliação: ${form.tradeDescription}` : '',
    form.offerValidUntil ? `Validade: ${form.offerValidUntil.split('-').reverse().join('/')}` : '',
    'Condições sujeitas à confirmação da loja e à disponibilidade do veículo.',
  ].filter(Boolean).join('\n');

  return <dialog ref={dialog} aria-labelledby="attendance-title"
    onCancel={event => { event.preventDefault(); if (!busy) onClose(); }}
    className="m-auto max-h-[94dvh] w-[96vw] max-w-5xl overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 p-4 text-white backdrop:bg-black/75 sm:p-6">
    <header className="mb-5 flex items-start justify-between gap-3">
      <div><h2 id="attendance-title" className="text-xl font-bold">{current.name || "Lead sem nome"}</h2>
        <a href={`tel:${current.phone}`} className="text-sm text-slate-400">{current.phone}</a>
        <p className="text-xs text-slate-400">{current.statusName} · {current.assignedToName ?? 'Sem responsável'}</p>
      </div>
      <button disabled={busy} onClick={onClose} className="rounded-lg bg-slate-800 px-4 py-2">Fechar</button>
    </header>
    {error && <p role="alert" className="mb-3 text-rose-300">{error}</p>}
    {notice && <p role="status" className="mb-3 text-emerald-300">{notice}</p>}
    <div className="grid gap-5 md:grid-cols-2">
      <section className="space-y-3 rounded-xl border border-slate-700 p-4">
        <h3 className="font-semibold">Veículo de interesse</h3>
        {vehicle ? <>
          {vehicle.mainPhotoUrl && <img src={vehicle.mainPhotoUrl} alt={vehicle.model} className="h-48 w-full rounded-lg object-cover" />}
          <p className="text-lg font-semibold">{vehicle.brand} {vehicle.model} {vehicle.version}</p>
          <p className="text-sm text-slate-400">{vehicle.modelYear} · {vehicle.mileage.toLocaleString('pt-BR')} km</p>
          <p>{vehicle.listedValue ? money(vehicle.listedValue) : 'Preço a confirmar'}</p>
          <p className={vehicle.status === VehicleStatus.AVenda ? 'text-emerald-300' : 'text-amber-300'}>
            {vehicle.status === VehicleStatus.Vendido ? 'Vendido' : vehicle.status === VehicleStatus.Reservado ? 'Reservado' : vehicle.status === VehicleStatus.AVenda ? 'À venda' : 'Em troca'}
          </p>
        </> : <p className="text-slate-400">{lead.vehicleId ? 'Carregando veículo…' : 'Vincule um veículo em Editar atendimento.'}</p>}
        {!!current.missingFields?.length && <form className="space-y-2 rounded-lg border border-amber-500/40 p-3" onSubmit={async event => {
          event.preventDefault(); setBusy(true); setError(''); setNotice('');
          try {
            const updated = await request<LeadItem>(`/leads/${lead.id}/contact-details`, { method: 'PATCH', body: JSON.stringify(contact) });
            setCurrent(updated); onUpdated(updated); setNotice('Dados do contato atualizados.');
          } catch (err) { setError(err instanceof Error ? err.message : 'Falha ao atualizar o contato.'); }
          finally { setBusy(false); }
        }}>
          <h3 className="font-semibold">Completar contato</h3>
          <p className="text-xs text-amber-200">Pendências: {current.missingFields.join(', ')}.</p>
          <label className="block text-sm">Nome<input required maxLength={160} className="mt-1 w-full rounded bg-slate-950 p-2" value={contact.name} onChange={e => setContact({ ...contact, name: e.target.value })} /></label>
          <label className="block text-sm">Telefone<input required type="tel" maxLength={30} className="mt-1 w-full rounded bg-slate-950 p-2" value={contact.phone} onChange={e => setContact({ ...contact, phone: e.target.value })} /></label>
          {(current.externalId || current.missingFields.includes('identificador do portal')) && <label className="block text-sm">Identificador do portal<input maxLength={160} className="mt-1 w-full rounded bg-slate-950 p-2" value={contact.externalId} onChange={e => setContact({ ...contact, externalId: e.target.value })} /></label>}
          <button disabled={busy} className="rounded bg-blue-600 px-3 py-2 text-sm">Salvar contato</button>
        </form>}
        <h3 className="pt-3 font-semibold">Histórico do atendimento</h3>
        <p className="text-sm text-slate-400">Criado em {new Date(current.createdAt).toLocaleString('pt-BR')}</p>
        {current.lastContactAt && <p className="text-sm text-slate-400">Último contato em {new Date(current.lastContactAt).toLocaleString('pt-BR')}</p>}
        <p className="whitespace-pre-wrap text-sm">{current.notes || 'Sem observações.'}</p>
        <button disabled={busy || current.missingFields?.includes("telefone")} className="rounded-lg bg-slate-800 px-3 py-2 disabled:opacity-50" onClick={async () => {
          setBusy(true); setError('');
          try { const updated = await leadService.registerContact(current.id); setCurrent(updated); onUpdated(updated); setNotice('Contato registrado.'); }
          catch (err) { setError(err instanceof Error ? err.message : 'Falha ao registrar contato.'); }
          finally { setBusy(false); }
        }}>Registrar contato realizado</button>
      </section>
      <form className="space-y-3" onSubmit={async event => { event.preventDefault(); await save(); }}>
        <h3 className="font-semibold">Proposta e próximo retorno</h3>
        <fieldset disabled={busy} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm">Valor proposto
              <input type="number" min="0.01" step="0.01" value={form.offerValue ?? ''} onChange={e => setForm({ ...form, offerValue: e.target.value ? Number(e.target.value) : null })} className="mt-1 w-full rounded-lg bg-slate-950 p-3" />
            </label>
            <label className="text-sm">Entrada
              <input type="number" min="0" max={form.offerValue ?? undefined} step="0.01" value={form.downPayment ?? ''} onChange={e => setForm({ ...form, downPayment: e.target.value ? Number(e.target.value) : null })} className="mt-1 w-full rounded-lg bg-slate-950 p-3" />
            </label>
          </div>
          <label className="block text-sm">Veículo de troca e condições
            <textarea maxLength={500} value={form.tradeDescription ?? ''} onChange={e => setForm({ ...form, tradeDescription: e.target.value })} className="mt-1 w-full rounded-lg bg-slate-950 p-3" />
          </label>
          <AttendanceFinancing price={form.offerValue ?? vehicle?.listedValue ?? null} downPayment={form.downPayment ?? 0} />
          <label className="block text-sm">Proposta válida até
            <input type="date" value={form.offerValidUntil ?? ''} onChange={e => setForm({ ...form, offerValidUntil: e.target.value || null })} className="mt-1 w-full rounded-lg bg-slate-950 p-3" />
          </label>
          <label className="block text-sm">Próximo retorno, visita ou test-drive
            <input type="datetime-local" value={returnAt} onChange={e => setReturnAt(e.target.value)} className="mt-1 w-full rounded-lg bg-slate-950 p-3" />
          </label>
          <div className="flex flex-wrap gap-2">
            {[1, 3, 7].map(days => <button key={days} type="button"
              className="rounded-lg bg-slate-800 px-3 py-2 text-sm" onClick={() => {
                const next = new Date();
                next.setDate(next.getDate() + days);
                next.setHours(9, 0, 0, 0);
                setReturnAt(localTime(next.toISOString()));
              }}>Retornar em {days} {days === 1 ? 'dia' : 'dias'}</button>)}
          </div>
          <button className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold">{busy ? 'Salvando…' : 'Salvar atendimento'}</button>
        </fieldset>
        <details className="rounded-lg border border-slate-700 p-3">
          <summary className="cursor-pointer text-sm">Conferir proposta para compartilhar</summary>
          <p className="mt-3 whitespace-pre-wrap text-sm">{proposal}</p>
        </details>
        <button type="button" disabled={busy || current.missingFields?.includes("telefone") || !form.offerValue || !vehicle || vehicle.status === VehicleStatus.Vendido}
          className="w-full rounded-lg bg-emerald-700 p-3 disabled:opacity-40" onClick={async () => {
            const popup = window.open('', '_blank');
            if (await save()) {
              const url = `https://wa.me/${phone}?text=${encodeURIComponent(proposal)}`;
              if (popup) { popup.opener = null; popup.location.href = url; }
              else setError('Permita a abertura de uma nova aba para compartilhar a proposta.');
            } else popup?.close();
          }}>Compartilhar proposta no WhatsApp</button>
        {vehicle && vehicle.status !== VehicleStatus.Vendido && <button type="button" disabled={busy} className="w-full rounded-lg border border-emerald-600 p-3" onClick={async () => {
          if (await save()) setSelling(true);
        }}>Registrar venda</button>}
      </form>
    </div>
    <LaunchLeadTools leadId={current.id} vehicleId={current.vehicleId} vehicleStatus={vehicle?.status} phone={current.missingFields?.includes("telefone") ? undefined : phone}
      onVehicleChanged={() => {
        if (current.vehicleId) vehicleService.getById(current.vehicleId).then(data => setVehicle(previous => ({ ...data, mainPhotoUrl: previous?.mainPhotoUrl }))).catch(() => setError('Reabra o atendimento para atualizar o veículo.'));
      }} />
    <AttendanceTools lead={current} />
    <OpenAiAssistant lead={current} onUpdated={updated => { setCurrent(updated); onUpdated(updated); }} />
    {vehicle && <button type="button" onClick={() => setOperationsOpen(true)} className="mt-4 rounded-lg border border-slate-700 px-4 py-3 text-sm">Conferir margem, despesas e entrega</button>}
    {operationsOpen && vehicle && <VehicleOperations vehicle={vehicle} onClose={() => setOperationsOpen(false)} />}
    {selling && vehicle && <VehicleSaleModal isOpen vehicle={{ ...vehicle, saleValue: form.offerValue ?? vehicle.saleValue }}
      onClose={() => setSelling(false)} onSaleCompleted={() => {
        setVehicle({ ...vehicle, status: VehicleStatus.Vendido });
        setSelling(false);
        setNotice('Venda registrada. Atualizando a etapa do atendimento…');
        leadService.changeStatus(current.id, LeadStatus.Venda).then(updated => {
          setCurrent(updated); onUpdated(updated); setNotice('Venda registrada e atendimento atualizado.');
        }).catch(() => setError('Venda registrada. Atualize a etapa para Venda no CRM.'));
      }} />}
  </dialog>;
}
