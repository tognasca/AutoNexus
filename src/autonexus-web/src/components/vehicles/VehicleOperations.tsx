import { useEffect, useRef, useState } from 'react';
import { request } from '../../services/api';
import { VehicleStatus, type VehicleSummary } from '../../types/vehicle';
import type { LeadItem } from '../../services/leadService';
import { VehicleCostsModal } from './VehicleCostsModal';
import { AttendancePanel } from '../leads/AttendancePanel';

interface Margin { values: { purchase: number; expenses: number; totalCost: number; revenue: number | null; profit: number | null; marginPercentage: number | null }; costs: { description: string; value: number; category: string }[]; realized: boolean; discount: number }
interface DeliveryEntry { done: boolean; completedAt: string | null; userId: string | null }
interface Interested { id: string; name: string; phone: string; budget: number | null; preferredModels: string | null }
const steps = [{ id: 'payment', label: 'Pagamento conferido' }, { id: 'documents', label: 'Documentos conferidos' }, { id: 'accessories', label: 'Chaves e acessórios conferidos' }, { id: 'handover', label: 'Veículo entregue' }];
const money = (value: number | null) => value == null ? 'A informar' : value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export function VehicleOperations({ vehicle, onClose }: { vehicle: VehicleSummary; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [margin, setMargin] = useState<Margin | null>(null);
  const [delivery, setDelivery] = useState<Record<string, DeliveryEntry>>({});
  const [interested, setInterested] = useState<Interested[]>([]);
  const [offer, setOffer] = useState('');
  const [costsOpen, setCostsOpen] = useState(false);
  const [lead, setLead] = useState<LeadItem | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function refreshMargin(value = '') {
    setMargin(await request<Margin>(`/launch/vehicles/${vehicle.id}/margin${value ? '?offer=' + encodeURIComponent(value) : ''}`));
  }
  useEffect(() => {
    dialog.current?.showModal();
    let active = true;
    Promise.all([
      request<Margin>(`/launch/vehicles/${vehicle.id}/margin`),
      request<Record<string, DeliveryEntry>>(`/launch/vehicles/${vehicle.id}/delivery`),
      request<Interested[]>(`/launch/vehicles/${vehicle.id}/interested`),
    ]).then(([values, checklist, buyers]) => { if (active) { setMargin(values); setDelivery(checklist); setInterested(buyers); } })
      .catch(err => { if (active) setError(err.message); });
    return () => { active = false; };
  }, [vehicle.id]);
  return <dialog ref={dialog} aria-labelledby="vehicle-operations-title"
    onCancel={event => { event.preventDefault(); if (!busy) onClose(); }}
    className="m-auto max-h-[94dvh] w-[96vw] max-w-4xl overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 p-5 text-white backdrop:bg-black/75">
    <header className="mb-5 flex items-center justify-between gap-3"><div><h2 id="vehicle-operations-title" className="text-xl font-bold">Resultado e entrega</h2><p className="text-sm text-slate-400">{vehicle.brand} {vehicle.model} · {vehicle.plate}</p></div><button disabled={busy} type="button" onClick={onClose} className="rounded-lg bg-slate-800 px-4 py-2">Fechar</button></header>
    {error && <p role="alert" className="mb-3 text-rose-300">{error}</p>}
    <div className="grid gap-5 md:grid-cols-2">
      <section className="space-y-3 rounded-xl border border-slate-700 p-4">
        <h3 className="font-semibold">{margin?.realized ? 'Resultado da venda' : 'Margem estimada'}</h3>
        {margin && <><dl className="space-y-2 text-sm">
          {[['Compra', margin.values.purchase], ['Despesas cadastradas', margin.values.expenses], ['Custo total', margin.values.totalCost], ['Receita', margin.values.revenue], ['Resultado', margin.values.profit]].map(([label, value]) => <div key={String(label)} className="flex justify-between gap-3"><dt>{label}</dt><dd className="font-semibold">{money(value as number | null)}</dd></div>)}
          <div className="flex justify-between"><dt>Margem sobre receita</dt><dd>{margin.values.marginPercentage == null ? 'A informar' : margin.values.marginPercentage.toLocaleString('pt-BR') + '%'}</dd></div>
          <div className="flex justify-between"><dt>Desconto sobre anúncio</dt><dd>{money(margin.discount)}</dd></div>
        </dl><p className="text-xs text-slate-400">O desconto já está refletido na receita. Registre manutenção, preparação, documentação, comissão e outros gastos nas despesas para compor o resultado.</p></>}
        {vehicle.status !== VehicleStatus.Vendido && <form onSubmit={async event => {
          event.preventDefault(); setBusy(true); setError('');
          try { await refreshMargin(offer); } catch (err) { setError(err instanceof Error ? err.message : 'Falha ao calcular.'); }
          finally { setBusy(false); }
        }} className="space-y-2"><label className="block text-sm">Simular preço negociado<input type="number" min="0.01" step="0.01" value={offer} onChange={e => setOffer(e.target.value)} className="mt-1 w-full rounded-lg bg-slate-950 p-3" /></label><button disabled={busy} className="rounded-lg bg-blue-600 px-4 py-2">Calcular margem</button></form>}
        <button type="button" onClick={() => setCostsOpen(true)} className="rounded-lg border border-slate-600 px-4 py-2">Gerenciar despesas</button>
        {margin?.costs.map((cost, index) => <div key={index} className="flex justify-between gap-3 border-t border-slate-800 pt-2 text-xs"><span>{cost.description} · {cost.category}</span><span>{money(cost.value)}</span></div>)}
      </section>
      <section className="space-y-3 rounded-xl border border-slate-700 p-4">
        <h3 className="font-semibold">Checklist da entrega</h3>
        {vehicle.status !== VehicleStatus.Vendido && <p className="text-sm text-slate-400">Disponível após o registro da venda.</p>}
        {steps.map(step => <div key={step.id} className="border-b border-slate-800 pb-3">
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={delivery[step.id]?.done ?? false}
            disabled={busy || vehicle.status !== VehicleStatus.Vendido || !delivery[step.id]}
            onChange={async event => {
              setBusy(true); setError('');
              try { setDelivery(await request<Record<string, DeliveryEntry>>(`/launch/vehicles/${vehicle.id}/delivery`, {
                method: 'PUT', body: JSON.stringify({ step: step.id, done: event.target.checked }),
              })); } catch (err) { setError(err instanceof Error ? err.message : 'Falha ao registrar conferência.'); }
              finally { setBusy(false); }
            }} />{step.label}</label>
          {delivery[step.id]?.completedAt && <p className="mt-1 break-all text-xs text-slate-400">
            {new Date(delivery[step.id].completedAt!).toLocaleString('pt-BR')} · Responsável {delivery[step.id].userId}
          </p>}
        </div>)}
        <h3 className="pt-3 font-semibold">Compradores compatíveis</h3>
        <p className="text-xs text-slate-400">Comparação das preferências salvas com orçamento, câmbio e modelo deste veículo à venda.</p>
        {interested.map(buyer => <button key={buyer.id} type="button" disabled={busy}
          className="block w-full rounded-lg bg-slate-800 p-3 text-left text-sm" onClick={async () => {
            setBusy(true); setError('');
            try { setLead(await request<LeadItem>(`/leads/${buyer.id}`)); }
            catch (err) { setError(err instanceof Error ? err.message : 'Falha ao abrir atendimento.'); }
            finally { setBusy(false); }
          }}><b>{buyer.name}</b><p className="text-xs text-slate-400">{buyer.phone} · {buyer.budget ? money(buyer.budget) : 'Orçamento livre'}</p></button>)}
        {!interested.length && <p className="text-sm text-slate-500">Nenhum interessado compatível encontrado.</p>}
      </section>
    </div>
    <VehicleCostsModal isOpen={costsOpen} vehicle={vehicle} onClose={() => setCostsOpen(false)} onCostsUpdated={() => void refreshMargin(offer).catch(() => setError('Reabra o resultado para atualizar despesas.'))} />
    {lead && <AttendancePanel key={lead.id} lead={lead} onClose={() => setLead(null)} onUpdated={setLead} />}
  </dialog>;
}
