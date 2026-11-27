import { useState } from 'react';
import { Ellipsis } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { canAccessView } from '../../utils/permissions';
import { navigationGroups, primaryNavigation } from './navigation';

interface BottomNavProps { currentView: string; onNavigate?: (view: string) => void }

export function BottomNav({ currentView, onNavigate }: BottomNavProps) {
  const { user } = useAuth();
  const [more, setMore] = useState(false);
  const allowed = (item: { id: string }) => canAccessView(user?.profile, item.id);
  const primary = primaryNavigation.slice(0, 3).filter(allowed);
  const secondary = [...primaryNavigation.slice(3), ...navigationGroups.flatMap(group => group.items)].filter(allowed);
  function navigate(view: string) {
    setMore(false);
    onNavigate?.(view);
  }
  return <nav aria-label="Menu móvel" className="fixed inset-x-0 bottom-0 z-40 border-t border-nexus-border bg-nexus-card md:hidden">
    {more && <div id="mobile-more" className="grid max-h-[60dvh] grid-cols-2 gap-2 overflow-y-auto border-b border-nexus-border p-3">
      {secondary.map(({ id, label, icon: Icon }) => <button key={id} type="button" onClick={() => navigate(id)}
        aria-current={currentView === id ? 'page' : undefined}
        className="flex items-center gap-2 rounded-lg bg-slate-800 p-3 text-left text-sm text-slate-100 aria-[current=page]:text-blue-300">
        <Icon className="shrink-0" size={17} />{label}
      </button>)}
    </div>}
    <div className="flex justify-around px-1 py-1 pb-[max(0.25rem,env(safe-area-inset-bottom))]">
      {primary.map(({ id, label, icon: Icon }) => <button key={id} type="button" onClick={() => navigate(id)}
        aria-current={currentView === id ? 'page' : undefined} className="flex min-h-11 flex-col items-center justify-center gap-1 px-2 text-xs text-slate-300 aria-[current=page]:text-blue-300">
        <Icon size={18} />{id === 'dashboard' ? 'Hoje' : label}
      </button>)}
      {secondary.length > 0 && <button type="button" aria-expanded={more} aria-controls={more ? 'mobile-more' : undefined} onClick={() => setMore(value => !value)}
        className="flex min-h-11 flex-col items-center justify-center gap-1 px-2 text-xs text-slate-300"><Ellipsis size={18} />Mais</button>}
    </div>
  </nav>;
}
