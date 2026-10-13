import { useEffect, useState } from 'react';
import { SubscriptionStatus, Plan } from '../../services/subscriptionService';
import {
  billingService, BillingOverview, BillingCycle, PaymentMethod, CheckoutResult,
  PaymentMethodLabel, PaymentStatusLabel, formatBRL,
} from '../../services/billingService';
import { useAuth } from '../../contexts/AuthContext';
import { formatDateTime } from '../../utils/formatters';
import { MainLayout } from '../../components/layout/MainLayout';
import { CreditCard, RefreshCw, Users, Car, X, Copy, Loader2 } from 'lucide-react';

interface SubscriptionPageProps {
  currentView?: string;
  onNavigate?: (view: string) => void;
}

export function SubscriptionPage({ currentView, onNavigate }: SubscriptionPageProps) {
  const { user } = useAuth();
  const isAdmin = user?.profile === 1;

  const [overview, setOverview] = useState<BillingOverview | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [annual, setAnnual] = useState(false);

  const [checkoutPlan, setCheckoutPlan] = useState<Plan | null>(null);
  const [method, setMethod] = useState<PaymentMethod>(1);
  const [document, setDocument] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [result, setResult] = useState<CheckoutResult | null>(null);
  const [copied, setCopied] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [ov, list] = await Promise.all([billingService.getOverview(), billingService.publicPlans()]);
      setOverview(ov);
      setPlans(list);
      if (ov.subscription?.billingCycle === 2) setAnnual(true);
    } catch (err) {
      console.error('Erro ao carregar assinatura:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const sub = overview?.subscription;
  const cycle: BillingCycle = annual ? 2 : 1;
  const priceOf = (p: Plan) => (annual && p.annualPrice ? p.annualPrice : p.price);
  const isCurrent = (p: Plan) => sub?.planId === p.id && sub.status === 2 && (sub.billingCycle ?? 1) === cycle;

  const openCheckout = (plan: Plan) => {
    setCheckoutPlan(plan);
    setResult(null);
    setCheckoutError(null);
    setMethod(1);
    setDocument('');
  };

  const submitCheckout = async () => {
    if (!checkoutPlan) return;
    setSubmitting(true);
    setCheckoutError(null);
    try {
      const res = await billingService.checkout({
        planId: checkoutPlan.id, cycle, method, payerDocument: document || undefined,
      });
      if (res.method === 2 && res.redirectUrl) {
        window.location.href = res.redirectUrl; // checkout seguro do Mercado Pago
        return;
      }
      setResult(res);
    } catch (err: any) {
      setCheckoutError(err.message || 'Não foi possível iniciar o pagamento. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm('Tem certeza que deseja cancelar a assinatura? Você continua com acesso até o fim do período já pago e seus dados são mantidos.')) return;
    const reason = prompt('Pode nos contar o motivo? (opcional)') ?? undefined;
    try {
      await billingService.cancel(reason);
      await load();
    } catch (err: any) {
      alert(err.message || 'Não foi possível cancelar agora.');
    }
  };

  const copyPix = async () => {
    if (!result?.pixCode) return;
    await navigator.clipboard.writeText(result.pixCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const periodicity = (c?: number) => (c === 2 ? 'ano' : 'mês');

  return (
    <MainLayout currentView={currentView} onNavigate={onNavigate}>
      <div className="space-y-6 p-4 sm:p-6 w-full">
        <div className="flex justify-between items-start gap-4 border-b border-nexus-border pb-4">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2"><CreditCard className="w-6 h-6 text-blue-400" />Minha Assinatura</h1>
            <p className="text-xs text-nexus-text-muted mt-1">Plano, cobrança, histórico de pagamentos e troca de plano.</p>
          </div>
          <button onClick={load} className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg cursor-pointer">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {loading ? (
          <div className="text-center text-slate-400 py-8">Carregando...</div>
        ) : !sub ? (
          <div className="bg-nexus-card border border-nexus-border rounded-xl p-8 text-center text-slate-400">Sua empresa ainda não tem uma assinatura. Escolha um plano abaixo.</div>
        ) : (
          <div className="bg-nexus-card border border-nexus-border rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider">Plano atual</p>
                <p className="text-2xl font-bold text-white">{sub.planName}</p>
                {overview?.plan && (
                  <p className="text-sm text-blue-400 mt-1">
                    {formatBRL(sub.billingCycle === 2 && overview.plan.annualPrice ? overview.plan.annualPrice : overview.plan.price)} / {periodicity(sub.billingCycle)}
                  </p>
                )}
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-500/15 text-blue-300 border border-blue-500/30">
                {SubscriptionStatus[sub.status] ?? 'Desconhecido'}
              </span>
            </div>

            {sub.status === 1 && overview?.trialDaysRemaining != null && (
              <p className="text-sm text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2">
                Período de teste: <strong>{overview.trialDaysRemaining} dia(s) restante(s)</strong>
                {sub.trialEndsAt ? ` (termina em ${new Date(sub.trialEndsAt).toLocaleDateString('pt-BR')})` : ''}. Assine abaixo para continuar depois do teste.
              </p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-800 text-xs text-slate-300">
              <div className="flex items-center gap-2"><Users className="w-4 h-4 text-blue-400" />{overview?.plan?.maxUsers ? `Até ${overview.plan.maxUsers} usuários` : 'Usuários conforme o plano'}</div>
              <div className="flex items-center gap-2"><Car className="w-4 h-4 text-blue-400" />{overview?.plan?.maxVehicles ? `Até ${overview.plan.maxVehicles} veículos` : 'Veículos conforme o plano'}</div>
              <div>{sub.paymentMethod ? `Pagamento: ${PaymentMethodLabel[sub.paymentMethod]}` : 'Forma de pagamento: não definida'}</div>
            </div>

            <div className="text-[11px] text-slate-500 border-t border-slate-800 pt-3 space-y-1">
              <p>Assinatura iniciada em {formatDateTime(sub.startDate)}</p>
              {sub.currentPeriodEnd && <p>{sub.status === 4 ? 'Acesso até' : 'Próxima cobrança'}: {new Date(sub.currentPeriodEnd).toLocaleDateString('pt-BR')}</p>}
              {sub.status === 4 && sub.endDate && !sub.currentPeriodEnd && <p>Acesso até {new Date(sub.endDate).toLocaleDateString('pt-BR')}</p>}
            </div>

            {isAdmin && sub.status !== 4 && sub.status !== 6 && sub.status !== 1 && (
              <button onClick={handleCancel} className="text-xs text-red-400 hover:text-red-300 underline cursor-pointer">Cancelar assinatura</button>
            )}
          </div>
        )}

        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-white">Planos</h2>
            <div className="inline-flex bg-slate-900 border border-slate-800 rounded-lg p-1 text-xs">
              <button onClick={() => setAnnual(false)} className={`px-3 py-1 rounded-md font-semibold cursor-pointer ${!annual ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>Mensal</button>
              <button onClick={() => setAnnual(true)} className={`px-3 py-1 rounded-md font-semibold cursor-pointer ${annual ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>Anual</button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {plans.map(plan => (
              <div key={plan.id} className={`bg-nexus-card border rounded-xl p-5 text-xs flex flex-col ${isCurrent(plan) ? 'border-blue-500' : 'border-nexus-border'}`}>
                <p className="text-sm font-bold text-white">{plan.name}</p>
                <p className="text-xl font-bold text-blue-400 mt-1">{formatBRL(priceOf(plan))}<span className="text-xs text-slate-500 font-normal"> / {annual && plan.annualPrice ? 'ano' : 'mês'}</span></p>
                <ul className="mt-3 space-y-1 text-slate-400 flex-1">
                  <li>{plan.maxUsers ? `Até ${plan.maxUsers} usuários` : 'Usuários conforme o plano'}</li>
                  <li>{plan.maxVehicles ? `Até ${plan.maxVehicles} veículos` : 'Veículos conforme o plano'}</li>
                </ul>
                {isCurrent(plan) ? (
                  <p className="mt-3 text-blue-400 font-bold">Plano atual</p>
                ) : isAdmin ? (
                  <button onClick={() => openCheckout(plan)} className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg cursor-pointer">
                    {!sub || sub.status === 1 || sub.status === 6 || sub.status === 4 ? 'Assinar' : 'Trocar para este plano'}
                  </button>
                ) : null}
              </div>
            ))}
          </div>
          {!isAdmin && <p className="text-[11px] text-slate-500 mt-3">Somente o administrador da empresa pode alterar o plano.</p>}
        </div>

        <div>
          <h2 className="text-sm font-bold text-white mb-3">Histórico de pagamentos</h2>
          <div className="bg-nexus-card border border-nexus-border rounded-xl overflow-hidden">
            {overview && overview.paymentHistory.length > 0 ? (
              <table className="w-full text-left text-xs">
                <thead><tr className="border-b border-nexus-border bg-slate-950/60 text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Data</th><th className="py-3 px-4">Valor</th><th className="py-3 px-4">Forma</th><th className="py-3 px-4">Status</th>
                </tr></thead>
                <tbody className="divide-y divide-nexus-border text-slate-200">
                  {overview.paymentHistory.map(p => (
                    <tr key={p.id}>
                      <td className="py-3 px-4">{formatDateTime(p.paidAt ?? p.createdAt)}</td>
                      <td className="py-3 px-4 font-bold">{formatBRL(p.amount)}</td>
                      <td className="py-3 px-4">{PaymentMethodLabel[p.method]}</td>
                      <td className="py-3 px-4">{PaymentStatusLabel[p.status]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-6 text-center text-xs text-slate-500">Nenhum pagamento registrado ainda.</div>
            )}
          </div>
        </div>
      </div>

      {checkoutPlan && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md text-slate-100 shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base text-white">Finalizar assinatura</h3>
              <button onClick={() => setCheckoutPlan(null)} className="p-1 hover:bg-slate-800 rounded text-slate-400 cursor-pointer"><X className="w-5 h-5" /></button>
            </div>

            {!result ? (
              <>
                <div className="text-xs bg-slate-950 border border-slate-800 rounded-lg p-3 space-y-1">
                  <p><span className="text-slate-400">Plano:</span> <strong>{checkoutPlan.name}</strong></p>
                  <p><span className="text-slate-400">Valor:</span> <strong>{formatBRL(priceOf(checkoutPlan))}</strong> por {annual && checkoutPlan.annualPrice ? 'ano' : 'mês'}</p>
                  {sub?.status === 1 && overview?.trialDaysRemaining != null && overview.trialDaysRemaining > 0 && (
                    <p className="text-amber-300">Seu teste continua: a primeira cobrança vale a partir do fim do período de teste.</p>
                  )}
                </div>

                <div className="space-y-2 text-xs">
                  <p className="text-slate-400">Forma de pagamento</p>
                  {([1, 2, 3] as PaymentMethod[]).map(m => (
                    <label key={m} className={`flex items-center gap-2 border rounded-lg px-3 py-2 cursor-pointer ${method === m ? 'border-blue-500 bg-blue-500/10' : 'border-slate-800'}`}>
                      <input type="radio" checked={method === m} onChange={() => setMethod(m)} />
                      {PaymentMethodLabel[m]}
                      <span className="text-slate-500 ml-auto">{m === 2 ? 'renovação automática' : 'renovação manual a cada período'}</span>
                    </label>
                  ))}
                  {method !== 2 && (
                    <input value={document} onChange={e => setDocument(e.target.value)} placeholder={method === 3 ? 'CPF ou CNPJ (obrigatório)' : 'CPF ou CNPJ (opcional)'}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-blue-500" />
                  )}
                </div>

                <p className="text-[11px] text-slate-500">
                  A assinatura só é ativada quando o pagamento for confirmado pelo Mercado Pago. Você pode cancelar quando quiser; o acesso continua até o fim do período pago.
                </p>
                {checkoutError && <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">{checkoutError}</p>}

                <button onClick={submitCheckout} disabled={submitting}
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl disabled:opacity-50 cursor-pointer">
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {submitting ? 'Gerando pagamento...' : method === 2 ? 'Ir para o pagamento seguro' : 'Gerar pagamento'}
                </button>
              </>
            ) : (
              <div className="space-y-3 text-xs">
                {result.method === 1 && (
                  <>
                    <p className="text-slate-300">Escaneie o QR Code ou copie o código Pix. Assim que o pagamento for confirmado, sua assinatura é ativada automaticamente.</p>
                    {result.qrCodeBase64 && <img alt="QR Code Pix" className="mx-auto w-48 h-48 bg-white p-2 rounded" src={`data:image/png;base64,${result.qrCodeBase64}`} />}
                    {result.pixCode && (
                      <button onClick={copyPix} className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg cursor-pointer">
                        <Copy className="w-4 h-4" />{copied ? 'Código copiado!' : 'Copiar código Pix'}
                      </button>
                    )}
                  </>
                )}
                {result.method === 3 && (
                  <>
                    <p className="text-slate-300">Boleto gerado. A compensação pode levar até alguns dias úteis; avisaremos por e-mail quando for confirmado.</p>
                    {result.redirectUrl && <a href={result.redirectUrl} target="_blank" rel="noreferrer" className="block text-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg">Abrir boleto</a>}
                  </>
                )}
                <button onClick={() => { setCheckoutPlan(null); load(); }} className="w-full px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg cursor-pointer">Fechar</button>
              </div>
            )}
          </div>
        </div>
      )}
    </MainLayout>
  );
}
