/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  SYSTEM_2000_CONTRACT_META,
  CONTRACT_ARTICLES,
  isPaymentMethodDepositEligible,
  qualifiesForLifelongDeposit,
  getAgreementSummaryText,
  MIN_PURCHASE_FOR_DEPOSIT,
  RETURN_COOLDOWN_DAYS,
} from './agreement';

describe('System 2000 User Agreement Contracts & Rules', () => {
  it('has valid metadata with contract number, 10% rate, 10,000 AMD threshold and 15 days return period', () => {
    assert.strictEqual(SYSTEM_2000_CONTRACT_META.contractNumber, 'SYS-2000/AGR-2026');
    assert.strictEqual(SYSTEM_2000_CONTRACT_META.annualRatePercent, 10);
    assert.strictEqual(SYSTEM_2000_CONTRACT_META.minPurchaseForDepositDram, 10000);
    assert.strictEqual(SYSTEM_2000_CONTRACT_META.returnPeriodDays, 15);
    assert.ok(SYSTEM_2000_CONTRACT_META.operatorNameHy.includes('Համակարգ 2000'));
    assert.ok(SYSTEM_2000_CONTRACT_META.operatorNameRu.includes('Система 2000'));
  });

  it('contains all 7 mandatory legal articles including lifelong deposit, inheritance right, and 15-day return cooldown', () => {
    assert.strictEqual(CONTRACT_ARTICLES.length, 7);

    // Article 2: Ecosystem Only
    const art2 = CONTRACT_ARTICLES.find((a) => a.number === 2);
    assert.ok(art2, 'Article 2 exists');
    assert.ok(art2?.titleRu.includes('ИСКЛЮЧИТЕЛЬНО В ЭКОСИСТЕМЕ'));
    assert.ok(art2?.titleHy.includes('ԲԱՑԱՌԱՊԵՍ ԷԿՈՀԱՄԱԿԱՐԳԻ'));

    // Article 3: Points are NOT deposit
    const art3 = CONTRACT_ARTICLES.find((a) => a.number === 3);
    assert.ok(art3, 'Article 3 exists');
    assert.ok(art3?.titleRu.includes('НЕ ЯВЛЯЕТСЯ ДЕПОЗИТОМ'));

    // Article 4: 10,000+ AMD purchase -> Lifelong deposit with inheritance rights
    const art4 = CONTRACT_ARTICLES.find((a) => a.number === 4);
    assert.ok(art4, 'Article 4 exists');
    assert.ok(art4?.titleRu.includes('ПОЖИЗНЕННЫЙ ДЕПОЗИТ 10% ГОДОВЫХ С ПРАВОМ НАСЛЕДОВАНИЯ'));
    assert.ok(art4?.titleHy.includes('ՑՄԱՀ ԴԵՊՈԶԻՏ 10% ՏԱՐԵԿԱՆ ԵՎ ԺԱՌԱՆԳՈՒԹՅԱՆ ԻՐԱՎՈՒՆՔ'));
    assert.ok(art4?.keyHighlightRu?.includes('от 10 000 Армянских драм'));
    assert.ok(art4?.keyHighlightRu?.includes('ПРАВОМ НАСЛЕДОВАНИЯ'));

    // Article 5: 15-day return period & per-second bonus streaming
    const art5 = CONTRACT_ARTICLES.find((a) => a.number === 5);
    assert.ok(art5, 'Article 5 exists');
    assert.ok(art5?.titleRu.includes('15-дневный гарантийный срок возврата'));
    assert.ok(art5?.titleRu.includes('ЕЖЕСЕКУНДНОЕ НАЧИСЛЕНИЕ БОНУСОВ'));
    assert.ok(art5?.keyHighlightRu?.includes('ЕЖЕСЕКУНДНО СПУСТЯ 15 ДНЕЙ'));

    // Article 6: Mandatory agreement acceptance
    const art6 = CONTRACT_ARTICLES.find((a) => a.number === 6);
    assert.ok(art6, 'Article 6 exists');
    assert.ok(art6?.titleRu.includes('Обязательное ознакомление, акцепт договора'));
  });

  it('correctly checks qualifications for lifelong deposit (>= 10,000 AMD in real payment)', () => {
    assert.strictEqual(qualifiesForLifelongDeposit(10000, 'idram'), true);
    assert.strictEqual(qualifiesForLifelongDeposit(25000, 'card'), true);
    assert.strictEqual(qualifiesForLifelongDeposit(9999, 'idram'), false); // less than 10,000
    assert.strictEqual(qualifiesForLifelongDeposit(15000, 'points'), false); // points not eligible
  });

  it('correctly classifies payment methods for deposit eligibility', () => {
    assert.strictEqual(isPaymentMethodDepositEligible('dram'), true);
    assert.strictEqual(isPaymentMethodDepositEligible('cash'), true);
    assert.strictEqual(isPaymentMethodDepositEligible('idram'), true);
    assert.strictEqual(isPaymentMethodDepositEligible('telcell'), true);
    assert.strictEqual(isPaymentMethodDepositEligible('card'), true);
    assert.strictEqual(isPaymentMethodDepositEligible('arca'), true);

    assert.strictEqual(isPaymentMethodDepositEligible('points'), false);
    assert.strictEqual(isPaymentMethodDepositEligible('bonus_points'), false);
  });

  it('provides bilingual summaries highlighting lifelong deposit, inheritance, and 15-day cooldown', () => {
    const summaryHy = getAgreementSummaryText('hy');
    assert.ok(summaryHy.lifelongInheritance.includes('10,000 ֏'));
    assert.ok(summaryHy.lifelongInheritance.includes('ԺԱՌԱՆԳՈՒԹՅԱՆ ԻՐԱՎՈՒՆՔՈՎ'));
    assert.ok(summaryHy.returnPeriodCooldown.includes('15 օր անց'));

    const summaryRu = getAgreementSummaryText('ru');
    assert.ok(summaryRu.lifelongInheritance.includes('10 000 ֏'));
    assert.ok(summaryRu.lifelongInheritance.includes('ПРАВОМ НАСЛЕДОВАНИЯ'));
    assert.ok(summaryRu.returnPeriodCooldown.includes('спустя 15 дней'));
  });
});
