import React, { useEffect, useState } from 'react';
import { bankConfigService, BankConfig, CreateBankConfig, UpdateBankConfig } from '../../services/bankConfigService';
import { MainLayout } from '../../components/layout/MainLayout';
import { Building2, Plus, Edit2, CheckCircle2, XCircle, ShieldAlert, Key, RefreshCw, X, Save } from 'lucide-react';

interface BankConfigPageProps {
  currentView?: string;
  onNavigate?: (view: string) => void;
}

export function BankConfigPage({ currentView, onNavigate }: BankConfigPageProps) {
  const [configs, setConfigs] = useState<BankConfig[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal de edição / criação
  const [selectedConfig, setSelectedConfig] = useState<BankConfig | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Formulário Modal
  const [bankCode, setBankCode] = useState('');
  const [name, setName] = useState('');
  const [rate, setRate] = useState<number>(1.5);
  const [apiUrl, setApiUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [merchantId, setMerchantId] = useState('');
  const [isSandbox, setIsSandbox] = useState(true);
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadConfigs = async () => {
    setLoading(true);
    try {
      const data = await bankConfigService.getAll();
      setConfigs(data);
    } catch (err) {
      console.error('Erro ao carregar configurações bancárias:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfigs();
  }, []);

  const handleOpenCreateModal = () => {
    setSelectedConfig(null);
    setBankCode('');
    setName('');
    setRate(1.50);
    setApiUrl('https://api.financeira.com.br/v1');
    setApiKey('');
    setApiSecret('');
    setMerchantId('');
    setIsSandbox(true);
    setIsActive(true);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (config: BankConfig) => {
    setSelectedConfig(config);
    setBankCode(config.bankCode);
    setName(config.name);
    setRate(config.defaultMonthlyRate);
    setApiUrl(config.apiUrl);
    setApiKey(config.apiKey);
    setApiSecret(config.apiSecret || '');
    setMerchantId(config.merchantId || '');
    setIsSandbox(config.isSandbox);
    setIsActive(config.isActive);
    setIsModalOpen(true);
  };

  const handleToggleActive = async (id: string) => {
    try {
      await bankConfigService.toggleActive(id);
      await loadConfigs();
    } catch (err) {
      alert('Erro ao alterar status da financeira.');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !apiUrl) {
      alert('Preencha o Nome e a URL da API da financeira.');
      return;
    }

    setSaving(true);
    try {
      if (selectedConfig) {
        // Atualizar
        const updatePayload: UpdateBankConfig = {
          name,
          defaultMonthlyRate: Number(rate),
          apiUrl,
          apiKey,
          apiSecret,
          merchantId,
          isActive,
          isSandbox,
        };
        await bankConfigService.update(selectedConfig.id, updatePayload);
      } else {
        // Criar
        const createPayload: CreateBankConfig = {
          bankCode,
          name,
          defaultMonthlyRate: Number(rate),
          apiUrl,
          apiKey,
          apiSecret,
          merchantId,
          isSandbox,
        };
        await bankConfigService.create(createPayload);
      }

      setIsModalOpen(false);
      await loadConfigs();
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar configuração da financeira.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <MainLayout currentView={currentView} onNavigate={onNavigate}>
      <div className="space-y-6 p-4 sm:p-6 max-w-6xl mx-auto">
        
        {/* Cabeçalho */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-nexus-border pb-4">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Building2 className="w-6 h-6 text-amber-400" />
              Gestão de Financeiras e Taxas de Crédito
            </h1>
            <p className="text-xs text-nexus-text-muted mt-1">
              Configure chaves de API, taxas padrão e ambientes de homologação dos bancos parceiros.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadConfigs}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-colors cursor-pointer"
              title="Atualizar Lista"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={handleOpenCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs transition-colors shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Nova Financeira
            </button>
          </div>
        </div>

        {/* Tabela de Financeiras */}
        <div className="bg-nexus-card border border-nexus-border rounded-xl overflow-hidden shadow-sm">
          {loading ? (
            <div className="p-8 text-center text-slate-400">Carregando financeiras...</div>
          ) : configs.length === 0 ? (
            <div className="p-8 text-center text-slate-400">Nenhuma financeira cadastrada.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-nexus-border bg-slate-950/60 text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-4">Código / Banco</th>
                    <th className="py-3 px-4">Taxa Padrão (% a.m.)</th>
                    <th className="py-3 px-4">URL da API</th>
                    <th className="py-3 px-4">Ambiente</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-nexus-border text-slate-200">
                  {configs.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-bold text-white">
                        {c.name}
                        <span className="block text-[10px] text-slate-500 font-mono font-normal uppercase">
                          Code: {c.bankCode}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-amber-400 font-bold">
                        {c.defaultMonthlyRate.toFixed(2)}%
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-400 truncate max-w-[200px]" title={c.apiUrl}>
                        {c.apiUrl}
                      </td>
                      <td className="py-3 px-4">
                        {c.isSandbox ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            SANDBOX (Testes)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            PRODUÇÃO
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleToggleActive(c.id)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold transition-colors cursor-pointer ${
                            c.isActive ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {c.isActive ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          {c.isActive ? 'Ativo' : 'Inativo'}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleOpenEditModal(c)}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer"
                          title="Editar Credenciais / Taxa"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
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

      {/* Modal de Cadastro / Edição */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl text-slate-100 shadow-2xl overflow-hidden my-auto">
            
            <div className="px-6 py-4 bg-slate-800/50 border-b border-slate-700/50 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-amber-400" />
                <h3 className="font-semibold text-sm sm:text-base">
                  {selectedConfig ? `Editar ${selectedConfig.name}` : 'Cadastrar Nova Financeira'}
                </h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 text-xs">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Código Identificador (Slug) *</label>
                  <input
                    type="text"
                    placeholder="ex: santander, bv, itau"
                    value={bankCode}
                    onChange={e => setBankCode(e.target.value)}
                    disabled={!!selectedConfig}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white outline-none focus:border-amber-500 disabled:opacity-50"
                    required
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Nome de Exibição *</label>
                  <input
                    type="text"
                    placeholder="Ex: Santander Financiamentos"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white outline-none focus:border-amber-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Taxa de Juros Padrão (% a.m.) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={rate}
                    onChange={e => setRate(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white outline-none focus:border-amber-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Código Lojista (Merchant ID)</label>
                  <input
                    type="text"
                    placeholder="Ex: STORE_9988"
                    value={merchantId}
                    onChange={e => setMerchantId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Endpoint URL da API *</label>
                <input
                  type="text"
                  placeholder="https://api.financeira.com.br/v1"
                  value={apiUrl}
                  onChange={e => setApiUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white outline-none focus:border-amber-500 font-mono text-[11px]"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-slate-800 pt-3">
                <div>
                  <label className="text-slate-400 block mb-1 flex items-center gap-1">
                    <Key className="w-3 h-3 text-amber-400" /> API Key (Chave de Acesso)
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••••••••••"
                    value={apiKey}
                    onChange={e => setApiKey(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1 flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3 text-amber-400" /> API Secret
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••••••••••"
                    value={apiSecret}
                    onChange={e => setApiSecret(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-slate-800 pt-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isSandbox}
                    onChange={e => setIsSandbox(e.target.checked)}
                    className="w-4 h-4 rounded bg-slate-950 border-slate-800 text-amber-500 focus:ring-0"
                  />
                  <span className="text-slate-300">Modo Sandbox (Homologação / Testes)</span>
                </label>

                {selectedConfig && (
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={e => setIsActive(e.target.checked)}
                      className="w-4 h-4 rounded bg-slate-950 border-slate-800 text-emerald-500 focus:ring-0"
                    />
                    <span className="text-slate-300">Banco Ativo</span>
                  </label>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition-colors shadow-sm disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Salvando...' : 'Salvar Configuração'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </MainLayout>
  );
}