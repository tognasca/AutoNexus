import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Upload, Camera, Star, Trash2, Loader2, Image as ImageIcon, VideoOff } from 'lucide-react';
import { request } from '../../services/api';
import type { VehicleSummary } from '../../types/vehicle';

interface VehiclePhoto {
  id: string;
  fileName?: string;
  storagePath?: string;
  url?: string;
  isMain?: boolean;
  order?: number;
}

interface VehiclePhotosModalProps {
  isOpen: boolean;
  vehicle: VehicleSummary | null;
  onClose: () => void;
  onPhotosUpdated: () => void;
}

// Converte qualquer caminho de foto em URL pública do backend
export const getFullPhotoUrl = (path?: string) => {
  if (!path) return '/placeholder-car.png';
  if (path.startsWith('http')) return path;

  const normalizedPath = path.replace(/\\/g, '/');
  const cleanPath = normalizedPath.startsWith('/') ? normalizedPath : `/${normalizedPath}`;
  
  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
  const host = apiBase.replace('/api', '');
  
  return `${host}${cleanPath}`;
};

export function VehiclePhotosModal({ isOpen, vehicle, onClose, onPhotosUpdated }: VehiclePhotosModalProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // --- CONTROLE DA CÂMERA AO VIVO ---
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
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
      console.error('Erro ao acessar a câmera:', err);
      setIsCameraActive(false);
      setError('Não foi possível acessar a câmera. Verifique as permissões do seu navegador.');
    }
  };

  const uploadFiles = async (files: File[] | FileList) => {
    if (!vehicle || !files || files.length === 0) return;

    try {
      setUploading(true);
      setError(null);

      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append('files', files[i]);
      }

      await request(`/vehicles/${vehicle.id}/photos`, {
        method: 'POST',
        body: formData,
      });

      onPhotosUpdated();
    } catch (err: any) {
      console.error('Erro ao fazer upload:', err);
      setError(err.message || 'Erro ao enviar foto para o servidor.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(async (blob) => {
      if (!blob) {
        setError('Erro ao capturar imagem da câmera.');
        return;
      }

      const file = new File([blob], `camera_${Date.now()}.jpg`, { type: 'image/jpeg' });
      await uploadFiles([file]);
      stopCamera();
    }, 'image/jpeg', 0.92);
  };

  const handleSetMainPhoto = async (photoId: string) => {
    if (!vehicle) return;
    try {
      setError(null);
      await request(`/vehicles/${vehicle.id}/photos/${photoId}/main`, {
        method: 'PUT',
      });
      onPhotosUpdated();
    } catch (err: any) {
      setError('Erro ao definir foto principal.');
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    if (!vehicle) return;
    if (!confirm('Deseja realmente remover esta foto da galeria?')) return;

    try {
      setError(null);
      await request(`/vehicles/${vehicle.id}/photos/${photoId}`, {
        method: 'DELETE',
      });
      onPhotosUpdated();
    } catch (err: any) {
      setError('Erro ao excluir foto.');
    }
  };

  const handleCloseModal = () => {
    stopCamera();
    onClose();
  };

  if (!isOpen || !vehicle) return null;

  const photos: VehiclePhoto[] = (vehicle as any).photos || (vehicle as any).Photos || [];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-nexus-card border border-nexus-border rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl my-8">

        {/* Cabeçalho */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-nexus-border">
          <div>
            <span className="text-xs font-bold text-nexus-accent uppercase tracking-wider">{vehicle.brand}</span>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <ImageIcon className="text-nexus-accent" size={18} />
              Galeria de Fotos do Veículo
            </h2>
          </div>
          <button onClick={handleCloseModal} className="text-slate-400 hover:text-white transition-colors cursor-pointer">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* VISOR DA CÂMERA AO VIVO */}
          {isCameraActive ? (
            <div className="relative bg-black rounded-2xl overflow-hidden border border-nexus-border shadow-xl">
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                className="w-full aspect-[4/3] object-cover" 
              />
              <canvas ref={canvasRef} className="hidden" />

              <div className="absolute bottom-4 inset-x-0 flex justify-center items-center gap-4">
                <button
                  type="button"
                  onClick={capturePhoto}
                  disabled={uploading}
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full font-bold shadow-2xl flex items-center gap-2 transition-transform active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  <Camera size={20} />
                  Capturar Foto
                </button>
                <button
                  type="button"
                  onClick={stopCamera}
                  disabled={uploading}
                  className="px-4 py-3 bg-slate-800/90 hover:bg-slate-700 text-slate-200 rounded-full font-bold transition-colors cursor-pointer"
                >
                  <VideoOff size={18} />
                </button>
              </div>
            </div>
          ) : (
            /* ÁREA DE SELEÇÃO E ACIONAMENTO DA CÂMERA */
            <div className="bg-slate-900/80 border-2 border-dashed border-nexus-border hover:border-nexus-accent p-6 rounded-2xl text-center space-y-3 transition-colors">
              <input
                type="file"
                ref={fileInputRef}
                multiple
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => {
                  if (e.target.files) uploadFiles(e.target.files);
                }}
                className="hidden"
              />

              <div className="flex justify-center gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="px-5 py-2.5 bg-nexus-accent hover:bg-nexus-accent-hover text-white rounded-xl text-xs font-bold transition-all shadow-lg flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {uploading ? <Loader2 className="animate-spin" size={16} /> : <Upload size={16} />}
                  {uploading ? 'Enviando Fotos...' : 'Selecionar Arquivos'}
                </button>

                <button
                  type="button"
                  onClick={startCamera}
                  disabled={uploading}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Camera size={16} />
                  Abrir Câmera
                </button>
              </div>

              <p className="text-[11px] text-slate-500">
                Formatos aceitos: JPG, PNG, WEBP (Máx. 10MB por foto)
              </p>
            </div>
          )}

          {/* Grid de Fotos Salvas na Galeria */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              Fotos Cadastradas ({photos.length})
            </h3>

            {photos.length === 0 ? (
              <div className="p-8 border border-nexus-border rounded-xl text-center text-slate-500">
                Nenhuma foto cadastrada para este veículo.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {photos.map((photo) => {
                  const photoSrc = getFullPhotoUrl(photo.storagePath || photo.url);
                  const isMain = photo.isMain;

                  return (
                    <div
                      key={photo.id}
                      className={`relative aspect-[4/3] bg-slate-950 rounded-xl overflow-hidden border-2 group shadow-md transition-all ${
                        isMain ? 'border-amber-400 ring-2 ring-amber-400/20' : 'border-nexus-border hover:border-slate-600'
                      }`}
                    >
                      <img
                        src={photoSrc}
                        alt={photo.fileName || 'Foto do veículo'}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=400&q=80';
                        }}
                      />

                      {isMain && (
                        <div className="absolute top-2 left-2 bg-amber-400 text-slate-950 font-black text-[10px] uppercase px-2 py-0.5 rounded shadow-lg flex items-center gap-1">
                          <Star size={10} className="fill-slate-950" />
                          <span>Capa</span>
                        </div>
                      )}

                      <div className="absolute inset-0 bg-black/60 backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
                        {!isMain && (
                          <button
                            type="button"
                            onClick={() => handleSetMainPhoto(photo.id)}
                            title="Definir como foto de Capa"
                            className="p-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg transition-colors cursor-pointer shadow-md"
                          >
                            <Star size={14} />
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleDeletePhoto(photo.id)}
                          title="Excluir Foto"
                          className="p-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg transition-colors cursor-pointer shadow-md"
                        >
                          <Trash2 size={14} />
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
            onClick={handleCloseModal}
            className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            Concluir
          </button>
        </div>
      </div>
    </div>
  );
}