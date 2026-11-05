import { useEffect, useState } from 'react';
import { superAdminService, PlatformIntegrationSettings } from '../../services/superAdminService';

export function PlatformIntegrationsSettings() {
  const [settings, setSettings] = useState<PlatformIntegrationSettings | null>(null);
  const [form, setForm] = useState({ resendApiKey: '', resendFromEmail: '', resendFromName: 'AutoNexus', bvAccessToken: '', bvCommercialPartnerCode: '', bvFinancingConditionsEndpoint: '' });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState(false);

  const load = async () => {
    const result = await superAdminService.getPlatformIntegrationSettings();
    setSettings(result);
    setForm(v => ({ ...v, resendFromEmail: result.resendFromEmail ?? '', resendFromName: result.resendFromName ?? 'AutoNexus', bvFinancingConditionsEndpoint: result.bvEndpoint ?? '' }));
  };
  useEffect(() => { void load().catch(() => setMessage('Não foi possível carregar as configurações.')); }, []);

  const update = (key: keyof typeof form, value: string) => setForm(v => ({ ...v, [key]: value }));
  const save = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy(true); setMessage(''); setError(false);
    try {
      const result = await superAdminService.savePlatformIntegrationSettings(form);
      setMessage(result.message); setForm(v => ({ ...v, resendApiKey: '', bvAccessToken: '', bvCommercialPartnerCode: '' }));
      await load();
    } catch (e) { setMessage(e instanceof Error ? e.message : 'Falha ao salvar.'); setError(true); }
    finally { setBusy(false); }
  };

  return <section className="overflow-hidden rounded-xl border border-blue-800 bg-[#061a32]">
    <div className="border-b border-blue-900 px-5 py-4"><p className="text-[10px] font-bold uppercase tracking-[.2em] text-blue-400">Segredos protegidos no banco</p><h2 className="text-lg font-black text-white">Resend e BV</h2><p className="mt-1 text-xs text-slate-400">Somente SuperAdmin. Credenciais criptografadas; alterações aplicadas sem reiniciar a API.</p></div>
    <form onSubmit={save} className="grid gap-4 p-5 lg:grid-cols-2">
      <div className="space-y-3 rounded-lg border border-blue-900 p-4">
        <h3 className="font-bold text-white">Resend {settings?.resendConfigured ? '· configurado' : '· pendente'}</h3>
        <label className="block text-xs text-slate-300">API Key {settings?.resendApiKeyHint && <span className="text-slate-500">({settings.resendApiKeyHint})</span>}<input type="password" autoComplete="new-password" value={form.resendApiKey} onChange={e=>update('resendApiKey',e.target.value)} placeholder="Deixe vazio para manter a atual" className="mt-1 w-full rounded-lg border border-blue-800 bg-slate-950 px-3 py-2 text-sm text-white"/></label>
        <label className="block text-xs text-slate-300">E-mail remetente verificado<input type="email" value={form.resendFromEmail} onChange={e=>update('resendFromEmail',e.target.value)} placeholder="noreply@seudominio.com.br" className="mt-1 w-full rounded-lg border border-blue-800 bg-slate-950 px-3 py-2 text-sm text-white"/></label>
        <label className="block text-xs text-slate-300">Nome remetente<input value={form.resendFromName} onChange={e=>update('resendFromName',e.target.value)} className="mt-1 w-full rounded-lg border border-blue-800 bg-slate-950 px-3 py-2 text-sm text-white"/></label>
      </div>
      <div className="space-y-3 rounded-lg border border-blue-900 p-4">
        <h3 className="font-bold text-white">BV Open {settings?.bvConfigured ? '· configurado' : '· pendente'}</h3>
        <label className="block text-xs text-slate-300">Access Token {settings?.bvAccessTokenHint && <span className="text-slate-500">({settings.bvAccessTokenHint})</span>}<input type="password" autoComplete="new-password" value={form.bvAccessToken} onChange={e=>update('bvAccessToken',e.target.value)} placeholder="Deixe vazio para manter o atual" className="mt-1 w-full rounded-lg border border-blue-800 bg-slate-950 px-3 py-2 text-sm text-white"/></label>
        <label className="block text-xs text-slate-300">Código comercial do parceiro<input type="password" autoComplete="new-password" value={form.bvCommercialPartnerCode} onChange={e=>update('bvCommercialPartnerCode',e.target.value)} placeholder="Deixe vazio para manter o atual" className="mt-1 w-full rounded-lg border border-blue-800 bg-slate-950 px-3 py-2 text-sm text-white"/></label>
        <label className="block text-xs text-slate-300">Endpoint de consulta de condições<input value={form.bvFinancingConditionsEndpoint} onChange={e=>update('bvFinancingConditionsEndpoint',e.target.value)} className="mt-1 w-full rounded-lg border border-blue-800 bg-slate-950 px-3 py-2 text-sm text-white"/></label>
        <p className="text-[10px] text-amber-300">A integração atual consulta condições/tabelas. Não envia proposta de crédito nem confirma aprovação.</p>
      </div>
      {message && <div role="status" className={`rounded-lg border p-3 text-xs lg:col-span-2 ${error?'border-red-500/30 bg-red-500/10 text-red-200':'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'}`}>{message}</div>}
      <div className="flex flex-wrap items-center gap-3 lg:col-span-2"><button disabled={busy} className="rounded-lg bg-blue-600 px-5 py-3 text-xs font-bold text-white disabled:opacity-50">{busy?'Salvando...':'Salvar Resend e BV'}</button><span className="text-[10px] text-slate-500">Última atualização: {settings?.configuredAtUtc ? new Date(settings.configuredAtUtc).toLocaleString('pt-BR') : 'ainda não configurado'}</span></div>
    </form>
  </section>;
}
