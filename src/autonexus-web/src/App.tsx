import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { canAccessView } from './utils/permissions';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { VehiclesPage } from './pages/VehiclesPage';
import { TradesPage } from './pages/TradesPage';
import { SimulatorPage } from './pages/SimulatorPage';
import { DrePage } from './pages/reports/DrePage';
import { CommissionPage } from './pages/reports/CommissionPage';
import { BankConfigPage } from './pages/admin/BankConfigPage';
import { UsersPage } from './pages/admin/UsersPage';
import { ShieldAlert, Loader2 } from 'lucide-react';

function AppContent() {
  const { user, isAuthenticated, loading } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-400 gap-2">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
        <span>Carregando AutoNexus...</span>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <LoginPage />;
  }

  const handleNavigate = (view: string) => {
    if (canAccessView(user?.profile, view)) {
      setCurrentView(view);
    } else {
      alert('Seu perfil de acesso não possui permissão para este módulo.');
    }
  };

  const renderContent = () => {
    // Garante que a visão atual seja permitida para o perfil do usuário
    if (!canAccessView(user?.profile, currentView)) {
      return (
        <div className="p-12 text-center text-slate-300 space-y-4">
          <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-xl font-bold text-white">Acesso Não Autorizado</h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Seu perfil de acesso ({user?.profileName || 'Usuário'}) não possui permissão para visualizar esta página.
          </p>
          <button
            onClick={() => setCurrentView('dashboard')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
          >
            Voltar ao Dashboard
          </button>
        </div>
      );
    }

    switch (currentView) {
      case 'dashboard':
        return <DashboardPage currentView={currentView} onNavigate={handleNavigate} />;
      case 'vehicles':
        return <VehiclesPage currentView={currentView} onNavigate={handleNavigate} />;
      case 'trades':
        return <TradesPage currentView={currentView} onNavigate={handleNavigate} />;
      case 'simulator':
        return <SimulatorPage currentView={currentView} onNavigate={handleNavigate} />;
      case 'reports':
        return <DrePage currentView={currentView} onNavigate={handleNavigate} />;
      case 'commissions':
        return <CommissionPage currentView={currentView} onNavigate={handleNavigate} />;
      case 'bank-configs':
        return <BankConfigPage currentView={currentView} onNavigate={handleNavigate} />;
      case 'users':
        return <UsersPage currentView={currentView} onNavigate={handleNavigate} />;
      default:
        return <DashboardPage currentView={currentView} onNavigate={handleNavigate} />;
    }
  };

  return <>{renderContent()}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}