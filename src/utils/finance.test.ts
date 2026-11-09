import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ANNUAL_RATE,
  SECONDS_PER_YEAR,
  MIN_PURCHASE_FOR_DEPOSIT,
  RETURN_COOLDOWN_MS,
  createInitialWalletState,
  calculateIncrement,
  calculateYieldRates,
  applyTick,
  processDeposit,
  processRealBalanceTopup,
  processDramPurchase,
  processPointsPurchase,
  confirmCooldownPassed,
  processReturnRefund,
  formatDram,
} from './finance';

test('calculateIncrement calculates accurate 10% annual bonus points', () => {
  const deposit = 100000;
  const oneYearInc = calculateIncrement(deposit, SECONDS_PER_YEAR, ANNUAL_RATE);
  assert.ok(Math.abs(oneYearInc - 10000) < 0.0001);
});

test('purchase >= 10,000 AMD becomes lifelong 10% deposit with inheritance right', () => {
  const state = createInitialWalletState(30000, 0, 0);
  const now = Date.now();
  const purchaseAmount = 15000;

  const result = processDramPurchase(state, purchaseAmount, 'Շինանյութերի փաթեթ', 0.05, now);

  assert.equal(result.success, true);
  assert.equal(result.becameLifelongDeposit, true);
  assert.ok(result.holdingCreated);
  assert.equal(result.holdingCreated.amount, 15000);
  assert.equal(result.holdingCreated.status, 'cooldown_15d');
  assert.equal(result.holdingCreated.inheritedRight, true);
  assert.equal(result.nextState.deposit, 15000);
  assert.equal(result.nextState.cooldownDeposit, 15000);
  assert.equal(result.nextState.realBalance, 15000);
  assert.equal(result.bonusEarned, 750); // 5% instant cashback
  assert.equal(result.nextState.bonusPoints, 750);
});

test('purchase < 10,000 AMD does NOT become lifelong deposit (remains standard retail)', () => {
  const state = createInitialWalletState(20000, 5000, 100);
  const now = Date.now();
  const purchaseAmount = 4500; // less than 10,000 AMD

  const result = processDramPurchase(state, purchaseAmount, 'Սննդամթերք', 0.05, now);

  assert.equal(result.success, true);
  assert.equal(result.becameLifelongDeposit, false);
  assert.equal(result.holdingCreated, undefined);
  assert.equal(result.nextState.deposit, 5000); // unchanged
  assert.equal(result.nextState.realBalance, 15500);
  assert.equal(result.bonusEarned, 225); // 5% cashback
  assert.equal(result.nextState.bonusPoints, 325);
});

test('during 15-day return cooldown, no per-second streaming until 15 days pass', () => {
  // Empty initial active deposit, 1 holding in cooldown
  const baseState = createInitialWalletState(10000, 0, 0);
  const purchaseTime = Date.now();
  const { nextState: stateWithHolding } = processDramPurchase(baseState, 20000, 'Էլեկտրական գործիք', 0.05, purchaseTime);

  // 5 days later (still inside 15-day cooldown)
  const fiveDaysLater = purchaseTime + 5 * 24 * 3600 * 1000;
  const tick1 = applyTick(stateWithHolding, fiveDaysLater, ANNUAL_RATE);

  // Active deposit is 0, so accrued points during return cooldown must be 0!
  assert.equal(tick1.accruedPoints, 0);
  assert.equal(tick1.nextState.cooldownDeposit, 20000);
  assert.equal(tick1.nextState.activeDeposit, 0);

  // 16 days later (after 15 days have passed without return)
  const sixteenDaysLater = purchaseTime + 16 * 24 * 3600 * 1000;
  const tick2 = applyTick(stateWithHolding, sixteenDaysLater, ANNUAL_RATE);

  // Holding automatically promoted to active_lifelong!
  assert.equal(tick2.nextState.activeDeposit, 20000);
  assert.equal(tick2.nextState.cooldownDeposit, 0);
  // Accrued points are now streaming!
  assert.ok(tick2.accruedPoints > 0);
  assert.ok(tick2.nextState.bonusPoints > 1000);
});

test('confirmCooldownPassed immediately activates lifelong deposit with right of inheritance', () => {
  const baseState = createInitialWalletState(10000, 0, 0);
  const { nextState, holdingCreated } = processDramPurchase(baseState, 12000, 'Գործիքների հավաքածու', 0.05);
  assert.ok(holdingCreated);

  const { nextState: activatedState } = confirmCooldownPassed(nextState, holdingCreated.id);
  assert.equal(activatedState.activeDeposit, 12000);
  assert.equal(activatedState.cooldownDeposit, 0);

  // Next tick immediately accrues per-second bonuses on confirmed deposit
  const tick = applyTick(activatedState, activatedState.lastTick + 1000, ANNUAL_RATE);
  assert.ok(tick.accruedPoints > 0);
});

test('processReturnRefund within 15 days refunds money and cancels deposit', () => {
  const baseState = createInitialWalletState(20000, 0, 0);
  const { nextState, holdingCreated } = processDramPurchase(baseState, 15000, 'Կահույքի սոսինձ', 0.05);
  assert.ok(holdingCreated);
  assert.equal(nextState.realBalance, 5000);
  assert.equal(nextState.deposit, 15000);

  const refundResult = processReturnRefund(nextState, holdingCreated.id);
  assert.equal(refundResult.success, true);
  assert.equal(refundResult.refundAmount, 15000);
  assert.equal(refundResult.nextState.realBalance, 20000); // money returned to balance
  assert.equal(refundResult.nextState.deposit, 0); // deposit cancelled
  assert.equal(refundResult.nextState.cooldownDeposit, 0);
});

test('processRealBalanceTopup increases real balance without minting bonus points', () => {
  const state = createInitialWalletState(10000, 0, 50);
  const { nextState, logEntry } = processRealBalanceTopup(state, 50000);

  assert.equal(nextState.realBalance, 60000);
  assert.equal(nextState.bonusPoints, 50);
  assert.ok(logEntry.includes('50'));
});

test('processPointsPurchase deducts points ONLY upon product purchase', () => {
  const state = createInitialWalletState(5000, 10000, 300);
  const result = processPointsPurchase(state, 250, 'Ցորենի հաց');

  assert.equal(result.success, true);
  assert.equal(result.nextState.bonusPoints, 50);
  assert.equal(result.nextState.deposit, 10000);
});

test('formatDram formats with Armenian Dram symbol', () => {
  const formatted = formatDram(5000);
  assert.ok(formatted.includes('֏'));
});
