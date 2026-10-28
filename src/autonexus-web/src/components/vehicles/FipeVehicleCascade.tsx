import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { fipeService, type FipeCatalogQuote, type FipeLookupItem } from '../../services/fipeService';
import { FipeValueCard } from './FipeValueCard';

interface FipeVehicleCascadeProps {
  vehicleType: string;
  brand: string;
  model: string;
  modelYear: number;
  version: string;
  onChange: (value: { brand: string; model: string; modelYear: number; version: string }) => void;
}

const normalizeYear = (name: string) => {
  const match = name.match(/\b(19|20)\d{2}\b/);
  return match ? Number(match[0]) : 0;
};

export function FipeVehicleCascade({ vehicleType, brand, model, modelYear, version, onChange }: FipeVehicleCascadeProps) {
  const [brands, setBrands] = useState<FipeLookupItem[]>([]);
  const [models, setModels] = useState<FipeLookupItem[]>([]);
  const [years, setYears] = useState<FipeLookupItem[]>([]);
  const [brandCode, setBrandCode] = useState('');
  const [modelCode, setModelCode] = useState('');
  const [yearCode, setYearCode] = useState('');
  const [loadingBrands, setLoadingBrands] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);
  const [loadingYears, setLoadingYears] = useState(false);
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [quote, setQuote] = useState<FipeCatalogQuote | null>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoadingBrands(true);
    fipeService.getCatalogBrands(vehicleType)
      .then(items => {
        if (!cancelled) setBrands(items || []);
      })
      .catch(() => {
        if (!cancelled) setBrands([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingBrands(false);
      });
    return () => { cancelled = true; };
  }, [vehicleType]);

  useEffect(() => {
    if (!brand) return;
    const match = brands.find(x => x.name.toLowerCase() === brand.toLowerCase());
    if (match) setBrandCode(match.code);
  }, [brand, brands]);

  useEffect(() => {
    if (!brandCode) return;
    let cancelled = false;
    setModels([]);
    setLoadingModels(true);
    fipeService.getCatalogModels(vehicleType, brandCode)
      .then(items => {
        if (!cancelled) setModels(items || []);
      })
      .catch(() => {
        if (!cancelled) setModels([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingModels(false);
      });
    return () => { cancelled = true; };
  }, [vehicleType, brandCode]);

  useEffect(() => {
    if (!model) return;
    const match = models.find(x => x.name.toLowerCase() === model.toLowerCase());
    if (match) setModelCode(match.code);
  }, [model, models]);

  useEffect(() => {
    if (!brandCode || !modelCode) return;
    let cancelled = false;
    setYears([]);
    setLoadingYears(true);
    fipeService.getCatalogYears(vehicleType, brandCode, modelCode)
      .then(items => {
        if (!cancelled) setYears(items || []);
      })
      .catch(() => {
        if (!cancelled) setYears([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingYears(false);
      });
    return () => { cancelled = true; };
  }, [vehicleType, brandCode, modelCode]);

  useEffect(() => {
    if (!modelYear || years.length === 0) return;
    const match = years.find(x => normalizeYear(x.name) === Number(modelYear));
    if (match) setYearCode(match.code);
  }, [modelYear, years]);

  useEffect(() => {
    if (!brandCode || !modelCode || !yearCode) {
      setQuote(null);
      setQuoteError(null);
      return;
    }
    let cancelled = false;
    setLoadingQuote(true);
    setQuoteError(null);
    fipeService.getCatalogQuote(vehicleType, brandCode, modelCode, yearCode)
      .then(result => {
        if (!cancelled) setQuote(result);
      })
      .catch(() => {
        if (!cancelled) {
          setQuote(null);
          setQuoteError('Não foi possível consultar a referência FIPE para esta configuração.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingQuote(false);
      });
    return () => { cancelled = true; };
  }, [vehicleType, brandCode, modelCode, yearCode]);

  const handleBrand = (code: string) => {
    const item = brands.find(x => x.code === code);
    setBrandCode(code);
    setModelCode('');
    setYearCode('');
    setModels([]);
    setYears([]);
    setQuote(null);
    onChange({ brand: item?.name || '', model: '', modelYear: new Date().getFullYear(), version: '' });
  };

  const handleModel = (code: string) => {
    const item = models.find(x => x.code === code);
    setModelCode(code);
    setYearCode('');
    setYears([]);
    setQuote(null);
    onChange({ brand, model: item?.name || '', modelYear: new Date().getFullYear(), version: item?.name || '' });
  };

  const handleYear = (code: string) => {
    const item = years.find(x => x.code === code);
    const year = item ? normalizeYear(item.name) : 0;
    setYearCode(code);
    onChange({ brand, model, modelYear: year || modelYear, version });
  };

  return (
    <div className="space-y-4 rounded-xl border border-nexus-border bg-nexus-dark/40 p-3 sm:p-4">
      <div>
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-blue-400">Identificação FIPE</p>
            <p className="text-[11px] text-slate-500">Selecione em cascata para manter marca, modelo e ano alinhados à tabela.</p>
          </div>
          {(loadingBrands || loadingModels || loadingYears) && <Loader2 className="h-4 w-4 animate-spin text-blue-400" />}
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <label className="text-xs font-semibold text-slate-400">
            Marca *
            <select
              value={brandCode}
              onChange={e => handleBrand(e.target.value)}
              disabled={loadingBrands}
              className="mt-1 w-full rounded-lg border border-nexus-border bg-nexus-dark p-2.5 text-sm text-white focus:border-nexus-accent focus:outline-none"
              required
            >
              <option value="">{loadingBrands ? 'Carregando marcas...' : 'Selecione a marca'}</option>
              {brands.map(item => <option key={item.code} value={item.code}>{item.name}</option>)}
            </select>
          </label>

          <label className="text-xs font-semibold text-slate-400">
            Modelo *
            <select
              value={modelCode}
              onChange={e => handleModel(e.target.value)}
              disabled={!brandCode || loadingModels}
              className="mt-1 w-full rounded-lg border border-nexus-border bg-nexus-dark p-2.5 text-sm text-white focus:border-nexus-accent focus:outline-none disabled:opacity-50"
              required
            >
              <option value="">{loadingModels ? 'Carregando modelos...' : 'Selecione o modelo'}</option>
              {models.map(item => <option key={item.code} value={item.code}>{item.name}</option>)}
            </select>
          </label>

          <label className="text-xs font-semibold text-slate-400">
            Ano / Modelo *
            <select
              value={yearCode}
              onChange={e => handleYear(e.target.value)}
              disabled={!modelCode || loadingYears}
              className="mt-1 w-full rounded-lg border border-nexus-border bg-nexus-dark p-2.5 text-sm text-white focus:border-nexus-accent focus:outline-none disabled:opacity-50"
              required
            >
              <option value="">{loadingYears ? 'Carregando anos...' : 'Selecione o ano'}</option>
              {years.map(item => <option key={item.code} value={item.code}>{item.name}</option>)}
            </select>
          </label>
        </div>

        <div className="mt-3">
          <label className="block text-xs font-semibold uppercase text-slate-400">Versão / Configuração FIPE</label>
          <input
            type="text"
            value={version}
            readOnly
            placeholder="Será preenchida pela configuração FIPE selecionada"
            className="mt-1 w-full rounded-lg border border-nexus-border bg-nexus-dark p-2.5 text-sm text-slate-300 focus:outline-none"
          />
        </div>
      </div>

      <FipeValueCard quote={quote} loading={loadingQuote} error={quoteError} />
    </div>
  );
}
