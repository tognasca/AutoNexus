import React, { useEffect, useState } from 'react';
import { tenantSettingsService, TenantSettings } from '../../services/tenantSettingsService';
import { MainLayout } from '../../components/layout/MainLayout';
import { Building2, Save, RefreshCw, CheckCircle2 } from 'lucide-react';

interface TenantSettingsPageProps {
  currentView?: string;
  onNavigate?: (view: string) => void;
}

const emptySettings: TenantSettings = {
  companyName: '',
  logoUrl: '',
  primaryColor: '#15171B',
  timeZone: 'America/Sao_Paulo',
  currency: 'BRL',
};

export function TenantSettingsPage({ currentView, onNavigate }: TenantSettingsPageProps) {
  const [form, setForm] = useState<TenantSettings>(emptySettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await tenantSettingsService.get();
      setForm(data);
    } catch (err) {
      console.error('Erro ao carregar configurações da empresa:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      const updated = await tenantSettingsService.update(form);
      setForm(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar configurações.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <MainLayout currentView={currentView} onNavigate={onNavigate}>
      <div className="space-y-6 p-4 sm:p-6 w-full max-w-2xl">

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-nexus-border pb-4">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Building2 className="w-6 h-6 text-blue-400" />
              Minha Empresa
            </h1>
            <p className="text-xs text-nexus-text-muted mt-1">
              Configurações próprias da sua empresa — nunca compartilhadas com outras empresas do sistema.
            </p>
          </div>
          <button
            onClick={load}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="bg-nexus-card border border-nexus-border rounded-xl p-6">
          {loading ? (
            <div className="text-center text-slate-400 py-8">Carregando...</div>
          ) : (
            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Nome da Empresa *</label>
                <input
                  type="text"
                  value={form.companyName}
                  onChange={e => setForm({ ...form, companyName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">URL do Logo (opcional)</label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={form.logoUrl ?? ''}
                  onChange={e => setForm({ ...form, logoUrl: e.target.value || null })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-400 block mb-1">Cor Primária</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={form.primaryColor}
                      onChange={e => setForm({ ...form, primaryColor: e.target.value })}
                      className="h-9 w-9 rounded-lg border border-slate-800 bg-slate-950 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={form.primaryColor}
                      onChange={e => setForm({ ...form, primaryColor: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-blue-500 font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Moeda</label>
                  <select
                    value={form.currency}
                    onChange={e => setForm({ ...form, currency: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                  >
                    <option value="BRL">Real (BRL)</option>
                    <option value="USD">Dólar (USD)</option>
                    <option value="EUR">Euro (EUR)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Fuso Horário</label>
                <select
                  value={form.timeZone}
                  onChange={e => setForm({ ...form, timeZone: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                >
                  <option value="America/Sao_Paulo">Brasília (America/Sao_Paulo)</option>
                  <option value="America/Manaus">Manaus (America/Manaus)</option>
                  <option value="America/Noronha">Fernando de Noronha</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                {saved && (
                  <span className="text-emerald-400 text-xs flex items-center gap-1 mr-auto">
                    <CheckCircle2 className="w-4 h-4" /> Salvo com sucesso
                  </span>
                )}
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl disabled:opacity-50 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Salvando...' : 'Salvar Configurações'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
