import {
  AccountType,
  TransactionType,
  LedgerEntry,
  UserState,
  CustomerAccount,
  CustomerPurchase,
} from '../types';
import { INITIAL_CUSTOMERS } from '../data/initialCustomers';

export class System2000Engine {
  private static readonly ANNUAL_RATE = 0.10; // 10% годовых
  private static readonly MS_IN_YEAR = 1000 * 60 * 60 * 24 * 365;

  /**
   * Чистый расчет накопленных процентов за прошедшее время (Δt)
   */
  public static calculateAccruedInterest(
    depositAmount: number,
    lastTimestamp: number,
    currentTimestamp: number = Date.now()
  ): number {
    if (depositAmount <= 0 || currentTimestamp <= lastTimestamp) {
      return 0;
    }
    const elapsedMs = currentTimestamp - lastTimestamp;
    const elapsedYears = elapsedMs / System2000Engine.MS_IN_YEAR;
    const interest = depositAmount * System2000Engine.ANNUAL_RATE * elapsedYears;
    return Number(interest.toFixed(6));
  }

  /**
   * Синхронизация процентов перед любой операцией
   */
  public static syncInterest(
    state: UserState,
    now: number = Date.now()
  ): { updatedState: UserState; interestEarned: number } {
    const accrued = this.calculateAccruedInterest(state.deposit, state.lastAccrualTimestamp, now);

    const updatedState: UserState = {
      ...state,
      realBalance: Number((state.realBalance + accrued).toFixed(2)),
      lastAccrualTimestamp: now,
    };

    return { updatedState, interestEarned: accrued };
  }

  /**
   * Пополнение депозита с основного баланса
   */
  public static topUpDeposit(
    state: UserState,
    amount: number,
    now: number = Date.now()
  ): { newState: UserState; ledgerEntries: LedgerEntry[] } {
    if (amount <= 0) throw new Error('Сумма пополнения должна быть больше нуля');

    const { updatedState: syncedState, interestEarned } = this.syncInterest(state, now);
    if (syncedState.realBalance < amount) throw new Error('Недостаточно средств на основном балансе');

    const ledgerEntries: LedgerEntry[] = [];

    if (interestEarned > 0) {
      ledgerEntries.push({
        id: `tx_int_${now}_${Math.random().toString(36).substring(2, 7)}`,
        userId: state.userId,
        type: 'INTEREST_ACCRUAL',
        amount: interestEarned,
        fromAccount: 'EXTERNAL_SYSTEM',
        toAccount: 'REAL_BALANCE',
        timestamp: now,
        details: '10% APY начисление процентов на депозит',
      });
    }

    const newState: UserState = {
      ...syncedState,
      realBalance: Number((syncedState.realBalance - amount).toFixed(2)),
      deposit: Number((syncedState.deposit + amount).toFixed(2)),
    };

    ledgerEntries.push({
      id: `tx_dep_${now}_${Math.random().toString(36).substring(2, 7)}`,
      userId: state.userId,
      type: 'DEPOSIT_TOPUP',
      amount: amount,
      fromAccount: 'REAL_BALANCE',
      toAccount: 'DEPOSIT',
      timestamp: now,
      details: 'Пополнение тела депозита с основного баланса',
    });

    return { newState, ledgerEntries };
  }

