import { ProductItem } from '../types';

export interface RecipeItemMatch {
  product: ProductItem;
  quantity: number;
  portionNoteRu: string;
  portionNoteHy: string;
}

export interface RecipeRecommendation {
  recipeNameRu: string;
  recipeNameHy: string;
  targetWeightGrams?: number;
  items: RecipeItemMatch[];
  totalPriceDram: number;
  estimatedCashbackPoints: number;
  explanationRu: string;
  explanationHy: string;
  usageInstructionsRu?: string;
  usageInstructionsHy?: string;
}

/**
 * Universal dynamic recipe & product catalog matcher.
 * Parses ANY user query in natural language (salads, breakfasts, dinners, specific dishes,
 * portion counts, weights, or direct hardware/construction queries) and returns matching catalog items
 * with calculated portion quantities and interactive cart action data.
 */
export function detectRecipeOrSearch(
  query: string,
  products: ProductItem[]
): RecipeRecommendation | null {
  if (!query || !products || products.length === 0) return null;
  const lower = query.toLowerCase().trim();

  // 0.0 BARCODE / SKU / DIRECT CODE MATCHING
  const digits = lower.replace(/\D/g, '');
  if (digits.length >= 4 || lower.includes('arm-') || lower.includes('ger-') || lower.includes('jpn-') || lower.includes('штрихкод') || lower.includes('barcode') || lower.includes('կոդ')) {
    const directProd = products.find(
      (p) =>
        (p.barcode && digits.length >= 4 && p.barcode.includes(digits)) ||
        (p.sku && p.sku.toLowerCase().includes(lower)) ||
        (p.barcode && lower.includes(p.barcode))
    );

    if (directProd) {
      const bCode = directProd.barcode || `48500012300${directProd.id}`;
      return {
        recipeNameRu: `Товар по коду ${bCode}`,
        recipeNameHy: `Ապրանք ըստ կոդի ${bCode}`,
        items: [
          {
            product: directProd,
            quantity: 1,
            portionNoteRu: `Найдено на складе 1С по коду ${bCode} (SKU: ${directProd.sku})`,
            portionNoteHy: `Գտնվել է պահեստում ըստ Շտրիխ կոդի ${bCode} (SKU: ${directProd.sku})`,
          },
        ],
        totalPriceDram: directProd.priceDram,
        estimatedCashbackPoints: Math.round(directProd.priceDram * 0.05),
        explanationRu: `🔍 AI Нашел товар на складе 1С по коду/маркировке: «${directProd.nameRu}» (${directProd.unitRu}). Цена: ${directProd.priceDram} ֏. Штрихкод: ${bCode}.`,
        explanationHy: `🔍 AI-ն գտավ ապրանքը 1C պահեստում՝ «${directProd.nameHy}» (${directProd.unitHy}): Գինը՝ ${directProd.priceDram} ֏: Շտրիխ կոդ՝ ${bCode}:`,
        usageInstructionsRu: directProd.usageInstructionsRu,
        usageInstructionsHy: directProd.usageInstructionsHy,
      };
    }
  }

  // Extract scale from weight (grams/kg) or portion/people count
  let scale = 1;
  let targetWeightGrams: number | undefined = undefined;


  const matchWeightKg = lower.match(/(\d+(?:[.,]\d+)?)\s*(кг|kg|կգ)/);
  const matchWeightGrams = lower.match(/(\d+)\s*(г|грамм|g|գ)/);
  const matchPeople = lower.match(/(\d+)\s*(человек|человека|персон|персоны|անձ|նորդ)/);

  if (matchWeightKg) {
    const kg = parseFloat(matchWeightKg[1].replace(',', '.'));
    if (kg > 0) {
      targetWeightGrams = Math.round(kg * 1000);
      scale = Math.max(0.5, targetWeightGrams / 500);
    }
  } else if (matchWeightGrams) {
    const g = parseInt(matchWeightGrams[1], 10);
    if (g > 0) {
      targetWeightGrams = g;
      scale = Math.max(0.5, g / 500);
    }
  } else if (matchPeople) {
    const count = parseInt(matchPeople[1], 10);
    if (count > 0) {
      scale = Math.max(1, count / 2);
    }
  }

  // Helper product locators
  const findByKeyword = (...keywords: string[]): ProductItem | undefined => {
    return products.find((p) =>
      keywords.some(
        (kw) =>
          p.nameRu.toLowerCase().includes(kw) ||
          p.nameHy.toLowerCase().includes(kw) ||
          p.categoryRu.toLowerCase().includes(kw) ||
          p.categoryHy.toLowerCase().includes(kw) ||
          p.descriptionRu.toLowerCase().includes(kw) ||
          p.descriptionHy.toLowerCase().includes(kw) ||
          (p.loadCapacityRu && p.loadCapacityRu.toLowerCase().includes(kw))
      )
    );
  };

  const matchedItems: RecipeItemMatch[] = [];
  let recipeNameRu = '';
  let recipeNameHy = '';
  let explanationRu = '';
  let explanationHy = '';
  let usageInstructionsRu: string | undefined = undefined;
  let usageInstructionsHy: string | undefined = undefined;

  // 0. CONSTRUCTION / WOOD GLUE / СТРОИТЕЛЬСТВО И КЛЕЙ ДЛЯ ДЕРЕВА
  const isWoodGlueQuery =
    lower.includes('склеи') ||
    lower.includes('клей') ||
    lower.includes('дерево') ||
    lower.includes('древесин') ||
    lower.includes('փայտ') ||
    lower.includes('սոսինձ') ||
    lower.includes('стройматериал') ||
    lower.includes('строительств') ||
    lower.includes('нагрузк') ||
    lower.includes('d3');

  if (isWoodGlueQuery) {
    const isHeavyLoad =
      lower.includes('высока') ||
      lower.includes('высокие') ||
      lower.includes('больш') ||
      lower.includes('тяжел') ||
      lower.includes('d3') ||
      lower.includes('влаг') ||
      lower.includes('водо') ||
      lower.includes('ծանր') ||
      lower.includes('ջրակայուն');

    const pvaExpress = findByKeyword('экспресс', 'express', '500г', '80 кг') || findByKeyword('клей');
    const pvaD3 = findByKeyword('d3', 'extra-heavy', 'влагостойкий', '150 кг');
    const liquidNails = findByKeyword('жидкие гвозди', 'superfix', '310мл');

    if (isHeavyLoad && pvaD3) {
      recipeNameRu = 'Рекомендация: Клей ПВА Extra-Heavy D3 (высокая нагрузка)';
      recipeNameHy = 'Խորհուրդ. Էմուլսիոն սոսինձ ՊՎԱ Extra-Heavy D3 (բարձր ծանրաբեռնվածություն)';
      
      matchedItems.push({
        product: pvaD3,
        quantity: 1,
        portionNoteRu: 'Водостойкий клей D3 (до 150 кг/см²)',
        portionNoteHy: 'Ջրակայուն սոսինձ D3 (մինչև 150 կգ/սմ²)',
      });

      if (liquidNails) {
        matchedItems.push({
          product: liquidNails,
          quantity: 1,
          portionNoteRu: 'Монтажный клей Жидкие гвозди (до 180 кг/см²)',
          portionNoteHy: 'Մոնտաժային սոսինձ Հեղուկ եղունգներ (մինչև 180 կգ/սմ²)',
        });
      }

      explanationRu = 'Для высоких нагрузок и влажных условий лучше всего подходит эмульсионный клей ПВА Extra-Heavy D3 (выдерживает до 150 кг/см²). Для экспресс-фиксации без зажимов рекомендуем Жидкие гвозди SuperFix (до 180 кг/см²).';
      explanationHy = 'Բարձր ծանրաբեռնվածության և խոնավ պայմանների համար լավագույնս համապատասխանում է ՊՎԱ Extra-Heavy D3-ը (մինչև 150 կգ/սմ²):';
      usageInstructionsRu = pvaD3.usageInstructionsRu;
      usageInstructionsHy = pvaD3.usageInstructionsHy;
    } else {
      recipeNameRu = 'Подбор клея для склеивания дерева';
      recipeNameHy = 'Սոսնձի ընտրություն փայտ սոսնձելու համար';

      if (pvaExpress) {
        matchedItems.push({
          product: pvaExpress,
          quantity: 1,
          portionNoteRu: 'Клей ПВА Экспресс 500г (средняя нагрузка до 80 кг/см²)',
          portionNoteHy: 'ՊՎԱ Express 500գ (միջին ծանրաբեռնվածություն մինչև 80 կգ/սմ²)',
        });
      }

      if (pvaD3) {
        matchedItems.push({
          product: pvaD3,
          quantity: 1,
          portionNoteRu: 'Клей ПВА Extra-Heavy D3 (высокая нагрузка и влагостойкость)',
          portionNoteHy: 'ՊՎԱ Extra-Heavy D3 (բարձր ծանրաբեռնվածություն)',
        });
      }

      explanationRu = 'Для склеивания дерева подойдет эмульсионный клей ПВА Express (для средних нагрузок до 80 кг/см², фиксация 20-30 мин). Если конструкция подвергается высоким нагрузкам или влаге, используйте клей ПВА Extra-Heavy D3 (до 150 кг/см²).';
      explanationHy = 'Փայտ սոսնձելու համար խորհուրդ է տրվում ՊՎԱ Express (մինչև 80 կգ/սմ²): Բարձր ծանրաբեռնվածության դեպքում ընտրեք ՊՎԱ Extra-Heavy D3 (մինչև 150 կգ/սմ²):';
      usageInstructionsRu = pvaExpress?.usageInstructionsRu || pvaD3?.usageInstructionsRu;
      usageInstructionsHy = pvaExpress?.usageInstructionsHy || pvaD3?.usageInstructionsHy;
    }

  // 1. SALAD / САЛАТ / ԱՂՑԱՆ
  } else if (lower.includes('салат') || lower.includes('աղցան')) {
    const tomato = findByKeyword('помидор', 'լոլիկ') || products[0];
    const cucumber = findByKeyword('огур', 'վարունգ') || products[0];
    const cheese = findByKeyword('лори', 'լոռի', 'сыр', 'պանիր') || products[0];
    const greens = findByKeyword('зелень', 'կանաչի') || products[0];
    const oil = findByKeyword('оливков', 'ձիթապտուղ', 'ձեթ', 'масло') || products[0];

    const weightText = targetWeightGrams ? `${targetWeightGrams}г` : `${Math.round(500 * scale)}г`;
    recipeNameRu = `Ингредиенты для свежего салата (${weightText})`;
    recipeNameHy = `Բաղադրիչներ թարմ աղցանի համար (${weightText})`;

    const itemsList = [
      { product: tomato, portionGrams: Math.round(200 * scale), noteRu: 'свежих сочных помидоров', noteHy: 'թարմ հյութալի լոլիկ' },
      { product: cucumber, portionGrams: Math.round(200 * scale), noteRu: 'хрустящих огурцов', noteHy: 'խրթխրթան վարունգ' },
      { product: cheese, portionGrams: Math.round(100 * scale), noteRu: 'сыра Лори', noteHy: 'Լոռի պանիր' },
      { product: greens, portionGrams: Math.round(50 * scale), noteRu: 'свежей зелени', noteHy: 'թարմ կանաչի' },
      { product: oil, portionGrams: Math.round(30 * scale), noteRu: 'оливкового масла для заправки', noteHy: 'ձիթայուղ համեմելու համար' },
    ];

    itemsList.forEach((i) => {
      if (i.product) {
        const qty = Math.max(1, Math.round(scale));
        matchedItems.push({
          product: i.product,
          quantity: qty,
          portionNoteRu: `${i.portionGrams}г ${i.noteRu}`,
          portionNoteHy: `${i.portionGrams}գ ${i.noteHy}`,
        });
      }
    });

    explanationRu = `Подборка ингредиентов для приготовления салата (${weightText}): помидоры, огурцы, сыр Лори, зелень и оливковое масло. Полноценная закупка с кешбэком 5%!`;
    explanationHy = `Բաղադրիչների ընտրություն աղցան պատրաստելու համար (${weightText})՝ լոլիկ, վարունգ, Լոռի պանիր, կանաչի և ձիթայուղ: Լիարժեք գնում 5% քեշբեքով:`;

  // 2. BREAKFAST / ЗАВТРАК / ՆԱԽԱՃԱՇ
  } else if (lower.includes('завтрак') || lower.includes('նախաճաշ') || lower.includes('яичниц') || lower.includes('омлет')) {
    recipeNameRu = 'Набор для полноценного завтрака';
    recipeNameHy = 'Հավաքածու լիարժեք նախաճաշի համար';

    const egg = findByKeyword('яйц', 'հավկիթ', 'ձու');
    const bread = findByKeyword('хлеб', 'հաց');
    const butter = findByKeyword('сливочн', 'կարագ', 'масло');
    const milk = findByKeyword('молок', 'կաթ');

    [
      { prod: egg, noteRu: 'свежих яиц C0', noteHy: 'թարմ հավկիթ' },
      { prod: bread, noteRu: 'свежего хлеба', noteHy: 'թարմ հաց' },
      { prod: butter, noteRu: 'сливочного масла 82.5%', noteHy: 'սերուցքային կարագ' },
      { prod: milk, noteRu: 'натурального молока', noteHy: 'բնական կաթ' },
    ].forEach((i) => {
      if (i.prod) {
        matchedItems.push({
          product: i.prod,
          quantity: Math.max(1, Math.round(scale)),
          portionNoteRu: `1 уп. ${i.noteRu}`,
          portionNoteHy: `1 փաթեթ ${i.noteHy}`,
        });
      }
    });

    explanationRu = 'Сбалансированный набор свежих фермерских продуктов для сытного и полезного завтрака.';
    explanationHy = 'Թարմ ֆերմերային մթերքների հավաքածու լիարժեք նախաճաշի համար:';

  // 3. BUCKWHEAT / ГРЕЧКА / ՀՆԴԿԱՁԱՎԱՐ
  } else if (lower.includes('гречк') || lower.includes('հնդկաձավար')) {
    recipeNameRu = 'Ингредиенты для блюда из гречки';
    recipeNameHy = 'Բաղադրիչներ հնդկաձավարով ճաշատեսակի համար';

    const buckwheat = findByKeyword('гречк', 'հնդկաձավար');
    const butter = findByKeyword('масло', 'կարագ');
    const milk = findByKeyword('молок', 'կաթ');

    if (buckwheat) matchedItems.push({ product: buckwheat, quantity: Math.max(1, Math.round(scale)), portionNoteRu: 'Отборная гречневая крупа (900г)', portionNoteHy: 'Հնդկաձավար (900գ)' });
    if (butter) matchedItems.push({ product: butter, quantity: 1, portionNoteRu: 'Сливочное масло для заправки', portionNoteHy: 'Սերուցքային կարագ' });
    if (milk) matchedItems.push({ product: milk, quantity: 1, portionNoteRu: 'Молоко 3.2% для молочной каши', portionNoteHy: 'Կովի կաթ 3.2%' });

    explanationRu = 'Отборная гречневая крупа с натуральным сливочным маслом и молоком.';
    explanationHy = 'Ընտիր հնդկաձավար բնական կարագով և կաթով:';

  // 4. POTATO / КАРТОФЕЛЬ / КАРТОШКА / ԿԱՐՏՈՖԻԼ
  } else if (lower.includes('картоф') || lower.includes('картош') || lower.includes('կարտոֆիլ')) {
    const kgText = targetWeightGrams ? `${targetWeightGrams}г` : `${Math.round(1000 * scale)}г`;
    recipeNameRu = `Ингредиенты для блюда из картофеля (${kgText})`;
    recipeNameHy = `Բաղադրիչներ կարտոֆիլով ճաշատեսակի համար (${kgText})`;

    const potato = findByKeyword('картоф', 'կարտոֆիլ');
    const butter = findByKeyword('масло', 'կարագ');
    const greens = findByKeyword('зелень', 'կանաչի');

    if (potato) matchedItems.push({ product: potato, quantity: Math.max(1, Math.round(scale)), portionNoteRu: `Картофель мытый (${kgText})`, portionNoteHy: `Կարտոֆիլ (${kgText})` });
    if (butter) matchedItems.push({ product: butter, quantity: 1, portionNoteRu: 'Сливочное/оливковое масло для обжарки', portionNoteHy: 'Կարագ/ձիթայուղ տապակելու համար' });
    if (greens) matchedItems.push({ product: greens, quantity: 1, portionNoteRu: 'Свежая зелень для подачи', portionNoteHy: 'Թարմ կանաչի' });

    explanationRu = `Отборный картофель со сливочным маслом и свежей зеленью.`;
    explanationHy = `Ընտիր կարտոֆիլ կարագով և թարմ կանաչիով:`;

  // 5. TEA / COFFEE / SWEETS / ЧАЙ / СЛАДОСТИ / ԹԵՅ
  } else if (lower.includes('чай') || lower.includes('чаю') || lower.includes('чаем') || lower.includes('թեյ') || lower.includes('сладост') || lower.includes('шоколад') || lower.includes('քաղցր')) {
    recipeNameRu = 'Набор к чаю и сладостям';
    recipeNameHy = 'Հավաքածու թեյի և քաղցրավենիքի համար';

    const tea = findByKeyword('чай', 'թեյ');
    const chocolate = findByKeyword('шоколад', 'շոկոլադ');
    const apples = findByKeyword('яблок', 'խնձոր');

    if (tea) matchedItems.push({ product: tea, quantity: 1, portionNoteRu: 'Черный листовой чай (100г)', portionNoteHy: 'Սև թեյ (100գ)' });
    if (chocolate) matchedItems.push({ product: chocolate, quantity: Math.max(1, Math.round(scale)), portionNoteRu: 'Темный шоколад 75%', portionNoteHy: 'Դառը շոկոլադ 75%' });
    if (apples) matchedItems.push({ product: apples, quantity: 1, portionNoteRu: 'Сочные сезонные яблоки (1кг)', portionNoteHy: 'Սեզոնային խնձոր (1կգ)' });

    explanationRu = 'Ароматный высокогорный чай с премиальным темным шоколадом и сочными яблоками.';
    explanationHy = 'Բուրավետ թեյ պրեմիում շոկոլադով և հյութալի խնձորներով:';

  // 6. SANDWICHES / БУТЕРБРОДЫ / ԲՈՒՏԵՐԲՐՈԴ
  } else if (lower.includes('бутерброд') || lower.includes('сэндвич') || lower.includes('перекус') || lower.includes('բուտերբրոդ')) {
    recipeNameRu = 'Ингредиенты для сытных бутербродов';
    recipeNameHy = 'Բաղադրիչներ հագեցնող բուտերբրոդների համար';

    const bread = findByKeyword('хлеб', 'հաց');
    const butter = findByKeyword('масло', 'կարագ');
    const cheese = findByKeyword('лори', 'պանիր');

    if (bread) matchedItems.push({ product: bread, quantity: 1, portionNoteRu: 'Свежий пшеничный хлеб', portionNoteHy: 'Թարմ ցորենի հաց' });
    if (butter) matchedItems.push({ product: butter, quantity: 1, portionNoteRu: 'Натуральное сливочное масло 82.5%', portionNoteHy: 'Սերուցքային կարագ' });
    if (cheese) matchedItems.push({ product: cheese, quantity: Math.max(1, Math.round(scale)), portionNoteRu: 'Традиционный сыр Лори', portionNoteHy: 'Լոռի պանիր' });

    explanationRu = 'Набор для приготовления вкусных классических бутербродов с сыром и маслом.';
    explanationHy = 'Հավաքածու պանրով և կարագով դասական բուտերբրոդներ պատրաստելու համար:';

  // 7. DYNAMIC NATURAL LANGUAGE MULTI-PRODUCT SEARCH
  } else {
    // Check if query contains any specific product keywords from catalog
    const matchingProds = products.filter((p) => {
      const pRu = p.nameRu.toLowerCase();
      const pHy = p.nameHy.toLowerCase();
      const pCatRu = p.categoryRu.toLowerCase();
      const pCatHy = p.categoryHy.toLowerCase();

      return (
        lower.includes(pRu) ||
        lower.includes(pHy) ||
        pRu.split(' ').some((word) => word.length > 3 && lower.includes(word.slice(0, -1))) ||
        pHy.split(' ').some((word) => word.length > 3 && lower.includes(word.slice(0, -1))) ||
        lower.includes(pCatRu) ||
        lower.includes(pCatHy)
      );
    });

    if (matchingProds.length > 0) {
      recipeNameRu = `Подборка товаров из каталога (${matchingProds.length} поз.)`;
      recipeNameHy = `Ապրանքների ընտրություն կատալոգից (${matchingProds.length} դիրք)`;

      matchingProds.slice(0, 5).forEach((prod) => {
        matchedItems.push({
          product: prod,
          quantity: Math.max(1, Math.round(scale)),
          portionNoteRu: `${prod.nameRu} (${prod.unitRu})`,
          portionNoteHy: `${prod.nameHy} (${prod.unitHy})`,
        });
      });

      explanationRu = `Автоматически найдены соответствующие товары из нашего каталога по вашему запросу.`;
      explanationHy = `Ձեր հարցմանը համապատասխանող ապրանքները ավտոմատ գտնվել են կատալոգում:`;
    }
  }

  if (matchedItems.length === 0) {
    return null;
  }

  const totalPriceDram = matchedItems.reduce((sum, i) => sum + i.product.priceDram * i.quantity, 0);
  const estimatedCashbackPoints = Math.round(totalPriceDram * 0.05);

  return {
    recipeNameRu,
    recipeNameHy,
    targetWeightGrams,
    items: matchedItems,
    totalPriceDram,
    estimatedCashbackPoints,
    explanationRu,
    explanationHy,
    usageInstructionsRu,
    usageInstructionsHy,
  };
}

