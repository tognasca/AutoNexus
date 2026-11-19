import { useState } from 'react';
import { request } from '../../services/api';
import type { LeadItem } from '../../services/leadService';
import { TransmissionType } from '../../types/vehicle';

interface Suggestion {
  id: string;
  brand: string;
  model: string;
  modelYear: number;
  listedValue: number;
  transmission: number;
}

export function AttendanceTools({ lead }: { lead: LeadItem }) {
  const [budget, setBudget] = useState('');
  const [transmission, setTransmission] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [draft, setDraft] = useState('');
  const digits = lead.phone.replace(/\D/g, '');
  const phone = digits.length === 10 || digits.length === 11 ? '55' + digits : digits;
  const greeting = `Olá, ${lead.name}!`;
  const templates = [
    { label: 'Primeiro contato', text: `${greeting} Recebi seu interesse${lead.vehicleName ? ' no ' + lead.vehicleName : ''}. Qual é o melhor horário para conversarmos sobre o que você procura?` },
    { label: 'Retomar conversa', text: `${greeting} Podemos retomar nossa conversa${lead.vehicleName ? ' sobre o ' + lead.vehicleName : ''}? Ficou alguma dúvida que eu possa ajudar a esclarecer?` },
    { label: 'Agendar visita', text: `${greeting} Que tal agendarmos uma visita à loja? Me diga o melhor dia e horário para confirmarmos a disponibilidade.` },
    { label: 'Pós-venda', text: `${greeting} Como está sua experiência com o veículo? Se precisar de ajuda, estou à disposição.` },
  ];

  return <section className="mt-5 space-y-4 rounded-xl border border-slate-700 p-4">
    <h3 className="font-semibold">Facilitar atendimento</h3>
    <div className="flex flex-wrap gap-2">
      {templates.map(template => <button key={template.label} type="button" onClick={() => setDraft(template.text)}
        className="rounded-lg bg-slate-800 px-3 py-2 text-sm">{template.label}</button>)}
    </div>
    <form onSubmit={async event => {
      event.preventDefault(); setLoading(true); setError(''); setSuggestions(null);
      try {
        const params = new URLSearchParams({ budget });
        if (transmission) params.set('transmission', transmission);
        setSuggestions(await request<Suggestion[]>(`/leads/${lead.id}/vehicle-suggestions?${params}`));
      } catch (err) { setError(err instanceof Error ? err.message : 'Não foi possível consultar o estoque.'); }
      finally { setLoading(false); }
    }} className="space-y-3">
      <p className="text-sm text-slate-400">Encontre até três opções à venda, com preço anunciado dentro do orçamento.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm">Orçamento máximo
          <input type="number" disabled={loading} required min="0.01" step="0.01" value={budget} onChange={e => { setBudget(e.target.value); setSuggestions(null); }}
            className="mt-1 w-full rounded-lg bg-slate-950 p-3" />
        </label>
        <label className="text-sm">Câmbio
          <select disabled={loading} value={transmission} onChange={e => { setTransmission(e.target.value); setSuggestions(null); }} className="mt-1 w-full rounded-lg bg-slate-950 p-3">
            <option value="">Qualquer</option>
            <option value={TransmissionType.Manual}>Manual</option>
            <option value={TransmissionType.Automatico}>Automático</option>
            <option value={TransmissionType.CVT}>CVT</option>
          </select>
        </label>
      </div>
      <button disabled={loading} className="rounded-lg bg-blue-600 px-4 py-2 disabled:opacity-50">{loading ? 'Consultando…' : 'Sugerir veículos'}</button>
    </form>
    {error && <p role="alert" className="text-sm text-rose-300">{error}</p>}
    {suggestions?.length === 0 && <p role="status" className="text-sm text-slate-400">Nenhum veículo disponível atende aos filtros. Ajuste o orçamento ou o câmbio.</p>}
    {suggestions?.map(vehicle => {
      const price = vehicle.listedValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
      return <article key={vehicle.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-slate-950 p-3 text-sm">
        <div><p className="font-semibold">{vehicle.brand} {vehicle.model} · {vehicle.modelYear}</p><p>{price}</p></div>
        <button type="button" className="rounded-lg border border-slate-700 px-3 py-2" onClick={() => setDraft(
          `${greeting} Encontrei uma opção dentro do seu orçamento: ${vehicle.brand} ${vehicle.model}, ano ${vehicle.modelYear}, por ${price}. Quer conhecer os detalhes? Disponibilidade e condições sujeitas à confirmação da loja.`
        )}>Preparar mensagem</button>
      </article>;
    })}
    {draft && <div className="space-y-2">
      <label className="block text-sm">Revise a mensagem
        <textarea rows={5} maxLength={3000} value={draft} onChange={e => setDraft(e.target.value)} className="mt-1 w-full rounded-lg bg-slate-950 p-3" />
      </label>
      <a href={`https://wa.me/${phone}?text=${encodeURIComponent(draft)}`} target="_blank" rel="noreferrer"
        className="inline-block rounded-lg bg-emerald-700 px-4 py-3 text-sm">Abrir no WhatsApp</a>
    </div>}
  </section>;
}
