import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { detectRecipeOrSearch } from './recipeEngine.js';
import { INITIAL_PRODUCTS } from '../data/products.js';

describe('Universal Dynamic Recipe & AI Product Matcher Engine', () => {
  it('handles 500g salad request', () => {
    const res = detectRecipeOrSearch('я хочу приготовить салат 500 грамм что купить', INITIAL_PRODUCTS);
    assert.ok(res !== null);
    assert.equal(res.targetWeightGrams, 500);
    assert.ok(res.items.length >= 3);
    assert.ok(res.totalPriceDram > 0);
  });

  it('handles 1.5kg salad request', () => {
    const res = detectRecipeOrSearch('приготовить салат 1.5кг', INITIAL_PRODUCTS);
    assert.ok(res !== null);
    assert.equal(res.targetWeightGrams, 1500);
    assert.ok(res.items.some((i) => i.quantity >= 3));
  });

  it('handles breakfast request for 4 people', () => {
    const res = detectRecipeOrSearch('собери завтрак на 4 человека', INITIAL_PRODUCTS);
    assert.ok(res !== null);
    assert.ok(res.recipeNameRu.includes('завтрак'));
    assert.ok(res.items.some((i) => i.quantity >= 2));
  });

  it('handles buckwheat dish request ("гречка с маслом и молоком")', () => {
    const res = detectRecipeOrSearch('хочу сварите гречку с маслом и молоком', INITIAL_PRODUCTS);
    assert.ok(res !== null);
    const names = res.items.map((i) => i.product.nameRu);
    assert.ok(names.some((n) => n.includes('Гречка')));
    assert.ok(names.some((n) => n.includes('Масло') || n.includes('Молоко')));
  });

  it('handles potato dish request ("пожарить картошку на 3 человека")', () => {
    const res = detectRecipeOrSearch('пожарить картошку на 3 человека', INITIAL_PRODUCTS);
    assert.ok(res !== null);
    const names = res.items.map((i) => i.product.nameRu);
    assert.ok(names.some((n) => n.includes('Картофель')));
  });

  it('handles tea & sweets request ("что купить к чаю")', () => {
    const res = detectRecipeOrSearch('что купить к чаю', INITIAL_PRODUCTS);
    assert.ok(res !== null);
    const names = res.items.map((i) => i.product.nameRu);
    assert.ok(names.some((n) => n.includes('чай') || n.includes('шоколад')));
  });

  it('handles sandwich request ("бутерброды с сыром и маслом")', () => {
    const res = detectRecipeOrSearch('хочу сделать бутерброды с сыром и маслом', INITIAL_PRODUCTS);
    assert.ok(res !== null);
    const names = res.items.map((i) => i.product.nameRu);
    assert.ok(names.some((n) => n.includes('Хлеб')));
    assert.ok(names.some((n) => n.includes('Сыр')));
  });

  it('handles natural language multi-product search ("хочу купить молоко и сыр Лори")', () => {
    const res = detectRecipeOrSearch('хочу купить молоко и сыр Лори', INITIAL_PRODUCTS);
    assert.ok(res !== null);
    const names = res.items.map((i) => i.product.nameRu);
    assert.ok(names.some((n) => n.includes('Молоко')));
    assert.ok(names.some((n) => n.includes('Лори')));
  });

  it('handles Armenian language dynamic dish request ("պատրաստել աղցան 1կգ")', () => {
    const res = detectRecipeOrSearch('պատրաստել աղցան 1կգ', INITIAL_PRODUCTS);
    assert.ok(res !== null);
    assert.ok(res.recipeNameHy.includes('աղցան'));
  });

  it('handles wood gluing query ("Я хочу склеить дерево")', () => {
    const res = detectRecipeOrSearch('Я хочу склеить дерево', INITIAL_PRODUCTS);
    assert.ok(res !== null);
    assert.ok(res.recipeNameRu.includes('склеивания дерева') || res.recipeNameRu.includes('Клей'));
    assert.ok(res.items.some((i) => i.product.nameRu.includes('ПВА')));
    assert.ok(res.usageInstructionsRu !== undefined && res.usageInstructionsRu.length > 0);
  });

  it('handles high load wood gluing query ("Какое средство использовать для высоких нагрузок D3?")', () => {
    const res = detectRecipeOrSearch('Какое средство использовать для высоких нагрузок D3?', INITIAL_PRODUCTS);
    assert.ok(res !== null);
    assert.ok(res.recipeNameRu.includes('высокая нагрузка') || res.recipeNameRu.includes('D3'));
    assert.ok(res.items.some((i) => i.product.nameRu.includes('D3')));
    assert.ok(res.explanationRu.includes('150 кг/см²') || res.explanationRu.includes('высоких нагрузок'));
    assert.ok(res.usageInstructionsRu !== undefined);
  });

  it('handles Armenian wood gluing query ("Փայտ սոսնձելու համար ի՞նչ սոսինձ ընտրել")', () => {
    const res = detectRecipeOrSearch('Փայտ սոսնձելու համար ի՞նչ սոսինձ ընտրել', INITIAL_PRODUCTS);
    assert.ok(res !== null);
    assert.ok(res.recipeNameHy.includes('սոսնձի') || res.recipeNameHy.includes('փայտ'));
    assert.ok(res.items.length >= 1);
  });

  it('returns null for purely non-food/non-store queries like deposit yield calculation', () => {
    const res = detectRecipeOrSearch('как рассчитать проценты по депозиту 10%', INITIAL_PRODUCTS);
    assert.equal(res, null);
  });
});
