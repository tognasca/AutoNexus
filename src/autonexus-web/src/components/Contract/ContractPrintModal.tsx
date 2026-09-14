import React from 'react';
import { formatCurrency, formatDate, formatCpfCnpj } from '../../utils/formatters';
import { Printer, X, FileText, CheckCircle2 } from 'lucide-react';

export interface ContractData {
  id: string;
  contractNumber: string;
  issueDate: string;
  documentType: string;
  store: {
    name: string;
    cnpj: string;
    address: string;
    phone: string;
    email: string;
  };
  customer: {
    name: string;
    document: string;
    rgNumber: string;
    phone: string;
    email: string;
    address: string;
  };
  vehicle: {
    brand: string;
    model: string;
    modelYear: number;
    manufactureYear: number;
    color: string;
    licensePlate: string;
    chassi: string;
    renavam: string;
    mileage: number;
    value: number;
  };
  tradeVehicle?: {
    brand: string;
    model: string;
    modelYear: number;
    color: string;
    licensePlate: string;
    chassi: string;
    mileage: number;
    value: number;
  } | null;
  financials: {
    totalVehicleValue: number;
    entryValue: number;
    tradeVehicleValue: number;
    financedValue: number;
    installmentsCount: number;
    installmentValue: number;
    paymentMethod: string;
    notes: string;
  };
  digitalAcceptance?: {
    isAccepted: boolean;
    acceptedAt?: string;
    ipAddress?: string;
    securityToken?: string;
  } | null;
}

interface ContractPrintModalProps {
  data: ContractData;
  onClose: () => void;
}

