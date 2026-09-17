import { useAuth } from '../../contexts/AuthContext';
import { canAccessView } from '../../utils/permissions';
import {
  LayoutDashboard,
  Car,
  ArrowLeftRight,
  Calculator,
  BarChart3,
  Building2,
  Users,
  Award,
  FolderOpen
} from 'lucide-react';

interface SidebarProps {
  currentView?: string;
  onNavigate?: (view: string) => void;
}

export function Sidebar({ currentView = 'dashboard', onNavigate }: SidebarProps) {
  const { user } = useAuth();
  const profile = user?.profile;

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
        {canAccessView(profile, 'dashboard') && (
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
        )}

        {canAccessView(profile, 'vehicles') && (
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
        )}

        {canAccessView(profile, 'trades') && (
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
        )}

        {canAccessView(profile, 'simulator') && (
          <button
            onClick={() => onNavigate?.('simulator')}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer text-left ${
              currentView === 'simulator'
                ? 'bg-nexus-accent/15 text-blue-400 border border-nexus-accent/30 shadow-sm'
                : 'text-slate-400 hover:bg-nexus-border/60 hover:text-white'
            }`}
          >
            <Calculator size={18} />
            Simulador
          </button>
        )}

        {canAccessView(profile, 'reports') && (
          <button
            onClick={() => onNavigate?.('reports')}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer text-left ${
              currentView === 'reports'
                ? 'bg-nexus-accent/15 text-blue-400 border border-nexus-accent/30 shadow-sm'
                : 'text-slate-400 hover:bg-nexus-border/60 hover:text-white'
            }`}
          >
            <BarChart3 size={18} />
            Relatório DRE
          </button>
        )}

        {canAccessView(profile, 'commissions') && (
          <button
            onClick={() => onNavigate?.('commissions')}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer text-left ${
              currentView === 'commissions'
                ? 'bg-nexus-accent/15 text-blue-400 border border-nexus-accent/30 shadow-sm'
                : 'text-slate-400 hover:bg-nexus-border/60 hover:text-white'
            }`}
          >
            <Award size={18} />
            Comissões
          </button>
        )}

        {/* MÓDULOS EXCLUSIVOS ADMIN */}
        {canAccessView(profile, 'bank-configs') && (
          <button
            onClick={() => onNavigate?.('bank-configs')}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer text-left ${
              currentView === 'bank-configs'
                ? 'bg-nexus-accent/15 text-blue-400 border border-nexus-accent/30 shadow-sm'
                : 'text-slate-400 hover:bg-nexus-border/60 hover:text-white'
            }`}
          >
            <Building2 size={18} />
            Financeiras (Admin)
          </button>
        )}

        {canAccessView(profile, 'users') && (
          <button
            onClick={() => onNavigate?.('users')}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer text-left ${
              currentView === 'users'
                ? 'bg-nexus-accent/15 text-blue-400 border border-nexus-accent/30 shadow-sm'
                : 'text-slate-400 hover:bg-nexus-border/60 hover:text-white'
            }`}
          >
            <Users size={18} />
            Usuários & Perfis
          </button>
        )}

        {canAccessView(profile, 'company-documents') && (
          <button
            onClick={() => onNavigate?.('company-documents')}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer text-left ${
              currentView === 'company-documents'
                ? 'bg-nexus-accent/15 text-blue-400 border border-nexus-accent/30 shadow-sm'
                : 'text-slate-400 hover:bg-nexus-border/60 hover:text-white'
            }`}
          >
            <FolderOpen size={18} />
            Docs Empresa (Admin)
          </button>
        )}
      </nav>
    </aside>
  );
}