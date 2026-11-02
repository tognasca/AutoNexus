import { useAuth } from '../../contexts/AuthContext';
import { canAccessView } from '../../utils/permissions';
import { LayoutDashboard, Car, ArrowLeftRight, Calculator, BarChart3, Building2, Users, FileDown, Rocket, MessageCircle, SlidersHorizontal } from 'lucide-react';

interface BottomNavProps { currentView: string; onNavigate?: (view: string) => void; }

export function BottomNav({ currentView, onNavigate }: BottomNavProps) {
  const { user } = useAuth();
  const profile = user?.profile;
  const button = (view: string, label: string, Icon: typeof LayoutDashboard) => canAccessView(profile, view) && (
    <button onClick={() => onNavigate?.(view)} className={`shrink-0 flex flex-col items-center gap-1 px-2 py-1 transition-colors cursor-pointer ${currentView === view ? 'text-blue-400' : 'text-slate-400 hover:text-white'}`}>
      <Icon size={18} /><span className="text-[9px] font-bold">{label}</span>
    </button>
  );

  return <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-nexus-card/95 backdrop-blur-lg border-t border-nexus-border z-40 px-2 py-2 flex items-center gap-1 overflow-x-auto">
    {button('dashboard', 'Dashboard', LayoutDashboard)}
    {button('onboarding', 'Primeiros', Rocket)}
    {button('commercial', 'Comercial', MessageCircle)}
    {button('vehicles', 'Estoque', Car)}
    {button('leads', 'Leads', Users)}
    {button('trades', 'Trocas', ArrowLeftRight)}
    {button('simulator', 'Simulador', Calculator)}
    {button('financing', 'Financ.', FileDown)}
    {button('reports', 'DRE', BarChart3)}
    {button('bank-configs', 'Bancos', Building2)}
    {button('users', 'Usuários', Users)}
    {button('settings-center', 'Config.', SlidersHorizontal)}
  </nav>;
}
