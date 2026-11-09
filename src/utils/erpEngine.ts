import { ProductItem } from '../types';
import {
  ErpState,
  ErpDocument,
  StockItem,
  Warehouse,
  Counterparty,
  CashAccount,
  ProfitAndLossReport,
  MaterialReportItem,
  CashierShift,
  ErpDocumentType,
} from '../types/erp';

export const INITIAL_WAREHOUSES: Warehouse[] = [
  {
    id: 'wh_store',
    nameHy: 'Խանութի առևտրային սրահ (Երևան, Աբովյան 12)',
    nameRu: 'Торговый зал магазина (Ереван, Абовяна 12)',
    code: 'СКЛ-001',
    type: 'retail',
    address: 'ք. Երևան, Աբովյան փող. 12',
    responsiblePerson: 'Արայիկ Պետրոսյան',
  },
  {
    id: 'wh_main',
    nameHy: 'Կենտրոնական պահեստ (Երևան, Արշակունյաց 44)',
    nameRu: 'Центральный оптовый склад (Ереван, Аршакунянц 44)',
    code: 'СКЛ-002',
    type: 'warehouse',
    address: 'ք. Երևան, Արշակունյաց պող. 44',
    responsiblePerson: 'Գևորգ Գրիգորյան',
  },
  {
    id: 'wh_spoilage',
    nameHy: 'Խոտանման և դուրսգրման պահեստ',
    nameRu: 'Склад списания и брака',
    code: 'СКЛ-003',
    type: 'spoilage',
    address: 'ք. Երևան, Պահեստային բաժին',
    responsiblePerson: 'Արայիկ Պետրոսյան',
  },
];

export const INITIAL_COUNTERPARTIES: Counterparty[] = [
  {
    id: 'cnt_ararat',
    name: '«Արարատ Դիստրիբյուշն» ՍՊԸ / ООО "Арарат Дистрибьюшн"',
    type: 'supplier',
    taxId: '02568912',
    phone: '+374 10 442211',
    email: 'order@ararat-dist.am',
    balanceDram: 145000, // Мы должны 145,000 ֏
  },
  {
    id: 'cnt_yerevan_food',
    name: '«Երևան Ֆուդս Թրեյդ» ՓԲԸ / ЗАО "Ереван Фудс Трейд"',
    type: 'supplier',
    taxId: '01894451',
    phone: '+374 10 551188',
    email: 'supply@yerevanfoods.am',
    balanceDram: 82000, // Мы должны 82,000 ֏
  },
  {
    id: 'cnt_retail_customer',
    name: 'Մանրածախ գնորդ / Розничный покупатель (Физическое лицо)',
    type: 'customer',
    taxId: '00000000',
    phone: '+374 00 000000',
    email: 'client@shop.am',
    balanceDram: 0,
  },
];

export const INITIAL_CASH_ACCOUNTS: CashAccount[] = [
  {
    id: 'acc_cash_desk',
    nameHy: 'Խանութի գլխավոր դրամարկղ (ՀԴՄ Կասսա ֏)',
    nameRu: 'Главная касса магазина (ККМ РМК ֏)',
    type: 'cash_register',
    accountNumber: 'ՀԴՄ-8840192',
    balanceDram: 85000,
  },
  {
    id: 'acc_bank_ameria',
    nameHy: 'Ամերիաբանկ Հաշվարկային հաշիվ (AMD)',
    nameRu: 'Расчетный счет Ameriabank CJSC (AMD)',
    type: 'bank_account',
    accountNumber: '1570089421500100',
    balanceDram: 640000,
  },
];

