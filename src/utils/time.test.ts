import test from 'node:test';
import assert from 'node:assert/strict';
import { formatUsageDuration, countFinancialTransactions } from './time';

test('formatUsageDuration formats seconds, minutes, hours in Armenian and Russian', () => {
  assert.equal(formatUsageDuration(45, 'hy'), '45 վայրկյան');
  assert.equal(formatUsageDuration(45, 'ru'), '45 сек');

  assert.equal(formatUsageDuration(125, 'hy'), '2 ր 5 վրկ');
  assert.equal(formatUsageDuration(125, 'ru'), '2 мин 5 сек');

  assert.equal(formatUsageDuration(3665, 'hy'), '1 ժ 1 ր 5 վրկ');
  assert.equal(formatUsageDuration(3665, 'ru'), '1 ч 1 мин 5 сек');

  assert.equal(formatUsageDuration(90000, 'hy'), '1 օր 1 ժ 0 ր');
});

test('countFinancialTransactions counts valid transaction types', () => {
  const sampleLogs = [
    { category: 'deposit' },
    { category: 'system' },
    { category: 'real_topup' },
    { category: 'dram_purchase' },
    { category: 'points_purchase' },
    { category: 'auth' },
  ];
  assert.equal(countFinancialTransactions(sampleLogs), 4);
});
