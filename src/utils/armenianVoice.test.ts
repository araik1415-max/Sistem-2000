import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildCalmArmenianPresentationText,
  buildCalmArmenianInspectionText,
} from './armenianVoice';
import { ProductItem } from '../types';

const sampleProduct: ProductItem = {
  id: 1,
  nameHy: 'Ապարանի Թարմ Կաթ 1Լ',
  nameRu: 'Свежее молоко Апаран 1Л',
  categoryHy: 'Կաթնամթերք',
  categoryRu: 'Молочные продукты',
  department: 'groceries',
  priceDram: 550,
  pointsCost: 550,
  unitHy: 'շիշ',
  unitRu: 'бут.',
  imageUrl: 'https://example.com/milk.jpg',
  iconName: 'Milk',
  descriptionHy: 'Բնական լեռնային կաթ 100% մաքրությամբ',
  descriptionRu: 'Натуральное горное молоко 100% чистоты',
  isAvailable: true,
};

test('buildCalmArmenianPresentationText generates calm Armenian presentation without ֏ symbol', () => {
  const script = buildCalmArmenianPresentationText(sampleProduct);

  assert.equal(script.includes('Բարև Ձեզ...'), true);
  assert.equal(script.includes('Ապարանի Թարմ Կաթ 1Լ'), true);
  assert.equal(script.includes('550 դրամ'), true);
  assert.equal(script.includes('շիշ'), true);
  assert.equal(script.includes('֏'), false);
  assert.equal(script.includes('տասը տոկոս ցմահ ավանդ'), true);
});

test('buildCalmArmenianInspectionText generates calm Armenian inspection text without ֏ symbol', () => {
  const script = buildCalmArmenianInspectionText(sampleProduct);

  assert.equal(script.includes('Եռաչափ մանրամասն զննում...'), true);
  assert.equal(script.includes('Ապարանի Թարմ Կաթ 1Լ'), true);
  assert.equal(script.includes('550 դրամ'), true);
  assert.equal(script.includes('Բնական լեռնային կաթ 100% մաքրությամբ'), true);
  assert.equal(script.includes('֏'), false);
});
