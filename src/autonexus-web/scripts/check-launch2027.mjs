import assert from 'node:assert/strict';
import { parseStockImport, stockImportTemplate } from '../src/utils/stockImport.ts';
import { calculateInstallment } from '../src/utils/financingMath.ts';

const rows = parseStockImport('\uFEFF' + stockImportTemplate, 'type');
assert.equal(rows[0].purchaseValue, 90000);
assert.equal(rows[0].listedValue, 105000);
assert.equal(rows[0].vehicleTypeId, 'type');
assert.equal(parseStockImport(stockImportTemplate.replace('Toyota', '"Toyota; Brasil"'), 'type')[0].brand, 'Toyota; Brasil');
assert.throws(() => parseStockImport(stockImportTemplate.replace('90000,00', 'inválido'), 'type'));
assert.throws(() => parseStockImport('marca;modelo\nToyota;Corolla', 'type'));
assert.throws(() => parseStockImport(stockImportTemplate + '"sem fechamento', 'type'));
assert.equal(calculateInstallment(12000, 12, 0), 1000);
assert.ok(Math.abs(calculateInstallment(100000, 12, 1) - 8884.878867834) < 0.00001);
assert.equal(calculateInstallment(0, 12, 1), 0);
for (const invalid of [[-1, 12, 1], [1000, 0, 1], [1000, 12, -1], [1000, 12, NaN], [Infinity, 12, 1]]) {
  assert.throws(() => calculateInstallment(...invalid));
}
console.log('PASS: CSV, moeda brasileira, aspas, erros de arquivo, Tabela Price e entradas inválidas.');
