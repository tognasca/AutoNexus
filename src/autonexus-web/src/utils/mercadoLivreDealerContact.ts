export function buildMercadoLivreDealerContact(input: string) {
  const invalid = 'Informe um telefone brasileiro válido, com DDD e 8 ou 9 dígitos.';
  if (!/^[+()\s\d-]+$/.test(input.trim())) throw new Error(invalid);
  const digits = input.replace(/\D/g, '');
  const national = (digits.length === 12 || digits.length === 13) && digits.startsWith('55')
    ? digits.slice(2) : digits;
  if (!/^[1-9]\d(?:[2-5]\d{7}|9\d{8})$/.test(national)) throw new Error(invalid);
  return { country_code2: '55', area_code2: national.slice(0, 2), phone2: national.slice(2) };
}
