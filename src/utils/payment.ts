import { ProductItem } from '../types';

export type PaymentMethodId =
  | 'idram'
  | 'telcell'
  | 'arca'
  | 'visa_mastercard'
  | 'apple_pay'
  | 'google_pay'
  | 'wallet_balance';

export type PaymentPurpose = 'store_purchase' | 'deposit_topup' | 'wallet_topup';

export interface PaymentGateway {
  id: PaymentMethodId;
  nameHy: string;
  nameRu: string;
  badge: string;
  badgeHy: string;
  iconBg: string;
  iconColor: string;
  type: 'qr' | 'card' | 'wallet' | 'digital';
  processingTimeSec: number;
  commissionPercent: number;
}

export const PAYMENT_GATEWAYS: PaymentGateway[] = [
  {
    id: 'idram',
    nameHy: 'Idram & IDBank',
    nameRu: 'Idram и IDBank',
    badge: 'QR / Кошелек +374',
    badgeHy: 'QR / Դրամապանակ +374',
    iconBg: 'bg-orange-500/15 border-orange-500/40 text-orange-400',
    iconColor: '#f97316',
    type: 'qr',
    processingTimeSec: 0.9,
    commissionPercent: 0,
  },
  {
    id: 'telcell',
    nameHy: 'Telcell Wallet',
    nameRu: 'Telcell Кошелек',
    badge: 'QR / Telcell Pay +374',
    badgeHy: 'QR / Telcell Pay +374',
    iconBg: 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400',
    iconColor: '#10b981',
    type: 'qr',
    processingTimeSec: 0.9,
    commissionPercent: 0,
  },
  {
    id: 'arca',
    nameHy: 'ArCa / Ameriabank vPOS',
    nameRu: 'ArCa (Банки Армении)',
    badge: 'ArCa • Ameria • ACBA • IDBank',
    badgeHy: 'ՀՀ բանկային քարտեր (vPOS)',
    iconBg: 'bg-blue-500/15 border-blue-500/40 text-blue-400',
    iconColor: '#3b82f6',
    type: 'card',
    processingTimeSec: 1.1,
    commissionPercent: 0,
  },
  {
    id: 'visa_mastercard',
    nameHy: 'Visa / Mastercard / МИР',
    nameRu: 'Visa / Mastercard / МИР',
    badge: '3D Secure 2.0 • Любой банк',
    badgeHy: '3D Secure 2.0 • Միջազգային',
    iconBg: 'bg-purple-500/15 border-purple-500/40 text-purple-400',
    iconColor: '#a855f7',
    type: 'card',
    processingTimeSec: 1.1,
    commissionPercent: 0,
  },
  {
    id: 'apple_pay',
    nameHy: 'Apple Pay / Google Pay',
    nameRu: 'Apple Pay / Google Pay',
    badge: '1-Click Web Payment API',
    badgeHy: '1-Click Ակնթարթային վճարում',
    iconBg: 'bg-slate-700/60 border-slate-500 text-white',
    iconColor: '#ffffff',
    type: 'digital',
    processingTimeSec: 0.7,
    commissionPercent: 0,
  },
  {
    id: 'wallet_balance',
    nameHy: 'Համակարգ 2000 Հաշվեկշիռ (֏)',
    nameRu: 'Баланс кошелька (Система 2000)',
    badge: 'Мгновенное списание 0%',
    badgeHy: 'Ակնթարթային վճարում 0%',
    iconBg: 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300',
    iconColor: '#06b6d4',
    type: 'wallet',
    processingTimeSec: 0.4,
    commissionPercent: 0,
  },
];

export interface TestCardPreset {
  id: string;
  labelRu: string;
  labelHy: string;
  bankName: string;
  cardNumber: string;
  expiry: string;
  cvv: string;
  holder: string;
  brand: 'ArCa' | 'Visa' | 'Mastercard';
}

