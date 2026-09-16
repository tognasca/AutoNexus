import React, { useState } from 'react';
import { CurrencyInput } from '../ui/CurrencyInput';
import { formatCpfCnpj } from '../../utils/formatters';
import { ContractPrintModal, ContractData } from './ContractPrintModal';
import { FileText, X, Car, User, DollarSign } from 'lucide-react';
import { request } from '../../services/api';

interface ContractFormModalProps {
  vehicle: {
    id: string;
    brand: string;
    model: string;
    modelYear: number;
    price?: number;
    plate?: string;
  };
  onClose: () => void;
}

export const ContractFormModal: React.FC<ContractFormModalProps> = ({ vehicle, onClose }) => {
  const [isProposal, setIsProposal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generatedContract, setGeneratedContract] = useState<ContractData | null>(null);

  // Dados do Cliente
  const [customerName, setCustomerName] = useState('');
  const [customerDocument, setCustomerDocument] = useState('');
  const [customerRg] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');

  // Condições Financeiras
  const [saleValue, setSaleValue] = useState<number>(vehicle.price || 0);
  const [entryValue, setEntryValue] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState('PIX / Transferência');

  // Veículo de Troca
  const [hasTrade, setHasTrade] = useState(false);
  const [tradeBrand, setTradeBrand] = useState('');
  const [tradeModel, setTradeModel] = useState('');
  const [tradeYear,] = useState<number>(new Date().getFullYear());
  const [tradePlate, setTradePlate] = useState('');
  const [tradeValue, setTradeValue] = useState<number>(0);

  // Financiamento
  const [financedValue] = useState<number>(0);
  const [installmentsCount] = useState<number>(0);
  const [installmentValue] = useState<number>(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerDocument) {
      alert('Preencha o Nome e CPF/CNPJ do cliente.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        customerName,
        customerDocument: customerDocument.replace(/\D/g, ''),
        customerRg: customerRg || null,
        customerPhone: customerPhone || '',
        customerEmail: customerEmail || null,
        customerAddress: customerAddress || null,
        saleValue: Number(saleValue) || 0,
        entryValue: Number(entryValue) || 0,
        hasTrade,
        tradeBrand: hasTrade ? tradeBrand : null,
        tradeModel: hasTrade ? tradeModel : null,
        tradeYear: hasTrade ? Number(tradeYear) : 0,
        tradePlate: hasTrade ? tradePlate : null,
        tradeValue: hasTrade ? Number(tradeValue) : 0,
        financedValue: Number(financedValue) || 0,
        installmentsCount: Number(installmentsCount) || 0,
        installmentValue: Number(installmentValue) || 0,
        paymentMethod: paymentMethod || 'PIX / Transferência',
        isProposal
      };

     // Utiliza sua função nativa `request`
      const data = await request<ContractData>(`/vehicles/${vehicle.id}/contract/generate`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      setGeneratedContract(data);
      
    } catch (err) {
      console.error("Erro ao gerar contrato:", err);
      alert('Erro ao gerar documento. Verifique os dados preenchidos.');
    } finally {
      setLoading(false);
    }
  };

  if (generatedContract) {
    return <ContractPrintModal data={generatedContract} onClose={onClose} />;
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl text-slate-100 shadow-2xl overflow-hidden my-8">

        {/* Cabeçalho */}
        <div className="px-6 py-4 bg-slate-800/50 border-b border-slate-700/50 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-400" />
            <h3 className="font-semibold text-lg">
              Gerar {isProposal ? 'Proposta Comercial' : 'Contrato de Venda'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">

          {/* Tipo de Documento */}
          <div className="flex gap-4 p-1 bg-slate-950 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setIsProposal(false)}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${!isProposal ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
            >
              Contrato de Compra e Venda
            </button>
            <button
              type="button"
              onClick={() => setIsProposal(true)}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${isProposal ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
            >
              Proposta Comercial
            </button>
          </div>

          {/* Dados do Cliente */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-2">
              <User className="w-4 h-4" /> Dados do Comprador / Cliente
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Nome Completo *"
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:border-blue-500 outline-none"
                required
              />
              <input
                type="text"
                placeholder="CPF ou CNPJ *"
                value={customerDocument}
                onChange={e => setCustomerDocument(formatCpfCnpj(e.target.value))}
                className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:border-blue-500 outline-none"
                required
              />
              <input
                type="text"
                placeholder="Telefone / WhatsApp"
                value={customerPhone}
                onChange={e => setCustomerPhone(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm outline-none"
              />
              <input
                type="email"
                placeholder="E-mail"
                value={customerEmail}
                onChange={e => setCustomerEmail(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm outline-none"
              />
              <input
                type="text"
                placeholder="Endereço Completo"
                value={customerAddress}
                onChange={e => setCustomerAddress(e.target.value)}
                className="sm:col-span-2 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm outline-none"
              />
            </div>
          </div>

          {/* Condições Financeiras */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
              <DollarSign className="w-4 h-4" /> Valores e Condições
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Valor do Veículo</label>
                <CurrencyInput value={saleValue} onChange={setSaleValue} />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Entrada (PIX/Dinheiro)</label>
                <CurrencyInput value={entryValue} onChange={setEntryValue} />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Forma de Pagamento</label>
                <select
                  value={paymentMethod}
                  onChange={e => setPaymentMethod(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm outline-none text-white"
                >
                  <option value="PIX / Transferência">PIX / Transferência</option>
                  <option value="Financiamento Bancário">Financiamento Bancário</option>
                  <option value="Cartão de Crédito">Cartão de Crédito</option>
                  <option value="Entrada + Financiamento">Entrada + Financiamento</option>
                </select>
              </div>
            </div>
          </div>

          {/* Veículo na Troca */}
          <div className="space-y-3 border-t border-slate-800 pt-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={hasTrade}
                onChange={e => setHasTrade(e.target.checked)}
                className="w-4 h-4 rounded bg-slate-950 border-slate-800 text-blue-600 focus:ring-0"
              />
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                <Car className="w-4 h-4 text-amber-400" /> Incluir Veículo Usado na Troca
              </span>
            </label>

            {hasTrade && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-950/50 p-3 rounded-xl border border-slate-800">
                <input
                  type="text"
                  placeholder="Marca da Troca (ex: Fiat)"
                  value={tradeBrand}
                  onChange={e => setTradeBrand(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm outline-none"
                />
                <input
                  type="text"
                  placeholder="Modelo (ex: Uno Mille)"
                  value={tradeModel}
                  onChange={e => setTradeModel(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm outline-none"
                />
                <input
                  type="text"
                  placeholder="Placa"
                  value={tradePlate}
                  onChange={e => setTradePlate(e.target.value.toUpperCase())}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm outline-none uppercase"
                />
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Valor de Avaliação</label>
                  <CurrencyInput value={tradeValue} onChange={setTradeValue} />
                </div>
              </div>
            )}
          </div>

          {/* Botão de Envio */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm disabled:opacity-50"
            >
              <FileText className="w-4 h-4" />
              {loading ? 'Gerando Documento...' : 'Gerar e Visualizar PDF'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};