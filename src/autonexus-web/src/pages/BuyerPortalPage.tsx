import { useState, useEffect } from 'react';
import { portalService, type PortalVehicle, type AcceptanceResult } from '../services/portalService';
import { formatCurrency, formatDateTime, formatCpfCnpj } from '../utils/formatters';
import { Car, Download, CheckCircle2, ShieldCheck, FileText, Loader2, AlertCircle } from 'lucide-react';

export function BuyerPortalPage({ token }: { token: string }) {
  const [portalData, setPortalData] = useState<PortalVehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [buyerName, setBuyerName] = useState('');
  const [buyerDoc, setBuyerDoc] = useState('');
  const [submittingAcceptance, setSubmittingAcceptance] = useState(false);

  useEffect(() => {
    const loadPortal = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await portalService.getDetails(token);
        setPortalData(data);
      } catch (err: any) {
        setError(err.message || 'Acesso negado ou link expirado.');
      } finally {
        setLoading(false);
      }
    };
    loadPortal();
  }, [token]);

  const handleAcceptance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!buyerName || !buyerDoc) {
      setError('Preencha seu Nome e CPF/CNPJ para o aceite eletrônico.');
      return;
    }

    try {
      setSubmittingAcceptance(true);
      setError(null);
      const res = await portalService.submitAcceptance(token, buyerName, buyerDoc);
      setPortalData((prev) => prev ? { ...prev, hasElectronicAcceptance: true, acceptedByBuyerName: res.buyerName, acceptedAt: res.acceptedAt } : null);
    } catch (err: any) {
      setError(err.message || 'Erro ao registrar aceite.');
    } finally {
      setSubmittingAcceptance(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-nexus-dark flex items-center justify-center text-nexus-accent">
        <Loader2 className="animate-spin" size={36} />
      </div>
    );
  }

  if (error || !portalData) {
    return (
      <div className="min-h-screen bg-nexus-dark flex items-center justify-center p-4">
        <div className="bg-nexus-card border border-red-500/30 rounded-2xl p-8 max-w-md w-full text-center space-y-4">
          <AlertCircle size={48} className="text-red-400 mx-auto" />
          <h1 className="text-xl font-bold text-white">Acesso Não Autorizado</h1>
          <p className="text-xs text-slate-400">{error || 'Este link de acesso é inválido, expirou ou foi revogado.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-nexus-dark text-slate-200 p-4 md:p-8 max-w-5xl mx-auto space-y-6">
      <header className="bg-nexus-card border border-nexus-border rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-bold text-white text-xl shadow-lg shadow-blue-500/30">
            AN
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Portal do Comprador</h1>
            <p className="text-xs text-slate-400">Documentação Digital & Laudos de Entrega</p>
          </div>
        </div>

        <a
          href={portalService.getDownloadZipUrl(token)}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/20"
        >
          <Download size={16} />
          Baixar Todos os Arquivos em ZIP
        </a>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-nexus-card border border-nexus-border rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2 text-nexus-accent">
            <Car size={20} />
            <h2 className="text-sm font-bold uppercase tracking-wider">Dados do Veículo</h2>
          </div>

          <div className="space-y-2 text-xs">
            <div><span className="text-slate-500 block">Marca / Modelo:</span><span className="text-white font-bold text-base">{portalData.brand} {portalData.model}</span></div>
            <div><span className="text-slate-500 block">Ano Modelo:</span><span className="text-slate-300 font-semibold">{portalData.modelYear}</span></div>
            {portalData.plate && <div><span className="text-slate-500 block">Placa:</span><span className="text-slate-300 font-mono font-semibold">{portalData.plate}</span></div>}
            <div><span className="text-slate-500 block">Valor:</span><span className="text-emerald-400 font-bold text-lg">{formatCurrency(portalData.price)}</span></div>
          </div>
        </div>

        <div className="md:col-span-2 bg-nexus-card border border-nexus-border rounded-2xl p-6 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">Fotos Registradas</h2>

          {portalData.photos.length === 0 ? (
            <p className="text-xs text-slate-500">Nenhuma foto registrada para este veículo.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {portalData.photos.map((photo) => (
                <div key={photo.id} className="rounded-xl overflow-hidden border border-nexus-border aspect-square bg-slate-900">
                  <img src={photo.storagePath} alt="Foto Veículo" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-nexus-card border border-nexus-border rounded-2xl p-6 space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
          <FileText size={18} className="text-nexus-accent" />
          Documentos & Laudos Disponibilizados
        </h2>

        {portalData.documents.length === 0 ? (
          <p className="text-xs text-slate-500">Nenhum documento disponibilizado no portal.</p>
        ) : (
          <div className="border border-nexus-border rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] border-b border-nexus-border">
                <tr>
                  <th className="p-3">Categoria</th>
                  <th className="p-3">Nome do Documento</th>
                  <th className="p-3 text-center">Download</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-nexus-border text-slate-300">
                {portalData.documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="p-3 font-semibold text-blue-400">{doc.documentCategoryName}</td>
                    <td className="p-3 font-medium text-white">{doc.name}</td>
                    <td className="p-3 text-center">
                      <a
                        href={portalService.getDownloadDocUrl(token, doc.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-nexus-border hover:bg-slate-700 text-white rounded font-medium transition-colors"
                      >
                        <Download size={14} />
                        Baixar
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Aceite Eletrônico com Datas e CPF/CNPJ MASCARADOS */}
      <div className="bg-nexus-card border border-indigo-500/30 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2 text-indigo-400">
          <ShieldCheck size={22} />
          <h2 className="text-base font-bold">Aceite Eletrônico Simples de Recebimento</h2>
        </div>

        {portalData.hasElectronicAcceptance ? (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs flex items-center gap-3">
            <CheckCircle2 size={24} className="shrink-0" />
            <div>
              <p className="font-bold">Aceite Eletrônico Confirmado com Sucesso!</p>
              <p className="text-[11px] text-emerald-300/80 mt-0.5">
                Comprador: {portalData.acceptedByBuyerName} • Confirmado em: {formatDateTime(portalData.acceptedAt)}
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleAcceptance} className="space-y-4">
            <p className="text-xs text-slate-400">
              Ao confirmar abaixo, você registra o aceite eletrônico simples de que recebeu o veículo e teve acesso à documentação disponibilizada.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Nome Completo *</label>
                <input
                  type="text"
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  placeholder="Seu nome completo"
                  required
                  className="w-full bg-nexus-dark border border-nexus-border rounded-lg p-2.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">CPF / CNPJ *</label>
                <input
                  type="text"
                  value={buyerDoc}
                  onChange={(e) => setBuyerDoc(formatCpfCnpj(e.target.value))}
                  placeholder="000.000.000-00"
                  maxLength={18}
                  required
                  className="w-full bg-nexus-dark border border-nexus-border rounded-lg p-2.5 text-xs text-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submittingAcceptance}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-lg shadow-indigo-600/20 flex items-center gap-2 disabled:opacity-50"
            >
              {submittingAcceptance ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
              Confirmar Aceite Eletrônico
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
