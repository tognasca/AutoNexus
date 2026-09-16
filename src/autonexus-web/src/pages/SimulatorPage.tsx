import { useState, useEffect } from 'react';
import { request } from '../services/api';
import { formatCurrency } from '../utils/formatters';
import { CurrencyInput } from '../components/ui/CurrencyInput';
import { Calculator, Car, Building, DollarSign, Send, MessageCircle } from 'lucide-react';
import { MainLayout } from '../components/layout/MainLayout';
import { CreditAnalysisModal } from '../components/simulator/CreditAnalysisModal';

interface VehicleOption {
  id: string;
  brand: string;
  model: string;
  modelYear: number;
  listedValue: number;
  purchaseValue: number;
  plate: string;
}

const DEFAULT_BANKS = [
  { id: 'santander', name: 'Santander Financiamentos', defaultRate: 1.49 },
  { id: 'itau', name: 'Itaú Veículos', defaultRate: 1.55 },
  { id: 'bradesco', name: 'Bradesco Financiamentos', defaultRate: 1.62 },
  { id: 'bv', name: 'Banco BV', defaultRate: 1.79 },
  { id: 'safra', name: 'Banco Safra', defaultRate: 1.85 },
  { id: 'custom', name: 'Taxa Personalizada', defaultRate: 2.00 },
];

