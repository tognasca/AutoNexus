import React, { useEffect, useState, useRef } from 'react';
import { companyDocumentService, CompanyDocument } from '../../services/companyDocumentService';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/formatters';
import { CurrencyInput } from '../../components/ui/CurrencyInput';
import { MainLayout } from '../../components/layout/MainLayout';
import { FolderOpen, Plus, Trash2, Download, FileText, X, Save, RefreshCw, Upload, Calendar, DollarSign, FileCheck } from 'lucide-react';

interface CompanyDocumentsPageProps {
  currentView?: string;
  onNavigate?: (view: string) => void;
}

export function CompanyDocumentsPage({ currentView, onNavigate }: CompanyDocumentsPageProps) {
  const [docs, setDocs] = useState<CompanyDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Formulário
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Despesas Fixas');
  const [amount, setAmount] = useState<number>(0);
  const [refDate, setRefDate] = useState('');
  const [notes, setNotes] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadDocs = async () => {
    setLoading(true);
    try {
      const data = await companyDocumentService.getAll();
      setDocs(data);
    } catch (err) {
      console.error('Erro ao carregar documentos da empresa:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocs();
  }, []);

  const handleOpenModal = () => {
    setTitle('');
    setCategory('Despesas Fixas');
    setAmount(0);
    setRefDate('');
    setNotes('');
    setFile(null);
    setIsModalOpen(true);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title) {
      alert('Informe o Título e selecione um Arquivo.');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('category', category);
      formData.append('file', file);
      
      if (amount > 0) formData.append('amount', amount.toString());
      if (refDate) formData.append('referenceDate', refDate);
      if (notes) formData.append('notes', notes);

      await companyDocumentService.upload(formData);
      setIsModalOpen(false);
      await loadDocs();
    } catch (err: any) {
      alert(err.message || 'Erro ao realizar upload do documento.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string, docTitle: string) => {
    if (confirm(`Deseja realmente excluir o documento "${docTitle}"?`)) {
      try {
        await companyDocumentService.delete(id);
        await loadDocs();
      } catch {
        alert('Erro ao excluir documento.');
      }
    }
  };

  return (
    <MainLayout currentView={currentView} onNavigate={onNavigate}>
      {/* Container Full Width */}
      <div className="space-y-6 p-4 sm:p-6 w-full">
        
        {/* Cabeçalho */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-nexus-border pb-4 w-full">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
              <FolderOpen className="w-6 h-6 text-blue-400" />
              Gestão de Documentos da Empresa (Backoffice)
            </h1>
            <p className="text-xs md:text-sm text-nexus-text-muted mt-1">
              Controle e armazenamento de contas de consumo (água/luz), alvarás, contratos sociais e impostos.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadDocs}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-colors cursor-pointer"
              title="Atualizar Lista"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={handleOpenModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs transition-colors shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Novo Documento
            </button>
          </div>
        </div>

        {/* Tabela de Documentos */}
        <div className="bg-nexus-card border border-nexus-border rounded-xl overflow-hidden shadow-sm w-full">
          {loading ? (
            <div className="p-8 text-center text-slate-400">Carregando documentos...</div>
          ) : docs.length === 0 ? (
            <div className="p-8 text-center text-slate-400">Nenhum documento da empresa anexado até o momento.</div>
          ) : (
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead>
                  <tr className="border-b border-nexus-border bg-slate-950/60 text-slate-400 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Documento / Título</th>
                    <th className="py-3.5 px-4">Categoria</th>
                    <th className="py-3.5 px-4">Valor (R$)</th>
                    <th className="py-3.5 px-4">Data Ref. / Vencimento</th>
                    <th className="py-3.5 px-4">Data do Upload</th>
                    <th className="py-3.5 px-4 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-nexus-border text-slate-200">
                  {docs.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-white flex items-center gap-2">
                        <FileText className="w-4 h-4 text-blue-400 shrink-0" />
                        <div>
                          <p className="text-white font-bold">{d.title}</p>
                          {d.notes && <p className="text-[10px] text-slate-400 font-normal">{d.notes}</p>}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                          {d.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-amber-400">
                        {d.amount ? formatCurrency(d.amount) : '-'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">
                        {d.referenceDate ? formatDate(d.referenceDate) : '-'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">
                        {formatDateTime(d.createdAt)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <a
                            href={d.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white rounded-lg transition-colors"
                            title="Baixar / Visualizar Documento"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </a>
                          <button
                            onClick={() => handleDelete(d.id, d.title)}
                            className="p-1.5 bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer"
                            title="Excluir Documento"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

      {/* Modal Amplo de Upload de Documento */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl text-slate-100 shadow-2xl p-6 sm:p-8 space-y-5">
            
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <h3 className="font-bold text-lg text-white flex items-center gap-2">
                <Upload className="w-5 h-5 text-blue-400" /> Cadastrar Documento da Empresa
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpload} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Título do Documento *</label>
                <input
                  type="text"
                  placeholder="Ex: Conta de Luz - Matriz (Janeiro/2025)"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Categoria *</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white outline-none focus:border-blue-500"
                  >
                    <option value="Despesas Fixas">Despesas Fixas (Água/Luz/Internet)</option>
                    <option value="Documentos Legais">Documentos Legais (Alvará/Contrato)</option>
                    <option value="Impostos">Impostos / Tributos</option>
                    <option value="Manutenção da Loja">Manutenção da Loja</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1 flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-400" /> Valor do Comprovante (R$)
                  </label>
                  <div className="w-full">
                    <CurrencyInput value={amount} onChange={setAmount} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-blue-400" /> Data de Vencimento / Ref.
                  </label>
                  <input
                    type="date"
                    value={refDate}
                    onChange={e => setRefDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Observações / Notas</label>
                  <input
                    type="text"
                    placeholder="Ex: Pago via PIX no banco Santander"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Área Espaçosa de Upload (Caixa Interativa / Dropzone) */}
              <div>
                <label className="text-slate-300 font-semibold block mb-1.5">Anexo (PDF ou Imagem) *</label>
                
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={e => setFile(e.target.files?.[0] || null)}
                  accept="application/pdf,image/*"
                  className="hidden"
                />

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-700 hover:border-blue-500 bg-slate-950 p-5 rounded-2xl text-center cursor-pointer transition-colors space-y-2 group"
                >
                  {file ? (
                    <div className="flex items-center justify-center gap-2 text-emerald-400">
                      <FileCheck className="w-6 h-6 shrink-0" />
                      <div className="text-left overflow-hidden">
                        <p className="text-xs font-bold truncate max-w-xs">{file.name}</p>
                        <p className="text-[10px] text-slate-500">{(file.size / 1024).toFixed(1)} KB • Clique para alterar</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <Upload className="w-7 h-7 text-blue-400 mx-auto group-hover:scale-110 transition-transform" />
                      <p className="text-xs font-bold text-slate-200">Clique para selecionar o arquivo</p>
                      <p className="text-[10px] text-slate-500">Formatos aceitos: PDF, PNG, JPG, JPEG</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md disabled:opacity-50 cursor-pointer transition-all"
                >
                  <Save className="w-4 h-4" />
                  {uploading ? 'Enviando...' : 'Salvar Documento'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}
    </MainLayout>
  );
}