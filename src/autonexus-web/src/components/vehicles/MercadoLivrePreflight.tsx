import { useState } from 'react';
import { buildMercadoLivreDealerContact } from '../../utils/mercadoLivreDealerContact';

export function MercadoLivrePreflight() {
  const [phone, setPhone] = useState('');
  const [result, setResult] = useState<{ ok: boolean; message: string }>();
  return <details className="rounded-xl border border-slate-700 p-4">
    <summary className="cursor-pointer font-semibold">Preparar anúncio no Mercado Livre</summary>
    <form className="mt-3 space-y-2" onSubmit={event => {
      event.preventDefault();
      try {
        buildMercadoLivreDealerContact(phone);
        setResult({ ok: true, message: 'Segundo telefone válido para o perfil concessionária.' });
      } catch (error) {
        setResult({ ok: false, message: (error as Error).message });
      }
    }}>
      <p className="text-sm text-slate-400">Confira o segundo telefone com DDD antes de publicar como concessionária. Validação local, sem envio ao portal.</p>
      <label className="block text-sm">Segundo telefone
        <input type="tel" required maxLength={24} autoComplete="off" value={phone}
          className="mt-1 w-full rounded bg-slate-950 p-2" onChange={event => {
            setPhone(event.target.value); setResult(undefined);
          }} />
      </label>
      <button className="rounded bg-blue-600 px-3 py-2 text-sm">Validar telefone</button>
      {result && <p role={result.ok ? 'status' : 'alert'} className={result.ok ? 'text-emerald-300' : 'text-amber-300'}>{result.message}</p>}
    </form>
  </details>;
}