export function createInitialErpState(products: ProductItem[]): ErpState {
  const stockRegister: StockItem[] = [];

  // Инициализируем остатки для всех товаров на складах
  products.forEach((prod) => {
    // В торговом зале магазина
    const storeQty = Math.max(12, Math.floor(prod.priceDram > 1000 ? 15 : 45));
    // На центральном складе
    const mainQty = Math.max(30, Math.floor(prod.priceDram > 1000 ? 50 : 180));
    // Примерная себестоимость (65-75% от розничной цены)
    const costPrice = Math.round(prod.priceDram * 0.70);

    stockRegister.push({
      productId: prod.id,
      warehouseId: 'wh_store',
      quantity: storeQty,
      reserved: 0,
      costPriceDram: costPrice,
      retailPriceDram: prod.priceDram,
      minStockThreshold: 10,
    });

    stockRegister.push({
      productId: prod.id,
      warehouseId: 'wh_main',
      quantity: mainQty,
      reserved: 0,
      costPriceDram: costPrice,
      retailPriceDram: prod.priceDram,
      minStockThreshold: 25,
    });
  });

  const now = new Date();
  const dateStr = now.toLocaleDateString('hy-AM');

  // Демонстрационные первичные документы 1С
  const sampleDocs: ErpDocument[] = [
    {
      id: 'doc_receipt_001',
      docNumber: 'ՄՈՒՏ-000042',
      type: 'receipt',
      status: 'posted',
      date: dateStr,
      timestamp: Date.now() - 86400000,
      warehouseId: 'wh_main',
      counterpartyId: 'cnt_ararat',
      amountDram: 145000,
      comment: 'Ապրանքների մուտքագրում ըստ ТОРГ-12 հաշիվ-ապրանքագրի',
      author: 'Արայիկ Պետրոսյան',
      items: [
        {
          productId: 1,
          productName: 'Ցորենի հաց (թարմ)',
          unit: '1 հատ',
          quantity: 100,
          priceDram: 175,
          totalDram: 17500,
        },
        {
          productId: 2,
          productName: 'Կովի կաթ 1լ (3.2%)',
          unit: '1 լիտր',
          quantity: 80,
          priceDram: 385,
          totalDram: 30800,
        },
        {
          productId: 3,
          productName: 'Հնդկաձավար 900գ',
          unit: '900 գ',
          quantity: 60,
          priceDram: 504,
          totalDram: 30240,
        },
      ],
    },
    {
      id: 'doc_transfer_001',
      docNumber: 'ՏԵՂ-000015',
      type: 'transfer',
      status: 'posted',
      date: dateStr,
      timestamp: Date.now() - 43200000,
      warehouseId: 'wh_main',
      targetWarehouseId: 'wh_store',
      amountDram: 45000,
      comment: 'Ապրանքների տեղափոխում պահեստից խանութի սրահ',
      author: 'Արայիկ Պետրոսյան',
      items: [
        {
          productId: 1,
          productName: 'Ցորենի հաց (թարմ)',
          unit: '1 հատ',
          quantity: 30,
          priceDram: 250,
          totalDram: 7500,
        },
        {
          productId: 2,
          productName: 'Կովի կաթ 1լ (3.2%)',
          unit: '1 լիտր',
          quantity: 25,
          priceDram: 550,
          totalDram: 13750,
        },
      ],
    },
    {
      id: 'doc_pko_001',
      docNumber: 'ՊԿՕ-000018',
      type: 'pko',
      status: 'posted',
      date: dateStr,
      timestamp: Date.now() - 20000000,
      cashAccountId: 'acc_cash_desk',
      counterpartyId: 'cnt_retail_customer',
      cashOperationType: 'retail_revenue',
      amountDram: 35000,
      comment: 'Մանրածախ վաճառքից ստացված եկամուտ (ՀԴՄ)',
      author: 'Արայիկ Պետրոսյան',
      items: [],
    },
  ];

  const currentShift: CashierShift = {
    id: `shift_${Date.now()}`,
    cashierName: 'Արայիկ Պետրոսյան (Ադմին)',
    openedAt: new Date().toLocaleTimeString('hy-AM', { hour: '2-digit', minute: '2-digit' }),
    isOpen: true,
    initialCashDram: 20000,
    cashRevenueDram: 35000,
    cardRevenueDram: 18500,
    totalRevenueDram: 53500,
    totalReceiptsCount: 8,
    cashOutDram: 0,
  };

  return {
    warehouses: INITIAL_WAREHOUSES,
    counterparties: INITIAL_COUNTERPARTIES,
    cashAccounts: INITIAL_CASH_ACCOUNTS,
    stockRegister,
    documents: sampleDocs,
    currentShift,
    shiftHistory: [],
  };
}