export const ContractPrintModal: React.FC<ContractPrintModalProps> = ({ data, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm overflow-y-auto flex justify-center p-4 sm:p-6 print:p-0 print:bg-white print:static print:inset-auto">
      <div className="bg-white text-slate-900 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden my-auto border border-slate-200 print:border-none print:shadow-none print:rounded-none">
        
        {/* Barra de Ações (Oculta na Impressão) */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-400" />
            <span className="font-semibold">{data.documentType} - {data.contractNumber}</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors cursor-pointer shadow-sm"
            >
              <Printer className="w-4 h-4" />
              Imprimir / Salvar PDF
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Folha do Contrato (Visível na Impressão) */}
        <div className="p-8 sm:p-12 space-y-6 text-xs sm:text-sm leading-relaxed text-slate-800">
          
          {/* Cabeçalho do Documento */}
          <div className="border-b-2 border-slate-900 pb-4 flex justify-between items-start gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 uppercase">
                {data.store.name}
              </h1>
              <p className="text-slate-600 font-medium">{data.store.address}</p>
              <p className="text-slate-600">CNPJ: {formatCpfCnpj(data.store.cnpj)} | Tel: {data.store.phone}</p>
            </div>
            <div className="text-right">
              <span className="inline-block bg-slate-900 text-white font-bold text-xs px-3 py-1 rounded uppercase">
                {data.documentType}
              </span>
              <p className="font-mono text-xs text-slate-600 mt-2">Nº: {data.contractNumber}</p>
              <p className="text-xs text-slate-600">Data: {formatDate(data.issueDate)}</p>
            </div>
          </div>

          {/* Cláusula 1: Das Partes */}
          <section className="space-y-2">
            <h2 className="font-bold text-slate-900 uppercase border-b border-slate-300 pb-1 text-xs tracking-wider">
              1. Qualificação das Partes
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-3 rounded border border-slate-200">
              <div>
                <p className="font-bold text-slate-900">VENDEDOR:</p>
                <p>{data.store.name}</p>
                <p>CNPJ: {formatCpfCnpj(data.store.cnpj)}</p>
                <p>{data.store.address}</p>
              </div>
              <div>
                <p className="font-bold text-slate-900">COMPRADOR:</p>
                <p>{data.customer.name}</p>
                <p>CPF/CNPJ: {formatCpfCnpj(data.customer.document)} | RG: {data.customer.rgNumber}</p>
                <p>Tel: {data.customer.phone}</p>
                <p>Endereço: {data.customer.address}</p>
              </div>
            </div>
          </section>

          {/* Cláusula 2: Do Veículo Objeto da Negociação */}
          <section className="space-y-2">
            <h2 className="font-bold text-slate-900 uppercase border-b border-slate-300 pb-1 text-xs tracking-wider">
              2. Objeto do Contrato (Veículo Adquirido)
            </h2>
            <table className="w-full text-left border-collapse border border-slate-300">
              <tbody>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <td className="p-2 font-bold">Marca/Modelo:</td>
                  <td className="p-2">{data.vehicle.brand} / {data.vehicle.model}</td>
                  <td className="p-2 font-bold">Ano/Mod:</td>
                  <td className="p-2">{data.vehicle.manufactureYear}/{data.vehicle.modelYear}</td>
                </tr>
                <tr className="border-b border-slate-200">
                  <td className="p-2 font-bold">Placa:</td>
                  <td className="p-2 font-mono font-bold uppercase">{data.vehicle.licensePlate}</td>
                  <td className="p-2 font-bold">Cor:</td>
                  <td className="p-2">{data.vehicle.color}</td>
                </tr>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <td className="p-2 font-bold">Chassi:</td>
                  <td className="p-2 font-mono text-xs">{data.vehicle.chassi}</td>
                  <td className="p-2 font-bold">Renavam:</td>
                  <td className="p-2 font-mono text-xs">{data.vehicle.renavam}</td>
                </tr>
                <tr>
                  <td className="p-2 font-bold">KM Atual:</td>
                  <td className="p-2">{data.vehicle.mileage.toLocaleString('pt-BR')} KM</td>
                  <td className="p-2 font-bold">Valor Negociado:</td>
                  <td className="p-2 font-bold text-blue-900">{formatCurrency(data.vehicle.value)}</td>
                </tr>
              </tbody>
            </table>
          </section>

          {/* Cláusula 3: Veículo de Troca (Se Houver) */}
          {data.tradeVehicle && (
            <section className="space-y-2">
              <h2 className="font-bold text-slate-900 uppercase border-b border-slate-300 pb-1 text-xs tracking-wider">
                3. Veículo Entregue na Troca
              </h2>
              <table className="w-full text-left border-collapse border border-slate-300">
                <tbody>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <td className="p-2 font-bold">Marca/Modelo:</td>
                    <td className="p-2">{data.tradeVehicle.brand} / {data.tradeVehicle.model}</td>
                    <td className="p-2 font-bold">Ano:</td>
                    <td className="p-2">{data.tradeVehicle.modelYear}</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-bold">Placa:</td>
                    <td className="p-2 font-mono uppercase">{data.tradeVehicle.licensePlate}</td>
                    <td className="p-2 font-bold">Valor de Avaliação:</td>
                    <td className="p-2 font-bold text-emerald-800">{formatCurrency(data.tradeVehicle.value)}</td>
                  </tr>
                </tbody>
              </table>
            </section>
          )}

          {/* Cláusula 4: Condições Financeiras e Pagamento */}
          <section className="space-y-2">
            <h2 className="font-bold text-slate-900 uppercase border-b border-slate-300 pb-1 text-xs tracking-wider">
              {data.tradeVehicle ? '4.' : '3.'} Condições de Pagamento
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-100 p-3 rounded border border-slate-300 text-center">
              <div>
                <p className="text-[10px] text-slate-500 uppercase font-bold">Valor Total</p>
                <p className="font-bold text-slate-900">{formatCurrency(data.financials.totalVehicleValue)}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase font-bold">Entrada (PIX/Dinheiro)</p>
                <p className="font-bold text-slate-900">{formatCurrency(data.financials.entryValue)}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase font-bold">Valor na Troca</p>
                <p className="font-bold text-slate-900">{formatCurrency(data.financials.tradeVehicleValue)}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase font-bold">Saldo Financiado</p>
                <p className="font-bold text-slate-900">{formatCurrency(data.financials.financedValue)}</p>
              </div>
            </div>
            {data.financials.installmentsCount > 0 && (
              <p className="text-xs text-slate-700 italic">
                * Financiamento aprovado em {data.financials.installmentsCount}x de {formatCurrency(data.financials.installmentValue)} via {data.financials.paymentMethod}.
              </p>
            )}
          </section>

          {/* Cláusulas Jurídicas de Garantia e Responsabilidade */}
          <section className="space-y-1 text-[11px] text-slate-600 border-t border-slate-300 pt-3">
            <p><strong>GARANTIA:</strong> O veículo possui garantia legal de 90 (noventa) dias para motor e câmbio, conforme Art. 26 do Código de Defesa do Consumidor (CDC).</p>
            <p><strong>MULTAS E DÉBITOS:</strong> O Vendedor responsabiliza-se por quaisquer débitos, multas e pendências financeiras anteriores à data de entrega do veículo.</p>
            <p><strong>TRANSFERÊNCIA:</strong> O Comprador compromete-se a efetuar a transferência de propriedade perante o DETRAN no prazo máximo de 30 (trinta) dias.</p>
          </section>

          {/* Aceite Digital / Assinaturas */}
          <div className="pt-8 space-y-6">
            {data.digitalAcceptance?.isAccepted ? (
              <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-lg flex items-center justify-between text-emerald-900">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                  <div>
                    <p className="font-bold text-xs uppercase">Contrato Assinado Digitalmente</p>
                    <p className="text-[10px] text-emerald-700">Data do Aceite: {formatDate(data.digitalAcceptance.acceptedAt)} | IP: {data.digitalAcceptance.ipAddress}</p>
                    <p className="text-[10px] font-mono text-emerald-800">Token: {data.digitalAcceptance.securityToken}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-8 pt-12">
                <div className="text-center border-t border-slate-400 pt-2">
                  <p className="font-bold text-xs">{data.store.name}</p>
                  <p className="text-[10px] text-slate-500">Vendedor / Representante Legal</p>
                </div>
                <div className="text-center border-t border-slate-400 pt-2">
                  <p className="font-bold text-xs">{data.customer.name}</p>
                  <p className="text-[10px] text-slate-500">Comprador</p>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};