import { LayoutDashboard, Car, ArrowLeftRight } from 'lucide-react';

interface SidebarProps {
  currentView?: string;
  onNavigate?: (view: string) => void;
}

export function Sidebar({ currentView = 'dashboard', onNavigate }: SidebarProps) {
  return (
    <aside className="hidden md:flex flex-col w-64 bg-nexus-card border-r border-nexus-border min-h-screen p-4">
      <div className="flex items-center gap-3 mb-8 px-2">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-bold text-white text-lg shadow-lg shadow-blue-500/30">
          AN
        </div>
        <div>
          <span className="text-lg font-bold text-white tracking-wide block">AutoNexus</span>
          <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Vehicle Hub</span>
        </div>
      </div>

      <nav className="flex flex-col gap-1.5">
        <button
          onClick={() => onNavigate?.('dashboard')}
          className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer text-left ${
            currentView === 'dashboard'
              ? 'bg-nexus-accent/15 text-blue-400 border border-nexus-accent/30 shadow-sm'
              : 'text-slate-400 hover:bg-nexus-border/60 hover:text-white'
          }`}
        >
          <LayoutDashboard size={18} />
          Dashboard
        </button>

        <button
          onClick={() => onNavigate?.('vehicles')}
          className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer text-left ${
            currentView === 'vehicles'
              ? 'bg-nexus-accent/15 text-blue-400 border border-nexus-accent/30 shadow-sm'
              : 'text-slate-400 hover:bg-nexus-border/60 hover:text-white'
          }`}
        >
          <Car size={18} />
          Estoque
        </button>

        <button
          onClick={() => onNavigate?.('trades')}
          className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer text-left ${
            currentView === 'trades'
              ? 'bg-nexus-accent/15 text-blue-400 border border-nexus-accent/30 shadow-sm'
              : 'text-slate-400 hover:bg-nexus-border/60 hover:text-white'
          }`}
        >
          <ArrowLeftRight size={18} />
          Trocas & Histórico
        </button>
      </nav>
    </aside>
  );
}
