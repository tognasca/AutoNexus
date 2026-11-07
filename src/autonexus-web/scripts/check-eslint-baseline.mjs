import { readFileSync } from 'node:fs';

const results = JSON.parse(readFileSync(process.argv[2] ?? 'eslint-results.json', 'utf8'));
const counts = results.reduce((total, file) => {
  total.errors += file.errorCount;
  total.warnings += file.warningCount;
  return total;
}, { errors: 0, warnings: 0 });

// Existing debt from CI #287. Never increase this baseline.
// Lower these thresholds as existing violations are corrected.
const baseline = { errors: 145, warnings: 9 };
console.log(`ESLint: ${counts.errors} errors, ${counts.warnings} warnings; baseline: ${baseline.errors} errors, ${baseline.warnings} warnings`);
if (counts.errors > baseline.errors || counts.warnings > baseline.warnings) {
  console.error('ESLint regression: new violations exceed the existing baseline.');
  for (const file of results) {
    for (const message of file.messages ?? []) {
      if (message.severity === 2) {
        console.error(`${file.filePath}:${message.line ?? 0}:${message.column ?? 0} ${message.ruleId ?? 'unknown'} ${message.message}`);
      }
    }
  }
  process.exitCode = 1;
}
