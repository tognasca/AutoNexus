import { useEffect, useState } from 'react';
import { CreditCard } from 'lucide-react';
import { superAdminService, type MercadoPagoConfigurationStatus } from '../../services/superAdminService';

export function MercadoPagoSettings() {
  const [mpStatus, setMpStatus] = useState<MercadoPagoConfigurationStatus | null>(null);
  const [mpEnvironment, setMpEnvironment] = useState<'test' | 'production'>('production');
  const [mpAccessToken, setMpAccessToken] = useState('');
  const [mpWebhookSecret, setMpWebhookSecret] = useState('');
  const [mpBusy, setMpBusy] = useState(false);
  const [mpMessage, setMpMessage] = useState<string | null>(null);
  const [mpMessageError, setMpMessageError] = useState(false);

  useEffect(() => {
    void superAdminService.getMercadoPagoConfiguration().then(status => {
      setMpStatus(status);
      setMpEnvironment(status.environment);
    }).catch(() => {
      setMpMessageError(true);
      setMpMessage('Não foi possível carregar as configurações do Mercado Pago.');
    });
  }, []);

  return (
        <section className="overflow-hidden rounded-xl border border-blue-800 bg-[#061a32]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-blue-900 px-5 py-4">
            <div className="flex items-center gap-3"><CreditCard className="text-blue-400" size={24}/><div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-blue-400">Gateway de pagamentos</p><h2 className="text-lg font-black text-white">Mercado Pago</h2><p className="text-xs text-slate-400">Configuração global exclusiva do SuperAdmin</p></div></div>
            <span className={`rounded-full px-3 py-1 text-[10px] font-bold ${mpStatus?.configured?'bg-emerald-500/15 text-emerald-300':'bg-amber-500/15 text-amber-300'}`}>{mpStatus?.configured?'Configurado':'Não configurado'}</span>
          </div>
          <form className="grid gap-4 p-5 lg:grid-cols-2" onSubmit={async e=>{e.preventDefault();setMpBusy(true);setMpMessage(null);setMpMessageError(false);try{const result=await superAdminService.saveMercadoPagoConfiguration({accessToken:mpAccessToken,webhookSecret:mpWebhookSecret,environment:mpEnvironment});setMpMessage(result.message);setMpMessageError(false);setMpAccessToken('');setMpWebhookSecret('');const status=await superAdminService.getMercadoPagoConfiguration();setMpStatus(status);}catch(err){setMpMessage(err instanceof Error?err.message:'Falha ao salvar as credenciais.');setMpMessageError(true);}finally{setMpBusy(false);}}}>
            <div className="space-y-2"><label className="text-xs font-bold text-slate-200">Ambiente</label><select value={mpEnvironment} onChange={e=>setMpEnvironment(e.target.value as 'test'|'production')} className="w-full rounded-lg border border-blue-800 bg-slate-950 px-3 py-3 text-sm text-white"><option value="test">Teste / Sandbox</option><option value="production">Produção</option></select><p className="text-[10px] text-slate-500">Produção exige token APP_USR-. Teste exige token TEST-.</p></div>
            <div className="space-y-2"><label className="text-xs font-bold text-slate-200">Access Token {mpStatus?.configured&&<span className="font-normal text-slate-500">({mpStatus.accessTokenHint})</span>}</label><input type="password" autoComplete="new-password" required value={mpAccessToken} onChange={e=>setMpAccessToken(e.target.value)} placeholder="Cole o Access Token da conta" className="w-full rounded-lg border border-blue-800 bg-slate-950 px-3 py-3 text-sm text-white placeholder:text-slate-600"/></div>
            <div className="space-y-2 lg:col-span-2"><label className="text-xs font-bold text-slate-200">Segredo de assinatura do Webhook</label><input type="password" autoComplete="new-password" required value={mpWebhookSecret} onChange={e=>setMpWebhookSecret(e.target.value)} placeholder="Cole a chave secreta cadastrada no painel Mercado Pago" className="w-full rounded-lg border border-blue-800 bg-slate-950 px-3 py-3 text-sm text-white placeholder:text-slate-600"/></div>
            {mpMessage&&<div role="status" className={`lg:col-span-2 rounded-lg border p-3 text-xs ${mpMessageError?'border-red-500/30 bg-red-500/10 text-red-200':'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'}`}>{mpMessage}</div>}
            <div className="flex flex-wrap gap-3 lg:col-span-2"><button type="submit" disabled={mpBusy||!mpAccessToken.trim()||!mpWebhookSecret.trim()} className="rounded-lg bg-blue-600 px-5 py-3 text-xs font-bold text-white hover:bg-blue-500 disabled:opacity-50">{mpBusy?'Salvando...':'Salvar configuração'}</button><button type="button" disabled={mpBusy||!mpStatus?.configured} onClick={async()=>{setMpBusy(true);setMpMessage(null);try{const result=await superAdminService.validateMercadoPagoConfiguration();setMpMessage(result.account?result.message+' Conta: '+result.account:result.message);setMpMessageError(!result.valid);}catch(err){setMpMessage(err instanceof Error?err.message:'Falha na validação.');setMpMessageError(true);}finally{setMpBusy(false);}}} className="rounded-lg border border-blue-700 px-5 py-3 text-xs font-bold text-blue-100 hover:bg-blue-900/40 disabled:opacity-50">Validar credencial</button></div>
            <p className="text-[10px] leading-5 text-slate-500 lg:col-span-2">As credenciais são criptografadas antes de serem gravadas. O sistema mostra apenas os últimos caracteres do token; nunca exibe o segredo completo. Ao trocar de ambiente, informe as duas credenciais correspondentes ao novo ambiente.</p>
          </form>
        </section>
  );
}
