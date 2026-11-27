import { useEffect, useState } from 'react';
import { request } from '../../services/api';

export interface OpenAiSettings {
  configured: boolean;
  enabled: boolean;
  model: string;
  monthlyLimit: number;
  used: number;
  month: string;
}

export function OpenAiIntegration() {
  const [settings, setSettings] = useState<OpenAiSettings | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [removeKey, setRemoveKey] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const refresh = () => request<OpenAiSettings>('/ai/settings').then(setSettings);

  useEffect(() => {
    void refresh().catch(() => setError('Não foi possível carregar a configuração de IA.'));
  }, []);

  return <section className="space-y-3 rounded-xl border border-nexus-border bg-nexus-card p-5 text-white">
    <h2 className="font-semibold">OpenAI</h2>
    {settings && <p className="text-sm text-slate-400">
      {settings.enabled && settings.configured ? 'Habilitada' : 'Desabilitada'} · {settings.used}/{settings.monthlyLimit} tentativas em {settings.month} (UTC).
    </p>}
    {message && <p role="status" className="text-sm text-emerald-300">{message}</p>}
    {error && <p role="alert" className="text-sm text-rose-300">{error}</p>}
    {settings && <details>
      <summary className="cursor-pointer text-sm">Configurar IA da empresa</summary>
      <form className="mt-3 space-y-3" onSubmit={async event => {
        event.preventDefault(); setBusy(true); setError(''); setMessage('');
        try {
          await request('/ai/settings', { method: 'PUT', body: JSON.stringify({
            apiKey, removeKey, model: settings.model, enabled: settings.enabled, monthlyLimit: settings.monthlyLimit,
          }) });
          setApiKey(''); setRemoveKey(false); await refresh(); setMessage('Configuração salva.');
        } catch (err) { setError(err instanceof Error ? err.message : 'Falha ao salvar configuração.'); }
        finally { setBusy(false); }
      }}>
        <fieldset disabled={busy} className="space-y-3">
          <label className="block text-sm">Chave de API OpenAI {settings.configured ? '(cadastrada)' : ''}
            <input type="password" autoComplete="new-password" maxLength={1000} value={apiKey} onChange={e => setApiKey(e.target.value)}
              placeholder="Deixe vazio para manter a chave atual" className="mt-1 w-full rounded-lg bg-slate-950 p-3" />
          </label>
          <label className="block text-sm">Modelo
            <input required maxLength={100} value={settings.model} onChange={e => setSettings({ ...settings, model: e.target.value })}
              className="mt-1 w-full rounded-lg bg-slate-950 p-3" />
          </label>
          <label className="block text-sm">Limite mensal de tentativas
            <input type="number" required min={0} max={100000} value={settings.monthlyLimit}
              onChange={e => setSettings({ ...settings, monthlyLimit: Number(e.target.value) })}
              className="mt-1 w-full rounded-lg bg-slate-950 p-3" />
          </label>
          <label className="flex gap-2 text-sm"><input type="checkbox" checked={settings.enabled}
            onChange={e => setSettings({ ...settings, enabled: e.target.checked })} />Habilitar IA</label>
          <label className="flex gap-2 text-sm"><input type="checkbox" checked={removeKey}
            onChange={e => setRemoveKey(e.target.checked)} />Remover chave cadastrada</label>
          <button className="rounded-lg bg-violet-700 px-4 py-2">Salvar configuração</button>
        </fieldset>
      </form>
    </details>}
  </section>;
}
