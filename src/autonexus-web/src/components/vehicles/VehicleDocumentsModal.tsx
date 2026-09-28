import { useState, useRef, useEffect, useCallback } from 'react';
import { 
  X, 
  Upload, 
  Camera, 
  FileText, 
  Trash2, 
  Loader2, 
  Eye, 
  EyeOff, 
  Download, 
  VideoOff, 
  Check, 
  ShieldCheck 
} from 'lucide-react';
import { request } from '../../services/api';
import type { VehicleSummary } from '../../types/vehicle';

interface VehicleDocument {
  id: string;
  documentCategoryId: string;
  categoryName?: string;
  name: string;
  fileName: string;
  storagePath: string;
  showInCatalog: boolean;
  createdAt: string;
}

interface DocumentCategory {
  id: string;
  name: string;
}

interface VehicleDocumentsModalProps {
  isOpen: boolean;
  vehicle: VehicleSummary | null;
  onClose: () => void;
  onDocumentsUpdated?: () => void;
}

const DEFAULT_CATEGORIES: DocumentCategory[] = [
  { id: '11111111-1111-1111-1111-111111111111', name: 'Laudo Cautelar' },
  { id: '22222222-2222-2222-2222-222222222222', name: 'CRLV / Documento' },
  { id: '33333333-3333-3333-3333-333333333333', name: 'Nota Fiscal' },
  { id: '44444444-4444-4444-4444-444444444444', name: 'Comprovante de Revisão' },
  { id: '55555555-5555-5555-5555-555555555555', name: 'Outros' }
];

export const getFullDocumentUrl = (path?: string) => {
  if (!path) return '#';
  if (path.startsWith('http')) return path;

  const normalizedPath = path.replace(/\\/g, '/');
  const cleanPath = normalizedPath.startsWith('/') ? normalizedPath : `/${normalizedPath}`;
  
  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  const host = apiBase.replace('/api', '');
  
  return `${host}${cleanPath}`;
};

