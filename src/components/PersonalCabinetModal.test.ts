/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { CustomerAccount, CustomerPurchase, LogItem, UserProfile } from '../types';

describe('Personal Cabinet Data Contracts', () => {
  it('correctly associates user purchases and logs for personal cabinet view', () => {
    const mockUser: UserProfile = {
      id: 'usr_araik',
      name: 'Араик Петросян',
      emailOrPhone: 'araik1415@gmail.com',
      isLoggedIn: true,
      registeredAt: '12.01.2026',
      isAdmin: true,
      agreementAccepted: true,
      agreementAcceptedAt: '12.01.2026, 14:00',
    };

    const mockPurchases: CustomerPurchase[] = [
      {
        id: 'ord_1001',
        orderNumber: 'ՊԱՏ-000101',
        date: '31.10.2026, 14:20',
        timestamp: Date.now() - 3600000,
        totalAmountDram: 4500,
        paidWith: 'idram',
        bonusPointsEarned: 225,
        status: 'delivered',
        items: [
          {
            productId: 1,
            productName: 'Хлеб пшеничный',
            quantity: 2,
            priceDram: 250,
            unit: '1 шт',
            totalDram: 500,
          },
        ],
      },
    ];

    const mockCustomer: CustomerAccount = {
      id: 'usr_araik',
      name: 'Араик Петросян',
      phone: '+374 91 123456',
      email: 'araik1415@gmail.com',
      city: 'Ереван',
      registeredAt: '12.01.2026',
      lastActiveAt: 'Сегодня',
      status: 'vip',
      realBalance: 35000,
      deposit: 150000,
      bonusPoints: 1450.5,
      lastAccrualTimestamp: Date.now(),
      purchases: mockPurchases,
      ledger: [],
      totalSpentDram: 118500,
      agreementAccepted: true,
      agreementAcceptedAt: '12.01.2026, 14:00',
    };

    assert.strictEqual(mockCustomer.id, mockUser.id);
    assert.strictEqual(mockCustomer.agreementAccepted, true);
    assert.strictEqual(mockCustomer.purchases.length, 1);
    assert.strictEqual(mockCustomer.purchases[0].totalAmountDram, 4500);
  });
});
