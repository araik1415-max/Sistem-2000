import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeAdminEcosystemMetrics,
  applyBulkPriceChange,
  applyBulkStockRefill,
  flattenAndFilterOrders,
} from './adminCommandCenter';
import { createInitialWalletState } from './finance';
import { ProductItem, CustomerAccount } from '../types';

const SAMPLE_PRODUCTS: ProductItem[] = [
  {
    id: 1,
    nameHy: 'Հաց',
    nameRu: 'Хлеб',
    categoryHy: 'Հացաբուլկեղեն',
    categoryRu: 'Выпечка',
    priceDram: 1000,
    pointsCost: 1000,
    descriptionHy: '',
    descriptionRu: '',
    unitHy: '1 հատ',
    unitRu: '1 шт',
    imageUrl: '',
    iconName: 'Package',
    department: 'groceries',
    stockCount: 10,
    isAvailable: true,
  },
  {
    id: 2,
    nameHy: 'Ցեմենտ',
    nameRu: 'Цемент',
    categoryHy: 'Շինանյութեր',
    categoryRu: 'Стройматериалы',
    priceDram: 3000,
    pointsCost: 3000,
    descriptionHy: '',
    descriptionRu: '',
    unitHy: '1 պարկ',
    unitRu: '1 мешок',
    imageUrl: '',
    iconName: 'Package',
    department: 'construction',
    stockCount: 3,
    isAvailable: false,
  },
];

const SAMPLE_CUSTOMERS: CustomerAccount[] = [
  {
    id: 'c1',
    name: 'Արայիկ Պետրոսյան',
    phone: '+374 91 123456',
    email: 'araik@example.com',
    city: 'Երևան',
    registeredAt: '01.01.2026',
    lastActiveAt: '09.11.2026',
    status: 'vip',
    realBalance: 25000,
    deposit: 50000,
    bonusPoints: 1200,
    lastAccrualTimestamp: 1000,
    totalSpentDram: 15000,
    ledger: [],
    purchases: [
      {
        id: 'ord_1',
        orderNumber: 'ORD-101',
        date: '08.11.2026',
        timestamp: 2000,
        totalAmountDram: 15000,
        paidWith: 'idram',
        bonusPointsEarned: 750,
        status: 'processing',
        items: [
          {
            productId: 1,
            productName: 'Хлеб',
            quantity: 2,
            priceDram: 1000,
            unit: '1 шт',
            totalDram: 2000,
          },
        ],
      },
    ],
  },
];

test('computeAdminEcosystemMetrics calculates accurate totals across catalog, CRM and wallet', () => {
  const wallet = createInitialWalletState(10000, 20000, 500);
  const metrics = computeAdminEcosystemMetrics({
    products: SAMPLE_PRODUCTS,
    customers: SAMPLE_CUSTOMERS,
    wallet,
  });

  assert.equal(metrics.totalProducts, 2);
  assert.equal(metrics.availableProducts, 1);
  assert.equal(metrics.hiddenProducts, 1);
  assert.equal(metrics.lowStockProducts, 1);
  assert.equal(metrics.totalCatalogStockUnits, 13);
  assert.equal(metrics.totalCatalogStockValueDram, 1000 * 10 + 3000 * 3);
  assert.equal(metrics.totalCustomers, 1);
  assert.equal(metrics.vipCustomers, 1);
  assert.equal(metrics.totalOrdersCount, 1);
  assert.equal(metrics.totalOrdersRevenueDram, 15000);
});

test('applyBulkPriceChange adjusts prices by percentage and respects department filter', () => {
  const increasedAll = applyBulkPriceChange(SAMPLE_PRODUCTS, 10, 'all');
  assert.equal(increasedAll[0].priceDram, 1100);
  assert.equal(increasedAll[1].priceDram, 3300);

  const discountedGroceries = applyBulkPriceChange(SAMPLE_PRODUCTS, -20, 'groceries');
  assert.equal(discountedGroceries[0].priceDram, 800);
  assert.equal(discountedGroceries[1].priceDram, 3000);
});

test('applyBulkStockRefill increments stock and marks items available', () => {
  const refilled = applyBulkStockRefill(SAMPLE_PRODUCTS, 25, 'construction');
  assert.equal(refilled[0].stockCount, 10);
  assert.equal(refilled[1].stockCount, 28);
  assert.equal(refilled[1].isAvailable, true);
});

test('flattenAndFilterOrders aggregates and filters customer orders', () => {
  const all = flattenAndFilterOrders(SAMPLE_CUSTOMERS);
  assert.equal(all.length, 1);
  assert.equal(all[0].orderNumber, 'ORD-101');
  assert.equal(all[0].customerName, 'Արայիկ Պետրոսյան');

  const byStatus = flattenAndFilterOrders(SAMPLE_CUSTOMERS, '', 'delivered');
  assert.equal(byStatus.length, 0);

  const bySearch = flattenAndFilterOrders(SAMPLE_CUSTOMERS, 'Хлеб');
  assert.equal(bySearch.length, 1);
});
