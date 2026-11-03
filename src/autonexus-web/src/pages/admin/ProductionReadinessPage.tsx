import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, CircleX, RefreshCw, ShieldCheck, Rocket, CreditCard, Mail, Handshake, Server, Info, SlidersHorizontal } from 'lucide-react';
import { MainLayout } from '../../components/layout/MainLayout';
import { superAdminService, ProductionReadiness } from '../../services/superAdminService';

interface Props { currentView?: string; onNavigate?: (view: string) => void; }

const configurationGroups = [
  { title: 'Infraestrutura e segurança', icon: Server, items: [
    { label: 'Conexão PostgreSQL', key: 'ConnectionStrings__DefaultConnection', description: 'String de conexão da instância PostgreSQL usada pela API.' },
    { label: 'Chave JWT', key: 'Jwt__SecretKey', description: 'Segredo aleatório forte com pelo menos 32 caracteres. Não reutilize a chave de desenvolvimento.' },
    { label: 'URL pública HTTPS', key: 'APPLICATION_URL', description: 'Endereço público HTTPS da aplicação, sem apontar para localhost.' },
  ]},
  { title: 'Pagamentos — Mercado Pago', icon: CreditCard, items: [
    { label: 'Access Token de produção', key: 'MERCADOPAGO_ACCESS_TOKEN', description: 'Credencial de produção da conta Mercado Pago.' },
    { label: 'Segredo do Webhook', key: 'MERCADOPAGO_WEBHOOK_SECRET', description: 'Segredo HMAC configurado no painel do Mercado Pago.' },
  ]},
  { title: 'E-mail transacional — Resend', icon: Mail, items: [
    { label: 'API Key', key: 'RESEND_API_KEY', description: 'Chave da API Resend.' },
    { label: 'E-mail remetente', key: 'RESEND_FROM_EMAIL', description: 'Endereço de domínio verificado no Resend.' },
    { label: 'Nome remetente', key: 'RESEND_FROM_NAME', description: 'Nome exibido nos e-mails enviados pelo AutoNexus.' },
  ]},
  { title: 'Crédito externo — BV', icon: Handshake, items: [
    { label: 'Access Token', key: 'BV_OPEN_ACCESS_TOKEN', description: 'Credencial fornecida pela instituição após homologação.' },
    { label: 'Código do parceiro', key: 'BV_OPEN_COMMERCIAL_PARTNER_CODE', description: 'Identificador comercial do parceiro.' },
    { label: 'Endpoint de condições', key: 'BV_OPEN_FINANCING_CONDITIONS_ENDPOINT', description: 'Endpoint oficial fornecido pela instituição.' },
    { label: 'Envio externo', key: 'AUTONEXUS_ENABLE_EXTERNAL_CREDIT_SUBMISSION', description: 'Mantenha false até concluir homologação e testes integrados.' },
  ]},
];

