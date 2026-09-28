import { useState, useRef, useEffect, useCallback } from 'react';
import {
  X,
  Upload,
  Camera,
  Star,
  Trash2,
  Loader2,
  Image as ImageIcon,
  VideoOff,
  ZoomIn,
  Images,
  Sparkles
} from 'lucide-react';
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

export const getFullPhotoUrl = (path?: string): string => {
  if (!path) return '/placeholder-car.png';

  const value = String(path).trim();
  if (!value) return '/placeholder-car.png';

  if (value.startsWith('http://') || value.startsWith('https://') || value.startsWith('blob:')) {
    return value;
  }

  let normalized = value.replace(/\\/g, '/').trim();

  if (normalized.startsWith('/')) return normalized;
  if (normalized.startsWith('api/')) return `/${normalized}`;

  return `/${normalized}`;
};

const photoSrc = (photo: VehiclePhoto) =>
  getFullPhotoUrl(photo.url || photo.storagePath);

export function VehiclePhotosModal({
  isOpen,
  vehicle,
  onClose,
  onPhotosUpdated
}: VehiclePhotosModalProps) {
  const [photos, setPhotos] = useState<VehiclePhoto[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [lightboxId, setLightboxId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [busyPhotoId, setBusyPhotoId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsCameraActive(false);
  }, []);

  const loadPhotos = useCallback(async () => {
    if (!vehicle?.id) {
      setPhotos([]);
      return;
    }

    try {
      setLoadingPhotos(true);
      setError(null);

      const response = await request(`/vehicles/${vehicle.id}/photos`, {
        method: 'GET'
      });

      let data: VehiclePhoto[] = [];

      if (Array.isArray(response)) {
        data = response;
      } else if (Array.isArray(response?.photos)) {
        data = response.photos;
      } else if (Array.isArray(response?.data)) {
        data = response.data;
      }

      data.sort((a, b) => {
        if (a.isMain && !b.isMain) return -1;
        if (!a.isMain && b.isMain) return 1;
        return (a.order ?? 0) - (b.order ?? 0);
      });

      setPhotos(data);
    } catch (err: any) {
      setPhotos([]);
      setError(err?.message || 'Erro ao carregar as fotos do veículo.');
    } finally {
      setLoadingPhotos(false);
    }
  }, [vehicle?.id]);

  useEffect(() => {
    if (isOpen && vehicle?.id) {
      loadPhotos();
    }
  }, [isOpen, vehicle?.id, loadPhotos]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  const startCamera = async () => {
    setError(null);

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Seu navegador não suporta acesso à câmera.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      });

      streamRef.current = stream;
      setIsCameraActive(true);

      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => undefined);
        }
      }, 50);
    } catch (err: any) {
      setIsCameraActive(false);
      setError(
        err?.message ||
          'Não foi possível acessar a câmera. Verifique as permissões do navegador.'
      );
    }
  };

  const uploadFiles = async (files: File[] | FileList) => {
    if (!vehicle || !files || files.length === 0) return;

    try {
      setUploading(true);
      setError(null);

      const formData = new FormData();

      Array.from(files).forEach((file) => {
        formData.append('files', file);
      });

      await request(`/vehicles/${vehicle.id}/photos`, {
        method: 'POST',
        body: formData
      });

      await loadPhotos();
      onPhotosUpdated();
    } catch (err: any) {
      setError(err?.message || 'Erro ao enviar foto para o servidor.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) {
      setError('Câmera ainda não está disponível.');
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
      setError('A câmera ainda está inicializando. Aguarde um instante.');
      return;
    }

    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setError('Não foi possível processar a imagem da câmera.');
      return;
    }

    ctx.drawImage(video, 0, 0, width, height);

    canvas.toBlob(
      async (blob) => {
        if (!blob) {
          setError('Erro ao capturar imagem da câmera.');
          return;
        }

        const file = new File([blob], `camera_${Date.now()}.jpg`, {
          type: 'image/jpeg'
        });

        await uploadFiles([file]);
        stopCamera();
      },
      'image/jpeg',
      0.92
    );
  };

  const handleSetMainPhoto = async (photoId: string) => {
    if (!vehicle) return;

    try {
      setBusyPhotoId(photoId);
      setError(null);

      await request(`/vehicles/${vehicle.id}/photos/${photoId}/main`, {
        method: 'PATCH'
      });

      await loadPhotos();
      onPhotosUpdated();
    } catch (err: any) {
      setError(err?.message || 'Erro ao definir foto principal.');
    } finally {
      setBusyPhotoId(null);
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    if (!vehicle) return;

    try {
      setBusyPhotoId(photoId);
      setError(null);

      await request(`/vehicles/${vehicle.id}/photos/${photoId}`, {
        method: 'DELETE'
      });

      setPendingDeleteId(null);
      if (lightboxId === photoId) setLightboxId(null);

      await loadPhotos();
      onPhotosUpdated();
    } catch (err: any) {
      setError(err?.message || 'Erro ao excluir foto.');
    } finally {
      setBusyPhotoId(null);
    }
  };

  const handleCloseModal = () => {
    stopCamera();
    setLightboxId(null);
    setPendingDeleteId(null);
    onClose();
  };

  const onDropFiles = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    if (event.dataTransfer.files?.length) {
      uploadFiles(event.dataTransfer.files);
    }
  };

  if (!isOpen || !vehicle) return null;

  const coverPhoto = photos.find((photo) => photo.isMain) ?? photos[0];
  const galleryPhotos = photos.filter((photo) => photo.id !== coverPhoto?.id);
  const lightboxPhoto = photos.find((photo) => photo.id === lightboxId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
      <div
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl"
        onClick={handleCloseModal}
      />

      <div className="relative w-full max-w-5xl max-h-[92vh] overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 via-nexus-card to-slate-950 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.85)]">
        <div className="pointer-events-none absolute -top-24 right-10 h-56 w-56 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 left-0 h-48 w-48 rounded-full bg-cyan-400/10 blur-3xl" />

        <header className="relative flex items-start justify-between gap-4 border-b border-white/10 px-5 py-4 sm:px-7">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-blue-300/80">
              Estúdio de fotos
            </p>
            <h2 className="mt-1 truncate text-xl font-bold text-white">
              {vehicle.brand} {vehicle.model}
            </h2>
            <p className="mt-1 flex items-center gap-2 text-xs text-slate-400">
              <Images size={14} className="text-blue-400" />
              {photos.length === 0
                ? 'Nenhuma foto ainda'
                : `${photos.length} ${photos.length === 1 ? 'foto na galeria' : 'fotos na galeria'}`}
            </p>
          </div>

          <button
            type="button"
            onClick={handleCloseModal}
            className="rounded-full border border-white/10 bg-white/5 p-2 text-slate-300 transition hover:bg-white/10 hover:text-white cursor-pointer"
          >
            <X size={18} />
          </button>
        </header>

        <div className="relative max-h-[calc(92vh-88px)] overflow-y-auto p-5 sm:p-7">
          {error && (
            <div className="mb-5 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
              {error}
            </div>
          )}

          {isCameraActive ? (
            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-black shadow-2xl">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="aspect-[16/10] w-full object-cover"
              />
              <canvas ref={canvasRef} className="hidden" />

              <div className="pointer-events-none absolute inset-6 rounded-[28px] border border-white/20" />
              <div className="absolute left-5 top-5 rounded-full bg-black/50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white/80">
                Câmera ao vivo
              </div>

              <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-6 py-6">
                <button
                  type="button"
                  onClick={stopCamera}
                  disabled={uploading}
                  className="rounded-full border border-white/15 bg-white/10 p-3 text-white transition hover:bg-white/20 cursor-pointer disabled:opacity-50"
                >
                  <VideoOff size={18} />
                </button>

                <button
                  type="button"
                  onClick={capturePhoto}
                  disabled={uploading}
                  className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-white/80 bg-white text-slate-950 shadow-2xl transition hover:scale-105 cursor-pointer disabled:opacity-50"
                >
                  {uploading ? (
                    <Loader2 className="animate-spin" size={22} />
                  ) : (
                    <span className="h-11 w-11 rounded-full bg-white ring-4 ring-slate-900/20" />
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div
              onDragOver={(event) => {
                event.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={onDropFiles}
              className={`relative overflow-hidden rounded-3xl border-2 border-dashed p-6 text-center transition ${
                isDragging
                  ? 'border-blue-400 bg-blue-500/10'
                  : 'border-white/10 bg-white/[0.03] hover:border-blue-400/50'
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                multiple
                accept="image/jpeg,image/png,image/webp"
                onChange={(event) => {
                  if (event.target.files) uploadFiles(event.target.files);
                }}
                className="hidden"
              />

              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/15 text-blue-300">
                {uploading ? <Loader2 className="animate-spin" size={24} /> : <Upload size={24} />}
              </div>

              <h3 className="text-base font-semibold text-white">
                {uploading ? 'Enviando fotos...' : 'Arraste as fotos para cá'}
              </h3>
              <p className="mt-1 text-sm text-slate-400">
                JPG, PNG ou WEBP · até 10 MB por arquivo
              </p>

              <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-400 cursor-pointer disabled:opacity-50"
                >
                  <ImageIcon size={16} />
                  Escolher arquivos
                </button>

                <button
                  type="button"
                  onClick={startCamera}
                  disabled={uploading}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-semibold text-slate-100 transition hover:bg-white/10 cursor-pointer disabled:opacity-50"
                >
                  <Camera size={16} />
                  Usar câmera
                </button>
              </div>
            </div>
          )}

          <section className="mt-7">
            {loadingPhotos ? (
              <div className="flex flex-col items-center justify-center rounded-3xl border border-white/5 bg-white/[0.02] py-16 text-slate-400">
                <Loader2 className="mb-3 animate-spin text-blue-400" size={28} />
                Carregando galeria...
              </div>
            ) : photos.length === 0 ? (
              <div className="rounded-3xl border border-white/5 bg-white/[0.02] px-6 py-14 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-800 text-slate-400">
                  <Sparkles size={26} />
                </div>
                <h3 className="text-lg font-semibold text-white">Galeria vazia</h3>
                <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">
                  Adicione a foto de capa e os ângulos do veículo. A primeira imagem se torna a capa automaticamente.
                </p>
              </div>
            ) : (
              <div className={`grid gap-4 ${galleryPhotos.length > 0 ? 'lg:grid-cols-[1.4fr_1fr]' : ''}`}>
                {coverPhoto && (
                  <article className="group relative overflow-hidden rounded-3xl border border-amber-400/30 bg-slate-950 shadow-xl">
                    <img
                      src={photoSrc(coverPhoto)}
                      alt={coverPhoto.fileName || 'Foto de capa'}
                      className="h-full min-h-[280px] w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                    <div className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-amber-400 px-3 py-1 text-[11px] font-black uppercase tracking-wide text-slate-950">
                      <Star size={12} className="fill-slate-950" />
                      Capa
                    </div>
                    <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between gap-3">
                      <p className="truncate text-sm font-medium text-white">
                        Foto principal do anúncio
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setLightboxId(coverPhoto.id)}
                          className="rounded-xl bg-white/15 p-2 text-white backdrop-blur-md transition hover:bg-white/25 cursor-pointer"
                        >
                          <ZoomIn size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setPendingDeleteId(coverPhoto.id)}
                          className="rounded-xl bg-rose-500/90 p-2 text-white transition hover:bg-rose-400 cursor-pointer"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </article>
                )}

                <div className="grid grid-cols-2 gap-3 content-start">
                  {galleryPhotos.map((photo) => {
                    const busy = busyPhotoId === photo.id;

                    return (
                      <article
                        key={photo.id}
                        className="group relative aspect-[4/3] overflow-hidden rounded-2xl border border-white/10 bg-slate-950"
                      >
                        <img
                          src={photoSrc(photo)}
                          alt={photo.fileName || 'Foto do veículo'}
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                          loading="lazy"
                          onError={(event) => {
                            event.currentTarget.src = '/placeholder-car.png';
                          }}
                        />

                        <div className="absolute inset-0 flex items-center justify-center gap-2 bg-slate-950/70 opacity-0 backdrop-blur-[2px] transition group-hover:opacity-100">
                          <button
                            type="button"
                            onClick={() => setLightboxId(photo.id)}
                            className="rounded-lg bg-white/15 p-2 text-white transition hover:bg-white/25 cursor-pointer"
                            title="Ampliar"
                          >
                            <ZoomIn size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSetMainPhoto(photo.id)}
                            disabled={busy}
                            className="rounded-lg bg-amber-400 p-2 text-slate-950 transition hover:bg-amber-300 cursor-pointer disabled:opacity-50"
                            title="Definir como capa"
                          >
                            {busy ? <Loader2 size={14} className="animate-spin" /> : <Star size={14} />}
                          </button>
                          <button
                            type="button"
                            onClick={() => setPendingDeleteId(photo.id)}
                            className="rounded-lg bg-rose-600 p-2 text-white transition hover:bg-rose-500 cursor-pointer"
                            title="Excluir"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            )}
          </section>
        </div>
      </div>

      {lightboxPhoto && (
        <div
          className="absolute inset-0 z-20 flex items-center justify-center bg-black/85 p-4"
          onClick={() => setLightboxId(null)}
        >
          <img
            src={photoSrc(lightboxPhoto)}
            alt={lightboxPhoto.fileName || 'Foto ampliada'}
            className="max-h-[88vh] max-w-full rounded-2xl object-contain shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          />
          <button
            type="button"
            onClick={() => setLightboxId(null)}
            className="absolute right-6 top-6 rounded-full bg-white/10 p-2 text-white cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {pendingDeleteId && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-950/70 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-white">Remover esta foto?</h3>
            <p className="mt-2 text-sm text-slate-400">
              Ela sai da galeria e deixa de aparecer no catálogo.
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setPendingDeleteId(null)}
                className="rounded-xl px-4 py-2 text-sm text-slate-300 hover:bg-white/5 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleDeletePhoto(pendingDeleteId)}
                disabled={busyPhotoId === pendingDeleteId}
                className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-500 cursor-pointer disabled:opacity-50"
              >
                {busyPhotoId === pendingDeleteId && <Loader2 size={14} className="animate-spin" />}
                Remover
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
