import { useState, type FormEvent } from 'react';
import { MessageCircle } from 'lucide-react';

export function CommercialDemoContact() {
  const [intent, setIntent] = useState(() => {
    const requested = new URLSearchParams(window.location.search).get('interesse');
    if (requested === 'implantacao') return 'Implantação assistida';
    if (requested === 'piloto') return 'Loja piloto';
    return 'Demonstração';
  });
  const [prepared, setPrepared] = useState('');
  const configuredNumber = String(import.meta.env.VITE_PUBLIC_WHATSAPP_NUMBER ?? '').replace(/\D/g, '');
  const whatsapp = /^[1-9]\d{7,14}$/.test(configuredNumber) ? configuredNumber : '';

  function prepare(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const store = String(data.get('store') ?? '').trim();
    const window = String(data.get('window') ?? '').trim();
    if (!store) return;
    setPrepared(`Olá! Gostaria de conversar sobre ${intent.toLowerCase()} do AT Motors. Minha loja é ${store}.${window ? ` Melhor horário: ${window}.` : ''}`);
  }

  return <section id="agendar" className="mx-auto max-w-6xl scroll-mt-6 px-4 pb-16">
    <div className="grid gap-7 rounded-3xl border border-slate-700 bg-nexus-card p-6 sm:p-9 md:grid-cols-2">
      <div>
        <h2 className="text-2xl font-bold text-white">Agende uma demonstração</h2>
        <p className="mt-3 text-slate-300">Mostramos como o atendimento, o estoque e o pós-venda funcionariam na rotina da sua loja. Você pode pedir ajuda para começar com sua planilha.</p>
        {!whatsapp && <p className="mt-4 text-sm text-slate-400">O contato comercial está indisponível neste momento. Você pode testar o fluxo de exemplo agora.</p>}
        <a href="/demo" className="mt-4 inline-block font-semibold text-cyan-300 underline">Testar com dados de exemplo</a>
      </div>
      {whatsapp && <form onSubmit={prepare} onChange={() => setPrepared('')} className="grid gap-3 text-sm">
        <label>Nome da loja<input name="store" required maxLength={100} autoComplete="organization"
          className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-950 p-3 text-white" /></label>
        <label>Tenho interesse em<select value={intent} onChange={event => setIntent(event.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-950 p-3 text-white">
          <option>Demonstração</option><option>Implantação assistida</option><option>Loja piloto</option>
        </select></label>
        <label>Melhor dia e horário <span className="text-slate-400">(opcional)</span>
          <input name="window" maxLength={100} className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-950 p-3 text-white" />
        </label>
        <button className="rounded-lg bg-cyan-400 px-4 py-3 font-bold text-slate-950">Preparar mensagem</button>
        {prepared && <div className="space-y-3 rounded-lg border border-slate-600 p-3">
          <p role="status">{prepared}</p>
          <a href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(prepared)}`} target="_blank" rel="noreferrer"
            className="inline-flex items-center gap-2 font-bold text-emerald-300"><MessageCircle size={18} /> Abrir WhatsApp para enviar</a>
        </div>}
      </form>}
    </div>
  </section>;
}
