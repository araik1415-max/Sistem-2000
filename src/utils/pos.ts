/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { UserProfile } from '../types';

export interface PosPaymentDetails {
  method: 'nfc_card' | 'idram_qr' | 'telcell_qr' | 'cash' | 'split';
  amount: number;
  discountPercent?: number;
  tipPercent?: number;
  receivedCash?: number;
  customerPhone?: string;
  depositYieldEligible?: boolean;
}

export interface PosCalculationResult {
  baseAmount: number;
  discountPercent: number;
  discountAmount: number;
  subtotalAfterDiscount: number;
  tipPercent: number;
  tipAmount: number;
  taxVatAmount: number; // 20% VAT included in Armenia
  finalTotal: number;
  changeAmount: number;
}

export interface PosFiscalReceipt {
  receiptId: string;
  terminalId: string;
  fiscalNumber: string;
  cashierName: string;
  timestamp: number;
  dateStr: string;
  method: 'nfc_card' | 'idram_qr' | 'telcell_qr' | 'cash' | 'split';
  methodLabelHy: string;
  methodLabelRu: string;
  baseAmount: number;
  discountAmount: number;
  tipAmount: number;
  finalTotal: number;
  vatAmount: number;
  receivedCash?: number;
  changeAmount?: number;
  customerPhone?: string;
  depositCredited: boolean;
}

/**
 * Verifies if user has admin privileges to operate POS terminal
 */
export function isPosAuthorized(user?: UserProfile | null): boolean {
  return Boolean(user && user.isLoggedIn && user.isAdmin === true);
}

/**
 * Calculates POS totals including discounts, tips, and 20% included VAT
 */
export function calculatePosTotals(
  baseAmount: number,
  discountPercent: number = 0,
  tipPercent: number = 0,
  receivedCash: number = 0
): PosCalculationResult {
  const safeBase = Math.max(0, Math.round(baseAmount));
  const safeDiscountPct = Math.min(100, Math.max(0, discountPercent));
  const safeTipPct = Math.min(100, Math.max(0, tipPercent));

  const discountAmount = Math.round((safeBase * safeDiscountPct) / 100);
  const subtotalAfterDiscount = Math.max(0, safeBase - discountAmount);

  const tipAmount = Math.round((subtotalAfterDiscount * safeTipPct) / 100);
  const finalTotal = subtotalAfterDiscount + tipAmount;

  // In Armenia, 20% VAT is included in standard retail price: Tax = Total * 20 / 120 = Total / 6
  const taxVatAmount = Math.round((subtotalAfterDiscount * 20) / 120);

  const safeCash = Math.max(0, receivedCash);
  const changeAmount = safeCash > finalTotal ? safeCash - finalTotal : 0;

  return {
    baseAmount: safeBase,
    discountPercent: safeDiscountPct,
    discountAmount,
    subtotalAfterDiscount,
    tipPercent: safeTipPct,
    tipAmount,
    taxVatAmount,
    finalTotal,
    changeAmount,
  };
}

/**
 * Generates official POS receipt numbers and fiscal codes
 */
export function generatePosFiscalReceipt(
  cashierName: string,
  totals: PosCalculationResult,
  method: 'nfc_card' | 'idram_qr' | 'telcell_qr' | 'cash' | 'split',
  customerPhone?: string,
  depositCredited: boolean = true
): PosFiscalReceipt {
  const now = Date.now();
  const randomSuffix = Math.floor(10000 + Math.random() * 90000);
  const receiptId = `POS-ARM-${now.toString().slice(-6)}-${randomSuffix}`;
  const fiscalNumber = `FISC-${Math.floor(10000000 + Math.random() * 90000000)}`;

  const labels = {
    nfc_card: { hy: 'Անհպում քարտ (NFC / ArCa / Visa)', ru: 'Бесконтактная карта (NFC)' },
    idram_qr: { hy: 'Idram QR վճարում', ru: 'Оплата через Idram QR' },
    telcell_qr: { hy: 'Telcell Wallet QR', ru: 'Оплата через Telcell Wallet' },
    cash: { hy: 'Կանխիկ դրամարկղ', ru: 'Наличные в кассу' },
    split: { hy: 'Մասնակի վճարում (Քարտ + Կանխիկ)', ru: 'Смешанная оплата (Карта + Наличные)' },
  };

  return {
    receiptId,
    terminalId: 'ARM-YVN-POS-2000',
    fiscalNumber,
    cashierName: cashierName || 'Ադմինիստրատոր',
    timestamp: now,
    dateStr: new Date(now).toLocaleString('hy-AM'),
    method,
    methodLabelHy: labels[method]?.hy || method,
    methodLabelRu: labels[method]?.ru || method,
    baseAmount: totals.baseAmount,
    discountAmount: totals.discountAmount,
    tipAmount: totals.tipAmount,
    finalTotal: totals.finalTotal,
    vatAmount: totals.taxVatAmount,
    receivedCash: method === 'cash' ? totals.finalTotal + totals.changeAmount : undefined,
    changeAmount: totals.changeAmount > 0 ? totals.changeAmount : undefined,
    customerPhone: customerPhone?.trim() || undefined,
    depositCredited,
  };
}
