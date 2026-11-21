import { useEffect, useState, type CSSProperties } from 'react';
import { tenantSettingsService } from '../../services/tenantSettingsService';
import { WorkspacePreferences } from './WorkspacePreferences';
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
  const tenantId = user?.tenantId;
  const companyUser = Boolean(user && user.profile !== 0);
  const [appearance, setAppearance] = useState({ color: '#3b82f6', density: 'comfortable' });
  useEffect(() => {
    let active = true;
    const loadAppearance = () => {
      if (companyUser) tenantSettingsService.get().then(settings => {
        if (active) setAppearance({ color: settings.primaryColor, density: settings.panelDensity || 'comfortable' });
      }).catch(() => {});
    };
    loadAppearance();
    window.addEventListener('atmotors:appearance-updated', loadAppearance);
    return () => { active = false; window.removeEventListener('atmotors:appearance-updated', loadAppearance); };
  }, [tenantId, companyUser, currentView]);
  return (
    <div className="flex min-h-screen bg-nexus-dark pb-16 md:pb-0"
      style={{ '--color-nexus-accent': appearance.color, '--color-nexus-accent-hover': appearance.color } as CSSProperties}>
      <Sidebar currentView={currentView} onNavigate={onNavigate} />
      <div className="flex-1 flex flex-col min-w-0">
        <PwaInstallPrompt />
        <Header />
        <WorkspacePreferences key={`${user?.tenantId}:${user?.userId}`} onNavigate={onNavigate} />
        {user && user.profile !== 0 && <SubscriptionBanner onNavigate={onNavigate} />}
        <main className={appearance.density === 'compact' ? "flex-1 p-3 md:p-4 overflow-x-hidden [&_input]:py-1.5 [&_select]:py-1.5" : "flex-1 p-4 md:p-6 overflow-x-hidden"}>
          {children}
        </main>
      </div>
      <BottomNav currentView={currentView} onNavigate={onNavigate} />
    </div>
  );
}