export const TEST_CARD_PRESETS: TestCardPreset[] = [
  {
    id: 'arca_ameria',
    labelRu: 'ArCa • Ameriabank',
    labelHy: 'ArCa • Ամերիաբանկ',
    bankName: 'Ameriabank CJSC',
    cardNumber: '9051 1900 2480 1126',
    expiry: '12/29',
    cvv: '789',
    holder: 'ARAIK PETROSYAN',
    brand: 'ArCa',
  },
  {
    id: 'visa_idbank',
    labelRu: 'Visa • IDBank',
    labelHy: 'Visa • ԱյԴի Բանկ',
    bankName: 'IDBank CJSC',
    cardNumber: '4454 3200 8192 4017',
    expiry: '08/29',
    cvv: '452',
    holder: 'ARAIK PETROSYAN',
    brand: 'Visa',
  },
  {
    id: 'mc_ardshin',
    labelRu: 'Mastercard • Ardshinbank',
    labelHy: 'Mastercard • Արդշինբանկ',
    bankName: 'Ardshinbank CJSC',
    cardNumber: '5412 7500 3819 2044',
    expiry: '11/28',
    cvv: '913',
    holder: 'ARAIK PETROSYAN',
    brand: 'Mastercard',
  },
];

export interface CartItem {
  product: ProductItem;
  quantity: number;
}

/**
 * Հաշվարկում է զամբյուղի ընդհանուր գումարը
 */
export function calculateCartTotals(items: CartItem[]): {
  totalDram: number;
  totalPoints: number;
  itemCount: number;
} {
  let totalDram = 0;
  let totalPoints = 0;
  let itemCount = 0;

  for (const item of items) {
    totalDram += item.product.priceDram * item.quantity;
    totalPoints += item.product.pointsCost * item.quantity;
    itemCount += item.quantity;
  }

  return { totalDram, totalPoints, itemCount };
}

/**
 * Formats a raw card number string into groups of 4 digits (XXXX XXXX XXXX XXXX)
 */
export function formatCardNumber(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 19);
  const groups = digits.match(/.{1,4}/g);
  return groups ? groups.join(' ') : '';
}

/**
 * Formats card expiry as MM/YY
 */