/**
 * Проведение документа 1С в регистрах (Остатки, Касса/Банк, Взаиморасчеты)
 */
export function postErpDocument(state: ErpState, doc: ErpDocument): ErpState {
  // Копируем состояние иммутабельно
  const updatedStock = [...state.stockRegister];
  let updatedCounterparties = [...state.counterparties];
  let updatedCashAccounts = [...state.cashAccounts];

  // Вспомогательная функция обновления остатка
  const adjustStock = (whId: string, prodId: number, deltaQty: number, costPrice?: number) => {
    const idx = updatedStock.findIndex((s) => s.warehouseId === whId && s.productId === prodId);
    if (idx >= 0) {
      const existing = updatedStock[idx];
      const newQty = Math.max(0, existing.quantity + deltaQty);
      const newCost = costPrice !== undefined && costPrice > 0 ? costPrice : existing.costPriceDram;
      updatedStock[idx] = {
        ...existing,
        quantity: newQty,
        costPriceDram: newCost,
      };
    } else if (deltaQty > 0) {
      updatedStock.push({
        productId: prodId,
        warehouseId: whId,
        quantity: deltaQty,
        reserved: 0,
        costPriceDram: costPrice || 500,
        retailPriceDram: Math.round((costPrice || 500) * 1.3),
        minStockThreshold: 10,
      });
    }
  };

  // 1. Поступление товаров (ТОРГ-12)
  if (doc.type === 'receipt' && doc.warehouseId) {
    doc.items.forEach((item) => {
      adjustStock(doc.warehouseId!, item.productId, item.quantity, item.priceDram);
    });
    // Увеличиваем кредиторскую задолженность перед поставщиком
    if (doc.counterpartyId) {
      updatedCounterparties = updatedCounterparties.map((c) =>
        c.id === doc.counterpartyId
          ? { ...c, balanceDram: c.balanceDram + doc.amountDram }
          : c
      );
    }
  }

  // 2. Перемещение товаров
  else if (doc.type === 'transfer' && doc.warehouseId && doc.targetWarehouseId) {
    doc.items.forEach((item) => {
      adjustStock(doc.warehouseId!, item.productId, -item.quantity);
      adjustStock(doc.targetWarehouseId!, item.productId, item.quantity);
    });
  }

  // 3. Списание товаров (Брак / Убыток)
  else if (doc.type === 'write_off' && doc.warehouseId) {
    doc.items.forEach((item) => {
      adjustStock(doc.warehouseId!, item.productId, -item.quantity);
    });
  }

  // 4. Оприходование излишков (Surplus)
  else if (doc.type === 'surplus' && doc.warehouseId) {
    doc.items.forEach((item) => {
      adjustStock(doc.warehouseId!, item.productId, item.quantity, item.priceDram);
    });
  }

  // 5. Продажа РМК / Чек ККМ / Заказ интернет-магазина
  else if (doc.type === 'pos_sale') {
    const whId = doc.warehouseId || 'wh_store';
    doc.items.forEach((item) => {
      adjustStock(whId, item.productId, -item.quantity);
    });

    // Начисление в кассу или расчетный счет
    const targetAccountId = doc.cashAccountId || 'acc_cash_desk';
    updatedCashAccounts = updatedCashAccounts.map((acc) =>
      acc.id === targetAccountId
        ? { ...acc, balanceDram: acc.balanceDram + doc.amountDram }
        : acc
    );
  }

  // 6. ПКО (Приходный кассовый ордер)
  else if (doc.type === 'pko' && doc.cashAccountId) {
    updatedCashAccounts = updatedCashAccounts.map((acc) =>
      acc.id === doc.cashAccountId
        ? { ...acc, balanceDram: acc.balanceDram + doc.amountDram }
        : acc
    );
    // Если операция уменьшает дебиторскую задолженность клиента
    if (doc.counterpartyId) {
      updatedCounterparties = updatedCounterparties.map((c) =>
        c.id === doc.counterpartyId
          ? { ...c, balanceDram: c.balanceDram + doc.amountDram }
          : c
      );
    }
  }

  // 7. РКО (Расходный кассовый ордер)
  else if (doc.type === 'rko' && doc.cashAccountId) {
    updatedCashAccounts = updatedCashAccounts.map((acc) =>
      acc.id === doc.cashAccountId
        ? { ...acc, balanceDram: Math.max(0, acc.balanceDram - doc.amountDram) }
        : acc
    );
    // Если оплата поставщику, снижаем наш долг
    if (doc.counterpartyId) {
      updatedCounterparties = updatedCounterparties.map((c) =>
        c.id === doc.counterpartyId
          ? { ...c, balanceDram: Math.max(0, c.balanceDram - doc.amountDram) }
          : c
      );
    }
  }

  // Обновляем статус документа на 'posted'
  const postedDoc: ErpDocument = { ...doc, status: 'posted' };
  const existingDocIdx = state.documents.findIndex((d) => d.id === doc.id);
  const updatedDocuments =
    existingDocIdx >= 0
      ? state.documents.map((d) => (d.id === doc.id ? postedDoc : d))
      : [postedDoc, ...state.documents];

  return {
    ...state,
    stockRegister: updatedStock,
    counterparties: updatedCounterparties,
    cashAccounts: updatedCashAccounts,
    documents: updatedDocuments,
  };
}

