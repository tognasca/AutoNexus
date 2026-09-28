import { useEffect, useState } from 'react';
import { subscriptionService, TenantSubscription, Plan, SubscriptionStatus } from '../../services/subscriptionService';
import { formatDateTime } from '../../utils/formatters';
import { MainLayout } from '../../components/layout/MainLayout';
import { CreditCard, RefreshCw, CheckCircle2, Users, Car, HardDrive } from 'lucide-react';

interface SubscriptionPageProps {
  currentView?: string;
  onNavigate?: (view: string) => void;
}

export function SubscriptionPage({ currentView, onNavigate }: SubscriptionPageProps) {
  const [subscription, setSubscription] = useState<TenantSubscription | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [sub, availablePlans] = await Promise.all([
        subscriptionService.getCurrent(),
        subscriptionService.getAvailablePlans(),
      ]);
      setSubscription(sub);
      setPlans(availablePlans);
    } catch (err) {
      console.error('Erro ao carregar assinatura:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const currentPlan = plans.find(p => p.id === subscription?.planId);

  return (
    <MainLayout currentView={currentView} onNavigate={onNavigate}>
      <div className="space-y-6 p-4 sm:p-6 w-full">

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-nexus-border pb-4">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <CreditCard className="w-6 h-6 text-blue-400" />
              Minha Assinatura
            </h1>
            <p className="text-xs text-nexus-text-muted mt-1">
              Plano atual da sua empresa. Para alterar de plano, fale com o suporte.
            </p>
          </div>
          <button
            onClick={load}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {loading ? (
          <div className="text-center text-slate-400 py-8">Carregando...</div>
        ) : !subscription ? (
          <div className="bg-nexus-card border border-nexus-border rounded-xl p-8 text-center text-slate-400">
            Sua empresa ainda não tem uma assinatura ativa. Fale com o suporte.
          </div>
        ) : (
          <div className="bg-nexus-card border border-nexus-border rounded-xl p-6 space-y-5">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider">Plano atual</p>
                <p className="text-2xl font-bold text-white">{subscription.planName}</p>
              </div>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {SubscriptionStatus[subscription.status] ?? 'Desconhecido'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-800 text-xs">
              <div className="flex items-center gap-2 text-slate-300">
                <Users className="w-4 h-4 text-blue-400" />
                {currentPlan?.maxUsers ? `Até ${currentPlan.maxUsers} usuários` : 'Usuários ilimitados'}
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Car className="w-4 h-4 text-blue-400" />
                {currentPlan?.maxVehicles ? `Até ${currentPlan.maxVehicles} veículos` : 'Veículos ilimitados'}
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <HardDrive className="w-4 h-4 text-blue-400" />
                {currentPlan?.maxStorageMb ? `${(currentPlan.maxStorageMb / 1000).toFixed(1)} GB de armazenamento` : 'Armazenamento ilimitado'}
              </div>
            </div>

            <p className="text-[11px] text-slate-500 pt-2 border-t border-slate-800">
              Assinatura iniciada em {formatDateTime(subscription.startDate)}
              {subscription.endDate ? ` · encerrada em ${formatDateTime(subscription.endDate)}` : ''}
            </p>
          </div>
        )}

        {plans.length > 0 && (
          <div>
            <h2 className="text-sm font-bold text-white mb-3">Planos disponíveis</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {plans.map(plan => (
                <div
                  key={plan.id}
                  className={`bg-nexus-card border rounded-xl p-4 text-xs ${plan.id === subscription?.planId ? 'border-blue-500' : 'border-nexus-border'}`}
                >
                  <p className="text-sm font-bold text-white">{plan.name}</p>
                  <p className="text-lg font-bold text-blue-400 mt-1">
                    {plan.price === 0 ? 'Grátis' : `R$ ${plan.price.toFixed(2)}/mês`}
                  </p>
                  <ul className="mt-3 space-y-1 text-slate-400">
                    <li>{plan.maxUsers ? `Até ${plan.maxUsers} usuários` : 'Usuários ilimitados'}</li>
                    <li>{plan.maxVehicles ? `Até ${plan.maxVehicles} veículos` : 'Veículos ilimitados'}</li>
                  </ul>
                  {plan.id === subscription?.planId && (
                    <p className="mt-3 text-blue-400 font-bold">Plano atual</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
