import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createInitialErpState,
  postErpDocument,
  unpostErpDocument,
  calculateProfitAndLoss,
  calculateInventoryDiscrepancy,
  closeShiftZReport,
  generateNextDocNumber,
  findLowStockItems,
} from './erpEngine';
import { ProductItem } from '../types';
import { ErpDocument } from '../types/erp';

const mockProducts: ProductItem[] = [
  {
    id: 1,
    nameHy: 'Ցորենի հաց',
    nameRu: 'Хлеб пшеничный',
    categoryHy: 'Հացաբուլկեղեն',
    categoryRu: 'Бакалея',
    priceDram: 250,
    pointsCost: 250,
    descriptionHy: 'Թարմ հաց',
    descriptionRu: 'Свежий хлеб',
    unitHy: '1 հատ',
    unitRu: '1 шт',
    imageUrl: '',
    iconName: 'Package',
  },
  {
    id: 2,
    nameHy: 'Կովի կաթ',
    nameRu: 'Молоко коровье',
    categoryHy: 'Կաթնամթերք',
    categoryRu: 'Молочные продукты',
    priceDram: 550,
    pointsCost: 550,
    descriptionHy: 'Կաթ',
    descriptionRu: 'Молоко',
    unitHy: '1 լիտր',
    unitRu: '1 литр',
    imageUrl: '',
    iconName: 'Package',
  },
];

test('createInitialErpState creates properly configured warehouses, counterparties and stock', () => {
  const state = createInitialErpState(mockProducts);
  assert.equal(state.warehouses.length, 3);
  assert.equal(state.counterparties.length, 3);
  assert.equal(state.cashAccounts.length, 2);
  assert.ok(state.stockRegister.length >= mockProducts.length * 2);
});

test('postErpDocument: Receipt (Поступление) increases warehouse stock and counterparty liability', () => {
  const state = createInitialErpState(mockProducts);
  const initialStock = state.stockRegister.find((s) => s.warehouseId === 'wh_main' && s.productId === 1)!.quantity;
  const initialSupplierBalance = state.counterparties.find((c) => c.id === 'cnt_ararat')!.balanceDram;

  const receiptDoc: ErpDocument = {
    id: 'test_rcpt_1',
    docNumber: 'ПСТ-000001',
    type: 'receipt',
    status: 'draft',
    date: '01.11.2026',
    timestamp: Date.now(),
    warehouseId: 'wh_main',
    counterpartyId: 'cnt_ararat',
    amountDram: 17500,
    comment: 'Тестовое поступление',
    author: 'Бухгалтер',
    items: [
      {
        productId: 1,
        productName: 'Хлеб пшеничный',
        unit: '1 шт',
        quantity: 100,
        priceDram: 175,
        totalDram: 17500,
      },
    ],
  };

  const newState = postErpDocument(state, receiptDoc);
  const newStock = newState.stockRegister.find((s) => s.warehouseId === 'wh_main' && s.productId === 1)!.quantity;
  const newSupplierBalance = newState.counterparties.find((c) => c.id === 'cnt_ararat')!.balanceDram;

  assert.equal(newStock, initialStock + 100);
  assert.equal(newSupplierBalance, initialSupplierBalance + 17500);
  assert.equal(newState.documents.find((d) => d.id === 'test_rcpt_1')?.status, 'posted');
});

test('postErpDocument: Transfer (Перемещение) moves stock between warehouses', () => {
  const state = createInitialErpState(mockProducts);
  const fromInitial = state.stockRegister.find((s) => s.warehouseId === 'wh_main' && s.productId === 1)!.quantity;
  const toInitial = state.stockRegister.find((s) => s.warehouseId === 'wh_store' && s.productId === 1)!.quantity;

  const transferDoc: ErpDocument = {
    id: 'test_trf_1',
    docNumber: 'ПРМ-000001',
    type: 'transfer',
    status: 'draft',
    date: '01.11.2026',
    timestamp: Date.now(),
    warehouseId: 'wh_main',
    targetWarehouseId: 'wh_store',
    amountDram: 2500,
    comment: 'Перемещение в торговый зал',
    author: 'Заведующий складом',
    items: [
      {
        productId: 1,
        productName: 'Хлеб',
        unit: '1 шт',
        quantity: 10,
        priceDram: 250,
        totalDram: 2500,
      },
    ],
  };

  const newState = postErpDocument(state, transferDoc);
  const fromNew = newState.stockRegister.find((s) => s.warehouseId === 'wh_main' && s.productId === 1)!.quantity;
  const toNew = newState.stockRegister.find((s) => s.warehouseId === 'wh_store' && s.productId === 1)!.quantity;

  assert.equal(fromNew, fromInitial - 10);
  assert.equal(toNew, toInitial + 10);
});

