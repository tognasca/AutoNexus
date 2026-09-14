import { LayoutDashboard, Car, ArrowLeftRight } from 'lucide-react';

interface BottomNavProps {
  currentView: string;
  onNavigate: (view: string) => void;
}

export function BottomNav({ currentView, onNavigate }: BottomNavProps) {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-nexus-card/95 backdrop-blur-lg border-t border-nexus-border z-40 px-4 py-2 flex items-center justify-around">
      <button
        onClick={() => onNavigate('dashboard')}
        className={`flex flex-col items-center gap-1 p-1 transition-colors cursor-pointer ${
          currentView === 'dashboard' ? 'text-blue-400' : 'text-slate-400 hover:text-white'
        }`}
      >
        <LayoutDashboard size={20} />
        <span className="text-[10px] font-bold">Dashboard</span>
      </button>

      <button
        onClick={() => onNavigate('vehicles')}
        className={`flex flex-col items-center gap-1 p-1 transition-colors cursor-pointer ${
          currentView === 'vehicles' ? 'text-blue-400' : 'text-slate-400 hover:text-white'
        }`}
      >
        <Car size={20} />
        <span className="text-[10px] font-bold">Estoque</span>
      </button>

      <button
        onClick={() => onNavigate('trades')}
        className={`flex flex-col items-center gap-1 p-1 transition-colors cursor-pointer ${
          currentView === 'trades' ? 'text-blue-400' : 'text-slate-400 hover:text-white'
        }`}
      >
        <ArrowLeftRight size={20} />
        <span className="text-[10px] font-bold">Trocas</span>
      </button>
    </nav>
  );
}
