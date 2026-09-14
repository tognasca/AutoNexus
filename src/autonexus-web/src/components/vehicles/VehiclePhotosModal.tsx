import { useState, useEffect, useRef } from 'react';
import { photoService, type VehiclePhoto } from '../../services/photoService';
import { type VehicleSummary } from '../../types/vehicle';
import { CameraCaptureModal } from './CameraCaptureModal';
import { X, Upload, Camera, Star, Trash2, Loader2, Image as ImageIcon } from 'lucide-react';

interface VehiclePhotosModalProps {
  isOpen: boolean;
  vehicle: VehicleSummary | null;
  onClose: () => void;
  onPhotosUpdated: () => void;
}

export function VehiclePhotosModal({ isOpen, vehicle, onClose, onPhotosUpdated }: VehiclePhotosModalProps) {
  const [photos, setPhotos] = useState<VehiclePhoto[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadPhotos = async () => {
    if (!vehicle) return;
    try {
      setLoading(true);
      setError(null);
      const data = await photoService.getPhotos(vehicle.id);
      setPhotos(data);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar fotos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && vehicle) {
      loadPhotos();
    }
  }, [isOpen, vehicle]);

  if (!isOpen || !vehicle) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    await uploadFileList(e.target.files);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const uploadFileList = async (files: FileList | File[]) => {
    if (!vehicle) return;
    try {
      setUploading(true);
      setError(null);
      await photoService.uploadPhotos(vehicle.id, files);
      await loadPhotos();
      onPhotosUpdated();
    } catch (err: any) {
      setError(err.message || 'Erro no upload.');
    } finally {
      setUploading(false);
    }
  };

  const handlePhotoCaptured = async (file: File) => {
    await uploadFileList([file]);
  };

  const handleSetMain = async (photoId: string) => {
    try {
      setError(null);
      await photoService.setMainPhoto(vehicle.id, photoId);
      await loadPhotos();
      onPhotosUpdated();
    } catch (err: any) {
      setError(err.message || 'Erro ao alterar foto principal.');
    }
  };

  const handleDelete = async (photoId: string) => {
    if (!confirm('Deseja realmente excluir esta foto?')) return;
    try {
      setError(null);
      await photoService.deletePhoto(vehicle.id, photoId);
      await loadPhotos();
      onPhotosUpdated();
    } catch (err: any) {
      setError(err.message || 'Erro ao excluir foto.');
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
        <div className="bg-nexus-card border border-nexus-border rounded-2xl w-full max-w-4xl overflow-hidden my-8 flex flex-col max-h-[90vh]">
          {/* Cabeçalho */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-nexus-border">
            <div>
              <h2 className="text-lg font-bold text-white">Galeria de Fotos</h2>
              <p className="text-xs text-slate-400">
                {vehicle.brand} {vehicle.model} {vehicle.plate ? `• ${vehicle.plate}` : ''}
              </p>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors cursor-pointer">
              <X size={20} />
            </button>
          </div>

          {/* Botões de Upload / Câmera */}
          <div className="p-6 border-b border-nexus-border bg-slate-900/40">
            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                multiple
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-2 bg-nexus-accent hover:bg-nexus-accent-hover text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 cursor-pointer"
              >
                {uploading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
                Selecionar Arquivos
              </button>

              <button
                onClick={() => setIsCameraOpen(true)}
                disabled={uploading}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 cursor-pointer shadow-lg shadow-indigo-600/20"
              >
                <Camera size={18} />
                Abrir Câmera
              </button>

              <span className="text-xs text-slate-500 ml-auto">
                Formatos: JPG, PNG, WEBP (Máx. 10MB)
              </span>
            </div>
          </div>

          {/* Grid de Fotos */}
          <div className="p-6 flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-48 text-slate-500 gap-3">
                <Loader2 className="animate-spin text-nexus-accent" size={32} />
                <span className="text-sm">Carregando fotos...</span>
              </div>
            ) : photos.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-slate-500 border-2 border-dashed border-nexus-border rounded-xl">
                <ImageIcon size={48} className="stroke-[1.5] mb-2 text-slate-600" />
                <p className="text-sm">Nenhuma foto cadastrada para este veículo.</p>
                <p className="text-xs text-slate-600 mt-1">Utilize os botões acima para fazer o upload.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {photos.map((photo) => (
                  <div
                    key={photo.id}
                    className={`group relative rounded-xl overflow-hidden border ${
                      photo.isMain ? 'border-amber-400 ring-2 ring-amber-400/30' : 'border-nexus-border'
                    } bg-slate-900 aspect-square flex flex-col justify-between`}
                  >
                    <img
                      src={photo.storagePath}
                      alt={photo.fileName}
                      className="w-full h-full object-cover"
                    />

                    {photo.isMain && (
                      <div className="absolute top-2 left-2 bg-amber-500/90 backdrop-blur-md text-slate-950 font-bold text-[10px] px-2 py-0.5 rounded flex items-center gap-1 shadow-md">
                        <Star size={12} className="fill-slate-950" />
                        CAPA
                      </div>
                    )}

                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
                      {!photo.isMain && (
                        <button
                          onClick={() => handleSetMain(photo.id)}
                          title="Definir como foto principal"
                          className="p-2 bg-nexus-card hover:bg-amber-500 text-slate-300 hover:text-slate-950 rounded-lg transition-colors cursor-pointer"
                        >
                          <Star size={16} />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(photo.id)}
                        title="Excluir foto"
                        className="p-2 bg-nexus-card hover:bg-red-500 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Rodapé */}
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

      {/* Modal da Câmera em Tempo Real */}
      <CameraCaptureModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onPhotoCaptured={handlePhotoCaptured}
      />
    </>
  );
}