export function SimulatorPage({ currentView, onNavigate }: { currentView?: string; onNavigate?: (view: string) => void }) {
  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados do Formulário
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [vehiclePrice, setVehiclePrice] = useState<number>(0);
  const [entryValue, setEntryValue] = useState<number>(0);
  const [tradeValue, setTradeValue] = useState<number>(0);

  const [selectedBank, setSelectedBank] = useState(DEFAULT_BANKS[0].id);
  const [interestRate, setInterestRate] = useState<number>(DEFAULT_BANKS[0].defaultRate);

  const [showCreditModal, setShowCreditModal] = useState(false);
  const [selectedPlanForCredit, setSelectedPlanForCredit] = useState<{ months: number; value: number } | null>(null);

  const handleShareWhatsApp = () => {
    const vehicle = vehicles.find(v => v.id === selectedVehicleId);
    const vehicleName = vehicle ? `${vehicle.brand} ${vehicle.model}` : 'Veículo';

    const text = `Olá! Segue a simulação de financiamento do *${vehicleName}* no AutoNexus:%0A%0A` +
      `🚗 *Valor do Veículo:* ${formatCurrency(vehiclePrice)}%0A` +
      `💵 *Entrada/Troca:* ${formatCurrency(entryValue + tradeValue)}%0A` +
      `🏦 *Saldo a Financiar:* ${formatCurrency(financedAmount)}%0A` +
      `🏛️ *Financeira:* ${DEFAULT_BANKS.find(b => b.id === selectedBank)?.name}%0A%0A` +
      `📋 *Opções de Parcelamento:*%0A` +
      plans.map(p => `• ${p.months}x de ${formatCurrency(p.value)}`).join('%0A') +
      `%0A%0A_Simulação sujeita a análise de crédito._`;

    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleOpenCreditAnalysis = (plan: { months: number; value: number }) => {
    setSelectedPlanForCredit(plan);
    setShowCreditModal(true);
  };

  // Busca o estoque disponível
  useEffect(() => {
    const fetchStock = async () => {
      try {
        const response = await request<any>('/vehicles?status=1&pageSize=100');
        const stock = response.items || [];
        setVehicles(stock);
      } catch (err) {
        console.error("Erro ao carregar estoque para simulação", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStock();
  }, []);

  // Atualiza o preço automaticamente ao trocar de carro
  useEffect(() => {
    const vehicle = vehicles.find(v => v.id === selectedVehicleId);
    if (vehicle) {
      setVehiclePrice(vehicle.listedValue || vehicle.purchaseValue);
    } else {
      setVehiclePrice(0);
    }
  }, [selectedVehicleId, vehicles]);

  // Atualiza a taxa automaticamente ao trocar de banco
  useEffect(() => {
    const bank = DEFAULT_BANKS.find(b => b.id === selectedBank);
    if (bank) setInterestRate(bank.defaultRate);
  }, [selectedBank]);

  // Cálculo Tabela Price (PMT)
  const calculateInstallments = (financedAmount: number, months: number, rate: number) => {
    if (financedAmount <= 0) return 0;
    const i = rate / 100;
    if (i === 0) return financedAmount / months;
    const factor = Math.pow(1 + i, months);
    return financedAmount * ((i * factor) / (factor - 1));
  };

  const financedAmount = Math.max(0, vehiclePrice - entryValue - tradeValue);

  const plans = [12, 24, 36, 48, 60].map(months => ({
    months,
    value: calculateInstallments(financedAmount, months, interestRate)
  }));

  if (loading) {
    return <div className="p-8 text-center text-slate-400">Carregando estoque para simulação...</div>;
  }

  const currentVehicle = vehicles.find(v => v.id === selectedVehicleId);

  return (
    <MainLayout currentView={currentView} onNavigate={onNavigate}>
      {/* Container Full Width */}
      <div className="space-y-6 p-4 sm:p-6 w-full">

        {/* Cabeçalho do Simulador */}
        <div className="flex items-center gap-3 border-b border-nexus-border pb-4 w-full">
          <div className="p-3 bg-blue-600/20 text-blue-400 rounded-xl shrink-0">
            <Calculator className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">Simulador de Financiamento</h1>
            <p className="text-xs md:text-sm text-slate-400">Calcule parcelas com taxas em tempo real para o cliente.</p>
          </div>
        </div>
        

        {/* Grid do Conteúdo (100% da largura) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">

          {/* Painel de Configuração (Esquerda - 7 colunas) */}
          <div className="lg:col-span-7 space-y-4">

            {/* 1. Seleção do Veículo */}
            <div className="bg-nexus-card border border-nexus-border rounded-xl p-5 space-y-4">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Car className="w-4 h-4 text-blue-400" /> Veículo da Negociação
              </h3>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Selecione o Carro no Estoque</label>
                <select
                  value={selectedVehicleId}
                  onChange={e => setSelectedVehicleId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500"
                >
                  <option value="">-- Selecionar um veículo --</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.brand} {v.model} {v.modelYear} - {v.plate} ({formatCurrency(v.listedValue || v.purchaseValue)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Valor do Veículo na Simulação (R$)</label>
                <CurrencyInput value={vehiclePrice} onChange={setVehiclePrice} />
              </div>
            </div>

            {/* 2. Valores de Entrada e Troca */}
            <div className="bg-nexus-card border border-nexus-border rounded-xl p-5 space-y-4">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-400" /> Composição de Pagamento
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Valor de Entrada (PIX/Dinheiro)</label>
                  <CurrencyInput value={entryValue} onChange={setEntryValue} />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Valor do Veículo na Troca</label>
                  <CurrencyInput value={tradeValue} onChange={setTradeValue} />
                </div>
              </div>
            </div>

            {/* 3. Banco e Taxas */}
            <div className="bg-nexus-card border border-nexus-border rounded-xl p-5 space-y-4">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Building className="w-4 h-4 text-amber-400" /> Financeira e Taxa de Juros
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Banco / Financeira</label>
                  <select
                    value={selectedBank}
                    onChange={e => setSelectedBank(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-amber-500"
                  >
                    {DEFAULT_BANKS.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Taxa de Juros (% ao mês)</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={interestRate}
                      onChange={e => setInterestRate(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-3 pr-8 py-2 text-sm text-white outline-none focus:border-amber-500"
                    />
                    <span className="absolute right-3 top-2.5 text-slate-400 text-sm">%</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Painel de Resultados (Direita - 5 colunas) */}
          <div className="lg:col-span-5 space-y-4">

            {/* Card Saldo a Financiar */}
            <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-5 text-center space-y-3">
              <p className="text-xs text-blue-200 font-bold uppercase tracking-wider">Saldo a Financiar</p>
              <h2 className="text-3xl sm:text-4xl font-black text-white">
                {formatCurrency(financedAmount)}
              </h2>
              <div className="flex items-center justify-center gap-2 text-xs text-blue-300">
                <span>Carro: {formatCurrency(vehiclePrice)}</span>
                <span>-</span>
                <span>Entrada/Troca: {formatCurrency(entryValue + tradeValue)}</span>
              </div>

              <button
                onClick={handleShareWhatsApp}
                disabled={financedAmount <= 0}
                className="w-full mt-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                Enviar Simulação no WhatsApp
              </button>
            </div>

            {/* Tabela de Parcelas */}
            <div className="bg-nexus-card border border-nexus-border rounded-xl p-5">
              <h3 className="text-sm font-semibold text-white mb-4 text-center">Opções de Parcelamento</h3>

              <div className="space-y-3">
                {plans.map(plan => (
                  <div key={plan.months} className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-500/50 transition-colors group">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center font-bold text-slate-300 group-hover:text-emerald-400 transition-colors text-xs">
                        {plan.months}x
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-right">
                      <div>
                        <span className="block text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">Valor da Parcela</span>
                        <span className="text-base sm:text-lg font-bold text-white group-hover:text-emerald-400 transition-colors">
                          {financedAmount > 0 ? formatCurrency(plan.value) : 'R$ 0,00'}
                        </span>
                      </div>
                      {financedAmount > 0 && (
                        <button
                          onClick={() => handleOpenCreditAnalysis(plan)}
                          title="Rodar Ficha na Mesa do Banco"
                          className="py-2 px-3 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
                        >
                          <Send size={12} />
                          <span>Rodar Ficha</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* Modal de Análise de Crédito com Câmera */}
      {showCreditModal && selectedPlanForCredit && (
        <CreditAnalysisModal
          bankName={DEFAULT_BANKS.find(b => b.id === selectedBank)?.name || 'Banco'}
          bankId={selectedBank}
          vehicleName={currentVehicle ? `${currentVehicle.brand} ${currentVehicle.model}` : 'Veículo Selecionado'}
          financedAmount={financedAmount}
          months={selectedPlanForCredit.months}
          installmentValue={selectedPlanForCredit.value}
          onClose={() => setShowCreditModal(false)}
        />
      )}
    </MainLayout>
  );
}