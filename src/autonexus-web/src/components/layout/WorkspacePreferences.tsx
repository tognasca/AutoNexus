import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { canAccessView } from '../../utils/permissions';

const destinations = [
  { id: 'leads', label: 'Atendimentos' },
  { id: 'vehicles', label: 'Estoque' },
  { id: 'trades', label: 'Trocas' },
  { id: 'financing', label: 'Financiamento' },
] as const;

export function WorkspacePreferences({ onNavigate }: { onNavigate?: (view: string) => void }) {
  const { user } = useAuth();
  const key = `atmotors:shortcuts:${user?.tenantId}:${user?.userId}`;
  const allowed = destinations.filter(item => canAccessView(user?.profile, item.id));
  const [selected, setSelected] = useState<string[]>(() => {
    try {
      const stored: unknown = JSON.parse(localStorage.getItem(key) || 'null');
      return Array.isArray(stored) ? stored.filter((value): value is string => typeof value === 'string') : ['leads', 'vehicles'];
    } catch { return ['leads', 'vehicles']; }
  });
  const [notice, setNotice] = useState('');
  if (!allowed.length || !onNavigate) return null;
  return <div className="flex flex-wrap items-center gap-2 border-b border-nexus-border px-4 py-3 md:px-6">
    {allowed.filter(item => selected.includes(item.id)).map(item => <button key={item.id} type="button" onClick={() => onNavigate(item.id)}
      className="rounded-lg bg-nexus-card px-3 py-2 text-sm text-slate-200 hover:text-white">{item.label}</button>)}
    <details className="relative ml-auto text-xs text-slate-400">
      <summary className="cursor-pointer rounded-lg px-3 py-2">Meus atalhos</summary>
      <div className="absolute right-0 z-40 mt-2 w-64 space-y-3 rounded-xl border border-slate-700 bg-slate-900 p-4 shadow-xl">
        <p>Preferências deste navegador e usuário.</p>
        {allowed.map(item => <label key={item.id} className="flex items-center gap-2">
          <input type="checkbox" checked={selected.includes(item.id)} onChange={event => {
            const next = event.target.checked ? [...selected, item.id] : selected.filter(id => id !== item.id);
            setSelected(next);
            try { localStorage.setItem(key, JSON.stringify(next)); setNotice(''); }
            catch { setNotice('Preferência aplicada nesta sessão. O navegador bloqueou o salvamento.'); }
          }} />{item.label}
        </label>)}
        {notice && <p role="status">{notice}</p>}
      </div>
    </details>
  </div>;
}
