import { useEffect, useState } from 'react';
import { documentService, type BuyerLink, type DocumentItem } from '../../services/documentService';

export function BuyerLinkPanel({ vehicleId }: { vehicleId: string }) {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [links, setLinks] = useState<BuyerLink[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [name, setName] = useState('');
  const [days, setDays] = useState(7);
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [message, setMessage] = useState('');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    let active = true;
    Promise.all([documentService.getDocuments(vehicleId), documentService.listBuyerLinks(vehicleId)])
      .then(([docs, existing]) => {
        if (active) {
          setDocuments(docs);
          setLinks(existing);
          setLoaded(true);
        }
      })
      .catch(() => { if (active) setMessage('Não foi possível carregar o portal. Feche e abra esta seção para tentar novamente.'); });
    return () => { active = false; };
  }, [open, vehicleId]);

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setMessage('');
    try { await action(); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Não foi possível concluir.'); }
    finally { setBusy(false); }
  }

  return <details className="mt-5 space-y-3 rounded-xl border border-slate-700 p-4"
    onToggle={event => setOpen(event.currentTarget.open)}>
    <summary className="cursor-pointer font-semibold">Portal do comprador</summary>
    {message && <p role="status" className="text-sm text-slate-200">{message}</p>}
    {loaded && <>
      <form className="space-y-3" onSubmit={event => {
        event.preventDefault();
        void run(async () => {
          const link = await documentService.createBuyerLink(vehicleId, { buyerName: name, expirationDays: days, documentIds: selected });
          setLinks(items => [link, ...items]);
          setSelected([]);
          setMessage('Link criado. Confira os documentos antes de encaminhar ao comprador.');
        });
      }}>
        <label className="block text-sm">Comprador <input maxLength={160} value={name} onChange={event => setName(event.target.value)}
          className="ml-2 rounded bg-slate-950 p-2" /></label>
        <label className="block text-sm">Validade em dias <input type="number" required min={1} max={30} value={days}
          onChange={event => setDays(Number(event.target.value))} className="ml-2 w-20 rounded bg-slate-950 p-2" /></label>
        <fieldset className="space-y-2">
          <legend className="text-sm font-semibold">Documentos autorizados para este link</legend>
          {documents.length === 0 && <p className="text-sm text-slate-400">Cadastre documentos na ficha do veículo para incluí-los no portal.</p>}
          {documents.map(doc => <label key={doc.id} className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={selected.includes(doc.id)} onChange={event => setSelected(ids =>
              event.target.checked ? [...ids, doc.id] : ids.filter(id => id !== doc.id))} />
            {doc.name} · {doc.documentCategoryName}
          </label>)}
        </fieldset>
        <button disabled={busy} className="rounded-lg bg-blue-600 px-4 py-2 disabled:opacity-50">Gerar link</button>
      </form>
      {links.map(link => {
        const url = new URL(link.shareUrl, window.location.origin).href;
        return <div key={link.id} className="space-y-2 border-t border-slate-700 pt-3 text-sm">
          <p>{link.buyerName || 'Comprador'} · {link.isValid ? `Válido até ${new Date(link.expiresAt).toLocaleString('pt-BR')}` : 'Inativo'}</p>
          {link.isValid && <>
            <input aria-label="Link do comprador" readOnly value={url} onFocus={event => event.target.select()}
              className="w-full rounded bg-slate-950 p-2" />
            <div className="flex flex-wrap gap-3">
              <a href={url} target="_blank" rel="noreferrer" className="underline">Conferir portal</a>
              <button type="button" className="underline" disabled={busy} onClick={() => void run(async () => {
                await navigator.clipboard.writeText(url);
                setMessage('Link copiado.');
              })}>Copiar link</button>
              <button type="button" className="text-rose-300 underline" disabled={busy} onClick={() => void run(async () => {
                await documentService.revokeBuyerLink(vehicleId, link.id);
                setLinks(items => items.map(item => item.id === link.id ? { ...item, isValid: false } : item));
              })}>Revogar</button>
            </div>
          </>}
        </div>;
      })}
    </>}
  </details>;
}
