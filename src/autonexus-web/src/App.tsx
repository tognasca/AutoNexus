import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { VehiclesPage } from './pages/VehiclesPage';
import { TradesPage } from './pages/TradesPage';
import { BuyerPortalPage } from './pages/BuyerPortalPage';
import { Loader2 } from 'lucide-react';

function AppContent() {
  const { isAuthenticated, loading } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard');

  const path = window.location.pathname;
  if (path.startsWith('/portal/')) {
    const token = path.replace('/portal/', '').trim();
    return <BuyerPortalPage token={token} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-nexus-dark flex items-center justify-center text-nexus-accent">
        <Loader2 className="animate-spin" size={36} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardPage currentView={currentView} onNavigate={setCurrentView} />;
      case 'trades':
        return <TradesPage currentView={currentView} onNavigate={setCurrentView} />;
      default:
        return <VehiclesPage currentView={currentView} onNavigate={setCurrentView} />;
    }
  };

  return <div className="min-h-screen bg-nexus-dark">{renderView()}</div>;
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
