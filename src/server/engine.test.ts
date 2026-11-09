import test from 'node:test';
import assert from 'node:assert/strict';
import { System2000Engine } from './engine';
import { UserState, CustomerAccount, CustomerPurchase } from '../types';

test('calculateAccruedInterest calculates accurate 10% annual interest', () => {
  const deposit = 100000;
  const oneYearMs = 1000 * 60 * 60 * 24 * 365;
  const start = 1000000;
  const end = start + oneYearMs;

  const interest = System2000Engine.calculateAccruedInterest(deposit, start, end);
  assert.equal(interest, 10000); // 10% of 100,000 = 10,000
});

test('syncInterest updates realBalance with accrued interest and updates timestamp', () => {
  const state: UserState = {
    userId: 'u1',
    realBalance: 5000,
    deposit: 120000,
    bonusPoints: 100,
    lastAccrualTimestamp: 1000,
  };
  const oneMonthMs = (1000 * 60 * 60 * 24 * 365) / 12;
  const now = 1000 + oneMonthMs;

  const { updatedState, interestEarned } = System2000Engine.syncInterest(state, now);
  assert.equal(interestEarned, 1000); // 120,000 * 0.10 / 12 = 1,000
  assert.equal(updatedState.realBalance, 6000);
  assert.equal(updatedState.lastAccrualTimestamp, now);
});

test('topUpDeposit transfers amount to deposit and logs ledger entries', () => {
  const state: UserState = {
    userId: 'u1',
    realBalance: 20000,
    deposit: 50000,
    bonusPoints: 200,
    lastAccrualTimestamp: 1000,
  };

  const { newState, ledgerEntries } = System2000Engine.topUpDeposit(state, 10000, 1000);
  assert.equal(newState.realBalance, 10000);
  assert.equal(newState.deposit, 60000);
  assert.ok(ledgerEntries.some((e) => e.type === 'DEPOSIT_TOPUP' && e.amount === 10000));
});

test('makePurchase deducts price, credits 5% bonus points, and logs transactions', () => {
  const state: UserState = {
    userId: 'u1',
    realBalance: 30000,
    deposit: 10000,
    bonusPoints: 100,
    lastAccrualTimestamp: 2000,
  };

  const { newState, ledgerEntries } = System2000Engine.makePurchase(state, 5000, 2000);
  assert.equal(newState.realBalance, 25000);
  assert.equal(newState.bonusPoints, 100 + 250); // 5% of 5,000 = 250
  assert.ok(ledgerEntries.some((e) => e.type === 'PURCHASE' && e.amount === 5000));
  assert.ok(ledgerEntries.some((e) => e.type === 'BONUS_REWARD' && e.amount === 250));
});

test('purchaseWithPoints deducts points and appends to customer order history', () => {
  const customer: CustomerAccount = {
    id: 'c1',
    name: 'Арам Саргсян',
    phone: '+374 93 111111',
    email: 'test@test.am',
    city: 'Ереван',
    registeredAt: '01.01.2026',
    lastActiveAt: 'Вчера',
    status: 'regular',
    realBalance: 5000,
    deposit: 20000,
    bonusPoints: 800,
    lastAccrualTimestamp: 1000,
    purchases: [],
    ledger: [],
    totalSpentDram: 15000,
  };

  const purchase: CustomerPurchase = {
    id: 'ord_test_1',
    orderNumber: 'ПАТ-001',
    date: '03.11.2026',
    timestamp: 3000,
    items: [
      {
        productId: 1,
        productName: 'Хлеб',
        quantity: 2,
        priceDram: 250,
        unit: '1 шт',
        totalDram: 500,
      },
    ],
    totalAmountDram: 500,
    paidWith: 'points',
    pointsUsed: 500,
    bonusPointsEarned: 0,
    status: 'delivered',
  };

  const updated = System2000Engine.purchaseWithPoints(customer, 500, purchase, 3000);
  assert.equal(updated.bonusPoints, 300);
  assert.equal(updated.purchases.length, 1);
  assert.equal(updated.purchases[0].orderNumber, 'ПАТ-001');
  assert.equal(updated.purchases[0].items[0].productName, 'Хлеб');
  assert.equal(updated.ledger.length, 1);
  assert.equal(updated.totalSpentDram, 15500);
});

test('adjustCustomerBalanceByAdmin allows admin to adjust bonus points and records ledger', () => {
  const customer: CustomerAccount = {
    id: 'c2',
    name: 'Анаит Казарян',
    phone: '+374 77 222222',
    email: 'anahit@test.am',
    city: 'Ереван',
    registeredAt: '01.01.2026',
    lastActiveAt: 'Вчера',
    status: 'vip',
    realBalance: 10000,
    deposit: 50000,
    bonusPoints: 1000,
    lastAccrualTimestamp: 1000,
    purchases: [],
    ledger: [],
    totalSpentDram: 20000,
  };

  const updated = System2000Engine.adjustCustomerBalanceByAdmin(
    customer,
    'BONUS_POINTS',
    500,
    'Подарочные баллы ко дню рождения'
  );

  assert.equal(updated.bonusPoints, 1500);
  assert.equal(updated.ledger.length, 1);
  assert.equal(updated.ledger[0].type, 'ADMIN_ADJUSTMENT');
  assert.ok(updated.ledger[0].details?.includes('Подарочные баллы'));
});
