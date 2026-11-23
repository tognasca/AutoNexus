export interface StockImportRow {
  vehicleTypeId: string; brand: string; model: string; manufacturingYear: number; modelYear: number;
  plate: string; purchaseValue: number; listedValue: number | null; mileage: number;
}
const headers = ['marca', 'modelo', 'ano_fabricacao', 'ano_modelo', 'placa', 'valor_compra', 'valor_anuncio', 'km'];
export const stockImportTemplate = headers.join(';') + '\nToyota;Corolla;2023;2024;ABC1D23;90000,00;105000,00;35000\n';

export function parseStockImport(text: string, vehicleTypeId: string): StockImportRow[] {
  const content = text.replace(/^\uFEFF/, '');
  const delimiter = content.split(/\r?\n/, 1)[0].includes(';') ? ';' : ',';
  const rows: string[][] = [];
  let row: string[] = []; let field = ''; let quoted = false;
  for (let index = 0; index < content.length; index++) {
    const char = content[index];
    if (char === '"') {
      if (quoted && content[index + 1] === '"') { field += '"'; index++; }
      else quoted = !quoted;
    } else if (char === delimiter && !quoted) {
      row.push(field); field = '';
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && content[index + 1] === '\n') index++;
      row.push(field); if (row.some(value => value.trim())) rows.push(row);
      row = []; field = '';
    } else field += char;
  }
  if (quoted) throw new Error('O CSV contém aspas sem fechamento.');
  row.push(field); if (row.some(value => value.trim())) rows.push(row);
  const heading = rows.shift()?.map(value => value.trim().toLowerCase());
  if (!heading || headers.some(header => !heading.includes(header)) || new Set(heading).size !== heading.length)
    throw new Error('Use as colunas do modelo CSV: ' + headers.join(', '));
  if (!rows.length || rows.length > 100) throw new Error('Selecione um arquivo com 1 a 100 veículos.');
  const decimal = (value: string, line: number) => {
    const normalized = value.trim().includes(',') ? value.trim().replace(/\./g, '').replace(',', '.') : value.trim();
    const number = Number(normalized);
    if (!normalized || !Number.isFinite(number)) throw new Error('Valor inválido na linha ' + line);
    return number;
  };
  return rows.map((values, index) => {
    if (values.length !== heading.length) throw new Error('Quantidade de colunas inválida na linha ' + (index + 2));
    const value = (name: string) => values[heading.indexOf(name)].trim();
    return {
      vehicleTypeId, brand: value('marca'), model: value('modelo'), plate: value('placa'),
      manufacturingYear: decimal(value('ano_fabricacao'), index + 2), modelYear: decimal(value('ano_modelo'), index + 2),
      purchaseValue: decimal(value('valor_compra'), index + 2),
      listedValue: value('valor_anuncio') ? decimal(value('valor_anuncio'), index + 2) : null,
      mileage: decimal(value('km'), index + 2),
    };
  });
}
