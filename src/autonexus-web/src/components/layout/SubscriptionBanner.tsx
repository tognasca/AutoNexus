import { useEffect, useState } from 'react';
import { billingService, BillingOverview } from '../../services/billingService';
import { Clock, AlertTriangle } from 'lucide-react';

/** Aviso claro de trial / pagamento (requisito 6 e 21 do documento): quantos dias restam e como assinar. */
export function SubscriptionBanner({ onNavigate }: { onNavigate?: (view: string) => void }) {
  const [overview, setOverview] = useState<BillingOverview | null>(null);

  useEffect(() => {
    billingService.getOverview().then(setOverview).catch(() => setOverview(null));
  }, []);

  const sub = overview?.subscription;
  if (!sub) return null;

  let message: string | null = null;
  let tone: 'info' | 'warn' = 'info';

  if (sub.status === 1 && overview?.trialDaysRemaining != null) {
    message = `Você está em período de teste — ${overview.trialDaysRemaining} dia(s) restante(s) no plano ${sub.planName}.`;
    if (overview.trialDaysRemaining <= 2) tone = 'warn';
  } else if (sub.status === 3) {
    message = 'Seu último pagamento não foi confirmado. Atualize a forma de pagamento para evitar a suspensão.';
    tone = 'warn';
  } else if (sub.status === 4 && sub.endDate) {
    message = `Assinatura cancelada — seu acesso continua até ${new Date(sub.endDate).toLocaleDateString('pt-BR')}.`;
    tone = 'warn';
  }

  if (!message) return null;

  return (
    <div className={`flex items-center justify-between gap-3 px-4 py-2 text-xs border-b ${
      tone === 'warn' ? 'bg-amber-500/10 border-amber-500/30 text-amber-300' : 'bg-blue-500/10 border-blue-500/30 text-blue-300'
    }`}>
      <span className="flex items-center gap-2">
        {tone === 'warn' ? <AlertTriangle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
        {message}
      </span>
      <button onClick={() => onNavigate?.('subscription')} className="font-bold underline cursor-pointer whitespace-nowrap">
        {sub.status === 1 ? 'Assinar agora' : 'Ver assinatura'}
      </button>
    </div>
  );
}
