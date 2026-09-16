import { useAuth } from '../../contexts/AuthContext';
import { canAccessView } from '../../utils/permissions';
import { LayoutDashboard, Car, ArrowLeftRight, Calculator, BarChart3, Building2, Users } from 'lucide-react';

interface BottomNavProps {
  currentView: string;
  onNavigate?: (view: string) => void;
}

export function BottomNav({ currentView, onNavigate }: BottomNavProps) {
  const { user } = useAuth();
  const profile = user?.profile;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-nexus-card/95 backdrop-blur-lg border-t border-nexus-border z-40 px-2 py-2 flex items-center justify-around">
      {canAccessView(profile, 'dashboard') && (
        <button
          onClick={() => onNavigate?.('dashboard')}
          className={`flex flex-col items-center gap-1 p-1 transition-colors cursor-pointer ${
            currentView === 'dashboard' ? 'text-blue-400' : 'text-slate-400 hover:text-white'
          }`}
        >
          <LayoutDashboard size={18} />
          <span className="text-[9px] font-bold">Dashboard</span>
        </button>
      )}

      {canAccessView(profile, 'vehicles') && (
        <button
          onClick={() => onNavigate?.('vehicles')}
          className={`flex flex-col items-center gap-1 p-1 transition-colors cursor-pointer ${
            currentView === 'vehicles' ? 'text-blue-400' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Car size={18} />
          <span className="text-[9px] font-bold">Estoque</span>
        </button>
      )}

      {canAccessView(profile, 'trades') && (
        <button
          onClick={() => onNavigate?.('trades')}
          className={`flex flex-col items-center gap-1 p-1 transition-colors cursor-pointer ${
            currentView === 'trades' ? 'text-blue-400' : 'text-slate-400 hover:text-white'
          }`}
        >
          <ArrowLeftRight size={18} />
          <span className="text-[9px] font-bold">Trocas</span>
        </button>
      )}

      {canAccessView(profile, 'simulator') && (
        <button
          onClick={() => onNavigate?.('simulator')}
          className={`flex flex-col items-center gap-1 p-1 transition-colors cursor-pointer ${
            currentView === 'simulator' ? 'text-blue-400' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Calculator size={18} />
          <span className="text-[9px] font-bold">Simulador</span>
        </button>
      )}

      {canAccessView(profile, 'reports') && (
        <button
          onClick={() => onNavigate?.('reports')}
          className={`flex flex-col items-center gap-1 p-1 transition-colors cursor-pointer ${
            currentView === 'reports' ? 'text-blue-400' : 'text-slate-400 hover:text-white'
          }`}
        >
          <BarChart3 size={18} />
          <span className="text-[9px] font-bold">DRE</span>
        </button>
      )}

      {canAccessView(profile, 'bank-configs') && (
        <button
          onClick={() => onNavigate?.('bank-configs')}
          className={`flex flex-col items-center gap-1 p-1 transition-colors cursor-pointer ${
            currentView === 'bank-configs' ? 'text-blue-400' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Building2 size={18} />
          <span className="text-[9px] font-bold">Bancos</span>
        </button>
      )}

      {canAccessView(profile, 'users') && (
        <button
          onClick={() => onNavigate?.('users')}
          className={`flex flex-col items-center gap-1 p-1 transition-colors cursor-pointer ${
            currentView === 'users' ? 'text-blue-400' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Users size={18} />
          <span className="text-[9px] font-bold">Usuários</span>
        </button>
      )}
    </nav>
  );
}