/**
 * Отмена проведения документа (Возврат остатков и балансов)
 */
export function unpostErpDocument(state: ErpState, docId: string): ErpState {
  const doc = state.documents.find((d) => d.id === docId);
  if (!doc || doc.status !== 'posted') return state;

  const updatedStock = [...state.stockRegister];
  let updatedCounterparties = [...state.counterparties];
  let updatedCashAccounts = [...state.cashAccounts];

  const adjustStock = (whId: string, prodId: number, deltaQty: number) => {
    const idx = updatedStock.findIndex((s) => s.warehouseId === whId && s.productId === prodId);
    if (idx >= 0) {
      const existing = updatedStock[idx];
      updatedStock[idx] = {
        ...existing,
        quantity: Math.max(0, existing.quantity + deltaQty),
      };
    }
  };

  // Обратный ход движений
  if (doc.type === 'receipt' && doc.warehouseId) {
    doc.items.forEach((item) => adjustStock(doc.warehouseId!, item.productId, -item.quantity));
    if (doc.counterpartyId) {
      updatedCounterparties = updatedCounterparties.map((c) =>
        c.id === doc.counterpartyId ? { ...c, balanceDram: Math.max(0, c.balanceDram - doc.amountDram) } : c
      );
    }
  } else if (doc.type === 'transfer' && doc.warehouseId && doc.targetWarehouseId) {
    doc.items.forEach((item) => {
      adjustStock(doc.warehouseId!, item.productId, item.quantity);
      adjustStock(doc.targetWarehouseId!, item.productId, -item.quantity);
    });
  } else if (doc.type === 'write_off' && doc.warehouseId) {
    doc.items.forEach((item) => adjustStock(doc.warehouseId!, item.productId, item.quantity));
  } else if (doc.type === 'surplus' && doc.warehouseId) {
    doc.items.forEach((item) => adjustStock(doc.warehouseId!, item.productId, -item.quantity));
  } else if (doc.type === 'pos_sale') {
    const whId = doc.warehouseId || 'wh_store';
    doc.items.forEach((item) => adjustStock(whId, item.productId, item.quantity));
    const targetAccountId = doc.cashAccountId || 'acc_cash_desk';
    updatedCashAccounts = updatedCashAccounts.map((acc) =>
      acc.id === targetAccountId ? { ...acc, balanceDram: Math.max(0, acc.balanceDram - doc.amountDram) } : acc
    );
  } else if (doc.type === 'pko' && doc.cashAccountId) {
    updatedCashAccounts = updatedCashAccounts.map((acc) =>
      acc.id === doc.cashAccountId ? { ...acc, balanceDram: Math.max(0, acc.balanceDram - doc.amountDram) } : acc
    );
  } else if (doc.type === 'rko' && doc.cashAccountId) {
    updatedCashAccounts = updatedCashAccounts.map((acc) =>
      acc.id === doc.cashAccountId ? { ...acc, balanceDram: acc.balanceDram + doc.amountDram } : acc
    );
    if (doc.counterpartyId) {
      updatedCounterparties = updatedCounterparties.map((c) =>
        c.id === doc.counterpartyId ? { ...c, balanceDram: c.balanceDram + doc.amountDram } : c
      );
    }
  }

  const updatedDocs = state.documents.map((d) => (d.id === docId ? { ...d, status: 'draft' as const } : d));

  return {
    ...state,
    stockRegister: updatedStock,
    counterparties: updatedCounterparties,
    cashAccounts: updatedCashAccounts,
    documents: updatedDocs,
  };
}

