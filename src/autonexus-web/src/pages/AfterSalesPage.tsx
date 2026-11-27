import { useCallback, useEffect, useState } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import { VehicleOperations } from '../components/vehicles/VehicleOperations';
import { request } from '../services/api';
import { vehicleService } from '../services/vehicleService';
import type { VehicleSummary } from '../types/vehicle';

interface Sale {
  id: string;
  brand: string;
  model: string;
  plate?: string;
  soldAt?: string;
  responsible?: string;
  delivered: boolean;
  transferred: boolean;
}
interface SalesPage { total: number; pageSize: number; items: Sale[] }

export function AfterSalesPage({ currentView, onNavigate }: { currentView?: string; onNavigate?: (view: string) => void }) {
  const [page, setPage] = useState(1);
  const [includeCompleted, setIncludeCompleted] = useState(false);
  const [data, setData] = useState<SalesPage | null>(null);
  const [error, setError] = useState('');
  const [vehicle, setVehicle] = useState<VehicleSummary | null>(null);
  const [opening, setOpening] = useState(false);
  const [revision, setRevision] = useState(0);
  const refresh = useCallback(() => setRevision(value => value + 1), []);

  useEffect(() => {
    const controller = new AbortController();
    request<SalesPage>(`/daily-work/after-sales?page=${page}&includeCompleted=${includeCompleted}`, { signal: controller.signal })
      .then(result => {
        if (controller.signal.aborted) return;
        if (page > 1 && result.items.length === 0) setPage(Math.max(1, Math.ceil(result.total / result.pageSize)));
        else setData(result);
      })
      .catch(err => { if (!controller.signal.aborted) setError(err instanceof Error ? err.message : 'Falha ao carregar vendas.'); });
    return () => controller.abort();
  }, [page, includeCompleted, revision]);

  function reload() {
    setData(null);
    setError('');
    refresh();
  }

  return <MainLayout currentView={currentView} onNavigate={onNavigate}>
    <header className="mb-5 space-y-3">
      <h1 className="text-2xl font-bold text-white">Entregas e transferências</h1>
      <label className="flex items-center gap-2 text-sm text-slate-300">
        <input type="checkbox" checked={includeCompleted} onChange={event => {
          setPage(1); setIncludeCompleted(event.target.checked); reload();
        }} /> Mostrar vendas concluídas
      </label>
    </header>
    {error && <p role="alert" className="mb-3 text-rose-300">{error} <button onClick={reload} className="underline">Tentar novamente</button></p>}
    {!data && !error && <p role="status" className="text-slate-400">Carregando vendas…</p>}
    {data?.items.length === 0 && <p className="text-slate-400">Nenhuma venda nesta fila.</p>}
    <ul className="grid gap-3 lg:grid-cols-2">
      {data?.items.map(sale => <li key={sale.id} className="space-y-2 rounded-xl border border-nexus-border bg-nexus-card p-4 text-white">
        <h2 className="font-semibold">{sale.brand} {sale.model}{sale.plate && ` · ${sale.plate}`}</h2>
        <p className="text-sm text-slate-400">{sale.responsible || 'Sem responsável'}{sale.soldAt && ` · ${new Date(sale.soldAt).toLocaleDateString('pt-BR')}`}</p>
        <p className="text-sm">Entrega <b>{sale.delivered ? 'concluída' : 'pendente'}</b> · Transferência <b>{sale.transferred ? 'concluída' : 'em acompanhamento'}</b></p>
        <button disabled={opening} className="rounded-lg bg-blue-600 px-3 py-2 text-sm disabled:opacity-50" onClick={async () => {
          setOpening(true); setError('');
          try { setVehicle(await vehicleService.getById(sale.id)); }
          catch (err) { setError(err instanceof Error ? err.message : 'Falha ao abrir a venda.'); }
          finally { setOpening(false); }
        }}>Abrir pós-venda</button>
      </li>)}
    </ul>
    {data && data.total > data.pageSize && <div className="mt-4 flex items-center gap-3 text-slate-200">
      <button disabled={page === 1} className="rounded bg-slate-800 px-3 py-2 disabled:opacity-40"
        onClick={() => { setPage(page - 1); reload(); }}>Anterior</button>
      <span>Página {page} de {Math.ceil(data.total / data.pageSize)}</span>
      <button disabled={page * data.pageSize >= data.total} className="rounded bg-slate-800 px-3 py-2 disabled:opacity-40"
        onClick={() => { setPage(page + 1); reload(); }}>Próxima</button>
    </div>}
    {vehicle && <VehicleOperations vehicle={vehicle} onClose={() => { setVehicle(null); reload(); }} />}
  </MainLayout>;
}
