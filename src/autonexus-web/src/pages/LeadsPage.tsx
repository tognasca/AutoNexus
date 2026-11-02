import { useEffect, useState } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import { leadService, LeadStatus, type LeadItem, type LeadInput } from '../services/leadService';
import { vehicleService } from '../services/vehicleService';
import { userService, type UserItem } from '../services/userService';
import { useAuth } from '../contexts/AuthContext';
import { Users, Plus, Search, Loader2, MessageCircle, Trash2, X } from 'lucide-react';

const stages = [
  { id: LeadStatus.Novo, name: 'Novo', color: 'border-slate-500' },
  { id: LeadStatus.Contato, name: 'Contato', color: 'border-sky-500' },
  { id: LeadStatus.Negociacao, name: 'Negociação', color: 'border-amber-500' },
  { id: LeadStatus.Proposta, name: 'Proposta', color: 'border-violet-500' },
  { id: LeadStatus.Venda, name: 'Venda', color: 'border-emerald-500' },
  { id: LeadStatus.Perdido, name: 'Perdido', color: 'border-rose-500' },
];

export function LeadsPage({ currentView, onNavigate }: { currentView?: string; onNavigate?: (view: string) => void }) {
  const { user } = useAuth();
  const [items, setItems] = useState<LeadItem[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState<LeadInput>({ name: '', phone: '', email: '', source: 'Manual', notes: '' });

  const load = async () => {
    setLoading(true);
    try { setItems(await leadService.getAll(search)); }
    catch (e: any) { alert(e?.message || 'Erro ao carregar leads.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [search]);
  useEffect(() => {
    vehicleService.getAll({ page: 1, pageSize: 100 }).then(x => setVehicles(x.items)).catch(() => {});
    if (user?.profile === 1) userService.getAll().then(setUsers).catch(() => {});
  }, [user?.profile]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      await leadService.create({ ...form, vehicleId: form.vehicleId || null, assignedToUserId: form.assignedToUserId || null });
      setModal(false); setForm({ name: '', phone: '', email: '', source: 'Manual', notes: '' }); await load();
    } catch (err: any) { alert(err?.message || 'Erro ao salvar lead.'); }
    finally { setSaving(false); }
  };
  const move = async (lead: LeadItem, status: LeadStatus) => {
    try { await leadService.changeStatus(lead.id, status); await load(); }
    catch (e: any) { alert(e?.message || 'Erro ao mudar etapa.'); }
  };
  const remove = async (lead: LeadItem) => {
    if (!confirm('Excluir este lead?')) return;
    try { await leadService.delete(lead.id); await load(); }
    catch (e: any) { alert(e?.message || 'Erro ao excluir lead.'); }
  };
  const contact = async (lead: LeadItem) => {
    try { await leadService.registerContact(lead.id); await load(); }
    catch (e: any) { alert(e?.message || 'Erro ao registrar contato.'); }
  };

  return <MainLayout currentView={currentView} onNavigate={onNavigate}>
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="flex items-center gap-2 text-xl font-bold text-white"><Users className="text-blue-400"/> CRM de Leads</h1><p className="mt-1 text-sm text-slate-400">Acompanhe oportunidades em cada etapa do funil comercial.</p></div>
        <button onClick={() => setModal(true)} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white"><Plus size={17}/> Novo lead</button>
      </div>
      <div className="relative max-w-md"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={17}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar nome, telefone ou e-mail..." className="w-full rounded-lg border border-nexus-border bg-nexus-card py-2.5 pl-10 pr-3 text-sm text-white"/></div>
      {loading ? <div className="flex h-48 items-center justify-center gap-2 text-slate-400"><Loader2 className="animate-spin"/>Carregando...</div> :
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          {stages.map(stage => {
            const leads = items.filter(x => x.status === stage.id);
            return <section key={stage.id} className={`min-w-0 rounded-xl border-t-2 bg-slate-900/50 ${stage.color}`}>
              <header className="flex justify-between border-b border-nexus-border px-3 py-3"><b className="text-sm text-white">{stage.name}</b><span className="rounded-full bg-slate-800 px-2 text-xs text-slate-300">{leads.length}</span></header>
              <div className="min-h-24 space-y-2 p-2">
                {leads.map(lead => <article key={lead.id} className="space-y-2 rounded-lg border border-nexus-border bg-nexus-card p-3">
                  <div className="flex justify-between gap-2"><b className="break-words text-sm text-white">{lead.name}</b><button onClick={() => remove(lead)} title="Excluir"><Trash2 size={14} className="text-slate-500 hover:text-rose-400"/></button></div>
                  <a href={`tel:${lead.phone}`} className="block text-xs text-slate-400">{lead.phone}</a>
                  {lead.email && <p className="break-all text-xs text-slate-500">{lead.email}</p>}
                  {lead.vehicleName && <p className="text-xs text-blue-300">{lead.vehicleName}</p>}
                  {lead.assignedToName && <p className="text-xs text-slate-500">Responsável: {lead.assignedToName}</p>}
                  <div className="flex flex-wrap gap-1">
                    <a target="_blank" rel="noreferrer" href={`https://wa.me/${lead.phone.replace(/\D/g, '')}`} className="flex items-center gap-1 rounded bg-emerald-600/15 px-2 py-1 text-[11px] text-emerald-400"><MessageCircle size={12}/> WhatsApp</a>
                    <button onClick={() => contact(lead)} className="rounded bg-sky-600/15 px-2 py-1 text-[11px] text-sky-300">Registrar contato</button>
                  </div>
                  <select value={lead.status} onChange={e => move(lead, Number(e.target.value) as LeadStatus)} className="w-full rounded border border-nexus-border bg-slate-950 px-2 py-1.5 text-xs text-slate-300">
                    {stages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </article>)}
                {!leads.length && <p className="py-5 text-center text-xs text-slate-600">Nenhum lead</p>}
              </div>
            </section>;
          })}
        </div>}
    </div>
    {modal && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4">
      <form onSubmit={save} className="w-full max-w-lg space-y-4 rounded-2xl border border-slate-700 bg-slate-900 p-5 text-white">
        <div className="flex justify-between border-b border-slate-800 pb-3"><h2 className="font-bold">Novo lead</h2><button type="button" onClick={() => setModal(false)}><X size={19}/></button></div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-xs">
          <label className="sm:col-span-2 text-slate-400">Nome *<input required maxLength={160} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-sm text-white"/></label>
          <label className="text-slate-400">Telefone *<input required maxLength={30} value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-sm text-white"/></label>
          <label className="text-slate-400">E-mail<input type="email" maxLength={254} value={form.email || ''} onChange={e => setForm({ ...form, email: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-sm text-white"/></label>
          <label className="text-slate-400">Origem<select value={form.source || 'Manual'} onChange={e => setForm({ ...form, source: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-sm text-white">{['Manual','WhatsApp','Instagram','Facebook','Site','Indicação','Marketplace','Outro'].map(x => <option key={x}>{x}</option>)}</select></label>
          <label className="text-slate-400">Veículo<select value={form.vehicleId || ''} onChange={e => setForm({ ...form, vehicleId: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-sm text-white"><option value="">Nenhum</option>{vehicles.map(v => <option key={v.id} value={v.id}>{v.brand} {v.model} ({v.modelYear})</option>)}</select></label>
          {user?.profile === 1 && <label className="text-slate-400">Responsável<select value={form.assignedToUserId || ''} onChange={e => setForm({ ...form, assignedToUserId: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-sm text-white"><option value="">Eu mesmo</option>{users.filter(x => x.isActive && x.profile !== 3).map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label>}
          <label className="sm:col-span-2 text-slate-400">Observações<textarea rows={3} maxLength={2000} value={form.notes || ''} onChange={e => setForm({ ...form, notes: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-sm text-white"/></label>
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-800 pt-3"><button type="button" onClick={() => setModal(false)} className="rounded-lg bg-slate-800 px-4 py-2 text-sm">Cancelar</button><button disabled={saving} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold disabled:opacity-50">{saving ? 'Salvando...' : 'Salvar lead'}</button></div>
      </form>
    </div>}
  </MainLayout>;
}
