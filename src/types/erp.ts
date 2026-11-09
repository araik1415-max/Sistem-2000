export type ErpDocumentStatus = 'draft' | 'posted' | 'cancelled';

export type ErpDocumentType =
  | 'receipt'       // Поступление товаров (Приходная накладная / ТОРГ-12)
  | 'transfer'      // Перемещение товаров между складами
  | 'write_off'     // Списание товаров (порча, брак, утеря)
  | 'inventory'     // Инвентаризация товаров (Сличительная ведомость)
  | 'surplus'       // Оприходование излишков
  | 'pko'           // Приходный кассовый ордер (ПКО)
  | 'rko'           // Расходный кассовый ордер (РКО)
  | 'pos_sale'      // Чек ККМ / Продажа РМК
  | 'revaluation';  // Акт переоценки

export interface Warehouse {
  id: string;
  nameHy: string;
  nameRu: string;
  code: string;
  type: 'retail' | 'warehouse' | 'spoilage';
  address: string;
  responsiblePerson: string;
}

export interface Counterparty {
  id: string;
  name: string;
  type: 'supplier' | 'customer' | 'both';
  taxId: string;       // ՀՎՀՀ / ИНН
  phone: string;
  email: string;
  balanceDram: number; // >0: мы должны контрагенту, <0: контрагент должен нам
}

export interface CashAccount {
  id: string;
  nameHy: string;
  nameRu: string;
  type: 'cash_register' | 'bank_account';
  accountNumber: string;
  balanceDram: number;
}

export interface StockItem {
  productId: number;
  warehouseId: string;
  quantity: number;
  reserved: number;
  costPriceDram: number;   // Себестоимость закупки (֏)
  retailPriceDram: number; // Розничная цена (֏)
  minStockThreshold: number;
}

export interface DocumentLineItem {
  productId: number;
  productName: string;
  unit: string;
  quantity: number;
  priceDram: number;
  totalDram: number;
  actualQuantity?: number; // Для инвентаризации
  variance?: number;       // Излишек (+) или Недостача (-)
}

export interface ErpDocument {
  id: string;
  docNumber: string;
  type: ErpDocumentType;
  status: ErpDocumentStatus;
  date: string;
  timestamp: number;
  warehouseId?: string;
  targetWarehouseId?: string; // Для перемещений
  counterpartyId?: string;
  cashAccountId?: string;
  amountDram: number;
  comment: string;
  author: string;
  items: DocumentLineItem[];
  // Метаданные для ПКО/РКО
  cashOperationType?:
    | 'retail_revenue'       // Выручка ККМ
    | 'supplier_payment'     // Оплата поставщику
    | 'encashment'           // Инкассация
    | 'salary'               // Зарплата
    | 'rent_utility'         // Аренда и коммунальные
    | 'founder_contribution';// Взнос учредителя
  linkedDocId?: string;
}

export interface CashierShift {
  id: string;
  cashierName: string;
  openedAt: string;
  closedAt?: string;
  isOpen: boolean;
  initialCashDram: number;
  cashRevenueDram: number;
  cardRevenueDram: number;
  totalRevenueDram: number;
  totalReceiptsCount: number;
  cashOutDram: number;
  finalCashDram?: number;
}

export interface ErpState {
  warehouses: Warehouse[];
  counterparties: Counterparty[];
  cashAccounts: CashAccount[];
  stockRegister: StockItem[];
  documents: ErpDocument[];
  currentShift: CashierShift;
  shiftHistory: CashierShift[];
}

export interface ProfitAndLossReport {
  period: string;
  totalRevenueDram: number;
  cogsDram: number;            // Себестоимость проданного
  grossProfitDram: number;     // Валовая прибыль
  marginPercent: number;       // Маржинальность %
  writeOffExpenseDram: number; // Убытки от списания/брака
  operatingExpensesDram: number; // Прочие расходы (РКО)
  netProfitDram: number;       // Чистая прибыль
}

export interface MaterialReportItem {
  productId: number;
  productName: string;
  sku: string;
  unit: string;
  warehouseName: string;
  incomingQty: number;
  outgoingQty: number;
  currentStock: number;
  costPriceDram: number;
  retailPriceDram: number;
  totalStockValueCostDram: number;
  totalStockValueRetailDram: number;
  isLowStock: boolean;
}
