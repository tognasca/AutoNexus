import { useState, useRef, useEffect } from 'react';
import { Camera, X, RefreshCw, Check, AlertCircle } from 'lucide-react';

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPhotoCaptured: (file: File) => void;
}

export function CameraCaptureModal({ isOpen, onClose, onPhotoCaptured }: CameraCaptureModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);

  const startCamera = async () => {
    try {
      setCameraError(null);
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      console.error('Erro ao acessar câmera:', err);
      setCameraError('Não foi possível acessar a câmera. Verifique as permissões do navegador.');
    }
  };

  useEffect(() => {
    if (isOpen && !capturedImage) {
      startCamera();
    }
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isOpen, facingMode]);

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    const context = canvas.getContext('2d');
    if (context) {
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setCapturedImage(dataUrl);

      // Pausa o stream de vídeo enquanto visualiza o preview
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    startCamera();
  };

  const handleConfirm = () => {
    if (!canvasRef.current || !capturedImage) return;

    canvasRef.current.toBlob(
      (blob) => {
        if (blob) {
          const file = new File([blob], `camera_photo_${Date.now()}.jpg`, { type: 'image/jpeg' });
          onPhotoCaptured(file);
          handleClose();
        }
      },
      'image/jpeg',
      0.9
    );
  };

  const handleToggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  const handleClose = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    setCapturedImage(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-nexus-card border border-nexus-border rounded-2xl w-full max-w-2xl overflow-hidden flex flex-col shadow-2xl">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-nexus-border">
          <div className="flex items-center gap-2">
            <Camera size={20} className="text-nexus-accent" />
            <h2 className="text-base font-bold text-white">Captura de Foto</h2>
          </div>
          <button onClick={handleClose} className="text-slate-400 hover:text-white transition-colors cursor-pointer">
            <X size={20} />
          </button>
        </div>

        {/* Área de Visualização */}
        <div className="relative bg-black aspect-video flex items-center justify-center overflow-hidden">
          {cameraError ? (
            <div className="p-6 text-center text-red-400 flex flex-col items-center gap-2">
              <AlertCircle size={36} />
              <p className="text-sm font-medium">{cameraError}</p>
            </div>
          ) : capturedImage ? (
            <img src={capturedImage} alt="Foto Capturada" className="w-full h-full object-contain" />
          ) : (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          )}

          {/* Canvas oculto para desenhar a imagem */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Botão de Trocar Câmera (Frontal / Traseira) */}
          {!capturedImage && !cameraError && (
            <button
              onClick={handleToggleFacingMode}
              title="Alternar Câmera"
              className="absolute top-4 right-4 p-3 bg-black/60 hover:bg-black/80 backdrop-blur-md rounded-full text-white transition-all cursor-pointer shadow-lg"
            >
              <RefreshCw size={18} />
            </button>
          )}
        </div>

        {/* Controles / Ações */}
        <div className="p-5 border-t border-nexus-border flex items-center justify-center gap-4 bg-slate-900/60">
          {capturedImage ? (
            <>
              <button
                onClick={handleRetake}
                className="flex items-center gap-2 px-5 py-2.5 bg-nexus-border hover:bg-slate-700 text-white rounded-lg text-sm font-semibold transition-colors cursor-pointer"
              >
                <RefreshCw size={16} />
                Tirar Outra
              </button>
              <button
                onClick={handleConfirm}
                className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-semibold transition-colors cursor-pointer shadow-lg shadow-emerald-600/20"
              >
                <Check size={18} />
                Confirmar e Enviar
              </button>
            </>
          ) : (
            <button
              onClick={handleCapture}
              disabled={!!cameraError}
              className="flex items-center gap-2 px-8 py-3 bg-nexus-accent hover:bg-nexus-accent-hover text-white rounded-xl text-base font-bold shadow-lg shadow-blue-500/30 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <Camera size={20} />
              Capturar Foto
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
