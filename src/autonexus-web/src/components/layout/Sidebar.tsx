import { useAuth } from '../../contexts/AuthContext';
import { canAccessView } from '../../utils/permissions';
import atMotorsLogo from '../../public/ATlogo.png';
import { navigationGroups, primaryNavigation } from './navigation';

interface SidebarProps { currentView?: string; onNavigate?: (view: string) => void }

export function Sidebar({ currentView = 'dashboard', onNavigate }: SidebarProps) {
  const { user } = useAuth();
  const allowed = (item: { id: string }) => canAccessView(user?.profile, item.id);
  const link = ({ id, label, icon: Icon }: typeof primaryNavigation[number]) =>
    <button key={id} type="button" aria-current={currentView === id ? 'page' : undefined} onClick={() => onNavigate?.(id)}
      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-slate-300 hover:bg-slate-800 aria-[current=page]:bg-blue-500/15 aria-[current=page]:text-blue-300">
      <Icon size={18} />{label}
    </button>;

  return <aside className="hidden min-h-screen w-56 shrink-0 border-r border-nexus-border bg-nexus-card p-4 md:block">
    <img src={atMotorsLogo} alt="AT Motors" className="mb-6 h-14 w-28 object-contain" />
    <nav aria-label="Menu principal" className="space-y-4">
      <div className="space-y-1">{primaryNavigation.filter(allowed).map(link)}</div>
      {navigationGroups.map(group => {
        const items = group.items.filter(allowed);
        return items.length > 0 && <details key={group.label} open={items.some(item => item.id === currentView) || undefined}>
          <summary className="cursor-pointer rounded px-3 py-2 text-sm font-semibold text-slate-400">{group.label}</summary>
          <div className="space-y-1">{items.map(link)}</div>
        </details>;
      })}
    </nav>
  </aside>;
}
