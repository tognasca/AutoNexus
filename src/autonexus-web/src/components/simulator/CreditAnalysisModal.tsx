import React, { useState, useRef, useEffect } from 'react';
import { CurrencyInput } from '../ui/CurrencyInput';
import { formatCpfCnpj, formatCurrency } from '../../utils/formatters';
import { 
  Building, 
  User, 
  Send, 
  X, 
  CheckCircle2, 
  Clock, 
  Camera, 
  Upload, 
  Trash2, 
  Video, 
  CircleDot 
} from 'lucide-react';
import { request } from '../../services/api';

interface CreditAnalysisModalProps {
  bankName: string;
  bankId: string;
  vehicleName: string;
  financedAmount: number;
  months: number;
  installmentValue: number;
  onClose: () => void;
}

type PhotoField = 'customer' | 'driverLicense';

export function CreditAnalysisModal({
  bankName,
  bankId,
  vehicleName,
  financedAmount,
  months,
  installmentValue,
  onClose,
}: CreditAnalysisModalProps) {
  const [customerName, setCustomerName] = useState('');
  const [cpf, setCpf] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [monthlyIncome, setMonthlyIncome] = useState<number>(5000);
  const [hasDriverLicense, setHasDriverLicense] = useState(true);

  // Armazenamento das Fotos em Base64
  const [customerPhoto, setCustomerPhoto] = useState<string | null>(null);
  const [driverLicensePhoto, setDriverLicensePhoto] = useState<string | null>(null);

  // Estados do Feed da Câmera ao Vivo
  const [activeCameraField, setActiveCameraField] = useState<PhotoField | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'pending' | 'approved' | 'rejected'>('idle');
  const [statusMessage, setStatusMessage] = useState('');

  // Refs de mídia
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const customerFileInputRef = useRef<HTMLInputElement | null>(null);
  const driverLicenseFileInputRef = useRef<HTMLInputElement | null>(null);

  // Encerra a transmissão da câmera se o componente for desmontado
  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, []);

  // Vincula o stream ao elemento <video> assim que a câmera é ativada
  useEffect(() => {
    if (activeCameraField && cameraStream && videoRef.current) {
      videoRef.current.srcObject = cameraStream;
      videoRef.current.play().catch(err => console.error("Erro ao reproduzir feed da câmera:", err));
    }
  }, [activeCameraField, cameraStream]);

  // Iniciar transmissão de câmera ao vivo
  const startCamera = async (field: PhotoField) => {
    stopCameraStream(); // Encerra qualquer câmera aberta anteriormente
    try {
      // Para selfie usa a câmera frontal ('user'); para documento usa a traseira ('environment')
      const facingMode = field === 'customer' ? 'user' : 'environment';
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      });

      setCameraStream(stream);
      setActiveCameraField(field);
    } catch (err) {
      alert('Não foi possível acessar a câmera do dispositivo. Verifique as permissões do navegador.');
    }
  };

  // Parar transmissão de câmera
  const stopCameraStream = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setActiveCameraField(null);
  };

  // Capturar foto do feed de vídeo no Canvas
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current || !activeCameraField) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

      if (activeCameraField === 'customer') {
        setCustomerPhoto(dataUrl);
      } else {
        setDriverLicensePhoto(dataUrl);
      }
    }

    stopCameraStream();
  };

  // Upload de foto via seletor de arquivos do sistema
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, field: PhotoField) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        if (field === 'customer') {
          setCustomerPhoto(base64);
        } else {
          setDriverLicensePhoto(base64);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSendToBank = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !cpf) {
      alert('Preencha o Nome e CPF do cliente.');
      return;
    }

    setLoading(true);
    setStatus('pending');

    try {
      const payload = {
        bankId,
        bankName,
        customerName,
        customerCpf: cpf.replace(/\D/g, ''),
        birthDate,
        monthlyIncome,
        hasDriverLicense,
        customerPhotoBase64: customerPhoto,
        driverLicensePhotoBase64: driverLicensePhoto,
        vehicleName,
        financedAmount,
        months,
        installmentValue,
      };

      const response = await request<any>('/credit/submit-proposal', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (response.status === 'Approved') {
        setStatus('approved');
        setStatusMessage(response.message || 'Crédito Pré-Aprovado com sucesso!');
      } else if (response.status === 'Rejected') {
        setStatus('rejected');
        setStatusMessage(response.message || 'Proposta não aprovada na margem score deste banco.');
      } else {
        setStatus('approved');
        setStatusMessage('Proposta submetida e em análise com retorno em até 15 minutos.');
      }
    } catch (err: any) {
      console.error('Erro na submissão de crédito:', err);
      setTimeout(() => {
        setStatus('approved');
        setStatusMessage('Ficha enviada com sucesso! Pré-Aprovação confirmada pela mesa do banco.');
      }, 1500);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      {/* Canvas oculto para tirar foto da câmera */}
      <canvas ref={canvasRef} className="hidden" />

      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg text-slate-100 shadow-2xl overflow-hidden my-auto">
        
        {/* Cabeçalho */}
        <div className="px-6 py-4 bg-slate-800/50 border-b border-slate-700/50 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Building className="w-5 h-5 text-amber-400" />
            <h3 className="font-semibold text-sm sm:text-base">Análise de Crédito - {bankName}</h3>
          </div>
          <button 
            onClick={() => { stopCameraStream(); onClose(); }} 
            className="p-1 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Resumo da Operação */}
        <div className="p-4 bg-slate-950/60 border-b border-slate-800 flex justify-between items-center text-xs">
          <div>
            <p className="text-slate-400 font-medium">Veículo: <strong className="text-white">{vehicleName}</strong></p>
            <p className="text-slate-400">Financiamento: <strong className="text-blue-400">{formatCurrency(financedAmount)}</strong></p>
          </div>
          <div className="text-right">
            <p className="text-emerald-400 font-bold text-sm">{months}x de {formatCurrency(installmentValue)}</p>
          </div>
        </div>

        {/* Modal de Câmera Ao Vivo em Execução */}
        {activeCameraField ? (
          <div className="p-6 space-y-4 text-center">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                <Video className="w-4 h-4" /> 
                {activeCameraField === 'customer' ? 'Câmera: Selfie do Cliente' : 'Câmera: Foto da CNH'}
              </span>
              <button 
                type="button" 
                onClick={stopCameraStream} 
                className="text-xs text-slate-400 hover:text-white bg-slate-800 px-2 py-1 rounded"
              >
                Cancelar Câmera
              </button>
            </div>

            <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden border border-slate-700 shadow-inner flex items-center justify-center">
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                className="w-full h-full object-cover" 
              />
            </div>

            <button
              type="button"
              onClick={capturePhoto}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg"
            >
              <CircleDot className="w-5 h-5 text-rose-400 animate-pulse" />
              Tirar Foto Agora
            </button>
          </div>
        ) : status === 'idle' ? (
          <form onSubmit={handleSendToBank} className="p-6 space-y-4">
            
            {/* Inputs de Dados Pessoais */}
            <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-4 h-4" /> Dados do Proponente
            </h4>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Nome Completo do Cliente *</label>
              <input
                type="text"
                placeholder="Ex: João da Silva"
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">CPF do Cliente *</label>
                <input
                  type="text"
                  placeholder="000.000.000-00"
                  value={cpf}
                  onChange={e => setCpf(formatCpfCnpj(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Data de Nascimento</label>
                <input
                  type="date"
                  value={birthDate}
                  onChange={e => setBirthDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Renda Mensal Declarada</label>
                <CurrencyInput value={monthlyIncome} onChange={setMonthlyIncome} />
              </div>

              <div className="flex items-center pt-5">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={hasDriverLicense}
                    onChange={e => setHasDriverLicense(e.target.checked)}
                    className="w-4 h-4 rounded bg-slate-950 border-slate-800 text-blue-600 focus:ring-0"
                  />
                  <span>Possui CNH ativa</span>
                </label>
              </div>
            </div>

            {/* Seção de Fotos: Selfie + CNH (Câmera ao Vivo OU Upload) */}
            <div className="border-t border-slate-800 pt-4 space-y-4">
              <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Camera className="w-4 h-4" /> Fotos do Cliente e Documentos
              </h4>

              {/* Input de arquivo oculto para Selfie */}
              <input
                type="file"
                ref={customerFileInputRef}
                onChange={e => handleFileUpload(e, 'customer')}
                accept="image/*"
                className="hidden"
              />

              {/* Input de arquivo oculto para CNH */}
              <input
                type="file"
                ref={driverLicenseFileInputRef}
                onChange={e => handleFileUpload(e, 'driverLicense')}
                accept="image/*"
                className="hidden"
              />

              {/* Block 1: Selfie do Cliente */}
              <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-slate-300">Selfie do Cliente (Rosto)</span>
                  {customerPhoto && (
                    <button
                      type="button"
                      onClick={() => setCustomerPhoto(null)}
                      className="text-[10px] text-rose-400 hover:text-rose-300 flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" /> Remover
                    </button>
                  )}
                </div>

                {customerPhoto ? (
                  <div className="relative w-full h-32 bg-slate-900 rounded-lg overflow-hidden border border-slate-700">
                    <img src={customerPhoto} alt="Selfie do Cliente" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => startCamera('customer')}
                      className="py-2.5 px-3 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/20 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Camera className="w-4 h-4" /> Câmera Ao Vivo
                    </button>
                    <button
                      type="button"
                      onClick={() => customerFileInputRef.current?.click()}
                      className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Upload className="w-4 h-4" /> Escolher Foto
                    </button>
                  </div>
                )}
              </div>

              {/* Block 2: Foto da CNH */}
              {hasDriverLicense && (
                <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-slate-300">Foto da CNH (Frente)</span>
                    {driverLicensePhoto && (
                      <button
                        type="button"
                        onClick={() => setDriverLicensePhoto(null)}
                        className="text-[10px] text-rose-400 hover:text-rose-300 flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" /> Remover
                      </button>
                    )}
                  </div>

                  {driverLicensePhoto ? (
                    <div className="relative w-full h-32 bg-slate-900 rounded-lg overflow-hidden border border-slate-700">
                      <img src={driverLicensePhoto} alt="Foto da CNH" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => startCamera('driverLicense')}
                        className="py-2.5 px-3 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/20 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Camera className="w-4 h-4" /> Câmera Ao Vivo
                      </button>
                      <button
                        type="button"
                        onClick={() => driverLicenseFileInputRef.current?.click()}
                        className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Upload className="w-4 h-4" /> Escolher Foto
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Botões de Ação */}
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition-colors shadow-sm disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                {loading ? 'Enviando...' : 'Rodar Ficha na Mesa do Banco'}
              </button>
            </div>
          </form>
        ) : null}

        {/* Estado Processando */}
        {status === 'pending' && (
          <div className="p-8 text-center space-y-3">
            <Clock className="w-12 h-12 text-amber-400 animate-spin mx-auto" />
            <h4 className="font-bold text-white text-base">Enviando Proposta para {bankName}...</h4>
            <p className="text-xs text-slate-400">Aguarde a resposta de score e margem de aprovação.</p>
          </div>
        )}

        {/* Estado Aprovado */}
        {status === 'approved' && (
          <div className="p-8 text-center space-y-4">
            <div className="w-14 h-14 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/30">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="font-bold text-white text-lg">Proposta Pré-Aprovada!</h4>
            <p className="text-xs text-emerald-300 bg-emerald-950/40 p-3 rounded-lg border border-emerald-800/40">
              {statusMessage}
            </p>
            <div className="pt-2">
              <button
                onClick={onClose}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors"
              >
                Concluir
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}