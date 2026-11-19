import { useEffect, useState } from 'react';
import { request } from '../../services/api';
import { lookupService } from '../../services/lookupService';
import type { LookupItem } from '../../types/lookup';
import { parseStockImport, stockImportTemplate, type StockImportRow } from '../../utils/stockImport';

interface Preview { accepted: number; skipped: number; preview: { brand: string; model: string; plate: string; modelYear: number; listedValue: number | null }[] }
export function StockImport({ onImported }: { onImported: () => void }) {
  const [types, setTypes] = useState<LookupItem[]>([]);
  const [typeId, setTypeId] = useState('');
  const [text, setText] = useState('');
  const [rows, setRows] = useState<StockImportRow[]>([]);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  useEffect(() => { lookupService.getVehicleTypes().then(setTypes).catch(() => setError('Não foi possível carregar os tipos de veículo.')); }, []);
  function downloadTemplate() {
    const url = URL.createObjectURL(new Blob(['\uFEFF' + stockImportTemplate], { type: 'text/csv;charset=utf-8' }));
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'modelo-estoque.csv'; anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return <section className="space-y-4 rounded-2xl border border-nexus-border bg-nexus-card p-5 text-white">
    <h2 className="font-bold">Importar estoque com conferência</h2>
    <p className="text-sm text-slate-400">Baixe o modelo, preencha até 100 veículos e confira antes de importar. Placas já cadastradas serão ignoradas. Inclua fotos e detalhes depois pelo estoque.</p>
    {error && <p role="alert" className="whitespace-pre-wrap text-sm text-rose-300">{error}</p>}
    {notice && <p role="status" className="text-sm text-emerald-300">{notice}</p>}
    <fieldset disabled={busy} className="space-y-3">
      <button type="button" onClick={downloadTemplate} className="rounded-lg border border-slate-600 px-4 py-2 text-sm">Baixar modelo CSV</button>
      <div className="grid gap-3 sm:grid-cols-2"><label className="text-sm">Tipo de veículo do lote
        <select value={typeId} onChange={e => { setTypeId(e.target.value); setPreview(null); }} className="mt-1 w-full rounded-lg bg-slate-950 p-3">
          <option value="">Selecione</option>{types.map(type => <option key={type.id} value={type.id}>{type.name}</option>)}
        </select>
      </label><label className="text-sm">Arquivo CSV em UTF-8
        <input type="file" accept=".csv,text/csv" className="mt-1 block w-full text-sm" onChange={async e => {
          setPreview(null); setNotice(''); setError('');
          const file = e.target.files?.[0]; if (!file) return;
          if (file.size > 1024 * 1024) { setError('Selecione um CSV de até 1 MB.'); return; }
          try { setText(await file.text()); } catch { setError('Não foi possível ler o arquivo.'); }
        }} />
      </label></div>
      <button type="button" disabled={!text || !typeId} className="rounded-lg bg-blue-600 px-4 py-2 disabled:opacity-50" onClick={async () => {
        setBusy(true); setError(''); setPreview(null);
        try {
          const parsed = parseStockImport(text, typeId);
          const next = await request<Preview>('/store-setup/import', { method: 'POST', body: JSON.stringify({ rows: parsed, commit: false }) });
          setRows(parsed); setPreview(next);
        } catch (err) { setError(err instanceof Error ? err.message : 'Não foi possível conferir o arquivo.'); }
        finally { setBusy(false); }
      }}>Conferir arquivo</button>
      {preview && <div className="space-y-3">
        <p className="text-sm">{preview.accepted} veículos novos · {preview.skipped} placas ignoradas.</p>
        <div className="max-h-64 overflow-auto rounded-lg border border-slate-700"><table className="w-full text-left text-xs"><thead><tr><th className="p-2">Veículo</th><th>Placa</th><th>Ano</th><th>Preço</th></tr></thead><tbody>{preview.preview.map(row => <tr key={row.plate} className="border-t border-slate-800"><td className="p-2">{row.brand} {row.model}</td><td>{row.plate}</td><td>{row.modelYear}</td><td>{row.listedValue?.toLocaleString('pt-BR')}</td></tr>)}</tbody></table></div>
        <button type="button" disabled={preview.accepted === 0} className="rounded-lg bg-emerald-700 px-4 py-3 disabled:opacity-50" onClick={async () => {
          setBusy(true); setError('');
          try {
            const result = await request<Preview>('/store-setup/import', { method: 'POST', body: JSON.stringify({ rows, commit: true }) });
            setPreview(null); setNotice(result.accepted + ' veículos importados. ' + result.skipped + ' placas ignoradas.'); onImported();
          } catch (err) { setError(err instanceof Error ? err.message : 'Não foi possível importar.'); }
          finally { setBusy(false); }
        }}>Confirmar importação</button>
      </div>}
    </fieldset>
  </section>;
}