/**
 * Расчет ведомости остатков (Оборотно-сальдовая / Материальный отчет)
 */
export function calculateMaterialReport(
  state: ErpState,
  products: ProductItem[],
  warehouseId?: string
): MaterialReportItem[] {
  const result: MaterialReportItem[] = [];

  products.forEach((prod) => {
    const relevantStocks = state.stockRegister.filter((s) =>
      s.productId === prod.id && (!warehouseId || s.warehouseId === warehouseId)
    );

    const totalQty = relevantStocks.reduce((sum, s) => sum + s.quantity, 0);
    const avgCost =
      relevantStocks.length > 0
        ? Math.round(relevantStocks.reduce((sum, s) => sum + s.costPriceDram, 0) / relevantStocks.length)
        : Math.round(prod.priceDram * 0.7);

    const whName = warehouseId
      ? state.warehouses.find((w) => w.id === warehouseId)?.nameRu || 'Склад'
      : 'Все склады';

    // Считаем обороты по проведенным документам
    let incoming = 0;
    let outgoing = 0;

    state.documents
      .filter((d) => d.status === 'posted')
      .forEach((d) => {
        d.items.forEach((it) => {
          if (it.productId === prod.id) {
            if (d.type === 'receipt' || d.type === 'surplus') incoming += it.quantity;
            if (d.type === 'pos_sale' || d.type === 'write_off') outgoing += it.quantity;
          }
        });
      });

    result.push({
      productId: prod.id,
      productName: prod.nameRu,
      sku: `АРТ-${String(prod.id).padStart(5, '0')}`,
      unit: prod.unitRu,
      warehouseName: whName,
      incomingQty: incoming,
      outgoingQty: outgoing,
      currentStock: totalQty,
      costPriceDram: avgCost,
      retailPriceDram: prod.priceDram,
      totalStockValueCostDram: totalQty * avgCost,
      totalStockValueRetailDram: totalQty * prod.priceDram,
      isLowStock: totalQty <= 15,
    });
  });

  return result;
}

/**
 * Расчет отчета о прибылях и убытках (P&L 1C)
 */
