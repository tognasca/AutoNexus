import React, { useState, useRef, useEffect } from 'react';
import { CurrencyInput } from '../ui/CurrencyInput';
import { formatCpfCnpj, formatCurrency, isValidCpfCnpj } from '../../utils/formatters';
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
  vehicleId: string;
  vehiclePrice: number;
  entryValue: number;
  tradeValue: number;
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
  vehicleId,
  vehiclePrice,
  entryValue,
  tradeValue,
  onClose,
}: CreditAnalysisModalProps) {
  const [customerName, setCustomerName] = useState('');
  const [cpf, setCpf] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [monthlyIncome, setMonthlyIncome] = useState<number>(5000);
  const [hasDriverLicense, setHasDriverLicense] = useState(true);
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [maritalStatus, setMaritalStatus] = useState('');
  const [nationality, setNationality] = useState('Brasileira');
  const [cep, setCep] = useState('');
  const [street, setStreet] = useState('');
  const [addressNumber, setAddressNumber] = useState('');
  const [addressComplement, setAddressComplement] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [residenceType, setResidenceType] = useState('');
  const [residenceMonths, setResidenceMonths] = useState('');
  const [occupation, setOccupation] = useState('');
  const [employmentType, setEmploymentType] = useState('');
  const [employerName, setEmployerName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [employmentMonths, setEmploymentMonths] = useState('');
  const [otherIncome, setOtherIncome] = useState<number>(0);
  const [dependents, setDependents] = useState('0');
  const [privacyConsent, setPrivacyConsent] = useState(false);

  // Armazenamento das Fotos em Base64
  const [customerPhoto, setCustomerPhoto] = useState<string | null>(null);
  const [driverLicensePhoto, setDriverLicensePhoto] = useState<string | null>(null);

  // Estados do Feed da Câmera ao Vivo
  const [activeCameraField, setActiveCameraField] = useState<PhotoField | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  const [formStep, setFormStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'pending' | 'approved' | 'rejected' | 'review' | 'unavailable'>('idle');
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

  const handleWizardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formStep === 0) {
      if (!customerName.trim() || !isValidCpfCnpj(cpf) || cpf.replace(/\D/g, '').length !== 11) {
        alert('Informe o nome do cliente e um CPF válido com dígitos verificadores corretos.');
        return;
      }
      if (!birthDate || Number.isNaN(Date.parse(birthDate)) || new Date(birthDate) >= new Date()) {
        alert('Informe uma data de nascimento válida no passado.');
        return;
      }
      if (!/^\d{10,11}$/.test(phone.replace(/\D/g, ''))) {
        alert('Informe um celular válido com DDD.');
        return;
      }
    }
    if (formStep === 1) {
      if (!/^\d{8}$/.test(cep.replace(/\D/g, '')) || !street.trim() || !addressNumber.trim() || !neighborhood.trim() || !city.trim() || state.trim().length !== 2) {
        alert('Preencha CEP, logradouro, número, bairro, cidade e UF corretamente.');
        return;
      }
    }
    if (formStep < 2) {
      setFormStep(current => current + 1);
      return;
    }
    void handleSendToBank(e);
  };

  const handleSendToBank = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !isValidCpfCnpj(cpf) || cpf.replace(/\D/g, '').length !== 11) {
      alert('Informe o nome do cliente e um CPF válido com dígitos verificadores corretos.');
      return;
    }
    if (!birthDate || Number.isNaN(Date.parse(birthDate)) || new Date(birthDate) >= new Date()) {
      alert('Informe uma data de nascimento válida no passado.');
      return;
    }
    if (!/^\d{10,11}$/.test(phone.replace(/\D/g, ''))) { alert('Informe um celular válido com DDD.'); return; }
    if (!/^\d{8}$/.test(cep.replace(/\D/g, '')) || !street.trim() || !addressNumber.trim() || !neighborhood.trim() || !city.trim() || state.trim().length !== 2) {
      alert('Preencha CEP, logradouro, número, bairro, cidade e UF corretamente.'); return;
    }
    if (!occupation.trim() || !employmentType) { alert('Informe a ocupação e o tipo de vínculo profissional.'); return; }
    if (!privacyConsent) { alert('Confirme que o cliente foi informado sobre o uso dos dados para a proposta.'); return; }
    if (monthlyIncome <= 0) {
      alert('A renda mensal deve ser maior que zero.');
      return;
    }

    setLoading(true);
    setStatus('pending');

    try {
      const payload = {
        bankId,
        vehicleId,
        vehiclePrice,
        entryValue,
        tradeValue,
        bankName,
        customerName,
        customerCpf: cpf.replace(/\D/g, ''),
        birthDate,
        monthlyIncome,
        hasDriverLicense,
        phone: phone.replace(/\D/g, ''),
        email: email.trim() || null,
        maritalStatus: maritalStatus || null,
        nationality: nationality.trim() || null,
        addressJson: JSON.stringify({ cep: cep.replace(/\D/g, ''), street: street.trim(), number: addressNumber.trim(), complement: addressComplement.trim() || null, neighborhood: neighborhood.trim(), city: city.trim(), state: state.toUpperCase(), residenceType: residenceType || null, residenceMonths: residenceMonths ? Number(residenceMonths) : null }),
        professionalJson: JSON.stringify({ occupation: occupation.trim(), employmentType, employerName: employerName.trim() || null, jobTitle: jobTitle.trim() || null, employmentMonths: employmentMonths ? Number(employmentMonths) : null, otherIncome, dependents: Number(dependents) }),
        privacyConsent,
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
      } else if (response.status === 'Unavailable') {
        setStatus('unavailable');
        setStatusMessage(response.message || 'O banco não confirmou o recebimento. Nenhuma aprovação foi confirmada.');
      } else if (response.status === 'Pending' || response.status === 'Submitted' || response.status === 'InAnalysis') {
        setStatus('review');
        setStatusMessage(response.message || 'Proposta recebida e aguardando análise. Isso não representa aprovação de crédito.');
      } else {
        setStatus('rejected');
        setStatusMessage(response.message || 'A API não confirmou aprovação nem recebimento da proposta.');
      }
    } catch (err: any) {
      console.error('Erro na submissão de crédito:', err);
      setStatus('rejected');
      setStatusMessage('Não foi possível enviar a proposta. Nenhuma aprovação foi confirmada. Verifique a conexão e tente novamente.');
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

        <p className="px-4 py-2 text-[11px] leading-relaxed text-amber-300 bg-amber-950/20 border-b border-slate-800">A taxa e as parcelas são estimativas. O envio e a aprovação dependem de uma integração real ativa com a financeira; o registro no AutoNexus, sozinho, não confirma envio ao banco.</p>

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
          <form onSubmit={handleWizardSubmit} className="p-6 space-y-4">
            <div className="flex items-center gap-2" aria-label="Etapas da ficha">
              {['Dados básicos', 'Endereço', 'Profissão e documentos'].map((label, index) => (
                <div key={label} className={`flex-1 border-b-2 pb-2 text-[10px] sm:text-xs ${formStep === index ? 'border-blue-400 text-blue-300 font-bold' : formStep > index ? 'border-emerald-500 text-emerald-400' : 'border-slate-700 text-slate-500'}`}>
                  {index + 1}. {label}
                </div>
              ))}
            </div>
            
            {formStep === 0 && <div className="space-y-4">
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
                  required
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

            <div className="border-t border-slate-800 pt-4 space-y-3">
              <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider">Contato e estado civil</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div><label className="text-xs text-slate-400 block mb-1">Celular com DDD *</label><input type="tel" inputMode="numeric" autoComplete="tel" placeholder="(11) 99999-9999" value={phone} onChange={e => setPhone(e.target.value.replace(/[^\d()+\s-]/g, '').slice(0, 16))} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white" required /></div>
                <div><label className="text-xs text-slate-400 block mb-1">E-mail</label><input type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white" /></div>
                <div><label className="text-xs text-slate-400 block mb-1">Estado civil</label><select value={maritalStatus} onChange={e => setMaritalStatus(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white"><option value="">Selecione</option><option>Solteiro(a)</option><option>Casado(a)</option><option>União estável</option><option>Divorciado(a)</option><option>Viúvo(a)</option></select></div>
                <div><label className="text-xs text-slate-400 block mb-1">Nacionalidade</label><input value={nationality} onChange={e => setNationality(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white" /></div>
              </div>
            </div>
            </div>}
            {formStep === 1 && <div className="space-y-4">
            <div className="border-t border-slate-800 pt-4 space-y-3">
              <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider">Endereço residencial</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div><label className="text-xs text-slate-400 block mb-1">CEP *</label><input inputMode="numeric" autoComplete="postal-code" maxLength={9} placeholder="00000-000" value={cep} onChange={e => setCep(e.target.value.replace(/[^\d-]/g, '').slice(0, 9))} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white" required /></div>
                <div><label className="text-xs text-slate-400 block mb-1">Rua / Logradouro *</label><input autoComplete="street-address" value={street} onChange={e => setStreet(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white" required /></div>
                <div><label className="text-xs text-slate-400 block mb-1">Número *</label><input value={addressNumber} onChange={e => setAddressNumber(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white" required /></div>
                <div><label className="text-xs text-slate-400 block mb-1">Complemento</label><input value={addressComplement} onChange={e => setAddressComplement(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white" /></div>
                <div><label className="text-xs text-slate-400 block mb-1">Bairro *</label><input value={neighborhood} onChange={e => setNeighborhood(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white" required /></div>
                <div><label className="text-xs text-slate-400 block mb-1">Cidade *</label><input value={city} onChange={e => setCity(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white" required /></div>
                <div><label className="text-xs text-slate-400 block mb-1">UF *</label><input maxLength={2} value={state} onChange={e => setState(e.target.value.replace(/[^a-zA-Z]/g, '').toUpperCase())} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white uppercase" required /></div>
                <div><label className="text-xs text-slate-400 block mb-1">Tipo de residência</label><select value={residenceType} onChange={e => setResidenceType(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white"><option value="">Selecione</option><option>Própria</option><option>Alugada</option><option>Financiada</option><option>Com familiares</option><option>Outra</option></select></div>
                <div><label className="text-xs text-slate-400 block mb-1">Tempo no endereço (meses)</label><input type="number" min="0" max="1200" value={residenceMonths} onChange={e => setResidenceMonths(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white" /></div>
              </div>
            </div>
            </div>}
            {formStep === 2 && <div className="space-y-4">
            <div className="border-t border-slate-800 pt-4 space-y-3">
              <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider">Dados profissionais e renda</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div><label className="text-xs text-slate-400 block mb-1">Ocupação / profissão *</label><input value={occupation} onChange={e => setOccupation(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white" required /></div>
                <div><label className="text-xs text-slate-400 block mb-1">Vínculo profissional *</label><select value={employmentType} onChange={e => setEmploymentType(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white" required><option value="">Selecione</option><option value="CLT">CLT</option><option value="Autônomo">Autônomo</option><option value="Empresário">Empresário</option><option value="Servidor público">Servidor público</option><option value="Aposentado/Pensionista">Aposentado/Pensionista</option><option value="Informal">Informal</option><option value="Outro">Outro</option></select></div>
                <div><label className="text-xs text-slate-400 block mb-1">Empresa / fonte pagadora</label><input value={employerName} onChange={e => setEmployerName(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white" /></div>
                <div><label className="text-xs text-slate-400 block mb-1">Cargo</label><input value={jobTitle} onChange={e => setJobTitle(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white" /></div>
                <div><label className="text-xs text-slate-400 block mb-1">Tempo de trabalho (meses)</label><input type="number" min="0" max="1200" value={employmentMonths} onChange={e => setEmploymentMonths(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white" /></div>
                <div><label className="text-xs text-slate-400 block mb-1">Outras rendas mensais</label><CurrencyInput value={otherIncome} onChange={setOtherIncome} /></div>
                <div><label className="text-xs text-slate-400 block mb-1">Número de dependentes</label><input type="number" min="0" max="30" value={dependents} onChange={e => setDependents(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white" /></div>
              </div>
            </div>
            <label className="flex items-start gap-2 text-xs text-slate-300 border-t border-slate-800 pt-4"><input type="checkbox" checked={privacyConsent} onChange={e => setPrivacyConsent(e.target.checked)} className="mt-0.5" required /><span>Confirmo que o cliente foi informado sobre a coleta e o uso destes dados para dar andamento à solicitação de financiamento. Revise o aviso de privacidade e a base legal aplicável antes de produção. *</span></label>

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

            </div>}
            {/* Botões de Ação */}
            <div className="flex justify-between gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl transition-colors"
              >
                Cancelar
              </button>
              {formStep > 0 && <button type="button" onClick={() => setFormStep(current => Math.max(0, current - 1))} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl transition-colors">Voltar</button>}
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition-colors shadow-sm disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                {loading ? 'Enviando...' : formStep < 2 ? 'Continuar' : 'Enviar proposta'}
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

        {status === 'review' && (
          <div className="p-8 text-center space-y-4">
            <h4 className="font-bold text-white text-lg">Proposta em análise</h4>
            <p className="text-sm text-amber-300 bg-amber-950/40 p-3 rounded-lg">{statusMessage}</p>
            <button onClick={onClose} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl">Concluir</button>
          </div>
        )}

        {status === 'unavailable' && (
          <div className="p-8 text-center space-y-4">
            <h4 className="font-bold text-white text-lg">Envio não confirmado</h4>
            <p className="text-sm text-amber-300 bg-amber-950/40 p-3 rounded-lg">{statusMessage}</p>
            <p className="text-xs text-slate-400">Não considere esta proposta aprovada. Confirme a integração do banco antes de tentar novamente.</p>
            <button onClick={onClose} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl">Fechar</button>
          </div>
        )}

        {status === 'rejected' && (
          <div className="p-8 text-center space-y-4">
            <h4 className="font-bold text-white text-lg">Não foi possível confirmar aprovação</h4>
            <p className="text-sm text-rose-300 bg-rose-950/40 p-3 rounded-lg">{statusMessage}</p>
            <button onClick={onClose} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl">Fechar</button>
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