import { MainLayout } from '../../components/layout/MainLayout';
import { useAuth } from '../../contexts/AuthContext';
import { UserProfileEnum } from '../../utils/permissions';
import { BankConfigPage } from './BankConfigPage';
import { MercadoPagoSettings } from './MercadoPagoSettings';
import { OpenAiSettings } from './OpenAiSettings';
import { PlatformIntegrationsSettings } from './PlatformIntegrationsSettings';

interface Props {
  currentView?: string;
  onNavigate?: (view: string) => void;
}

export function IntegrationsPage({ currentView, onNavigate }: Props) {
  const { user } = useAuth();
  return <MainLayout currentView={currentView} onNavigate={onNavigate}>
    <div className="mx-auto max-w-6xl space-y-5 p-4 sm:p-6">
      <header>
        <p className="text-sm text-slate-400">Configurações</p>
        <h1 className="text-2xl font-bold text-white">Integrações</h1>
      </header>
      {user?.profile === UserProfileEnum.SuperAdmin && <>
        <PlatformIntegrationsSettings />
        <MercadoPagoSettings />
      </>}
      {user?.profile === UserProfileEnum.Admin && <>
        <OpenAiSettings />
        <BankConfigPage embedded />
        <section className="space-y-2 rounded-xl border border-nexus-border bg-nexus-card p-5">
          <h2 className="font-bold text-white">Tabela FIPE</h2>
          <p className="text-sm text-slate-400">A consulta usa Parallelum e BrasilAPI e funciona sem credenciais.</p>
        </section>
      </>}
    </div>
  </MainLayout>;
}