export function ProductionReadinessPage({ currentView, onNavigate }: Props) {
  const [data, setData] = useState<ProductionReadiness | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showConfiguration, setShowConfiguration] = useState(true);

  const load = async () => {
    setLoading(true); setError(null);
    try { setData(await superAdminService.getProductionReadiness()); }
    catch (err) { setError(err instanceof Error ? err.message : 'Não foi possível consultar a preparação para produção.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const stats = useMemo(() => {
    const checks = data?.checks || [];
    const ok = checks.filter(x => x.ok).length;
    const blocking = checks.filter(x => x.blocking && !x.ok).length;
    const pending = checks.filter(x => !x.ok && !x.blocking).length;
    return { ok, blocking, pending, total: checks.length, percent: checks.length ? Math.round(ok / checks.length * 100) : 0 };
  }, [data]);

  return (
    <MainLayout currentView={currentView} onNavigate={onNavigate}>
      <div className="mx-auto w-full max-w-[1500px] space-y-6 p-4 text-slate-100 sm:p-6">
        <div className="flex flex-col justify-between gap-4 border-b border-blue-900/60 pb-5 lg:flex-row lg:items-center">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-blue-400/40 bg-blue-500/10 text-blue-400 shadow-lg shadow-blue-900/30"><Rocket size={34}/></div>
            <div><p className="text-[10px] font-bold uppercase tracking-[.22em] text-blue-400">Área restrita · SuperAdmin</p><h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">Prontidão para Produção</h1><p className="mt-1 text-xs text-slate-400 sm:text-sm">Configure os serviços globais e valide o ambiente antes do deploy.</p></div>
          </div>
          <div className="flex items-center gap-3 self-start rounded-xl border border-blue-900 bg-slate-950/60 p-2 lg:self-center">
            <span className={`h-2.5 w-2.5 rounded-full ${data?.ready ? 'bg-emerald-400' : 'bg-amber-400'}`}/>
            <span className="text-[11px] text-slate-300">{data ? `Última verificação: ${new Date(data.checkedAtUtc).toLocaleString('pt-BR')}` : 'Aguardando verificação'}</span>
            <button onClick={load} disabled={loading} className="flex items-center gap-2 rounded-lg border border-blue-700 px-3 py-2 text-xs font-bold text-white hover:bg-blue-900/40 disabled:opacity-50"><RefreshCw size={14} className={loading?'animate-spin':''}/> Atualizar</button>
          </div>
        </div>

        {error && <div role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">{error}</div>}

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="flex items-center gap-4 rounded-xl border-l-4 border-blue-500 bg-gradient-to-r from-blue-950/80 to-slate-900 p-4"><div className="rounded-full bg-blue-500 p-3"><CheckCircle2 size={24}/></div><div><strong className="text-3xl font-black">{stats.ok}/{stats.total}</strong><p className="text-xs text-slate-300">Itens OK</p></div></div>
          <div className="flex items-center gap-4 rounded-xl border-l-4 border-amber-400 bg-gradient-to-r from-amber-950/50 to-slate-900 p-4"><div className="rounded-full bg-amber-400 p-3 text-slate-950"><AlertTriangle size={24}/></div><div><strong className="text-3xl font-black">{stats.pending}</strong><p className="text-xs text-slate-300">Pendências não bloqueantes</p></div></div>
          <div className="flex items-center gap-4 rounded-xl border-l-4 border-red-500 bg-gradient-to-r from-red-950/50 to-slate-900 p-4"><div className="rounded-full bg-slate-400 p-3 text-slate-950"><CircleX size={24}/></div><div><strong className="text-3xl font-black">{stats.blocking}</strong><p className="text-xs text-slate-300">Itens bloqueantes</p></div></div>
          <div className="flex items-center gap-4 rounded-xl border-l-4 border-emerald-400 bg-gradient-to-r from-emerald-950/50 to-slate-900 p-4"><div className="rounded-full bg-emerald-400 p-3 text-slate-950"><ShieldCheck size={24}/></div><div><strong className="text-3xl font-black">{stats.percent}%</strong><p className="text-xs text-slate-300">Itens verificados OK</p></div></div>
        </div>

        <div className="grid items-start gap-5 xl:grid-cols-[1.05fr_.95fr]">
          <section className="overflow-hidden rounded-xl border border-blue-900 bg-[#061a32]">
            <div className="flex items-center gap-3 border-b border-blue-900 px-5 py-4"><ShieldCheck className="text-blue-400" size={24}/><div><h2 className="font-bold text-white">Checklist de Produção</h2><p className="text-[10px] text-slate-400">Resultado da última verificação executada pela API</p></div></div>
            {loading && !data ? <div className="p-8 text-center text-sm text-slate-400">Verificando ambiente...</div> : <div className="divide-y divide-blue-900/70">{(data?.checks||[]).map(check=><div key={check.name} className="flex items-start gap-3 px-5 py-3"><div className="mt-0.5">{check.ok?<CheckCircle2 className="text-emerald-400" size={20}/>:check.blocking?<CircleX className="text-red-400" size={20}/>:<AlertTriangle className="text-amber-400" size={20}/>}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><strong className="text-sm text-white">{check.name}</strong><span className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase ${check.ok?'bg-emerald-500/15 text-emerald-300':check.blocking?'bg-red-500/15 text-red-300':'bg-amber-500/15 text-amber-300'}`}>{check.ok?'OK':check.blocking?'Bloqueante':'Pendente'}</span></div>{!check.ok&&<p className="mt-1 text-[11px] leading-5 text-slate-400">{check.guidance}</p>}</div></div>)}</div>}
          </section>

          <div className="space-y-4">
            <section className={`rounded-xl border p-5 ${data?.ready?'border-emerald-500/60 bg-gradient-to-br from-emerald-950 to-green-950/50':'border-amber-500/50 bg-gradient-to-br from-amber-950/70 to-slate-950'}`}>
              <div className="flex items-center gap-4">{data?.ready?<CheckCircle2 size={46} className="shrink-0 text-emerald-400"/>:<AlertTriangle size={46} className="shrink-0 text-amber-400"/>}<div><h2 className="text-lg font-black text-white">{data?.ready?'Requisitos técnicos verificados':'Configuração ainda pendente'}</h2><p className="mt-1 text-xs leading-5 text-slate-300">{data?.ready?'Os requisitos bloqueantes verificados pela API estão atendidos. Revise também as integrações e a homologação antes do deploy.':'Resolva os itens bloqueantes e execute uma nova verificação antes de publicar.'}</p></div></div>
              <button onClick={()=>{setShowConfiguration(true);document.getElementById('configuracao-producao')?.scrollIntoView({behavior:'smooth'});}} className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg border border-blue-400/50 bg-blue-600/20 px-4 py-3 text-sm font-bold text-white hover:bg-blue-600/40"><SlidersHorizontal size={17}/> Configurar ambiente</button>
            </section>

            <section className="rounded-xl border border-blue-900 bg-[#061a32] p-5">
              <div className="mb-3 flex items-center gap-2"><Info className="text-blue-400" size={20}/><h3 className="font-bold text-white">Informações do sistema</h3></div>
              <div className="space-y-2 text-xs"><div className="flex justify-between gap-3 border-b border-blue-900/70 pb-2"><span className="text-slate-400">Ambiente</span><strong className="text-white">{data?.environment||'Não identificado'}</strong></div><div className="flex justify-between gap-3 border-b border-blue-900/70 pb-2"><span className="text-slate-400">Status do diagnóstico</span><strong className={data?.ready?'text-emerald-300':'text-amber-300'}>{data?.ready?'Apto nos itens bloqueantes':'Requer ajustes'}</strong></div><div className="flex justify-between gap-3"><span className="text-slate-400">Última execução</span><strong className="text-white">{data?new Date(data.checkedAtUtc).toLocaleString('pt-BR'):'—'}</strong></div></div>
            </section>
          </div>
        </div>

        <section id="configuracao-producao" className="scroll-mt-24 rounded-xl border border-blue-900 bg-[#06172c]">
          <button onClick={()=>setShowConfiguration(v=>!v)} className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"><div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-blue-400">Configuração global</p><h2 className="mt-1 text-lg font-black text-white">Configurações de produção</h2><p className="mt-1 text-xs text-slate-400">Variáveis que devem ser cadastradas no ambiente da API / gerenciador de secrets.</p></div><span className="rounded-lg border border-blue-800 px-3 py-2 text-xs font-bold text-blue-200">{showConfiguration?'Recolher':'Expandir'}</span></button>
          {showConfiguration&&<div className="grid gap-3 border-t border-blue-900 p-4 lg:grid-cols-2">{configurationGroups.map(group=><div key={group.title} className="rounded-xl border border-blue-900/80 bg-slate-950/60 p-4"><div className="mb-3 flex items-center gap-2"><group.icon className="text-blue-400" size={19}/><h3 className="text-sm font-bold text-white">{group.title}</h3></div><div className="space-y-3">{group.items.map(item=><div key={item.key} className="border-t border-slate-800 pt-3 first:border-0 first:pt-0"><div className="flex flex-wrap items-center justify-between gap-2"><strong className="text-xs text-slate-200">{item.label}</strong><code className="rounded bg-blue-950 px-2 py-1 text-[10px] text-blue-200">{item.key}</code></div><p className="mt-1 text-[10px] leading-4 text-slate-500">{item.description}</p></div>)}</div></div>)}</div>}
          <div className="border-t border-blue-900 bg-blue-950/30 px-5 py-4 text-[11px] leading-5 text-slate-300"><strong className="text-white">Segurança:</strong> esta tela não recebe, exibe ou grava senhas e tokens. Cadastre os valores no gerenciador de secrets do servidor/host (ou variáveis protegidas do deploy). O backend lê essas variáveis ao iniciar. Depois de atualizar o ambiente, reinicie somente a API e clique em Atualizar. Nunca coloque credenciais em appsettings.json, no Git ou no banco de dados.</div>
        </section>
      </div>
    </MainLayout>
  );
}
