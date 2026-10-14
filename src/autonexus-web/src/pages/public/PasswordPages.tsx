import { useState } from 'react';
import { passwordService } from '../../services/passwordService';

const input = 'w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500';
const btn = 'w-full px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl disabled:opacity-50 cursor-pointer';

function Shell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-nexus-dark text-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-nexus-card border border-nexus-border rounded-2xl p-6 sm:p-8">
        <h1 className="text-xl font-bold text-white mb-4">{title}</h1>
        {children}
        <a href="/" className="block mt-5 text-center text-xs text-slate-400 hover:text-white">← Voltar ao login</a>
      </div>
    </div>
  );
}

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(null);
    try { await passwordService.forgot(email); setDone(true); }
    catch (err: any) { setError(err.message || 'Não foi possível enviar agora. Tente novamente.'); }
    finally { setLoading(false); }
  };

  return (
    <Shell title="Esqueci minha senha">
      {done ? (
        <p className="text-sm text-slate-300">Se o e-mail estiver cadastrado, enviamos as instruções para redefinir a senha. O link vale por 1 hora.</p>
      ) : (
        <form onSubmit={submit} className="space-y-4 text-xs">
          <p className="text-slate-400">Informe o e-mail da sua conta e enviaremos um link para criar uma nova senha.</p>
          <input className={input} type="email" required placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} />
          {error && <p className="text-red-400">{error}</p>}
          <button className={btn} disabled={loading}>{loading ? 'Enviando...' : 'Enviar link'}</button>
        </form>
      )}
    </Shell>
  );
}

export function ResetPasswordPage() {
  const token = new URLSearchParams(window.location.search).get('token') ?? '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { setError('As senhas não conferem.'); return; }
    setLoading(true); setError(null);
    try { await passwordService.reset(token, password); setDone(true); }
    catch (err: any) { setError(err.message || 'Não foi possível redefinir a senha.'); }
    finally { setLoading(false); }
  };

  return (
    <Shell title="Criar nova senha">
      {done ? (
        <p className="text-sm text-emerald-400">Senha alterada com sucesso. Já pode entrar com a nova senha.</p>
      ) : (
        <form onSubmit={submit} className="space-y-4 text-xs">
          <input className={input} type="password" minLength={8} required placeholder="Nova senha (mínimo 8 caracteres)" value={password} onChange={e => setPassword(e.target.value)} />
          <input className={input} type="password" minLength={8} required placeholder="Repita a nova senha" value={confirm} onChange={e => setConfirm(e.target.value)} />
          {error && <p className="text-red-400">{error}</p>}
          <button className={btn} disabled={loading || !token}>{loading ? 'Salvando...' : 'Salvar nova senha'}</button>
        </form>
      )}
    </Shell>
  );
}