  /**
   * Покупка товара с начислением бонусных баллов и конвертацией
   */
  public static makePurchase(
    state: UserState,
    productPrice: number,
    now: number = Date.now()
  ): { newState: UserState; ledgerEntries: LedgerEntry[] } {
    if (productPrice <= 0) throw new Error('Некорректная цена товара');

    const { updatedState: syncedState, interestEarned } = this.syncInterest(state, now);
    if (syncedState.realBalance < productPrice) throw new Error('Недостаточно средств для покупки');

    const ledgerEntries: LedgerEntry[] = [];

    if (interestEarned > 0) {
      ledgerEntries.push({
        id: `tx_int_${now}_${Math.random().toString(36).substring(2, 7)}`,
        userId: state.userId,
        type: 'INTEREST_ACCRUAL',
        amount: interestEarned,
        fromAccount: 'EXTERNAL_SYSTEM',
        toAccount: 'REAL_BALANCE',
        timestamp: now,
        details: '10% APY начисление процентов на депозит',
      });
    }

    // Начисляем бонусные баллы (5% от суммы покупки)
    const bonusEarned = Number((productPrice * 0.05).toFixed(2));

    const newState: UserState = {
      ...syncedState,
      realBalance: Number((syncedState.realBalance - productPrice).toFixed(2)),
      bonusPoints: Number((syncedState.bonusPoints + bonusEarned).toFixed(2)),
    };

    ledgerEntries.push({
      id: `tx_pur_${now}_${Math.random().toString(36).substring(2, 7)}`,
      userId: state.userId,
      type: 'PURCHASE',
      amount: productPrice,
      fromAccount: 'REAL_BALANCE',
      toAccount: 'EXTERNAL_SYSTEM',
      timestamp: now,
      details: `Покупка товара в онлайн-магазине (-${productPrice} ֏)`,
    });

    ledgerEntries.push({
      id: `tx_bon_${now}_${Math.random().toString(36).substring(2, 7)}`,
      userId: state.userId,
      type: 'BONUS_REWARD',
      amount: bonusEarned,
      fromAccount: 'EXTERNAL_SYSTEM',
      toAccount: 'BONUS_POINTS',
      timestamp: now,
      details: `Начисление кешбэк бонусов (+${bonusEarned} б.)`,
    });

    return { newState, ledgerEntries };
  }

  /**
   * Покупка с оплатой бонусными баллами
   */
  public static purchaseWithPoints(
    customer: CustomerAccount,
    pointsRequired: number,
    purchase: CustomerPurchase,
    now: number = Date.now()
  ): CustomerAccount {
    if (customer.bonusPoints < pointsRequired) {
      throw new Error(`Недостаточно баллов. Требуется: ${pointsRequired}, доступно: ${customer.bonusPoints}`);
    }

    const updatedPoints = Number((customer.bonusPoints - pointsRequired).toFixed(2));
    const ledgerEntry: LedgerEntry = {
      id: `tx_bon_pay_${now}`,
      userId: customer.id,
      type: 'PURCHASE',
      amount: pointsRequired,
      fromAccount: 'BONUS_POINTS',
      toAccount: 'EXTERNAL_SYSTEM',
      timestamp: now,
      details: `Оплата заказа ${purchase.orderNumber} бонусами (-${pointsRequired} б.)`,
    };

    return {
      ...customer,
      bonusPoints: updatedPoints,
      purchases: [purchase, ...customer.purchases],
      ledger: [ledgerEntry, ...customer.ledger],
      totalSpentDram: customer.totalSpentDram + purchase.totalAmountDram,
      lastActiveAt: 'Только что',
    };
  }

  /**
   * Корректировка баллов или баланса клиента администратором
   */
  public static adjustCustomerBalanceByAdmin(
    customer: CustomerAccount,
    account: AccountType,
    delta: number,
    reason: string,
    now: number = Date.now()
  ): CustomerAccount {
    const updated = { ...customer };

    if (account === 'BONUS_POINTS') {
      updated.bonusPoints = Math.max(0, Number((customer.bonusPoints + delta).toFixed(2)));
    } else if (account === 'DEPOSIT') {
      updated.deposit = Math.max(0, Number((customer.deposit + delta).toFixed(2)));
    } else if (account === 'REAL_BALANCE') {
      updated.realBalance = Math.max(0, Number((customer.realBalance + delta).toFixed(2)));
    }

    const ledgerEntry: LedgerEntry = {
      id: `tx_adm_${now}_${Math.random().toString(36).substring(2, 6)}`,
      userId: customer.id,
      type: 'ADMIN_ADJUSTMENT',
      amount: delta,
      fromAccount: delta >= 0 ? 'EXTERNAL_SYSTEM' : account,
      toAccount: delta >= 0 ? account : 'EXTERNAL_SYSTEM',
      timestamp: now,
      details: `Административная корректировка: ${reason} (${delta >= 0 ? '+' : ''}${delta})`,
    };

    updated.ledger = [ledgerEntry, ...customer.ledger];
    return updated;
  }
}
