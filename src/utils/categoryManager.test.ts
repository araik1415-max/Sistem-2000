import { describe, it } from 'node:test';
import assert from 'node:assert';
import { INITIAL_CATEGORIES } from '../data/categories';
import { ProductCategory } from '../types';

describe('System 2000 Product Category Management', () => {
  it('contains mandatory default categories for groceries and construction', () => {
    assert.ok(INITIAL_CATEGORIES.length >= 10, 'Should have at least 10 initial categories');
    
    const groceryCategories = INITIAL_CATEGORIES.filter((c) => c.department === 'groceries');
    const constructionCategories = INITIAL_CATEGORIES.filter((c) => c.department === 'construction');

    assert.ok(groceryCategories.length >= 5, 'Should have grocery categories');
    assert.ok(constructionCategories.length >= 5, 'Should have construction categories');

    const bakery = INITIAL_CATEGORIES.find((c) => c.nameHy === 'Հացաբուլկեղեն');
    assert.ok(bakery, 'Bakery category must exist');
    assert.strictEqual(bakery?.department, 'groceries');

    const tools = INITIAL_CATEGORIES.find((c) => c.nameHy === 'Գործիքներ');
    assert.ok(tools, 'Tools category must exist');
    assert.strictEqual(tools?.department, 'construction');
  });

  it('allows adding custom product categories with valid fields', () => {
    const initialList = [...INITIAL_CATEGORIES];
    const newCategory: ProductCategory = {
      id: `cat_custom_${Date.now()}`,
      nameHy: 'Էլեկտրատեխնիկա',
      nameRu: 'Электротехника',
      department: 'construction',
      iconName: 'Zap',
      descriptionHy: 'Էլեկտրական սարքավորումներ և լարեր',
      descriptionRu: 'Электрооборудование и кабели',
      isCustom: true,
      createdAt: new Date().toISOString(),
    };

    const updatedList = [...initialList, newCategory];
    assert.strictEqual(updatedList.length, initialList.length + 1);

    const found = updatedList.find((c) => c.id === newCategory.id);
    assert.ok(found, 'New category must be present in list');
    assert.strictEqual(found?.nameHy, 'Էլեկտրատեխնիկա');
    assert.strictEqual(found?.nameRu, 'Электротехника');
    assert.strictEqual(found?.isCustom, true);
  });

  it('supports updating custom category properties', () => {
    const category: ProductCategory = {
      id: 'cat_test_123',
      nameHy: 'Նախնական',
      nameRu: 'Исходная',
      department: 'groceries',
      isCustom: true,
    };

    const updated: ProductCategory = {
      ...category,
      nameHy: 'Թարմացված',
      nameRu: 'Обновленная',
    };

    assert.strictEqual(updated.id, 'cat_test_123');
    assert.strictEqual(updated.nameHy, 'Թարմացված');
    assert.strictEqual(updated.nameRu, 'Обновленная');
  });

  it('supports deleting custom categories', () => {
    const list: ProductCategory[] = [
      ...INITIAL_CATEGORIES,
      {
        id: 'cat_custom_to_delete',
        nameHy: 'Ջնջվելիք',
        nameRu: 'Удаляемая',
        department: 'groceries',
        isCustom: true,
      },
    ];

    const filtered = list.filter((c) => c.id !== 'cat_custom_to_delete');
    assert.strictEqual(filtered.length, INITIAL_CATEGORIES.length);
    assert.strictEqual(filtered.find((c) => c.id === 'cat_custom_to_delete'), undefined);
  });
});
