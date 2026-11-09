import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateCartTotals,
  generateTransactionReceipt,
  PAYMENT_GATEWAYS,
  formatCardNumber,
  formatCardExpiry,
  formatArmenianPhone,
  detectCardBrandAndBank,
  validateCardDetails,
  buildGatewayQrPayload,
  generateQrMatrix,
} from './payment';
import { ProductItem } from '../types';

const mockProductA: ProductItem = {
  id: 1,
  nameHy: 'Հաց',
  nameRu: 'Хлеб',
  categoryHy: 'Հացաբուլկեղեն',
  categoryRu: 'Бакалея',
  priceDram: 250,
  pointsCost: 250,
  descriptionHy: '',
  descriptionRu: '',
  unitHy: '1 հատ',
  unitRu: '1 шт',
  imageUrl: '',
  iconName: '',
  isAvailable: true,
};

const mockProductB: ProductItem = {
  id: 2,
  nameHy: 'Կաթ',
  nameRu: 'Молоко',
  categoryHy: 'Կաթնամթերք',
  categoryRu: 'Молочные продукты',
  priceDram: 550,
  pointsCost: 550,
  descriptionHy: '',
  descriptionRu: '',
  unitHy: '1 լ',
  unitRu: '1 л',
  imageUrl: '',
  iconName: '',
  isAvailable: true,
};

test('calculateCartTotals calculates accurate totals and counts', () => {
  const cart = [
    { product: mockProductA, quantity: 2 }, // 250 * 2 = 500
    { product: mockProductB, quantity: 1 }, // 550 * 1 = 550
  ];
  const { totalDram, totalPoints, itemCount } = calculateCartTotals(cart);
  assert.equal(totalDram, 1050);
  assert.equal(totalPoints, 1050);
  assert.equal(itemCount, 3);
});

test('generateTransactionReceipt produces unique receipt ID, fiscal HDM number, and completed status', () => {
  const receipt = generateTransactionReceipt(15000, 'idram', 'store_purchase', 2, '+374 91 200 000');
  assert.ok(receipt.receiptId.startsWith('REC-IDR-'));
  assert.ok(receipt.fiscalHdmNumber.startsWith('ՀԴՄ-'));
  assert.equal(receipt.taxTin, '02584917');
  assert.equal(receipt.status, 'COMPLETED');
  assert.equal(receipt.amountDram, 15000);
  assert.ok(receipt.providerCode.includes('IDRAM_TXN_'));
});

test('PAYMENT_GATEWAYS includes Idram, Telcell, ArCa, Visa/Mastercard, Apple/Google Pay, and Wallet Balance', () => {
  const ids = PAYMENT_GATEWAYS.map((g) => g.id);
  assert.ok(ids.includes('idram'));
  assert.ok(ids.includes('telcell'));
  assert.ok(ids.includes('arca'));
  assert.ok(ids.includes('visa_mastercard'));
  assert.ok(ids.includes('apple_pay'));
  assert.ok(ids.includes('wallet_balance'));
});

test('card formatting and brand/bank detection works for ArCa, Visa, and Mastercard', () => {
  assert.equal(formatCardNumber('9051190024801126'), '9051 1900 2480 1126');
  assert.equal(formatCardExpiry('1229'), '12/29');
  assert.equal(formatArmenianPhone('091200000'), '+374 91 200 000');

  const arcaInfo = detectCardBrandAndBank('9051 1900 2480 1126');
  assert.equal(arcaInfo.brand, 'ArCa');
  assert.equal(arcaInfo.bankName, 'Ameriabank CJSC');

  const visaInfo = detectCardBrandAndBank('4454 3200 8192 4017');
  assert.equal(visaInfo.brand, 'Visa');
  assert.equal(visaInfo.bankName, 'IDBank CJSC');
});

test('validateCardDetails checks card length, expiry, CVV, and holder name', () => {
  const valid = validateCardDetails({
    cardNumber: '9051 1900 2480 1126',
    expiry: '12/29',
    cvv: '789',
    holder: 'ARAIK PETROSYAN',
  });
  assert.equal(valid.valid, true);

  const invalidCard = validateCardDetails({
    cardNumber: '1234',
    expiry: '12/29',
    cvv: '789',
    holder: 'ARAIK PETROSYAN',
  });
  assert.equal(invalidCard.valid, false);
});

test('buildGatewayQrPayload and generateQrMatrix generate valid URI and 25x25 QR matrix', () => {
  const payload = buildGatewayQrPayload('idram', 10000, 'ORD-101', 'Test Order');
  assert.ok(payload.qrUri.startsWith('idramapp://payment?'));
  assert.ok(payload.webCheckoutUrl.includes('banking.idram.am'));

  const matrix = generateQrMatrix(payload.qrUri, 25);
  assert.equal(matrix.length, 25);
  assert.equal(matrix[0].length, 25);
  assert.equal(matrix[0][0], true); // Top-left finder corner
  assert.equal(matrix[0][24], true); // Top-right finder corner
  assert.equal(matrix[24][0], true); // Bottom-left finder corner
});
