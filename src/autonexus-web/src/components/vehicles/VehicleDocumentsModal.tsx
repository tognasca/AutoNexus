import { useState, useEffect, useRef } from 'react';
import { documentService, type DocumentItem, type BuyerLink } from '../../services/documentService';
import { lookupService } from '../../services/lookupService';
import type { LookupItem } from '../../types/lookup';
import type { VehicleSummary } from '../../types/vehicle';
import { formatDate } from '../../utils/formatters';
import { X, FileText, Upload, Download, Trash2, Loader2, Share2, Copy, Check } from 'lucide-react';

interface VehicleDocumentsModalProps {
  isOpen: boolean;
  vehicle: VehicleSummary | null;
  onClose: () => void;
}

export function VehicleDocumentsModal({ isOpen, vehicle, onClose }: VehicleDocumentsModalProps) {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [categories, setCategories] = useState<LookupItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedCategory, setSelectedCategory] = useState('');
  const [docName, setDocName] = useState('');
  const [docNotes, setDocNotes] = useState('');
  const [buyerName, setBuyerName] = useState('');
  const [generatedLink, setBuyerLink] = useState<BuyerLink | null>(null);
  const [copied, setCopied] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = async () => {
    if (!vehicle) return;
    try {
      setLoading(true);
      setError(null);
      const [docsRes, categoriesRes] = await Promise.all([
        documentService.getDocuments(vehicle.id),
        lookupService.getDocumentCategories(),
      ]);
      setDocuments(docsRes);
      setCategories(categoriesRes);
      if (categoriesRes.length > 0 && !selectedCategory) {
        setSelectedCategory(categoriesRes[0].id);
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar documentos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && vehicle) {
      loadData();
    }
  }, [isOpen, vehicle]);

  if (!isOpen || !vehicle) return null;

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    const file = fileInputRef.current?.files?.[0];
    if (!file || !docName || !selectedCategory) {
      setError('Selecione uma categoria, informe o nome e escolha um arquivo (PDF, JPG, PNG).');
      return;
    }

    try {
      setUploading(true);
      setError(null);
      await documentService.uploadDocument(vehicle.id, selectedCategory, docName, file, docNotes);
      setDocName('');
      setDocNotes('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Erro ao enviar documento.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (docId: string) => {
    if (!confirm('Deseja realmente remover este documento?')) return;
    try {
      setError(null);
      await documentService.deleteDocument(vehicle.id, docId);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Erro ao excluir documento.');
    }
  };

  const handleGenerateLink = async () => {
    try {
      setError(null);
      const link = await documentService.createBuyerLink(vehicle.id, buyerName);
      setBuyerLink(link);
    } catch (err: any) {
      setError(err.message || 'Erro ao gerar link seguro.');
    }
  };

  const handleCopyLink = () => {
    if (!generatedLink) return;
    const fullUrl = `${window.location.origin}${generatedLink.shareUrl}`;
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-nexus-card border border-nexus-border rounded-2xl w-full max-w-4xl overflow-hidden my-8 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-nexus-border">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <FileText size={20} className="text-nexus-accent" />
              Documentos do Veículo
            </h2>
            <p className="text-xs text-slate-400">
              {vehicle.brand} {vehicle.model} {vehicle.plate ? `• ${vehicle.plate}` : ''}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors cursor-pointer">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleUpload} className="bg-slate-900/60 border border-nexus-border rounded-xl p-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-nexus-accent mb-2">Anexar Novo Documento ao Estoque</h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Categoria *</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full bg-nexus-dark border border-nexus-border rounded-lg p-2 text-xs text-white"
                  required
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Nome do Documento *</label>
                <input
                  type="text"
                  value={docName}
                  onChange={(e) => setDocName(e.target.value)}
                  placeholder="Ex: Laudo Cautelar 2026 / CRLV Atualizado"
                  className="w-full bg-nexus-dark border border-nexus-border rounded-lg p-2 text-xs text-white"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
              <div className="sm:col-span-2">
                <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Arquivo (PDF, JPG, PNG) *</label>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="w-full bg-nexus-dark border border-nexus-border rounded-lg p-1.5 text-xs text-slate-300 file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-nexus-accent file:text-white"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={uploading}
                className="py-2.5 bg-nexus-accent hover:bg-nexus-accent-hover text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
              >
                {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                Enviar Documento
              </button>
            </div>
          </form>

          <div className="bg-slate-900/60 border border-indigo-500/30 rounded-xl p-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
              <Share2 size={16} />
              Portal do Comprador • Gerar Link Temporário Seguro
            </h3>

            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
                placeholder="Nome do Comprador (Opcional)"
                className="flex-1 bg-nexus-dark border border-nexus-border rounded-lg p-2 text-xs text-white"
              />
              <button
                type="button"
                onClick={handleGenerateLink}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
              >
                <Share2 size={14} />
                Gerar Link Seguro (30 dias)
              </button>
            </div>

            {generatedLink && (
              <div className="p-3 bg-nexus-dark border border-indigo-500/40 rounded-lg flex items-center justify-between gap-3">
                <span className="text-xs text-indigo-300 font-mono truncate">
                  {window.location.origin}{generatedLink.shareUrl}
                </span>
                <button
                  onClick={handleCopyLink}
                  className="px-3 py-1.5 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 rounded text-xs font-semibold flex items-center gap-1 cursor-pointer shrink-0"
                >
                  {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  {copied ? 'Copiado!' : 'Copiar URL'}
                </button>
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Documentos Anexados</h3>
              {documents.length > 0 && (
                <a
                  href={documentService.downloadZipUrl(vehicle.id)}
                  download
                  className="px-3 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-400 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Download size={14} />
                  Baixar Todos em ZIP
                </a>
              )}
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center h-32 text-slate-500 gap-2">
                <Loader2 className="animate-spin text-nexus-accent" size={24} />
                <span className="text-xs">Carregando documentos...</span>
              </div>
            ) : documents.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-nexus-border rounded-xl text-slate-500">
                <FileText size={32} className="mx-auto mb-2 opacity-50" />
                <p className="text-xs">Nenhum documento anexado a este veículo.</p>
              </div>
            ) : (
              <div className="border border-nexus-border rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] border-b border-nexus-border">
                    <tr>
                      <th className="p-3">Categoria</th>
                      <th className="p-3">Nome / Arquivo</th>
                      <th className="p-3">Data</th>
                      <th className="p-3 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-nexus-border text-slate-300">
                    {documents.map((doc) => (
                      <tr key={doc.id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="p-3 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-nexus-border text-blue-400">
                            {doc.documentCategoryName}
                          </span>
                        </td>
                        <td className="p-3 font-medium text-white">
                          <p>{doc.name}</p>
                          <span className="text-[10px] text-slate-500 font-mono">{doc.fileName}</span>
                        </td>
                        <td className="p-3 whitespace-nowrap text-slate-400">
                          {formatDate(doc.createdAt)}
                        </td>
                        <td className="p-3 text-center whitespace-nowrap flex items-center justify-center gap-2">
                          <a
                            href={doc.storagePath}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 bg-nexus-border hover:bg-slate-700 text-slate-200 rounded transition-colors"
                            title="Visualizar / Baixar"
                          >
                            <Download size={14} />
                          </a>
                          <button
                            onClick={() => handleDelete(doc.id)}
                            className="p-1.5 hover:bg-red-500/10 text-slate-500 hover:text-red-400 rounded transition-colors cursor-pointer"
                            title="Excluir"
                          >
                            <Trash2 size={14} />
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

        <div className="px-6 py-4 border-t border-nexus-border flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-nexus-border hover:bg-slate-700 text-white rounded-lg text-sm font-semibold transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