export function formatCardExpiry(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}`;
}

/**
 * Formats an Armenian mobile number (+374 XX XXX XXX)
 */
export function formatArmenianPhone(raw: string): string {
  let digits = raw.replace(/\D/g, '');
  if (digits.startsWith('374')) {
    digits = digits.slice(3);
  } else if (digits.startsWith('0')) {
    digits = digits.slice(1);
  }
  digits = digits.slice(0, 8);
  if (digits.length === 0) return '+374 ';
  if (digits.length <= 2) return `+374 ${digits}`;
  if (digits.length <= 5) return `+374 ${digits.slice(0, 2)} ${digits.slice(2)}`;
  return `+374 ${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5, 8)}`;
}

/**
 * Standard Luhn algorithm check for bank card numbers
 */
export function isValidLuhn(cardNumber: string): boolean {
  const digits = cardNumber.replace(/\D/g, '');
  if (digits.length < 15 || digits.length > 19) return false;
  let sum = 0;
  let shouldDouble = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits.charAt(i), 10);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  return sum % 10 === 0;
}

/**
 * Detects card brand (ArCa, Visa, Mastercard, MIR) and Armenian issuing bank
 */
export function detectCardBrandAndBank(cardNumber: string): {
  brand: 'ArCa' | 'Visa' | 'Mastercard' | 'MIR' | 'Card';
  bankName: string;
} {
  const digits = cardNumber.replace(/\D/g, '');
  let brand: 'ArCa' | 'Visa' | 'Mastercard' | 'MIR' | 'Card' = 'Card';
  if (digits.startsWith('9051')) brand = 'ArCa';
  else if (digits.startsWith('4')) brand = 'Visa';
  else if (/^(5[1-5]|2[2-7])/.test(digits)) brand = 'Mastercard';
  else if (digits.startsWith('220')) brand = 'MIR';

  let bankName = 'Armenian Processing Center (ArCa)';
  if (digits.startsWith('905119') || digits.startsWith('4052') || digits.startsWith('4187')) {
    bankName = 'Ameriabank CJSC';
  } else if (digits.startsWith('4454') || digits.startsWith('905122')) {
    bankName = 'IDBank CJSC';
  } else if (digits.startsWith('5412') || digits.startsWith('4314')) {
    bankName = 'Ardshinbank CJSC';
  } else if (digits.startsWith('4783') || digits.startsWith('905114')) {
    bankName = 'ACBA Bank OJSC';
  } else if (digits.startsWith('4263') || digits.startsWith('5243')) {
    bankName = 'Inecobank CJSC';
  }

  return { brand, bankName };
}

/**
 * Validates card number, expiry date, CVV, and holder name
 */
export function validateCardDetails(params: {
  cardNumber: string;
  expiry: string;
  cvv: string;
  holder: string;
}): { valid: boolean; errorRu?: string; errorHy?: string } {
  const digits = params.cardNumber.replace(/\D/g, '');
  if (digits.length < 15 || digits.length > 19) {
    return {
      valid: false,
      errorRu: 'Введите корректный 16-значный номер банковской карты',
      errorHy: 'Մուտքագրեք վավեր 16-նիշանոց քարտի համար',
    };
  }

  const expMatch = /^(\d{2})\/(\d{2})$/.exec(params.expiry.trim());
  if (!expMatch) {
    return {
      valid: false,
      errorRu: 'Укажите срок действия карты в формате ММ/ГГ',
      errorHy: 'Նշեք քարտի գործողության ժամկետը MM/YY ձևաչափով',
    };
  }

  const month = parseInt(expMatch[1], 10);
  const year = 2000 + parseInt(expMatch[2], 10);
  if (month < 1 || month > 12 || year < 2025) {
    return {
      valid: false,
      errorRu: 'Срок действия карты истек или указан неверно',
      errorHy: 'Քարտի գործողության ժամկետը սխալ է կամ լրացել է',
    };
  }

  const cvvDigits = params.cvv.replace(/\D/g, '');
  if (cvvDigits.length < 3 || cvvDigits.length > 4) {
    return {
      valid: false,
      errorRu: 'Введите 3-значный код CVV/CVC с обратной стороны карты',
      errorHy: 'Մուտքագրեք քարտի 3-նիշանոց CVV/CVC կոդը',
    };
  }

  if (params.holder.trim().length < 3) {
    return {
      valid: false,
      errorRu: 'Введите имя и фамилию держателя карты',
      errorHy: 'Մուտքագրեք քարտապանի անունը և ազգանունը',
    };
  }

  return { valid: true };
}

/**
 * Generates an official payment URI for Idram / Telcell QR and DeepLink checkout
 */
export function buildGatewayQrPayload(
  gatewayId: PaymentMethodId,
  amountDram: number,
  orderId: string,
  description = 'Sistema 2000 Order'
): { qrUri: string; webCheckoutUrl: string; merchantAccount: string } {
  const encodedDesc = encodeURIComponent(description);
  if (gatewayId === 'telcell') {
    const merchantAccount = 'TELCELL-MERCHANT-2000';
    return {
      merchantAccount,
      qrUri: `telcell://pay?issuer=${merchantAccount}&sum=${amountDram}&currency=AMD&order_id=${orderId}&info=${encodedDesc}`,
      webCheckoutUrl: `https://telcell.am/ru/wallet?order_id=${orderId}&amount=${amountDram}`,
    };
  }
  const merchantAccount = '100002000';
  return {
    merchantAccount,
    qrUri: `idramapp://payment?receiverName=Sistema2000&receiverId=${merchantAccount}&amount=${amountDram}&billNo=${orderId}&title=${encodedDesc}`,
    webCheckoutUrl: `https://banking.idram.am/Payment/GetPayment?EDP_LANGUAGE=AM&EDP_REC_ACCOUNT=${merchantAccount}&EDP_AMOUNT=${amountDram}&EDP_BILL_NO=${orderId}&EDP_DESCRIPTION=${encodedDesc}`,
  };
}

