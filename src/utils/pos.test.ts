/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  isPosAuthorized,
  calculatePosTotals,
  generatePosFiscalReceipt,
} from './pos';
import { UserProfile } from '../types';

describe('POS Terminal Utility Tests', () => {
  describe('isPosAuthorized', () => {
    it('returns true only for logged-in admin user', () => {
      const admin: UserProfile = {
        id: 'adm1',
        name: 'Admin',
        emailOrPhone: 'admin@system.am',
        isLoggedIn: true,
        registeredAt: '2026-01-01',
        isAdmin: true,
      };
      assert.strictEqual(isPosAuthorized(admin), true);
    });

    it('returns false for regular customer or logged out user', () => {
      const user: UserProfile = {
        id: 'usr1',
        name: 'User',
        emailOrPhone: 'user@system.am',
        isLoggedIn: true,
        registeredAt: '2026-01-01',
        isAdmin: false,
      };
      assert.strictEqual(isPosAuthorized(user), false);

      const loggedOutAdmin: UserProfile = {
        id: 'adm2',
        name: 'Admin',
        emailOrPhone: 'admin@system.am',
        isLoggedIn: false,
        registeredAt: '2026-01-01',
        isAdmin: true,
      };
      assert.strictEqual(isPosAuthorized(loggedOutAdmin), false);
      assert.strictEqual(isPosAuthorized(null), false);
      assert.strictEqual(isPosAuthorized(undefined), false);
    });
  });

  describe('calculatePosTotals', () => {
    it('calculates straightforward total without discount or tip', () => {
      const res = calculatePosTotals(10000, 0, 0, 0);
      assert.strictEqual(res.baseAmount, 10000);
      assert.strictEqual(res.discountAmount, 0);
      assert.strictEqual(res.subtotalAfterDiscount, 10000);
      assert.strictEqual(res.tipAmount, 0);
      assert.strictEqual(res.finalTotal, 10000);
      // 20% VAT in 10000 = round(10000 * 20 / 120) = 1667
      assert.strictEqual(res.taxVatAmount, 1667);
      assert.strictEqual(res.changeAmount, 0);
    });

    it('applies discount correctly', () => {
      const res = calculatePosTotals(5000, 10, 0, 0); // 10% off
      assert.strictEqual(res.discountAmount, 500);
      assert.strictEqual(res.subtotalAfterDiscount, 4500);
      assert.strictEqual(res.finalTotal, 4500);
    });

    it('calculates tip and cash change properly', () => {
      const res = calculatePosTotals(4000, 0, 5, 5000); // 5% tip on 4000 = 200, total = 4200, paid 5000 cash
      assert.strictEqual(res.tipAmount, 200);
      assert.strictEqual(res.finalTotal, 4200);
      assert.strictEqual(res.changeAmount, 800); // 5000 - 4200 = 800
    });
  });

  describe('generatePosFiscalReceipt', () => {
    it('generates a valid fiscal receipt object', () => {
      const totals = calculatePosTotals(7500, 0, 0, 10000);
      const receipt = generatePosFiscalReceipt('Արայիկ (Ադմին)', totals, 'cash', '+374 91 123456', true);

      assert.match(receipt.receiptId, /^POS-ARM-/);
      assert.match(receipt.fiscalNumber, /^FISC-/);
      assert.strictEqual(receipt.cashierName, 'Արայիկ (Ադմին)');
      assert.strictEqual(receipt.finalTotal, 7500);
      assert.strictEqual(receipt.changeAmount, 2500);
      assert.strictEqual(receipt.customerPhone, '+374 91 123456');
      assert.strictEqual(receipt.depositCredited, true);
    });
  });
});