export function calculateProfitAndLoss(state: ErpState): ProfitAndLossReport {
  let revenue = 0;
  let cogs = 0;
  let writeOffExpense = 0;
  let operatingExpenses = 0;

  state.documents
    .filter((d) => d.status === 'posted')
    .forEach((doc) => {
      if (doc.type === 'pos_sale') {
        revenue += doc.amountDram;
        // Себестоимость проданного
        doc.items.forEach((it) => {
          const stock = state.stockRegister.find((s) => s.productId === it.productId);
          const cost = stock?.costPriceDram || Math.round(it.priceDram * 0.7);
          cogs += it.quantity * cost;
        });
      } else if (doc.type === 'write_off') {
        doc.items.forEach((it) => {
          const cost = it.priceDram || 500;
          writeOffExpense += it.quantity * cost;
        });
      } else if (doc.type === 'rko') {
        // Расходы (аренда, коммуналка, зарплата)
        if (doc.cashOperationType === 'salary' || doc.cashOperationType === 'rent_utility') {
          operatingExpenses += doc.amountDram;
        }
      }
    });

  // Добавим выручку из текущей смены кассы, если есть
  if (state.currentShift && state.currentShift.isOpen) {
    revenue += state.currentShift.totalRevenueDram;
    cogs += Math.round(state.currentShift.totalRevenueDram * 0.7);
  }

  const grossProfit = Math.max(0, revenue - cogs);
  const marginPercent = revenue > 0 ? Math.round((grossProfit / revenue) * 100) : 0;
  const netProfit = grossProfit - writeOffExpense - operatingExpenses;

  return {
    period: new Date().toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' }),
    totalRevenueDram: revenue,
    cogsDram: cogs,
    grossProfitDram: grossProfit,
    marginPercent,
    writeOffExpenseDram: writeOffExpense,
    operatingExpensesDram: operatingExpenses,
    netProfitDram: netProfit,
  };
}

/**
 * Расчет расхождений инвентаризации (Учет vs Факт)
 */
export function calculateInventoryDiscrepancy(
  accountingQty: number,
  actualQty: number,
  costPriceDram: number
): { varianceQty: number; varianceCostDram: number; status: 'surplus' | 'shortage' | 'match' } {
  const varianceQty = actualQty - accountingQty;
  const varianceCostDram = Math.abs(varianceQty) * costPriceDram;
  const status = varianceQty > 0 ? 'surplus' : varianceQty < 0 ? 'shortage' : 'match';
  return { varianceQty, varianceCostDram, status };
}

/**
 * Генерация Z-отчета при закрытии смены кассы
 */
export function closeShiftZReport(shift: CashierShift, actualCashCountDram: number): CashierShift {
  const expectedCash = shift.initialCashDram + shift.cashRevenueDram - shift.cashOutDram;
  return {
    ...shift,
    isOpen: false,
    closedAt: new Date().toLocaleTimeString('hy-AM', { hour: '2-digit', minute: '2-digit' }),
    finalCashDram: actualCashCountDram,
    // totalRevenueDram already has card + cash
  };
}

/**
 * Поиск позиций с критически низким остатком
 */
export function findLowStockItems(state: ErpState, products: ProductItem[]): { product: ProductItem; totalStock: number; minThreshold: number }[] {
  const lowList: { product: ProductItem; totalStock: number; minThreshold: number }[] = [];

  products.forEach((prod) => {
    const totalStock = state.stockRegister
      .filter((s) => s.productId === prod.id)
      .reduce((acc, curr) => acc + curr.quantity, 0);

    const minThreshold = state.stockRegister.find((s) => s.productId === prod.id)?.minStockThreshold || 15;

    if (totalStock <= minThreshold) {
      lowList.push({ product: prod, totalStock, minThreshold });
    }
  });

  return lowList;
}

/**
 * Генерация следующего номера документа 1С (e.g. МՈՒՏ-000043, ՊԿՕ-000019)
 */
export function generateNextDocNumber(type: ErpDocumentType, existingDocs: ErpDocument[]): string {
  const prefixes: Record<ErpDocumentType, string> = {
    receipt: 'ПСТ',
    transfer: 'ПРМ',
    write_off: 'СПС',
    inventory: 'ИНВ',
    surplus: 'ОПР',
    pko: 'ПКО',
    rko: 'РКО',
    pos_sale: 'ЧЕК',
    revaluation: 'ПРЦ',
  };
  const prefix = prefixes[type] || 'ДОК';
  const matching = existingDocs.filter((d) => d.type === type);
  const nextNum = matching.length + 1;
  return `${prefix}-${String(nextNum).padStart(6, '0')}`;
}
