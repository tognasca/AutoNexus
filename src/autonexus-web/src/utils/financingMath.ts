export function calculateInstallment(principal: number, months: number, monthlyRate: number): number {
  if (!Number.isFinite(principal) || principal < 0 || !Number.isInteger(months) || months <= 0 ||
      !Number.isFinite(monthlyRate) || monthlyRate < 0) throw new Error('Valores inválidos para simulação.');
  if (principal === 0) return 0;
  if (monthlyRate === 0) return principal / months;
  const rate = monthlyRate / 100;
  // Forma equivalente da Tabela Price, evitando overflow em potências positivas.
  return principal * rate / -Math.expm1(-months * Math.log1p(rate));
}
