import { useEffect, useState } from 'react';
import type { LookupItem } from '../../types/lookup';
import { FuelType, TransmissionType, VehicleStatus, type UpdateVehicleInput } from '../../types/vehicle';
import { CurrencyInput } from '../ui/CurrencyInput';
import {
  X,
  Sparkles,
  Loader2,
  Camera,
  FileText,
  DollarSign,
  Car,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Upload,
  Star,
  Download,
} from 'lucide-react';
import { vehicleService } from '../../services/vehicleService';
import { catalogService, getPhotoUrl } from '../../services/catalogService';
import { request } from '../../services/api';

interface EditVehicleModalProps {
  isOpen: boolean;
  vehicleId: string | null;
  onClose: () => void;
  onSuccess: () => void;
  vehicleTypes: LookupItem[];
}

type TabType = 'details' | 'photos' | 'documents' | 'costs';

export function EditVehicleModal({ isOpen, vehicleId, onClose, onSuccess, vehicleTypes }: EditVehicleModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('details');
  const [fetching, setFetching] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form de Dados Principais
  const [form, setForm] = useState<UpdateVehicleInput>({
    id: '',
    vehicleTypeId: vehicleTypes[0]?.id || '',
    brand: '',
    model: '',
    version: '',
    manufacturingYear: new Date().getFullYear(),
    modelYear: new Date().getFullYear(),
    plate: '',
    chassis: '',
    Renavam: '',
    mileage: 0,
    color: '',
    fuel: FuelType.Flex,
    transmission: TransmissionType.Automatico,
    PurchaseValue: 0,
    ListedValue: 0,
    status: VehicleStatus.AVenda,
    notes: '',
  });

  // Estados de Fotos
  const [photos, setPhotos] = useState<any[]>([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);

  // Estados de Documentos
  const [documents, setDocuments] = useState<any[]>([]);
  const [docCategories, setDocCategories] = useState<LookupItem[]>([]);
  const [docName, setDocName] = useState('');
  const [docCategoryId, setDocCategoryId] = useState('');
  const [showInCatalog, setShowInCatalog] = useState(false);
  const [selectedDocFile, setSelectedDocFile] = useState<File | null>(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);

  // Estados de Custos
  const [costs, setCosts] = useState<any[]>([]);
  const [costCategories, setCostCategories] = useState<LookupItem[]>([]);
  const [costDescription, setCostDescription] = useState('');
  const [costCategoryId, setCostCategoryId] = useState('');
  const [costValue, setCostValue] = useState(0);
  const [addingCost, setAddingCost] = useState(false);

  useEffect(() => {
    if (isOpen && vehicleId) {
      setActiveTab('details');
      loadVehicleData(vehicleId);
      loadLookups();
    }
  }, [isOpen, vehicleId]);

  const loadLookups = async () => {
    try {
      const [cats, cCats] = await Promise.all([
        request<LookupItem[]>('/lookup/document-categories').catch(() => []),
        request<LookupItem[]>('/lookup/cost-categories').catch(() => []),
      ]);
      setDocCategories(cats || []);
      if (cats && cats.length > 0) setDocCategoryId(cats[0].id);

      setCostCategories(cCats || []);
      if (cCats && cCats.length > 0) setCostCategoryId(cCats[0].id);
    } catch (e) {
      console.error('Erro ao carregar categorias auxiliares:', e);
    }
  };

  const loadVehicleData = async (id: string) => {
    try {
      setFetching(true);
      setError(null);
      const vehicle = await vehicleService.getById(id);

      const purchaseVal = Number(vehicle.purchaseValue ?? vehicle.PurchaseValue ?? 0);
      const listedVal = Number(vehicle.listedValue ?? vehicle.ListedValue ?? 0);

      setForm({
        id: vehicle.id,
        vehicleTypeId: vehicle.vehicleTypeId || vehicleTypes[0]?.id || '',
        brand: vehicle.brand || '',
        model: vehicle.model || '',
        version: vehicle.version || '',
        manufacturingYear: vehicle.manufacturingYear || new Date().getFullYear(),
        modelYear: vehicle.modelYear || new Date().getFullYear(),
        plate: vehicle.plate || '',
        chassis: vehicle.chassis || '',
        Renavam: vehicle.renavam || vehicle.Renavam || '',
        mileage: vehicle.mileage || 0,
        color: vehicle.color || '',
        fuel: vehicle.fuel ?? FuelType.Flex,
        transmission: vehicle.transmission ?? TransmissionType.Automatico,
        PurchaseValue: purchaseVal,
        ListedValue: listedVal,
        status: vehicle.status ?? VehicleStatus.AVenda,
        notes: vehicle.notes || '',
      });

      setPhotos(vehicle.photos || []);
      setDocuments(vehicle.documents || []);
      setCosts(vehicle.costs || []);
    } catch (err: any) {
      console.error('Erro ao carregar veículo:', err);
      setError('Erro ao carregar dados do veículo para edição.');
    } finally {
      setFetching(false);
    }
  };

  if (!isOpen || !vehicleId) return null;

  // --- IA ---
  const handleGenerateAiDescription = async () => {
    if (!form.brand || !form.model) {
      setError('Preencha ao menos Marca e Modelo antes de gerar a descrição com IA.');
      return;
    }

    try {
      setIsGeneratingAi(true);
      setError(null);
      const text = await catalogService.generateAiDescription({
        brand: form.brand,
        model: form.model,
        year: form.modelYear,
        price: form.ListedValue || form.PurchaseValue,
        mileage: form.mileage,
        color: form.color ?? '',
        fuelType: String(form.fuel),
        transmission: String(form.transmission),
      });
      setForm(prev => ({ ...prev, notes: text }));
    } catch (err: any) {
      alert('Não foi possível gerar a descrição automática.');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  // --- SUBMIT DADOS DADOS PRINCIPAIS ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!form.brand || !form.model || !form.vehicleTypeId) {
        throw new Error('Preencha os campos obrigatórios (Tipo, Marca e Modelo).');
      }

      const purchaseVal = Number(form.PurchaseValue ?? (form as any).purchaseValue ?? 0);
      if (purchaseVal <= 0) {
        throw new Error('O Valor de Compra deve ser maior que R$ 0,00.');
      }

      const payload: UpdateVehicleInput = {
        ...form,
        PurchaseValue: Number(form.PurchaseValue),
        ListedValue: Number(form.ListedValue || 0),
        mileage: Number(form.mileage || 0),
        manufacturingYear: Number(form.manufacturingYear),
        modelYear: Number(form.modelYear),
      };

      await vehicleService.update(form.id, payload);
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Erro ao atualizar veículo:', err);
      setError(err.message || 'Erro ao atualizar dados do veículo.');
    } finally {
      setLoading(false);
    }
  };

  // --- FOTOS ---
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    try {
      setUploadingPhotos(true);
      const formData = new FormData();
      Array.from(e.target.files).forEach((file) => formData.append('files', file));

      await request(`/vehicles/${form.id}/photos`, {
        method: 'POST',
        body: formData,
      });

      const updated = await vehicleService.getById(form.id);
      setPhotos(updated.photos || []);
    } catch (err: any) {
      alert('Erro ao enviar foto(s): ' + (err.message || 'Tente novamente.'));
    } finally {
      setUploadingPhotos(false);
    }
  };

  const handleSetMainPhoto = async (photoId: string) => {
    try {
      await request(`/vehicles/${form.id}/photos/${photoId}/main`, { method: 'PUT' });
      const updated = await vehicleService.getById(form.id);
      setPhotos(updated.photos || []);
    } catch (err: any) {
      alert('Erro ao definir foto principal.');
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    if (!confirm('Deseja realmente remover esta foto?')) return;
    try {
      await request(`/vehicles/${form.id}/photos/${photoId}`, { method: 'DELETE' });
      setPhotos(prev => prev.filter(p => p.id !== photoId));
    } catch (err: any) {
      alert('Erro ao remover foto.');
    }
  };

  // --- DOCUMENTOS ---
  const handleDocumentUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDocFile || !docName.trim() || !docCategoryId) {
      alert('Selecione um arquivo e informe o nome e a categoria.');
      return;
    }

    try {
      setUploadingDoc(true);
      const formData = new FormData();
      formData.append('file', selectedDocFile);
      formData.append('categoryId', docCategoryId);
      formData.append('name', docName.trim());
      formData.append('showInCatalog', String(showInCatalog));

      await request(`/vehicles/${form.id}/documents`, {
        method: 'POST',
        body: formData,
      });

      const updated = await vehicleService.getById(form.id);
      setDocuments(updated.documents || []);
      setDocName('');
      setSelectedDocFile(null);
      setShowInCatalog(false);
    } catch (err: any) {
      alert('Erro ao enviar documento: ' + (err.message || 'Ocorreu uma falha.'));
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleToggleDocCatalog = async (docId: string, currentStatus: boolean) => {
    try {
      await request(`/vehicles/${form.id}/documents/${docId}/toggle-catalog`, {
        method: 'PATCH',
      });
      setDocuments(prev =>
        prev.map(d => (d.id === docId ? { ...d, showInCatalog: !currentStatus } : d))
      );
    } catch {
      // Fallback local se a API não retornar corpo
      setDocuments(prev =>
        prev.map(d => (d.id === docId ? { ...d, showInCatalog: !currentStatus } : d))
      );
    }
  };

  const handleDeleteDoc = async (docId: string) => {
    if (!confirm('Deseja realmente remover este documento?')) return;
    try {
      await request(`/vehicles/${form.id}/documents/${docId}`, { method: 'DELETE' });
      setDocuments(prev => prev.filter(d => d.id !== docId));
    } catch (err: any) {
      alert('Erro ao remover documento.');
    }
  };

  // --- CUSTOS ---
  const handleAddCost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!costDescription.trim() || costValue <= 0 || !costCategoryId) {
      alert('Informe a descrição, categoria e valor válido para o custo.');
      return;
    }

    try {
      setAddingCost(true);
      await request(`/vehicles/${form.id}/costs`, {
        method: 'POST',
        body: JSON.stringify({
          costCategoryId,
          description: costDescription.trim(),
          value: costValue,
          costDate: new Date().toISOString(),
        }),
      });

      const updated = await vehicleService.getById(form.id);
      setCosts(updated.costs || []);
      setCostDescription('');
      setCostValue(0);
    } catch (err: any) {
      alert('Erro ao adicionar custo.');
    } finally {
      setAddingCost(false);
    }
  };

  const handleDeleteCost = async (costId: string) => {
    if (!confirm('Deseja remover este custo?')) return;
    try {
      await request(`/vehicles/${form.id}/costs/${costId}`, { method: 'DELETE' });
      setCosts(prev => prev.filter(c => c.id !== costId));
    } catch (err: any) {
      alert('Erro ao remover custo.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-nexus-card border border-nexus-border rounded-2xl w-full max-w-3xl overflow-hidden my-8 shadow-2xl">
        
        {/* Cabeçalho com Abas */}
        <div className="border-b border-nexus-border">
          <div className="flex items-center justify-between px-6 py-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Car className="text-blue-500 w-5 h-5" />
              Editar Veículo: <span className="text-slate-300">{form.brand} {form.model}</span>
            </h2>
            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors cursor-pointer">
              <X size={20} />
            </button>
          </div>

          {/* Navegação de Abas */}
          <div className="flex px-6 gap-2 border-t border-nexus-border/50 bg-nexus-dark/50">
            <button
              type="button"
              onClick={() => setActiveTab('details')}
              className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
                activeTab === 'details'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <Car size={16} /> Dados do Veículo
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('photos')}
              className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
                activeTab === 'photos'
                  ? 'border-amber-500 text-amber-400'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <Camera size={16} /> Fotos ({photos.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('documents')}
              className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
                activeTab === 'documents'
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <FileText size={16} /> Documentos ({documents.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('costs')}
              className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
                activeTab === 'costs'
                  ? 'border-purple-500 text-purple-400'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <DollarSign size={16} /> Custos ({costs.length})
            </button>
          </div>
        </div>

        {fetching ? (
          <div className="p-12 flex flex-col items-center justify-center text-slate-400 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            <p className="text-sm font-medium">Carregando dados do veículo...</p>
          </div>
        ) : (
          <div className="p-6 max-h-[75vh] overflow-y-auto">
            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm font-medium">
                {error}
              </div>
            )}

            {/* ABA 1: DADOS DO VEÍCULO */}
            {activeTab === 'details' && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Tipo *</label>
                    <select
                      value={form.vehicleTypeId}
                      onChange={(e) => setForm(prev => ({ ...prev, vehicleTypeId: e.target.value }))}
                      className="w-full bg-nexus-dark border border-nexus-border rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-nexus-accent"
                      required
                    >
                      {vehicleTypes.map((t) => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Marca *</label>
                    <input
                      type="text"
                      value={form.brand}
                      onChange={(e) => setForm(prev => ({ ...prev, brand: e.target.value }))}
                      className="w-full bg-nexus-dark border border-nexus-border rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-nexus-accent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Modelo *</label>
                    <input
                      type="text"
                      value={form.model}
                      onChange={(e) => setForm(prev => ({ ...prev, model: e.target.value }))}
                      className="w-full bg-nexus-dark border border-nexus-border rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-nexus-accent"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Versão</label>
                    <input
                      type="text"
                      value={form.version}
                      onChange={(e) => setForm(prev => ({ ...prev, version: e.target.value }))}
                      className="w-full bg-nexus-dark border border-nexus-border rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-nexus-accent"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Ano Fab.</label>
                    <input
                      type="number"
                      value={form.manufacturingYear}
                      onChange={(e) => setForm(prev => ({ ...prev, manufacturingYear: Number(e.target.value) }))}
                      className="w-full bg-nexus-dark border border-nexus-border rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-nexus-accent"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Ano Mod.</label>
                    <input
                      type="number"
                      value={form.modelYear}
                      onChange={(e) => setForm(prev => ({ ...prev, modelYear: Number(e.target.value) }))}
                      className="w-full bg-nexus-dark border border-nexus-border rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-nexus-accent"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Placa</label>
                    <input
                      type="text"
                      value={form.plate}
                      onChange={(e) => setForm(prev => ({ ...prev, plate: e.target.value.toUpperCase() }))}
                      className="w-full bg-nexus-dark border border-nexus-border rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-nexus-accent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Status</label>
                    <select
                      value={form.status}
                      onChange={(e) => setForm(prev => ({ ...prev, status: Number(e.target.value) as VehicleStatus }))}
                      className="w-full bg-nexus-dark border border-nexus-border rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-nexus-accent font-semibold"
                    >
                      <option value={VehicleStatus.AVenda}>À Venda</option>
                      <option value={VehicleStatus.EmTroca}>Em Troca</option>
                      <option value={VehicleStatus.Vendido}>Vendido</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">KM</label>
                    <input
                      type="number"
                      value={form.mileage}
                      onChange={(e) => setForm(prev => ({ ...prev, mileage: Number(e.target.value) }))}
                      className="w-full bg-nexus-dark border border-nexus-border rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-nexus-accent"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Cor</label>
                    <input
                      type="text"
                      value={form.color}
                      onChange={(e) => setForm(prev => ({ ...prev, color: e.target.value }))}
                      className="w-full bg-nexus-dark border border-nexus-border rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-nexus-accent"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Câmbio</label>
                    <select
                      value={form.transmission}
                      onChange={(e) => setForm(prev => ({ ...prev, transmission: Number(e.target.value) as TransmissionType }))}
                      className="w-full bg-nexus-dark border border-nexus-border rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-nexus-accent"
                    >
                      <option value={TransmissionType.Automatico}>Automático</option>
                      <option value={TransmissionType.Manual}>Manual</option>
                      <option value={TransmissionType.CVT}>CVT</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-amber-400 uppercase mb-1">
                      Valor de Compra (R$) *
                    </label>
                    <CurrencyInput
                      value={form.PurchaseValue}
                      onChange={(val) => setForm(prev => ({ ...prev, PurchaseValue: val }))}
                      className="w-full bg-nexus-dark border border-amber-500/40 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-amber-400 font-bold"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                      Valor Anunciado (R$)
                    </label>
                    <CurrencyInput
                      value={form.ListedValue || 0}
                      onChange={(val) => setForm(prev => ({ ...prev, ListedValue: val }))}
                      className="w-full bg-nexus-dark border border-nexus-border rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-nexus-accent"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-400 uppercase">
                      Observações / Descrição
                    </label>
                    <button
                      type="button"
                      onClick={handleGenerateAiDescription}
                      disabled={isGeneratingAi}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-400 hover:text-amber-300 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      <Sparkles size={14} />
                      {isGeneratingAi ? 'Gerando com IA...' : '✨ Gerar Descrição com IA'}
                    </button>
                  </div>
                  <textarea
                    rows={4}
                    value={form.notes}
                    onChange={(e) => setForm(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full bg-nexus-dark border border-nexus-border rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-nexus-accent"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-nexus-border">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2.5 text-sm font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-2"
                  >
                    {loading && <Loader2 size={16} className="animate-spin" />}
                    {loading ? 'Salvando...' : 'Atualizar Veículo'}
                  </button>
                </div>
              </form>
            )}

            {/* ABA 2: FOTOS (A CÂMERA RESTAURADA) */}
            {activeTab === 'photos' && (
              <div className="space-y-6">
                <div className="p-4 border-2 border-dashed border-nexus-border rounded-xl bg-nexus-dark/50 text-center">
                  <Camera className="w-8 h-8 mx-auto mb-2 text-amber-400" />
                  <p className="text-sm font-medium text-white mb-1">Selecione ou arraste fotos para este veículo</p>
                  <p className="text-xs text-slate-400 mb-4">Formatos suportados: JPG, PNG, WEBP</p>
                  
                  <label className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition-colors cursor-pointer">
                    {uploadingPhotos ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                    {uploadingPhotos ? 'Enviando...' : 'Fazer Upload de Fotos'}
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      disabled={uploadingPhotos}
                      className="hidden"
                    />
                  </label>
                </div>

                {photos.length === 0 ? (
                  <p className="text-center text-sm text-slate-400 py-6">Nenhuma foto cadastrada até o momento.</p>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {photos.map((photo) => {
                      const photoUrl = getPhotoUrl(photo.storagePath || photo.url);
                      return (
                        <div key={photo.id} className="relative group bg-nexus-dark border border-nexus-border rounded-xl overflow-hidden aspect-video">
                          <img src={photoUrl} alt="Foto do Veículo" className="w-full h-full object-cover" />
                          
                          {photo.isMain && (
                            <span className="absolute top-2 left-2 bg-amber-500 text-slate-950 text-[10px] font-extrabold px-2 py-0.5 rounded flex items-center gap-1 shadow">
                              <Star size={10} fill="currentColor" /> PRINCIPAL
                            </span>
                          )}

                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            {!photo.isMain && (
                              <button
                                type="button"
                                onClick={() => handleSetMainPhoto(photo.id)}
                                title="Definir como Foto Principal"
                                className="p-2 bg-amber-500 text-slate-950 rounded-lg hover:bg-amber-400 transition-colors cursor-pointer"
                              >
                                <Star size={14} />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleDeletePhoto(photo.id)}
                              title="Excluir Foto"
                              className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-500 transition-colors cursor-pointer"
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
            )}

            {/* ABA 3: DOCUMENTOS (COM FLAG DE EXIBIÇÃO NO CATÁLOGO PÚBLICO) */}
            {activeTab === 'documents' && (
              <div className="space-y-6">
                <form onSubmit={handleDocumentUpload} className="p-4 bg-nexus-dark border border-nexus-border rounded-xl space-y-4">
                  <h3 className="text-xs font-bold uppercase text-slate-300 flex items-center gap-2">
                    <Plus size={14} className="text-emerald-400" /> Adicionar Documento / Laudo
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Nome do Anexo *</label>
                      <input
                        type="text"
                        placeholder="Ex: Laudo Cautelar Dekra 2025"
                        value={docName}
                        onChange={(e) => setDocName(e.target.value)}
                        className="w-full bg-nexus-card border border-nexus-border rounded-lg p-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Categoria *</label>
                      <select
                        value={docCategoryId}
                        onChange={(e) => setDocCategoryId(e.target.value)}
                        className="w-full bg-nexus-card border border-nexus-border rounded-lg p-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                        required
                      >
                        {docCategories.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pt-2">
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showInCatalog}
                        onChange={(e) => setShowInCatalog(e.target.checked)}
                        className="w-4 h-4 rounded bg-nexus-card border-nexus-border text-emerald-500 focus:ring-emerald-500 cursor-pointer"
                      />
                      Exibir este documento na Vitrine do Catálogo Público
                    </label>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                      <input
                        type="file"
                        onChange={(e) => setSelectedDocFile(e.target.files?.[0] || null)}
                        className="text-xs text-slate-400 file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-emerald-500/10 file:text-emerald-400 hover:file:bg-emerald-500/20 cursor-pointer"
                        required
                      />

                      <button
                        type="submit"
                        disabled={uploadingDoc}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg text-xs transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer whitespace-nowrap"
                      >
                        {uploadingDoc ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                        {uploadingDoc ? 'Enviando...' : 'Enviar Anexo'}
                      </button>
                    </div>
                  </div>
                </form>

                {documents.length === 0 ? (
                  <p className="text-center text-sm text-slate-400 py-6">Nenhum documento ou laudo anexado.</p>
                ) : (
                  <div className="space-y-2">
                    {documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-3 bg-nexus-dark border border-nexus-border rounded-xl"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-emerald-400 shrink-0" />
                          <div>
                            <p className="text-xs font-bold text-white">{doc.name}</p>
                            <p className="text-[10px] text-slate-400">
                              {doc.categoryName || 'Laudo/Documento'} • {doc.fileName}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleToggleDocCatalog(doc.id, !!doc.showInCatalog)}
                            className={`px-2.5 py-1 rounded-md text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                              doc.showInCatalog
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                : 'bg-slate-800 text-slate-400 border border-slate-700'
                            }`}
                            title="Alternar Exibição no Catálogo Público"
                          >
                            {doc.showInCatalog ? <Eye size={12} /> : <EyeOff size={12} />}
                            {doc.showInCatalog ? 'Visível no Catálogo' : 'Oculto no Catálogo'}
                          </button>

                          <a
                            href={getPhotoUrl(doc.storagePath || doc.fileUrl)}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md transition-colors"
                            title="Baixar / Visualizar"
                          >
                            <Download size={14} />
                          </a>

                          <button
                            type="button"
                            onClick={() => handleDeleteDoc(doc.id)}
                            className="p-1.5 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-md transition-colors cursor-pointer"
                            title="Excluir Documento"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ABA 4: CUSTOS */}
            {activeTab === 'costs' && (
              <div className="space-y-6">
                <form onSubmit={handleAddCost} className="p-4 bg-nexus-dark border border-nexus-border rounded-xl space-y-4">
                  <h3 className="text-xs font-bold uppercase text-slate-300 flex items-center gap-2">
                    <Plus size={14} className="text-purple-400" /> Lançar Custo / Manutenção
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Descrição *</label>
                      <input
                        type="text"
                        placeholder="Ex: Troca de Pneus e Alinhamento"
                        value={costDescription}
                        onChange={(e) => setCostDescription(e.target.value)}
                        className="w-full bg-nexus-card border border-nexus-border rounded-lg p-2 text-xs text-white focus:outline-none focus:border-purple-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Categoria *</label>
                      <select
                        value={costCategoryId}
                        onChange={(e) => setCostCategoryId(e.target.value)}
                        className="w-full bg-nexus-card border border-nexus-border rounded-lg p-2 text-xs text-white focus:outline-none focus:border-purple-500"
                        required
                      >
                        {costCategories.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Valor (R$) *</label>
                      <CurrencyInput
                        value={costValue}
                        onChange={(val) => setCostValue(val)}
                        className="w-full bg-nexus-card border border-nexus-border rounded-lg p-2 text-xs text-white focus:outline-none focus:border-purple-500 font-bold"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={addingCost}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-lg text-xs transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                    >
                      {addingCost ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                      {addingCost ? 'Lançando...' : 'Lançar Custo'}
                    </button>
                  </div>
                </form>

                {costs.length === 0 ? (
                  <p className="text-center text-sm text-slate-400 py-6">Nenhum custo adicional registrado.</p>
                ) : (
                  <div className="space-y-2">
                    {costs.map((cost) => (
                      <div
                        key={cost.id}
                        className="flex items-center justify-between p-3 bg-nexus-dark border border-nexus-border rounded-xl"
                      >
                        <div>
                          <p className="text-xs font-bold text-white">{cost.description}</p>
                          <p className="text-[10px] text-slate-400">{cost.categoryName || 'Preparação/Manutenção'}</p>
                        </div>

                        <div className="flex items-center gap-4">
                          <span className="text-xs font-bold text-purple-400">
                            {Number(cost.value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDeleteCost(cost.id)}
                            className="p-1.5 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-md transition-colors cursor-pointer"
                            title="Remover Custo"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}