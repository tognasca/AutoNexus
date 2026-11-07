import { useEffect, useState } from 'react';
import { X, History, Loader2, CalendarClock } from 'lucide-react';
import type { VehicleSummary } from '../../types/vehicle';
import { vehicleService } from '../../services/vehicleService';

type HistoryItem = { id: string; operation: string; details?: string; userId?: string; executedAt: string };

export function VehicleHistoryModal({ vehicle, onClose }: { vehicle: VehicleSummary | null; onClose: () => void }) {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!vehicle) return;
    let active = true;
    setLoading(true);
    setError('');
    vehicleService.getHistory(vehicle.id)
      .then(data => { if (active) setItems(data); })
      .catch(() => { if (active) setError('Não foi possível carregar o histórico deste veículo.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [vehicle?.id]);

  if (!vehicle) return null;
  return (
    <div className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <section className="w-full max-w-2xl max-h-[85vh] overflow-hidden rounded-2xl border border-nexus-border bg-nexus-card shadow-2xl" onClick={e => e.stopPropagation()}>
        <header className="flex items-center justify-between gap-3 p-5 border-b border-nexus-border">
          <div><div className="flex items-center gap-2 text-white font-bold"><History size={18} /> Histórico do veículo</div><p className="text-xs text-slate-400 mt-1">{vehicle.brand} {vehicle.model} · {vehicle.plate || 'Sem placa'}</p></div>
          <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700" aria-label="Fechar"><X size={18} /></button>
        </header>
        <div className="p-5 overflow-y-auto max-h-[65vh]">
          {loading ? <div className="py-12 flex justify-center text-slate-400"><Loader2 className="animate-spin" /></div>
            : error ? <p className="text-sm text-rose-300">{error}</p>
            : items.length === 0 ? <div className="py-10 text-center text-slate-400"><CalendarClock size={30} className="mx-auto mb-3 opacity-60" /><p>Nenhuma alteração registrada ainda.</p><p className="text-xs mt-1">As próximas alterações aparecerão aqui.</p></div>
            : <ol className="space-y-4">{items.map(item => <li key={item.id} className="relative pl-6 border-l border-slate-700 pb-2"><span className="absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full bg-nexus-accent" /><div className="flex flex-wrap justify-between gap-2"><strong className="text-sm text-white">{item.operation}</strong><time className="text-xs text-slate-500">{new Date(item.executedAt).toLocaleString('pt-BR')}</time></div>{item.details && <p className="text-sm text-slate-300 mt-1">{item.details}</p>}{item.userId && <p className="text-[11px] text-slate-500 mt-1">Usuário: {item.userId}</p>}</li>)}</ol>}
        </div>
      </section>
    </div>
  );
}