export function VehicleDocumentsModal({
  isOpen,
  vehicle,
  onClose,
  onDocumentsUpdated
}: VehicleDocumentsModalProps) {
  const [documents, setDocuments] = useState<VehicleDocument[]>([]);
  const [categories, setCategories] = useState<DocumentCategory[]>(DEFAULT_CATEGORIES);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [documentName, setDocumentName] = useState<string>('');
  const [showInCatalog, setShowInCatalog] = useState<boolean>(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  }, []);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  const startCamera = async () => {
    setError(null);
    try {
      setIsCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      console.error('Erro ao acessar câmera:', err);
      setIsCameraActive(false);
      setError('Não foi possível acessar a câmera. Verifique as permissões de vídeo do seu navegador.');
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth || 1920;
    canvas.height = video.videoHeight || 1080;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (!blob) {
        setError('Falha ao capturar imagem da câmera.');
        return;
      }

      const file = new File([blob], `camera_doc_${Date.now()}.jpg`, { type: 'image/jpeg' });
      setSelectedFile(file);
      if (!documentName) {
        setDocumentName(`Foto Documento - ${new Date().toLocaleDateString('pt-BR')}`);
      }
      stopCamera();
    }, 'image/jpeg', 0.95);
  };

  const loadData = useCallback(async () => {
    if (!vehicle) return;
    setLoading(true);
    setError(null);

    try {
      const cats = await request('/lookups/document-categories').catch(() => null);
      if (Array.isArray(cats) && cats.length > 0) {
        setCategories(cats);
        setSelectedCategoryId(cats[0].id);
      }

      const docs = await request(`/vehicles/${vehicle.id}/documents`).catch(() => []);
      setDocuments(Array.isArray(docs) ? docs : []);
    } catch (err: any) {
      console.error('Erro ao carregar dados:', err);
    } finally {
      setLoading(false);
    }
  }, [vehicle]);

  useEffect(() => {
    if (isOpen && vehicle) {
      loadData();
    } else {
      stopCamera();
      setSelectedFile(null);
      setDocumentName('');
    }
  }, [isOpen, vehicle, loadData, stopCamera]);

  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicle || !selectedFile) {
      setError('Selecione um arquivo ou tire uma foto do documento.');
      return;
    }

    try {
      setUploading(true);
      setError(null);

      const activeCategoryId = selectedCategoryId;
      if (!activeCategoryId) {
        setError('Selecione ou carregue uma categoria de documento antes de enviar.');
        return;
      }

      const formData = new FormData();
      formData.append('categoryId', activeCategoryId);
      formData.append('name', documentName.trim() || selectedFile.name);
      formData.append('showInCatalog', String(showInCatalog));
      formData.append('file', selectedFile);

      await request(`/vehicles/${vehicle.id}/documents`, {
        method: 'POST',
        body: formData
      });

      setSelectedFile(null);
      setDocumentName('');
      await loadData();
      if (onDocumentsUpdated) onDocumentsUpdated();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar documento.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleToggleCatalog = async (docId: string) => {
    if (!vehicle) return;
    try {
      setError(null);
      await request(`/vehicles/${vehicle.id}/documents/${docId}/toggle-catalog`, {
        method: 'PATCH'
      });
      await loadData();
      if (onDocumentsUpdated) onDocumentsUpdated();
    } catch (err: any) {
      setError('Erro ao alternar visibilidade no catálogo.');
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    if (!vehicle) return;
    if (!confirm('Deseja realmente remover este documento?')) return;

    try {
      setError(null);
      await request(`/vehicles/${vehicle.id}/documents/${docId}`, {
        method: 'DELETE'
      });
      await loadData();
      if (onDocumentsUpdated) onDocumentsUpdated();
    } catch (err: any) {
      setError('Erro ao excluir documento.');
    }
  };

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  if (!isOpen || !vehicle) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-nexus-card border border-nexus-border rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl my-8">

        {/* Cabeçalho */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-nexus-border">
          <div>
            <span className="text-xs font-bold text-nexus-accent uppercase tracking-wider">{vehicle.brand} {vehicle.model}</span>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <ShieldCheck className="text-nexus-accent" size={20} />
              Documentos e Laudos do Veículo
            </h2>
          </div>
          <button onClick={handleClose} className="text-slate-400 hover:text-white transition-colors cursor-pointer">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* FORMULÁRIO DE NOVO ANEXO / CÂMERA */}
          <form onSubmit={handleUploadDocument} className="bg-slate-900/80 border border-nexus-border p-5 rounded-2xl space-y-4">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Upload size={16} className="text-nexus-accent" />
              Anexar Novo Documento / Laudo
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Categoria do Documento</label>
                <select
                  value={selectedCategoryId}
                  onChange={(e) => setSelectedCategoryId(e.target.value)}
                  className="w-full bg-slate-950 border border-nexus-border rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-nexus-accent"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Nome de Exibição</label>
                <input
                  type="text"
                  placeholder="Ex: Laudo Cautelar Aprovado Dekra"
                  value={documentName}
                  onChange={(e) => setDocumentName(e.target.value)}
                  className="w-full bg-slate-950 border border-nexus-border rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-nexus-accent"
                />
              </div>
            </div>

            {/* VISOR DA CÂMERA AO VIVO */}
            {isCameraActive ? (
              <div className="relative bg-black rounded-xl overflow-hidden border border-nexus-border shadow-lg">
                <video ref={videoRef} autoPlay playsInline className="w-full aspect-[4/3] object-cover" />
                <canvas ref={canvasRef} className="hidden" />

                <div className="absolute bottom-4 inset-x-0 flex justify-center items-center gap-4">
                  <button
                    type="button"
                    onClick={capturePhoto}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full font-bold shadow-xl flex items-center gap-2 cursor-pointer transition-transform active:scale-95"
                  >
                    <Camera size={18} />
                    Tirar Foto do Documento
                  </button>
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-full font-bold transition-colors cursor-pointer"
                  >
                    <VideoOff size={16} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="border border-dashed border-nexus-border hover:border-nexus-accent p-4 rounded-xl text-center space-y-3 bg-slate-950/50">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="application/pdf,image/jpeg,image/png,image/webp"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setSelectedFile(e.target.files[0]);
                      if (!documentName) {
                        setDocumentName(e.target.files[0].name.replace(/\.[^/.]+$/, ''));
                      }
                    }
                  }}
                  className="hidden"
                />

                <div className="flex flex-wrap justify-center items-center gap-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-nexus-accent hover:bg-nexus-accent-hover text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Upload size={15} />
                    Selecionar Arquivo (PDF / Imagem)
                  </button>

                  <button
                    type="button"
                    onClick={startCamera}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-nexus-border rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Camera size={15} className="text-emerald-400" />
                    Abrir Câmera / Tirar Foto
                  </button>
                </div>

                {selectedFile ? (
                  <p className="text-xs text-emerald-400 font-semibold flex items-center justify-center gap-1">
                    <Check size={14} /> Arquivo pronto: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                  </p>
                ) : (
                  <p className="text-[11px] text-slate-500">PDF, JPG, PNG ou WEBP até 15MB</p>
                )}
              </div>
            )}

            {/* Checkbox de catálogo digital */}
            <div className="flex items-center justify-between pt-2">
              <label className="flex items-center gap-2 text-xs font-medium text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showInCatalog}
                  onChange={(e) => setShowInCatalog(e.target.checked)}
                  className="rounded border-slate-700 text-nexus-accent focus:ring-0 cursor-pointer"
                />
                👁️ Exibir este documento publicamente no Catálogo Digital (/catalogo)
              </label>

              <button
                type="submit"
                disabled={uploading || !selectedFile}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                {uploading ? 'Enviando...' : 'Salvar Documento'}
              </button>
            </div>
          </form>

          {/* LISTAGEM DE DOCUMENTOS */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              Documentos Cadastrados ({documents.length})
            </h3>

            {loading ? (
              <div className="p-6 text-center text-slate-400 flex items-center justify-center gap-2">
                <Loader2 className="animate-spin" size={18} /> Carregando...
              </div>
            ) : documents.length === 0 ? (
              <div className="p-8 border border-nexus-border rounded-xl text-center text-slate-500 text-sm">
                Nenhum laudo ou documento anexado para este veículo.
              </div>
            ) : (
              <div className="space-y-2">
                {documents.map((doc) => {
                  const fileUrl = getFullDocumentUrl(doc.storagePath);

                  return (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-3.5 bg-slate-950 border border-nexus-border hover:border-slate-700 rounded-xl transition-colors"
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="p-2.5 bg-slate-900 text-nexus-accent rounded-lg">
                          <FileText size={20} />
                        </div>
                        <div className="overflow-hidden">
                          <h4 className="text-sm font-bold text-white truncate">{doc.name}</h4>
                          <div className="flex items-center gap-2 text-xs text-slate-400">
                            <span className="text-nexus-accent font-semibold">{doc.categoryName || 'Documento'}</span>
                            <span>•</span>
                            <span>{new Date(doc.createdAt).toLocaleDateString('pt-BR')}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleToggleCatalog(doc.id)}
                          title={doc.showInCatalog ? 'Visível no Catálogo' : 'Oculto no Catálogo'}
                          className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                            doc.showInCatalog
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                              : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'
                          }`}
                        >
                          {doc.showInCatalog ? <Eye size={15} /> : <EyeOff size={15} />}
                          <span className="hidden sm:inline">{doc.showInCatalog ? 'Público' : 'Privado'}</span>
                        </button>

                        <a
                          href={fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors cursor-pointer"
                          title="Visualizar / Download"
                        >
                          <Download size={15} />
                        </a>

                        <button
                          type="button"
                          onClick={() => handleDeleteDocument(doc.id)}
                          className="p-2 bg-rose-600/10 hover:bg-rose-600 text-rose-400 hover:text-white rounded-lg transition-colors cursor-pointer border border-rose-600/20"
                          title="Excluir Documento"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Rodapé */}
        <div className="flex items-center justify-end px-6 py-4 border-t border-nexus-border">
          <button
            type="button"
            onClick={handleClose}
            className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}