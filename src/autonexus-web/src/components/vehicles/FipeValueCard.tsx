import { Loader2, TrendingUp } from 'lucide-react';
import type { FipeCatalogQuote } from '../../services/fipeService';

interface FipeValueCardProps {
  quote: FipeCatalogQuote | null;
  loading?: boolean;
  error?: string | null;
}

export function FipeValueCard({ quote, loading = false, error = null }: FipeValueCardProps) {
  if (loading) {
    return (
      <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
        <div className="flex items-center gap-2 text-sm text-blue-300">
          <Loader2 className="h-4 w-4 animate-spin" />
          Consultando valor atual da Tabela FIPE...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-300">
        {error}
      </div>
    );
  }

  if (!quote) return null;

  const value = quote.fipeValue.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  });

  return (
    <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="mb-1 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-blue-300">
            <TrendingUp className="h-4 w-4" />
            Valor FIPE
          </div>
          <div className="text-xl font-bold text-white">{value}</div>
          <div className="mt-1 text-xs text-slate-400">
            Referência: {String(quote.referenceMonth).padStart(2, '0')}/{quote.referenceYear}
          </div>
        </div>
        <span className="rounded-full border border-blue-400/20 bg-blue-400/10 px-2 py-1 text-[10px] font-semibold text-blue-300">
          Apenas interno
        </span>
      </div>
    </div>
  );
}
