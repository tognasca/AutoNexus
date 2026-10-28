/**
 * Formata um número para Moeda Real Brasileira (R$ 1.234,56)
 */
export function formatCurrency(val?: number | null): string {
  if (val === undefined || val === null || isNaN(val)) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(val);
}

/**
 * Formata uma data para o padrão Brasileiro (DD/MM/AAAA)
 */
export function formatDate(date?: string | Date | null): string {
  if (!date) return '--/--/----';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '--/--/----';
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d);
}

/**
 * Formata uma data e hora para o padrão Brasileiro (DD/MM/AAAA HH:mm)
 */
export function formatDateTime(date?: string | Date | null): string {
  if (!date) return '--/--/---- --:--';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '--/--/---- --:--';
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

/**
 * Máscara dinâmica para CPF (000.000.000-00) ou CNPJ (00.000.000/0000-00)
 */
export function formatCpfCnpj(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 11) {
    return digits
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  }
  return digits
    .slice(0, 14)
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
}


/** Máscara de telefone brasileiro: (11) 91234-5678 ou (11) 1234-5678. */
export function formatBrazilianPhone(value: string): string {
  const digits = value.replace(/\\D/g, '').slice(0, 11);
  if (digits.length <= 2) return digits ? `(${digits}` : '';
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

/** Valida os dígitos verificadores de CPF ou CNPJ (não apenas o formato). */
export function isValidCpfCnpj(value: string): boolean {
  const digits = value.replace(/\\D/g, '');
  if (!/^\\d{11}$|^\\d{14}$/.test(digits) || /^(\\d)\\1+$/.test(digits)) return false;

  if (digits.length === 11) {
    const numbers = digits.split('').map(Number);
    const first = numbers.slice(0, 9).reduce((sum, n, i) => sum + n * (10 - i), 0);
    const firstDigit = (first * 10) % 11 % 10;
    const second = numbers.slice(0, 10).reduce((sum, n, i) => sum + n * (11 - i), 0);
    const secondDigit = (second * 10) % 11 % 10;
    return numbers[9] === firstDigit && numbers[10] === secondDigit;
  }

  const numbers = digits.split('').map(Number);
  const calculate = (length: number, weights: number[]) => {
    const sum = numbers.slice(0, length).reduce((total, n, i) => total + n * weights[i % weights.length], 0);
    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };
  const firstDigit = calculate(12, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const secondWeights = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const secondSum = numbers.slice(0, 13).reduce((total, n, i) => total + n * secondWeights[i], 0);
  const secondRemainder = secondSum % 11;
  const secondDigit = secondRemainder < 2 ? 0 : 11 - secondRemainder;
  return numbers[12] === firstDigit && numbers[13] === secondDigit;
}

/** Normaliza placa brasileira antiga ou Mercosul; valida apenas a estrutura. */
export function formatBrazilianPlate(value: string): string {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 7);
}

export function isValidBrazilianPlate(value: string): boolean {
  const plate = formatBrazilianPlate(value);
  return /^[A-Z]{3}\\d{4}$/.test(plate) || /^[A-Z]{3}\\d[A-Z]\\d{2}$/.test(plate);
}
