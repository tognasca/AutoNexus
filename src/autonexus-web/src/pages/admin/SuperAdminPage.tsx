import React, { useEffect, useState } from 'react';
import {
  superAdminService,
  Tenant,
  SuperAdminUser,
} from '../../services/superAdminService';
import type { Plan } from '../../services/subscriptionService';
import { formatDateTime } from '../../utils/formatters';
import { MainLayout } from '../../components/layout/MainLayout';
import {
  ShieldCheck, Building2, Users, CreditCard, Plus, X, Save,
  CheckCircle2, XCircle, RefreshCw, Power,
} from 'lucide-react';

interface SuperAdminPageProps {
  currentView?: string;
  onNavigate?: (view: string) => void;
}

type Tab = 'tenants' | 'plans' | 'users';

const emptyTenantForm = {
  tenantName: '',
  tenantSlug: '',
  adminName: '',
  adminEmail: '',
  adminPassword: '',
};

const emptyPlanForm = {
  name: '',
  price: 0,
  maxUsers: '' as number | '',
  maxVehicles: '' as number | '',
  maxStorageMb: '' as number | '',
};

export function SuperAdminPage({ currentView, onNavigate }: SuperAdminPageProps) {
  const [tab, setTab] = useState<Tab>('tenants');

  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [users, setUsers] = useState<SuperAdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  const [isTenantModalOpen, setIsTenantModalOpen] = useState(false);
  const [tenantForm, setTenantForm] = useState(emptyTenantForm);
  const [savingTenant, setSavingTenant] = useState(false);

  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [planForm, setPlanForm] = useState(emptyPlanForm);
  const [savingPlan, setSavingPlan] = useState(false);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [tenantsData, plansData, usersData] = await Promise.all([
        superAdminService.getTenants(),
        superAdminService.getPlans(),
        superAdminService.getUsers(),
      ]);
      setTenants(tenantsData);
      setPlans(plansData);
      setUsers(usersData);
    } catch (err) {
      console.error('Erro ao carregar painel SuperAdmin:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingTenant(true);
    try {
      await superAdminService.createTenant(tenantForm);
      setIsTenantModalOpen(false);
      setTenantForm(emptyTenantForm);
      await loadAll();
    } catch (err: any) {
      alert(err.message || 'Erro ao criar empresa.');
    } finally {
      setSavingTenant(false);
    }
  };

  const handleToggleTenant = async (tenant: Tenant) => {
    const action = tenant.isActive ? 'desativar' : 'ativar';
    if (!confirm(`Tem certeza que deseja ${action} a empresa "${tenant.name}"?`)) return;

    try {
      if (tenant.isActive) {
        await superAdminService.deactivateTenant(tenant.id);
      } else {
        await superAdminService.activateTenant(tenant.id);
      }
      await loadAll();
    } catch (err: any) {
      alert(err.message || `Erro ao ${action} empresa.`);
    }
  };

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPlan(true);
    try {
      await superAdminService.createPlan({
        name: planForm.name,
        price: Number(planForm.price),
        maxUsers: planForm.maxUsers === '' ? null : Number(planForm.maxUsers),
        maxVehicles: planForm.maxVehicles === '' ? null : Number(planForm.maxVehicles),
        maxStorageMb: planForm.maxStorageMb === '' ? null : Number(planForm.maxStorageMb),
      });
      setIsPlanModalOpen(false);
      setPlanForm(emptyPlanForm);
      await loadAll();
    } catch (err: any) {
      alert(err.message || 'Erro ao criar plano.');
    } finally {
      setSavingPlan(false);
    }
  };

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'tenants', label: 'Empresas', icon: <Building2 className="w-4 h-4" /> },
    { key: 'plans', label: 'Planos', icon: <CreditCard className="w-4 h-4" /> },
    { key: 'users', label: 'Usuários', icon: <Users className="w-4 h-4" /> },
  ];

  return (
    <MainLayout currentView={currentView} onNavigate={onNavigate}>
      <div className="space-y-6 p-4 sm:p-6 w-full">

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-nexus-border pb-4">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-amber-400" />
              Painel do SuperAdmin
            </h1>
            <p className="text-xs text-nexus-text-muted mt-1">
              Gestão global do SaaS — empresas, planos e usuários de todos os tenants.
            </p>
          </div>
          <button
            onClick={loadAll}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="flex gap-2 border-b border-nexus-border">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
                tab === t.key ? 'border-amber-400 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        {/* --- ABA EMPRESAS --- */}
        {tab === 'tenants' && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button
                onClick={() => setIsTenantModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Nova Empresa
              </button>
            </div>

            <div className="bg-nexus-card border border-nexus-border rounded-xl overflow-hidden">
              {loading ? (
                <div className="p-8 text-center text-slate-400">Carregando...</div>
              ) : tenants.length === 0 ? (
                <div className="p-8 text-center text-slate-400">Nenhuma empresa cadastrada.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-nexus-border bg-slate-950/60 text-slate-400 uppercase tracking-wider">
                        <th className="py-3 px-4">Empresa</th>
                        <th className="py-3 px-4">Slug</th>
                        <th className="py-3 px-4">Criada em</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-nexus-border text-slate-200">
                      {tenants.map(t => (
                        <tr key={t.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-4 font-bold text-white">{t.name}</td>
                          <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">{t.slug}</td>
                          <td className="py-3 px-4 text-slate-400">{formatDateTime(t.createdAt)}</td>
                          <td className="py-3 px-4">
                            {t.isActive ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                <CheckCircle2 className="w-3 h-3" /> Ativa
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/15 text-red-400 border border-red-500/30">
                                <XCircle className="w-3 h-3" /> Desativada
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <button
                              onClick={() => handleToggleTenant(t)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[11px] font-medium cursor-pointer"
                            >
                              <Power className="w-3 h-3" />
                              {t.isActive ? 'Desativar' : 'Ativar'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- ABA PLANOS --- */}
        {tab === 'plans' && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button
                onClick={() => setIsPlanModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Novo Plano
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {plans.map(plan => (
                <div key={plan.id} className="bg-nexus-card border border-nexus-border rounded-xl p-4 text-xs">
                  <p className="text-sm font-bold text-white">{plan.name}</p>
                  <p className="text-lg font-bold text-blue-400 mt-1">
                    {plan.price === 0 ? 'Grátis' : `R$ ${plan.price.toFixed(2)}/mês`}
                  </p>
                  <ul className="mt-3 space-y-1 text-slate-400">
                    <li>{plan.maxUsers ? `Até ${plan.maxUsers} usuários` : 'Usuários ilimitados'}</li>
                    <li>{plan.maxVehicles ? `Até ${plan.maxVehicles} veículos` : 'Veículos ilimitados'}</li>
                    <li>{plan.maxStorageMb ? `${(plan.maxStorageMb / 1000).toFixed(1)} GB` : 'Armazenamento ilimitado'}</li>
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- ABA USUÁRIOS --- */}
        {tab === 'users' && (
          <div className="bg-nexus-card border border-nexus-border rounded-xl overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-slate-400">Carregando...</div>
            ) : users.length === 0 ? (
              <div className="p-8 text-center text-slate-400">Nenhum usuário cadastrado.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-nexus-border bg-slate-950/60 text-slate-400 uppercase tracking-wider">
                      <th className="py-3 px-4">Usuário</th>
                      <th className="py-3 px-4">E-mail</th>
                      <th className="py-3 px-4">Perfil</th>
                      <th className="py-3 px-4">Empresa (TenantId)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-nexus-border text-slate-200">
                    {users.map(u => (
                      <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4 font-bold text-white">{u.name}</td>
                        <td className="py-3 px-4 text-slate-300 font-mono text-[11px]">{u.email}</td>
                        <td className="py-3 px-4 text-slate-300">{u.profileName}</td>
                        <td className="py-3 px-4 text-slate-500 font-mono text-[10px]">
                          {tenants.find(t => t.id === u.tenantId)?.name ?? u.tenantId}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal: Nova Empresa */}
      {isTenantModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md text-slate-100 shadow-2xl p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-400" /> Nova Empresa
              </h3>
              <button onClick={() => setIsTenantModalOpen(false)} className="p-1 hover:bg-slate-800 rounded text-slate-400 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTenant} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Nome da Empresa *</label>
                <input
                  type="text"
                  value={tenantForm.tenantName}
                  onChange={e => setTenantForm({ ...tenantForm, tenantName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Slug (identificador único) *</label>
                <input
                  type="text"
                  placeholder="ex: minha-loja"
                  value={tenantForm.tenantSlug}
                  onChange={e => setTenantForm({ ...tenantForm, tenantSlug: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-blue-500 font-mono"
                  required
                />
              </div>
              <div className="pt-2 border-t border-slate-800">
                <p className="text-slate-400 mb-2">Administrador inicial dessa empresa</p>
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Nome do administrador"
                    value={tenantForm.adminName}
                    onChange={e => setTenantForm({ ...tenantForm, adminName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                    required
                  />
                  <input
                    type="email"
                    placeholder="E-mail do administrador"
                    value={tenantForm.adminEmail}
                    onChange={e => setTenantForm({ ...tenantForm, adminEmail: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                    required
                  />
                  <input
                    type="password"
                    placeholder="Senha inicial"
                    value={tenantForm.adminPassword}
                    onChange={e => setTenantForm({ ...tenantForm, adminPassword: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-blue-500 font-mono"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button type="button" onClick={() => setIsTenantModalOpen(false)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl cursor-pointer">
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingTenant}
                  className="inline-flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl disabled:opacity-50 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  {savingTenant ? 'Criando...' : 'Criar Empresa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Novo Plano */}
      {isPlanModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md text-slate-100 shadow-2xl p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-blue-400" /> Novo Plano
              </h3>
              <button onClick={() => setIsPlanModalOpen(false)} className="p-1 hover:bg-slate-800 rounded text-slate-400 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePlan} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Nome do Plano *</label>
                <input
                  type="text"
                  value={planForm.name}
                  onChange={e => setPlanForm({ ...planForm, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Preço mensal (R$) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={planForm.price}
                  onChange={e => setPlanForm({ ...planForm, price: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                  required
                />
              </div>
              <p className="text-slate-500">Limites (deixe em branco para ilimitado)</p>
              <div className="grid grid-cols-3 gap-3">
                <input
                  type="number"
                  placeholder="Usuários"
                  value={planForm.maxUsers}
                  onChange={e => setPlanForm({ ...planForm, maxUsers: e.target.value === '' ? '' : Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                />
                <input
                  type="number"
                  placeholder="Veículos"
                  value={planForm.maxVehicles}
                  onChange={e => setPlanForm({ ...planForm, maxVehicles: e.target.value === '' ? '' : Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                />
                <input
                  type="number"
                  placeholder="MB armazenamento"
                  value={planForm.maxStorageMb}
                  onChange={e => setPlanForm({ ...planForm, maxStorageMb: e.target.value === '' ? '' : Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button type="button" onClick={() => setIsPlanModalOpen(false)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl cursor-pointer">
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingPlan}
                  className="inline-flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl disabled:opacity-50 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  {savingPlan ? 'Criando...' : 'Criar Plano'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
