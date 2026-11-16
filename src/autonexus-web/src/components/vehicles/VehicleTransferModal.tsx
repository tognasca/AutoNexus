import { useEffect, useRef, useState, type FormEvent } from 'react';
import { request } from '../../services/api';
import type { VehicleSummary } from '../../types/vehicle';

interface Transfer {
  started: boolean;
  signed: boolean;
  inspected: boolean;
  protocol: string | null;
  completedOn: string | null;
}

export function VehicleTransferModal({ vehicle, onClose, onSaved }: {
  vehicle: VehicleSummary;
  onClose: () => void;
  onSaved: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [transfer, setTransfer] = useState<Transfer | null>(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const endpoint = `/vehicles/${vehicle.id}/transfer`;

  useEffect(() => {
    dialog.current?.showModal();
    const controller = new AbortController();
    request<Transfer>(endpoint, { signal: controller.signal })
      .then(setTransfer)
      .catch((err: Error) => {
        if (!controller.signal.aborted) setError(err.message);
      });
    return () => controller.abort();
  }, [endpoint]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!transfer || saving) return;
    setSaving(true);
    setError('');
    try {
      await request(endpoint, { method: 'PUT', body: JSON.stringify(transfer) });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível salvar a transferência.');
      setSaving(false);
    }
  }

  return (
    <dialog ref={dialog} onCancel={event => { event.preventDefault(); if (!saving) onClose(); }}
      aria-labelledby="transfer-title"
      className="m-auto w-[min(92vw,28rem)] rounded-xl border border-nexus-border bg-nexus-card p-5 text-white backdrop:bg-black/70">
      <h2 id="transfer-title" className="text-lg font-semibold">Transferência do veículo</h2>
      <p className="mb-4 text-sm text-slate-400">{vehicle.brand} {vehicle.model} · {vehicle.plate}</p>
      {error && <p role="alert" className="mb-3 text-sm text-rose-300">{error}</p>}
      {transfer ? (
        <form onSubmit={save} className="space-y-3 text-sm">
          <p className="font-semibold">
            {transfer.completedOn ? 'Concluída' : transfer.started || transfer.signed || transfer.inspected ? 'Em processamento' : 'Pendente'}
          </p>
          <fieldset disabled={saving} className="space-y-3">
            {([
              ['started', 'Processo iniciado'],
              ['signed', 'Assinatura confirmada'],
              ['inspected', 'Vistoria confirmada, quando aplicável'],
            ] as const).map(([key, label]) => (
              <label key={key} className="flex items-center gap-2">
                <input type="checkbox" checked={transfer[key]}
                  onChange={event => setTransfer({ ...transfer, [key]: event.target.checked })} />
                {label}
              </label>
            ))}
            <label className="block">
              Protocolo da transferência
              <input className="mt-1 block w-full rounded border border-slate-700 bg-slate-950 p-2"
                maxLength={120} required={Boolean(transfer.completedOn)} value={transfer.protocol ?? ''}
                onChange={event => setTransfer({ ...transfer, protocol: event.target.value })} />
            </label>
            <label className="block">
              Data da confirmação da transferência
              <input type="date" className="mt-1 block w-full rounded border border-slate-700 bg-slate-950 p-2"
                value={transfer.completedOn ?? ''}
                onChange={event => setTransfer({ ...transfer, completedOn: event.target.value || null })} />
            </label>
          </fieldset>
          <div className="flex justify-end gap-3">
            <button type="button" disabled={saving} onClick={onClose} className="px-3 py-2">Cancelar</button>
            <button disabled={saving} className="rounded bg-nexus-accent px-4 py-2 font-semibold">
              {saving ? 'Salvando…' : 'Salvar'}
            </button>
          </div>
        </form>
      ) : (
        <div className="flex items-center justify-between">
          {!error && <p role="status">Carregando transferência…</p>}
          <button type="button" onClick={onClose} className="px-3 py-2">Fechar</button>
        </div>
      )}
    </dialog>
  );
}