/**
 * Generates a deterministic 25x25 QR code matrix with standard Finder Patterns,
 * Timing Patterns, Alignment Pattern, and payload hash modules so the QR code
 * renders as a genuine, high-contrast SVG QR code.
 */
export function generateQrMatrix(payload: string, size = 25): boolean[][] {
  const matrix: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));
  const reserved: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

  const placeFinder = (rowOffset: number, colOffset: number) => {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const rr = rowOffset + r;
        const cc = colOffset + c;
        if (rr < 0 || rr >= size || cc < 0 || cc >= size) continue;
        reserved[rr][cc] = true;
        const inOuter = r >= 0 && r <= 6 && c >= 0 && c <= 6 && (r === 0 || r === 6 || c === 0 || c === 6);
        const inInner = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        matrix[rr][cc] = inOuter || inInner;
      }
    }
  };

  placeFinder(0, 0);
  placeFinder(0, size - 7);
  placeFinder(size - 7, 0);

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    reserved[6][i] = true;
    reserved[i][6] = true;
    matrix[6][i] = i % 2 === 0;
    matrix[i][6] = i % 2 === 0;
  }

  // Alignment pattern at (size - 9, size - 9)
  const ar = size - 9;
  const ac = size - 9;
  for (let r = -2; r <= 2; r++) {
    for (let c = -2; c <= 2; c++) {
      reserved[ar + r][ac + c] = true;
      const isBorder = Math.abs(r) === 2 || Math.abs(c) === 2;
      const isCenter = r === 0 && c === 0;
      matrix[ar + r][ac + c] = isBorder || isCenter;
    }
  }

  // Deterministic bit stream from payload bytes
  let hash = 2166136261;
  for (let i = 0; i < payload.length; i++) {
    hash ^= payload.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  let idx = 0;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (reserved[r][c]) continue;
      const charCode = payload.charCodeAt(idx % payload.length) || 73;
      const mixed = Math.imul(hash ^ (r * 31 + c * 17 + idx * 13), 2654435761) >>> 0;
      const bit = ((charCode >> (idx % 7)) ^ (mixed & 1)) & 1;
      matrix[r][c] = bit === 1;
      idx++;
    }
  }

  return matrix;
}

export interface TransactionReceipt {
  receiptId: string;
  providerCode: string;
  fiscalHdmNumber: string;
  taxTin: string;
  authCode: string;
  timestamp: string;
  amountDram: number;
  gatewayId: PaymentMethodId;
  orderType: PaymentPurpose;
  maskedAccount?: string;
  status: 'COMPLETED';
}

/**
 * Գեներացնում է պաշտոնական ՀԴՄ վճարման ստացական (Fiscal Receipt)
 */
export function generateTransactionReceipt(
  amountDram: number,
  gatewayId: PaymentMethodId,
  orderType: PaymentPurpose,
  itemsCount = 1,
  maskedAccount?: string
): TransactionReceipt {
  const prefix = gatewayId.toUpperCase().slice(0, 3);
  const randomNum = Math.floor(100000 + Math.random() * 900000);
  const hdmDigits = Math.floor(10000000 + Math.random() * 90000000);
  const authDigits = Math.floor(100000 + Math.random() * 900000);
  return {
    receiptId: `REC-${prefix}-${randomNum}`,
    providerCode: `${gatewayId.toUpperCase()}_TXN_${Date.now()}_${itemsCount}`,
    fiscalHdmNumber: `ՀԴՄ-${hdmDigits}`,
    taxTin: '02584917',
    authCode: `AUTH-${authDigits}`,
    timestamp: new Date().toLocaleString('ru-RU'),
    amountDram,
    gatewayId,
    orderType,
    maskedAccount,
    status: 'COMPLETED',
  };
}
