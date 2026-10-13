import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { BottomNav } from './BottomNav';
import { PwaInstallPrompt } from '../pwa/PwaInstallPrompt';
import { SubscriptionBanner } from './SubscriptionBanner';
import { useAuth } from '../../contexts/AuthContext';

interface MainLayoutProps {
  children: React.ReactNode;
  currentView?: string;
  onNavigate?: (view: string) => void;
}

export function MainLayout({ children, currentView = 'dashboard', onNavigate }: MainLayoutProps) {
  const { user } = useAuth();
  return (
    <div className="flex min-h-screen bg-nexus-dark pb-16 md:pb-0">
      <Sidebar currentView={currentView} onNavigate={onNavigate} />
      <div className="flex-1 flex flex-col min-w-0">
        <PwaInstallPrompt />
        <Header />
        {user && user.profile !== 0 && <SubscriptionBanner onNavigate={onNavigate} />}
        <main className="flex-1 p-4 md:p-6 overflow-x-hidden">
          {children}
        </main>
      </div>
      <BottomNav currentView={currentView} onNavigate={onNavigate} />
    </div>
  );
}
