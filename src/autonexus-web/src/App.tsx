import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { canAccessView, UserProfileEnum } from './utils/permissions';
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
import { CompanyDocumentsPage } from './pages/admin/CompanyDocumentsPage';
import { PublicCatalogPage } from './pages/PublicCatalogPage';
import { TenantSettingsPage } from './pages/admin/TenantSettingsPage';
import { SubscriptionPage } from './pages/admin/SubscriptionPage';
import { SuperAdminPage } from './pages/admin/SuperAdminPage';
import { PricingPage } from './pages/public/PricingPage';
import { SignupPage } from './pages/public/SignupPage';
import { LegalPage } from './pages/public/LegalPage';
import { ForgotPasswordPage, ResetPasswordPage } from './pages/public/PasswordPages';

function AppContent() {
  const { user, isAuthenticated, loading } = useAuth();
  const [currentView, setCurrentView] = useState(() =>
    new URLSearchParams(window.location.search).get('view') === 'subscription' ? 'subscription' : 'dashboard'
  );
  const [isPublicCatalogRoute, setIsPublicCatalogRoute] = useState(window.location.pathname === '/catalogo');

  useEffect(() => {
    const handlePopState = () => setIsPublicCatalogRoute(window.location.pathname === '/catalogo');
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // SuperAdmin não pertence a nenhuma empresa, então não tem "dashboard"
  // (nem nenhum outro módulo operacional) — manda ele direto pro próprio
  // painel assim que a sessão carrega.
  useEffect(() => {
    if (publicPath === '/app' && user?.profile === UserProfileEnum.SuperAdmin && currentView === 'dashboard') {
      setCurrentView('superadmin');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Quando o backend responde 402 (assinatura necessária), leva o cliente direto para a tela de assinatura.
  useEffect(() => {
    const goToSubscription = () => setCurrentView('subscription');
    window.addEventListener('autonexus:subscription-required', goToSubscription);
    return () => window.removeEventListener('autonexus:subscription-required', goToSubscription);
  }, []);

  // Páginas públicas (sem login): landing/planos, cadastro, login e documentos legais
  const publicPath = window.location.pathname;
  if (publicPath === '/entrar') return <LoginPage />;
  if (publicPath === '/precos') return <PricingPage />;
  if (publicPath.startsWith('/loja/')) return <PublicCatalogPage />;
  if (publicPath === '/cadastro') return <SignupPage />;
  if (publicPath === '/esqueci-senha') return <ForgotPasswordPage />;
  if (publicPath === '/redefinir-senha') return <ResetPasswordPage />;
  if (publicPath === '/termos') return <LegalPage slug="termos" />;
  if (publicPath === '/privacidade') return <LegalPage slug="privacidade" />;
  if (publicPath === '/cookies') return <LegalPage slug="cookies" />;

  // 1. Se a URL do navegador for /catalogo, renderiza a vitrine pública direto (sem exigir login)
  if (isPublicCatalogRoute) {
    return (
      <PublicCatalogPage
        currentView="catalog"
        onNavigate={(view) => {
          if (view !== 'catalog') {
            window.history.pushState({}, '', '/');
            setIsPublicCatalogRoute(false);
            setCurrentView(view);
          }
        }}
      />
    );
  }

  // 2. Estado de Carregamento
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-400 gap-2">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
        <span>Carregando AutoNexus...</span>
      </div>
    );
  }

  // 3. A raiz é a landing comercial para visitantes; o login fica em /entrar.
  // Usuários autenticados continuam entrando normalmente no sistema.
  if (!isAuthenticated || !user) {
    return <PricingPage />;
  }

  // 4. Manipulador de navegação interna
  const handleNavigate = (view: string) => {
    if (view === 'catalog') {
      window.history.pushState({}, '', '/catalogo');
      setIsPublicCatalogRoute(true);
      return;
    }
    if (canAccessView(user.profile, view)) setCurrentView(view);
    else alert('Seu perfil de acesso não possui permissão para este módulo.');
  };

  const renderContent = () => {
    // Garante que a visão atual seja permitida para o perfil do usuário
    if (!canAccessView(user?.profile, currentView)) {
      const homeView = user?.profile === UserProfileEnum.SuperAdmin ? 'superadmin' : 'dashboard';
      return (
        <div className="p-12 text-center text-slate-300 space-y-4">
          <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-xl font-bold text-white">Acesso Não Autorizado</h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Seu perfil de acesso ({user?.profileName || 'Usuário'}) não possui permissão para visualizar esta página.
          </p>
          <button
            onClick={() => setCurrentView(homeView)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
          >
            {homeView === 'superadmin' ? 'Voltar ao Painel SuperAdmin' : 'Voltar ao Dashboard'}
          </button>
        </div>
      );
    }

    switch (currentView) {
      case 'dashboard': return <DashboardPage currentView={currentView} onNavigate={handleNavigate} />;
      case 'vehicles': return <VehiclesPage currentView={currentView} onNavigate={handleNavigate} />;
      case 'trades': return <TradesPage currentView={currentView} onNavigate={handleNavigate} />;
      case 'simulator': return <SimulatorPage currentView={currentView} onNavigate={handleNavigate} />;
      case 'reports': return <DrePage currentView={currentView} onNavigate={handleNavigate} />;
      case 'commissions': return <CommissionPage currentView={currentView} onNavigate={handleNavigate} />;
      case 'bank-configs': return <BankConfigPage currentView={currentView} onNavigate={handleNavigate} />;
      case 'users': return <UsersPage currentView={currentView} onNavigate={handleNavigate} />;
      case 'company-documents': return <CompanyDocumentsPage currentView={currentView} onNavigate={handleNavigate} />;
      case 'catalog': return <PublicCatalogPage currentView={currentView} onNavigate={handleNavigate} />;
      case 'tenant-settings': return <TenantSettingsPage currentView={currentView} onNavigate={handleNavigate} />;
      case 'subscription': return <SubscriptionPage currentView={currentView} onNavigate={handleNavigate} />;
      case 'superadmin': return <SuperAdminPage currentView={currentView} onNavigate={handleNavigate} />;
      default: return <DashboardPage currentView={currentView} onNavigate={handleNavigate} />;
    }
  };

  return <>{renderContent()}</>;
}

export default function App() {
  return <AuthProvider><AppContent /></AuthProvider>;
}
