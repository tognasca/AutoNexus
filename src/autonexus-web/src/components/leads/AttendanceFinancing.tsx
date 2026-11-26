import { useState } from 'react';
import { calculateInstallment } from '../../utils/financingMath';
import { formatCurrency } from '../../utils/formatters';

const terms = [12, 24, 36, 48, 60];

export function AttendanceFinancing({ price, downPayment }: {
  price: number | null;
  downPayment: number;
}) {
  const [tradeCredit, setTradeCredit] = useState('');
  const [rate, setRate] = useState('');
  const [months, setMonths] = useState(48);
  const trade = Number(tradeCredit);
  const monthlyRate = Number(rate);
  const principal = price === null ? null : price - downPayment - trade;
  const valid = price !== null && price > 0 && Number.isFinite(price) &&
    Number.isFinite(downPayment) && downPayment >= 0 && Number.isFinite(trade) && trade >= 0 &&
    principal !== null && principal >= 0;
  const validRate = rate !== '' && Number.isFinite(monthlyRate) && monthlyRate >= 0 && monthlyRate <= 100;
  const installment = valid && principal !== null && validRate
    ? calculateInstallment(principal, months, monthlyRate)
    : null;

  return <details className="rounded-lg border border-slate-700 p-3">
    <summary className="cursor-pointer text-sm font-semibold">Estimar parcelas</summary>
    <div className="mt-3 space-y-3">
      <p className="text-sm text-slate-400">
        {price === null ? 'Informe o valor proposto para começar.' : `Preço ${formatCurrency(price)} · Entrada ${formatCurrency(downPayment)}`}
      </p>
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="text-sm">Crédito da troca (R$)
          <input type="number" step="any" inputMode="decimal" value={tradeCredit} onChange={event => setTradeCredit(event.target.value)}
            className="mt-1 w-full rounded-lg bg-slate-950 p-2" />
        </label>
        <label className="text-sm">Taxa mensal (%)
          <input type="number" step="any" inputMode="decimal" value={rate} onChange={event => setRate(event.target.value)}
            className="mt-1 w-full rounded-lg bg-slate-950 p-2" />
        </label>
        <label className="text-sm">Prazo
          <select value={months} onChange={event => setMonths(Number(event.target.value))}
            className="mt-1 w-full rounded-lg bg-slate-950 p-2">
            {terms.map(term => <option key={term} value={term}>{term} meses</option>)}
          </select>
        </label>
      </div>
      {price !== null && !valid && <p className="text-sm text-amber-300">Confira o preço e os abatimentos. Entrada e troca devem caber no preço.</p>}
      {rate !== '' && !validRate && <p className="text-sm text-amber-300">Informe uma taxa mensal entre 0 e 100%.</p>}
      {installment !== null && <p role="status" className="font-semibold">
        {installment > 0 ? `${months} parcelas estimadas de ${formatCurrency(installment)}` : 'Sem saldo a financiar'}
      </p>}
      <p className="text-xs text-slate-400">Estimativa pela Tabela Price. CET, encargos e aprovação dependem da financeira.</p>
    </div>
  </details>;
}
