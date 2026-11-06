import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ShieldCheck, Lock, Mail, Loader2, AlertCircle } from 'lucide-react';

export function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Falha ao autenticar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-nexus-dark flex items-center justify-center p-4 relative overflow-hidden">
      {/* Luz ambiente de fundo */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="bg-nexus-card border border-nexus-border rounded-2xl w-full max-w-md p-8 relative shadow-2xl z-10">
        <div className="flex flex-col items-center mb-8 text-center">
          <img src="/novamarcha-logo.png?v=20261106" alt="Nova Marcha" className="w-64 max-w-full h-auto object-contain mb-2" />
          <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-semibold">Sistema de Gestão de Veículos</p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg text-sm flex items-center gap-2">
            <AlertCircle size={18} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">E-mail</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="username"
                className="w-full pl-10 pr-4 py-2.5 bg-nexus-dark border border-nexus-border rounded-lg text-sm text-white focus:outline-none focus:border-nexus-accent transition-colors"
                placeholder="seu.email@dominio.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Senha</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full pl-10 pr-4 py-2.5 bg-nexus-dark border border-nexus-border rounded-lg text-sm text-white focus:outline-none focus:border-nexus-accent transition-colors"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 py-3 bg-nexus-accent hover:bg-nexus-accent-hover text-white rounded-lg text-sm font-semibold shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                <span>Autenticando...</span>
              </>
            ) : (
              <>
                <ShieldCheck size={18} />
                <span>Entrar no Sistema</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-400 space-x-3">
          <a href="/cadastro" className="text-blue-400 hover:underline font-semibold">Criar conta (7 dias grátis)</a>
          <span>•</span>
          <a href="/precos" className="text-blue-400 hover:underline">Ver planos</a>
          <span>•</span>
          <a href="/esqueci-senha" className="text-blue-400 hover:underline">Esqueci minha senha</a>
        </div>

        <div className="mt-8 pt-6 border-t border-nexus-border/60 text-center">
          <p className="text-xs italic leading-relaxed text-slate-400">
            “Posso todas as coisas naquele que me fortalece.”
          </p>
          <p className="mt-1 text-[11px] font-semibold text-blue-400">Filipenses 4:13</p>
          <p className="mt-5 text-[11px] text-slate-500">
            Acesso restrito a usuários autorizados • Nova Marcha Hub v1.0
          </p>
        </div>
      </div>
    </div>
  );
}
