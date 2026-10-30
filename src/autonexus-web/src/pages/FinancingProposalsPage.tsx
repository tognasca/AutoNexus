import { useEffect, useState } from 'react';
import { Plus, RefreshCw, X, CheckCircle2, Clock3 } from 'lucide-react';
import { MainLayout } from '../components/layout/MainLayout';
import { financingProposalService, FinancingProposal, FinancingProposalCreate } from '../services/financingProposalService';

const emptyForm: FinancingProposalCreate = {
  customerName: '', customerCpf: '', monthlyIncome: 0, hasDriverLicense: false,
  vehicleName: '', vehiclePrice: 0, entryValue: 0, tradeValue: 0,
  financedAmount: 0, months: 48, installmentValue: 0, privacyConsent: false,
};

const money = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export function FinancingProposalsPage({ currentView, onNavigate }: { currentView?: string; onNavigate?: (view: string) => void }) {
  const [items, setItems] = useState<FinancingProposal[]>([]);
  const [form, setForm] = useState<FinancingProposalCreate>(emptyForm);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try { setItems(await financingProposalService.list()); }
    catch (e) { setError(e instanceof Error ? e.message : 'Erro ao carregar propostas.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const update = <K extends keyof FinancingProposalCreate>(key: K, value: FinancingProposalCreate[K]) =>
    setForm(current => ({ ...current, [key]: value }));

  const recalc = (next: Partial<FinancingProposalCreate>) => {
    const value = next.vehiclePrice ?? form.vehiclePrice;
    const entry = next.entryValue ?? form.entryValue;
    const trade = next.tradeValue ?? form.tradeValue;
    setForm(current => ({ ...current, ...next, financedAmount: Math.max(0, value - entry - trade) }));
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true); setError('');
    try {
      await financingProposalService.create(form);
      setOpen(false); setForm(emptyForm); await load();
    } catch (e) { setError(e instanceof Error ? e.message : 'Não foi possível salvar a proposta.'); }
    finally { setSaving(false); }
  };

  return (
    <MainLayout currentView={currentView} onNavigate={onNavigate}>
      <style>{`.autonexus-financing input.input,.autonexus-financing textarea.input{width:100%;border:1px solid rgb(30 41 59);background:rgb(2 6 23);color:white;border-radius:.5rem;padding:.55rem .75rem;outline:none}.autonexus-financing input.input:focus,.autonexus-financing textarea.input:focus{border-color:rgb(245 158 11)}.autonexus-financing input.input::placeholder,.autonexus-financing textarea.input::placeholder{color:rgb(100 116 139)}`}</style>
      <div className="autonexus-financing space-y-6 p-4 sm:p-6 w-full">
        <div className="flex flex-col sm:flex-row justify-between gap-4 border-b border-nexus-border pb-4">
          <div><h1 className="text-xl font-bold text-white">Financiamento</h1><p className="text-xs text-nexus-text-muted mt-1">Cadastre propostas uma única vez e envie depois para BV, financeira ou outro sistema.</p></div>
          <div className="flex gap-2"><button onClick={load} className="p-2 bg-slate-800 rounded-lg text-slate-300" title="Atualizar"><RefreshCw className="w-4 h-4" /></button><button onClick={() => setOpen(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs"><Plus className="w-4 h-4" /> Nova proposta</button></div>
        </div>
        {error && <div className="p-3 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-300 text-xs">{error}</div>}
        <div className="bg-nexus-card border border-nexus-border rounded-xl overflow-hidden">
          {loading ? <div className="p-8 text-center text-slate-400">Carregando...</div> : items.length === 0 ? <div className="p-10 text-center text-slate-400 text-sm">Nenhuma proposta cadastrada.</div> : <div className="overflow-x-auto"><table className="w-full text-left text-xs"><thead><tr className="border-b border-nexus-border bg-slate-950/60 text-slate-400 uppercase"><th className="p-3">Proposta</th><th className="p-3">Cliente</th><th className="p-3">Veículo</th><th className="p-3">Financiado</th><th className="p-3">Status</th><th className="p-3 text-center">Exportar</th></tr></thead><tbody className="divide-y divide-nexus-border text-slate-200">{items.map(item => <tr key={item.id} className="hover:bg-slate-800/40"><td className="p-3 font-mono">{item.proposalNumber}</td><td className="p-3">{item.customerName}<span className="block text-[10px] text-slate-500">{item.customerCpf}</span></td><td className="p-3">{item.vehicleName}</td><td className="p-3 font-bold text-amber-400">{money(item.financedAmount)}</td><td className="p-3">{item.status === 'Draft' ? <span className="inline-flex gap-1 items-center text-amber-400"><Clock3 className="w-3 h-3" /> Cadastro</span> : <span className="inline-flex gap-1 items-center text-emerald-400"><CheckCircle2 className="w-3 h-3" /> {item.status}</span>}</td><td className="p-3"><div className="flex justify-center gap-1">{(['xml','txt','csv','json'] as const).map(format => <button key={format} onClick={() => financingProposalService.export(item.id, format)} className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[10px] uppercase">{format}</button>)}</div></td></tr>)}</tbody></table></div>}
        </div>
      </div>

      {open && <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"><form onSubmit={save} className="autonexus-financing bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl p-6 space-y-5 text-xs text-slate-100 my-auto">
        <div className="flex justify-between items-center"><div><h2 className="text-lg font-bold">Nova proposta de financiamento</h2><p className="text-slate-400 mt-1">O cadastro não chama nenhuma financeira. Os dados ficam prontos para integração/exportação.</p></div><button type="button" onClick={() => setOpen(false)}><X className="w-5 h-5 text-slate-400" /></button></div>
        <section className="grid grid-cols-1 md:grid-cols-3 gap-3"><h3 className="md:col-span-3 font-bold text-amber-400">Cliente</h3><input required placeholder="Nome completo *" value={form.customerName} onChange={e => update('customerName', e.target.value)} className="input" /><input required placeholder="CPF *" value={form.customerCpf} onChange={e => update('customerCpf', e.target.value)} className="input" /><input type="date" value={form.birthDate || ''} onChange={e => update('birthDate', e.target.value)} className="input" /><input required type="number" min="0" step="0.01" placeholder="Renda mensal *" value={form.monthlyIncome || ''} onChange={e => update('monthlyIncome', Number(e.target.value))} className="input" /><input placeholder="Telefone" value={form.phone || ''} onChange={e => update('phone', e.target.value)} className="input" /><input type="email" placeholder="E-mail" value={form.email || ''} onChange={e => update('email', e.target.value)} className="input" /></section>
        <section className="grid grid-cols-1 md:grid-cols-4 gap-3"><h3 className="md:col-span-4 font-bold text-amber-400">Veículo e negociação</h3><input required placeholder="Veículo / modelo *" value={form.vehicleName} onChange={e => update('vehicleName', e.target.value)} className="input md:col-span-2" /><input placeholder="Marca" value={form.brand || ''} onChange={e => update('brand', e.target.value)} className="input" /><input placeholder="Ano" value={form.vehicleYear || ''} onChange={e => update('vehicleYear', e.target.value)} className="input" /><input required type="number" min="0" step="0.01" placeholder="Valor do veículo *" value={form.vehiclePrice || ''} onChange={e => recalc({ vehiclePrice: Number(e.target.value) })} className="input" /><input type="number" min="0" step="0.01" placeholder="Entrada" value={form.entryValue || ''} onChange={e => recalc({ entryValue: Number(e.target.value) })} className="input" /><input type="number" min="0" step="0.01" placeholder="Troca" value={form.tradeValue || ''} onChange={e => recalc({ tradeValue: Number(e.target.value) })} className="input" /><input readOnly type="number" step="0.01" placeholder="Valor financiado" value={form.financedAmount || ''} className="input bg-slate-800" /><input required type="number" min="1" placeholder="Parcelas" value={form.months} onChange={e => update('months', Number(e.target.value))} className="input" /><input required type="number" min="0" step="0.01" placeholder="Valor da parcela" value={form.installmentValue || ''} onChange={e => update('installmentValue', Number(e.target.value))} className="input" /><input placeholder="Placa" value={form.plate || ''} onChange={e => update('plate', e.target.value)} className="input" /><input placeholder="Renavam" value={form.renavam || ''} onChange={e => update('renavam', e.target.value)} className="input" /><input placeholder="Chassi" value={form.chassis || ''} onChange={e => update('chassis', e.target.value)} className="input md:col-span-2" /></section>
        <textarea placeholder="Observações" value={form.notes || ''} onChange={e => update('notes', e.target.value)} className="input min-h-20 w-full" />
        <label className="flex items-start gap-2 text-slate-300"><input type="checkbox" checked={form.privacyConsent} onChange={e => update('privacyConsent', e.target.checked)} className="mt-0.5" required /> Confirmo que o cliente autorizou o cadastro e tratamento dos dados para análise/financiamento.</label>
        <div className="flex justify-end gap-2 border-t border-slate-800 pt-4"><button type="button" onClick={() => setOpen(false)} className="px-4 py-2 rounded-lg bg-slate-800">Cancelar</button><button disabled={saving} className="px-5 py-2 rounded-lg bg-amber-600 font-bold disabled:opacity-50">{saving ? 'Salvando...' : 'Salvar proposta'}</button></div>
      </form></div>}
    </MainLayout>
  );
}