test('postErpDocument: POS Sale decrements stock and increases cash register', () => {
  const state = createInitialErpState(mockProducts);
  const initialStock = state.stockRegister.find((s) => s.warehouseId === 'wh_store' && s.productId === 1)!.quantity;
  const initialCash = state.cashAccounts.find((a) => a.id === 'acc_cash_desk')!.balanceDram;

  const saleDoc: ErpDocument = {
    id: 'sale_1',
    docNumber: 'ЧЕК-000001',
    type: 'pos_sale',
    status: 'draft',
    date: '01.11.2026',
    timestamp: Date.now(),
    warehouseId: 'wh_store',
    cashAccountId: 'acc_cash_desk',
    amountDram: 500,
    comment: 'Продажа 2 шт хлеба',
    author: 'Кассир',
    items: [
      {
        productId: 1,
        productName: 'Хлеб',
        unit: '1 шт',
        quantity: 2,
        priceDram: 250,
        totalDram: 500,
      },
    ],
  };

  const newState = postErpDocument(state, saleDoc);
  const newStock = newState.stockRegister.find((s) => s.warehouseId === 'wh_store' && s.productId === 1)!.quantity;
  const newCash = newState.cashAccounts.find((a) => a.id === 'acc_cash_desk')!.balanceDram;

  assert.equal(newStock, initialStock - 2);
  assert.equal(newCash, initialCash + 500);
});

test('unpostErpDocument reverts document movements cleanly', () => {
  const state = createInitialErpState(mockProducts);
  const receiptDoc: ErpDocument = {
    id: 'rcpt_temp',
    docNumber: 'ПСТ-999',
    type: 'receipt',
    status: 'draft',
    date: '01.11.2026',
    timestamp: Date.now(),
    warehouseId: 'wh_main',
    counterpartyId: 'cnt_ararat',
    amountDram: 10000,
    comment: 'Temp',
    author: 'Бухгалтер',
    items: [
      {
        productId: 2,
        productName: 'Молоко',
        unit: '1 л',
        quantity: 20,
        priceDram: 500,
        totalDram: 10000,
      },
    ],
  };

  const posted = postErpDocument(state, receiptDoc);
  const unposted = unpostErpDocument(posted, 'rcpt_temp');

  const origStock = state.stockRegister.find((s) => s.warehouseId === 'wh_main' && s.productId === 2)!.quantity;
  const revertedStock = unposted.stockRegister.find((s) => s.warehouseId === 'wh_main' && s.productId === 2)!.quantity;

  assert.equal(revertedStock, origStock);
  assert.equal(unposted.documents.find((d) => d.id === 'rcpt_temp')?.status, 'draft');
});

test('calculateInventoryDiscrepancy correctly detects shortage and surplus', () => {
  const surplus = calculateInventoryDiscrepancy(10, 15, 200);
  assert.equal(surplus.status, 'surplus');
  assert.equal(surplus.varianceQty, 5);
  assert.equal(surplus.varianceCostDram, 1000);

  const shortage = calculateInventoryDiscrepancy(20, 17, 300);
  assert.equal(shortage.status, 'shortage');
  assert.equal(shortage.varianceQty, -3);
  assert.equal(shortage.varianceCostDram, 900);

  const match = calculateInventoryDiscrepancy(12, 12, 150);
  assert.equal(match.status, 'match');
  assert.equal(match.varianceQty, 0);
  assert.equal(match.varianceCostDram, 0);
});

test('calculateProfitAndLoss accurately aggregates revenue and calculates profit', () => {
  const state = createInitialErpState(mockProducts);
  const pnl = calculateProfitAndLoss(state);

  assert.ok(pnl.totalRevenueDram >= 0);
  assert.ok(pnl.grossProfitDram <= pnl.totalRevenueDram);
  assert.equal(pnl.grossProfitDram, Math.max(0, pnl.totalRevenueDram - pnl.cogsDram));
});

test('generateNextDocNumber formats 1C sequence number with correct prefix', () => {
  const num1 = generateNextDocNumber('receipt', []);
  assert.equal(num1, 'ПСТ-000001');

  const num2 = generateNextDocNumber('inventory', []);
  assert.equal(num2, 'ИНВ-000001');
});
