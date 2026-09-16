import React, { useEffect, useState } from 'react';
import { userService, UserItem } from '../../services/userService';
import { formatDateTime } from '../../utils/formatters';
import { MainLayout } from '../../components/layout/MainLayout';
import { Users, UserPlus, Shield, CheckCircle2, RefreshCw, X, Save, Key } from 'lucide-react';

interface UsersPageProps {
  currentView?: string;
  onNavigate?: (view: string) => void;
}

export function UsersPage({ currentView, onNavigate }: UsersPageProps) {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Formulário de Cadastro
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [profile, setProfile] = useState<number>(2); // Padrão: Vendedor
  const [saving, setSaving] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await userService.getAll();
      setUsers(data);
    } catch (err) {
      console.error('Erro ao carregar usuários:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleOpenCreateModal = () => {
    setName('');
    setEmail('');
    setPassword('');
    setProfile(2);
    setIsModalOpen(true);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      alert('Preencha o Nome, E-mail e Senha.');
      return;
    }

    setSaving(true);
    try {
      await userService.create({
        name,
        email,
        password,
        profile
      });

      setIsModalOpen(false);
      await loadUsers();
    } catch (err: any) {
      alert(err.message || 'Erro ao cadastrar usuário.');
    } finally {
      setSaving(false);
    }
  };

  const getProfileBadge = (profileNumber: number) => {
    switch (profileNumber) {
      case 1:
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">Administrador</span>;
      case 2:
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30">Vendedor</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400">Cliente</span>;
    }
  };

  return (
    <MainLayout currentView={currentView} onNavigate={onNavigate}>
      <div className="space-y-6 p-4 sm:p-6 w-full">
        
        {/* Cabeçalho */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-nexus-border pb-4">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Users className="w-6 h-6 text-blue-400" />
              Gestão de Usuários & Perfis de Acesso
            </h1>
            <p className="text-xs text-nexus-text-muted mt-1">
              Cadastre e gerencie administradores, vendedores e clientes da loja.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadUsers}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={handleOpenCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs transition-colors shadow-sm cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              Novo Usuário
            </button>
          </div>
        </div>

        {/* Tabela de Usuários */}
        <div className="bg-nexus-card border border-nexus-border rounded-xl overflow-hidden shadow-sm">
          {loading ? (
            <div className="p-8 text-center text-slate-400">Carregando usuários...</div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center text-slate-400">Nenhum usuário cadastrado.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-nexus-border bg-slate-950/60 text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-4">Usuário / Nome</th>
                    <th className="py-3 px-4">E-mail</th>
                    <th className="py-3 px-4">Perfil de Acesso</th>
                    <th className="py-3 px-4">Data Cadastro</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-nexus-border text-slate-200">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-bold text-white flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold text-xs">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        {u.name}
                      </td>
                      <td className="py-3 px-4 text-slate-300 font-mono text-[11px]">{u.email}</td>
                      <td className="py-3 px-4">{getProfileBadge(u.profile)}</td>
                      <td className="py-3 px-4 text-slate-400">{formatDateTime(u.createdAt)}</td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          <CheckCircle2 className="w-3 h-3" /> Ativo
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

      {/* Modal de Cadastro de Usuário */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md text-slate-100 shadow-2xl p-6 space-y-4">
            
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-400" /> Cadastrar Novo Usuário
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-slate-800 rounded text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Nome Completo *</label>
                <input
                  type="text"
                  placeholder="Ex: Carlos Silva"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">E-mail de Acesso *</label>
                <input
                  type="email"
                  placeholder="carlos@autonexus.com.br"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1 flex items-center gap-1">
                  <Key className="w-3.5 h-3.5 text-amber-400" /> Senha Inicial *
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-blue-500 font-mono"
                  required
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1 flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5 text-blue-400" /> Perfil de Permissão *
                </label>
                <select
                  value={profile}
                  onChange={e => setProfile(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                >
                  <option value={1}>Administrador (Acesso Total)</option>
                  <option value={2}>Vendedor (Acesso Operacional e Vendas)</option>
                  <option value={3}>Cliente (Acesso Restrito ao Portal)</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Cadastrando...' : 'Cadastrar Usuário'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}
    </MainLayout>
  );
}