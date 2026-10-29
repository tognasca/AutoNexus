import { useEffect, useState } from 'react';
import { billingService, formatBRL, BillingCycle } from '../../services/billingService';
import type { Plan } from '../../services/subscriptionService';
import { Loader2 } from 'lucide-react';

export function SignupPage() {
  const params = new URLSearchParams(window.location.search);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [planId, setPlanId] = useState(params.get('plano') ?? '');
  const [cycle, setCycle] = useState<BillingCycle>(params.get('ciclo') === '2' ? 2 : 1);
  const [form, setForm] = useState({ companyName: '', adminName: '', adminEmail: '', adminPassword: '' });
  const [terms, setTerms] = useState(false);
  const [privacy, setPrivacy] = useState(false);
  const [cookies, setCookies] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    billingService.publicPlans().then(list => {
      setPlans(list);
      if (!planId && list.length) setPlanId(list[0].id);
    }).catch(() => setError('Não foi possível carregar os planos agora.'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const plan = plans.find(p => p.id === planId);
  const allAccepted = terms && privacy && cookies;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.companyName.trim() || !form.adminName.trim()) {
      setError('Informe o nome da empresa e o nome do administrador.');
      return;
    }
    if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(form.adminEmail.trim())) {
      setError('Informe um e-mail válido.');
      return;
    }
    if (form.adminPassword.length < 8) {
      setError('A senha deve ter pelo menos 8 caracteres.');
      return;
    }
    if (!planId) {
      setError('Selecione um plano antes de continuar.');
      return;
    }
    if (!allAccepted) {
      setError('Aceite os Termos de Uso, a Política de Privacidade e a Política de Cookies para continuar.');
      return;
    }
    setLoading(true);
    try {
      const result = await billingService.signup({
        ...form, companyName: form.companyName.trim(), adminName: form.adminName.trim(), adminEmail: form.adminEmail.trim(), planId, cycle,
        acceptTermsOfUse: terms, acceptPrivacyPolicy: privacy, acceptCookiePolicy: cookies,
      });
      // Já entra logado: mesma chave/formato usados pelo login normal.
      localStorage.setItem('autonexus_token', result.login.token);
      localStorage.setItem('autonexus_user', JSON.stringify({ ...result.login, profileName: 'Administrador' }));
      // Após criar empresa e administrador, abrir a área de assinatura para o usuário concluir a cobrança.
      window.location.href = '/?view=subscription';
    } catch (err: any) {
      setError(err.message || 'Não foi possível concluir o cadastro. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const input = 'w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500';

  return (
    <div className="min-h-screen bg-nexus-dark text-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-nexus-card border border-nexus-border rounded-2xl p-6 sm:p-8">
        <a href="/precos" className="text-xs text-slate-400 hover:text-white">← Voltar aos planos</a>
        <h1 className="mt-3 text-2xl font-bold text-white">Crie sua conta</h1>
        <p className="text-xs text-slate-400 mt-1">
          {plan && plan.trialDays > 0 ? `${plan.trialDays} dias de teste grátis. ` : ''}Você pode cancelar quando quiser.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4 text-xs">
          <div>
            <label className="text-slate-400 block mb-1">Plano</label>
            <div className="grid grid-cols-2 gap-2">
              <select value={planId} onChange={e => setPlanId(e.target.value)} className={input}>
                {plans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <select value={cycle} onChange={e => setCycle(Number(e.target.value) as BillingCycle)} className={input}>
                <option value={1}>Mensal{plan ? ` — ${formatBRL(plan.price)}` : ''}</option>
                {plan?.annualPrice && <option value={2}>Anual — {formatBRL(plan.annualPrice)}</option>}
              </select>
            </div>
          </div>

          <div><label className="text-slate-400 block mb-1">Nome da empresa *</label>
            <input className={input} required value={form.companyName} onChange={e => setForm({ ...form, companyName: e.target.value })} /></div>
          <div><label className="text-slate-400 block mb-1">Seu nome *</label>
            <input className={input} required value={form.adminName} onChange={e => setForm({ ...form, adminName: e.target.value })} /></div>
          <div><label className="text-slate-400 block mb-1">E-mail *</label>
            <input className={input} type="email" required value={form.adminEmail} onChange={e => setForm({ ...form, adminEmail: e.target.value })} /></div>
          <div><label className="text-slate-400 block mb-1">Senha (mínimo 8 caracteres) *</label>
            <input className={input} type="password" minLength={8} required value={form.adminPassword} onChange={e => setForm({ ...form, adminPassword: e.target.value })} /></div>

          <div className="space-y-2 pt-2 border-t border-slate-800 text-slate-300">
            <label className="flex gap-2 items-start cursor-pointer"><input type="checkbox" checked={terms} onChange={e => setTerms(e.target.checked)} className="mt-0.5" />
              <span>Li e aceito os <a href="/termos" target="_blank" className="text-blue-400 underline">Termos de Uso</a></span></label>
            <label className="flex gap-2 items-start cursor-pointer"><input type="checkbox" checked={privacy} onChange={e => setPrivacy(e.target.checked)} className="mt-0.5" />
              <span>Li e aceito a <a href="/privacidade" target="_blank" className="text-blue-400 underline">Política de Privacidade</a></span></label>
            <label className="flex gap-2 items-start cursor-pointer"><input type="checkbox" checked={cookies} onChange={e => setCookies(e.target.checked)} className="mt-0.5" />
              <span>Li e aceito a <a href="/cookies" target="_blank" className="text-blue-400 underline">Política de Cookies</a></span></label>
          </div>

          {error && <p className="text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">{error}</p>}

          <button type="submit" disabled={loading || !allAccepted || !planId}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl disabled:opacity-50 cursor-pointer">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? 'Criando conta...' : 'Criar conta e começar'}
          </button>
        </form>
      </div>
    </div>
  );
}
