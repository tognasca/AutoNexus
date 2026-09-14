import { useAuth } from '../../contexts/AuthContext';
import { LogOut } from 'lucide-react';

export function Header() {
  const { user, logout } = useAuth();

  const getProfileName = (profile?: number) => {
    switch (profile) {
      case 1: return 'Admin';
      case 2: return 'Vendedor';
      case 3: return 'Cliente';
      default: return 'Usuário';
    }
  };

  return (
    <header className="flex items-center justify-between px-6 py-4 bg-nexus-card border-b border-nexus-border">
      <div className="flex items-center gap-2">
        <h1 className="text-lg font-semibold text-white">Painel Operacional</h1>
      </div>

      <div className="flex items-center gap-4">
        {user && (
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-white">{user.name}</p>
              <p className="text-[10px] text-blue-400 font-medium uppercase tracking-wider">{getProfileName(user.profile)}</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white text-sm font-bold shadow-sm">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <button
              onClick={logout}
              title="Sair do sistema"
              className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
            >
              <LogOut size={18} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
