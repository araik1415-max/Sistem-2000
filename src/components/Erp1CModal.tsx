import React, { useState } from 'react';
import {
  X,
  Package,
  Layers,
  FileText,
  DollarSign,
  TrendingUp,
  Tag,
  Plus,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  Printer,
  Search,
  Filter,
  ArrowRightLeft,
  Truck,
  ArrowDownLeft,
  ArrowUpRight,
  ClipboardList,
  Check,
  ShoppingBag,
  CreditCard,
  QrCode,
  Calendar,
  Building,
  UserCheck,
  Percent,
} from 'lucide-react';
import { ProductItem, Language } from '../types';
import {
  ErpState,
  ErpDocument,
  ErpDocumentType,
  Warehouse,
  Counterparty,
  CashAccount,
  DocumentLineItem,
} from '../types/erp';
import {
  postErpDocument,
  unpostErpDocument,
  calculateProfitAndLoss,
  calculateMaterialReport,
  generateNextDocNumber,
  closeShiftZReport,
  findLowStockItems,
} from '../utils/erpEngine';
import { formatDram } from '../utils/finance';
import { PrintFormsModal } from './PrintFormsModal';
import { PriceTagsPrintModal } from './PriceTagsPrintModal';

interface Erp1CModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  products: ProductItem[];
  erpState: ErpState;
  onUpdateErpState: (updater: (prev: ErpState) => ErpState) => void;
  onOpenStorefront?: () => void;
}

export const Erp1CModal: React.FC<Erp1CModalProps> = ({
  isOpen,
  onClose,
  lang,
  products,
  erpState,
  onUpdateErpState,
  onOpenStorefront,
}) => {
  const [activeTab, setActiveTab] = useState<'warehouse' | 'documents' | 'accounting' | 'pos' | 'reports' | 'nomenclature'>('warehouse');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('all');
  const [docFilterType, setDocFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Состояние для печатных форм
  const [printDoc, setPrintDoc] = useState<ErpDocument | null>(null);
  const [isPriceTagsOpen, setIsPriceTagsOpen] = useState<boolean>(false);

  // Состояние редактора нового документа
  const [isCreatingDoc, setIsCreatingDoc] = useState<boolean>(false);
  const [docTypeToCreate, setDocTypeToCreate] = useState<ErpDocumentType>('receipt');
  const [editWhId, setEditWhId] = useState<string>('wh_store');
  const [editTargetWhId, setEditTargetWhId] = useState<string>('wh_main');
  const [editCounterpartyId, setEditCounterpartyId] = useState<string>('cnt_ararat');
  const [editCashAccountId, setEditCashAccountId] = useState<string>('acc_cash_desk');
  const [editComment, setEditComment] = useState<string>('');
  const [editDocLines, setEditDocLines] = useState<DocumentLineItem[]>([]);
  const [editCashAmount, setEditCashAmount] = useState<number>(15000);
  const [editCashOpType, setEditCashOpType] = useState<'retail_revenue' | 'supplier_payment' | 'encashment' | 'salary' | 'rent_utility'>('supplier_payment');

  // Состояние для встроенного РМК (Кассы)
  const [posBarcode, setPosBarcode] = useState<string>('');
  const [posLines, setPosLines] = useState<{ product: ProductItem; quantity: number }[]>([]);
  const [posDiscount, setPosDiscount] = useState<number>(0);
  const [posTenderType, setPosTenderType] = useState<'cash' | 'card' | 'qr'>('cash');
  const [posLastSaleSummary, setPosLastSaleSummary] = useState<string | null>(null);

  if (!isOpen) return null;

  const isHy = lang === 'hy';

  // Вычисляемые финансовые показатели
  const pnlReport = calculateProfitAndLoss(erpState);
  const materialReport = calculateMaterialReport(
    erpState,
    products,
    selectedWarehouseId === 'all' ? undefined : selectedWarehouseId
  );
  const lowStockAlerts = findLowStockItems(erpState, products);

  // Общая стоимость всех складов
  const totalStockCostValue = erpState.stockRegister.reduce(
    (sum, s) => sum + s.quantity * s.costPriceDram,
    0
  );
  const totalStockRetailValue = erpState.stockRegister.reduce(
    (sum, s) => sum + s.quantity * s.retailPriceDram,
    0
  );

  // Баланс кассы и банка
  const cashDeskBalance =
    erpState.cashAccounts.find((a) => a.id === 'acc_cash_desk')?.balanceDram || 0;
  const bankAccountBalance =
    erpState.cashAccounts.find((a) => a.id === 'acc_bank_ameria')?.balanceDram || 0;

  // Кредиторская задолженность перед поставщиками
  const totalSupplierDebt = erpState.counterparties
    .filter((c) => c.type === 'supplier' || c.type === 'both')
    .reduce((sum, c) => sum + Math.max(0, c.balanceDram), 0);

  // Инициализация строк для нового документа
  const handleOpenCreateDoc = (type: ErpDocumentType) => {
    setDocTypeToCreate(type);
    setEditComment('');
    if (type === 'receipt') {
      setEditWhId('wh_store');
      setEditCounterpartyId('cnt_ararat');
      setEditDocLines([
        {
          productId: products[0].id,
          productName: products[0].nameRu,
          unit: products[0].unitRu,
          quantity: 20,
          priceDram: Math.round(products[0].priceDram * 0.7),
          totalDram: 20 * Math.round(products[0].priceDram * 0.7),
        },
      ]);
    } else if (type === 'transfer') {
      setEditWhId('wh_main');
      setEditTargetWhId('wh_store');
      setEditDocLines([
        {
          productId: products[0].id,
          productName: products[0].nameRu,
          unit: products[0].unitRu,
          quantity: 15,
          priceDram: products[0].priceDram,
          totalDram: 15 * products[0].priceDram,
        },
      ]);
    } else if (type === 'write_off') {
      setEditWhId('wh_store');
      setEditComment('Истек срок реализации / Порча');
      setEditDocLines([
        {
          productId: products[0].id,
          productName: products[0].nameRu,
          unit: products[0].unitRu,
          quantity: 2,
          priceDram: Math.round(products[0].priceDram * 0.7),
          totalDram: 2 * Math.round(products[0].priceDram * 0.7),
        },
      ]);
    } else if (type === 'inventory') {
      setEditWhId('wh_store');
      setEditComment('Плановая инвентаризация торгового зала');
      // Заполняем текущими остатками для сверки
      const lines = products.slice(0, 8).map((p) => {
        const currentQty =
          erpState.stockRegister.find((s) => s.warehouseId === 'wh_store' && s.productId === p.id)
            ?.quantity || 10;
        return {
          productId: p.id,
          productName: p.nameRu,
          unit: p.unitRu,
          quantity: currentQty, // Учет
          actualQuantity: currentQty, // Факт
          priceDram: Math.round(p.priceDram * 0.7),
          totalDram: currentQty * Math.round(p.priceDram * 0.7),
        };
      });
      setEditDocLines(lines);
    } else if (type === 'pko') {
      setEditCashAccountId('acc_cash_desk');
      setEditCounterpartyId('cnt_retail_customer');
      setEditCashOpType('retail_revenue');
      setEditCashAmount(25000);
      setEditComment('Поступление розничной выручки за день');
    } else if (type === 'rko') {
      setEditCashAccountId('acc_cash_desk');
      setEditCounterpartyId('cnt_ararat');
      setEditCashOpType('supplier_payment');
      setEditCashAmount(30000);
      setEditComment('Частичная оплата поставщику за поставку');
    }
    setIsCreatingDoc(true);
  };

  const handleSaveAndPostDoc = (andPost: boolean) => {
    const docNumber = generateNextDocNumber(docTypeToCreate, erpState.documents);
    const totalAmount =
      docTypeToCreate === 'pko' || docTypeToCreate === 'rko'
        ? editCashAmount
        : editDocLines.reduce((s, it) => s + it.totalDram, 0);

    const newDoc: ErpDocument = {
      id: `doc_${Date.now()}`,
      docNumber,
      type: docTypeToCreate,
      status: andPost ? 'posted' : 'draft',
      date: new Date().toLocaleDateString('ru-RU'),
      timestamp: Date.now(),
      warehouseId: editWhId,
      targetWarehouseId: docTypeToCreate === 'transfer' ? editTargetWhId : undefined,
      counterpartyId: editCounterpartyId,
      cashAccountId: editCashAccountId,
      cashOperationType: docTypeToCreate === 'pko' || docTypeToCreate === 'rko' ? editCashOpType : undefined,
      amountDram: totalAmount,
      comment: editComment || `Документ ${docTypeToCreate}`,
      author: 'Արայիկ Պետրոսյան (1C Администратор)',
      items: editDocLines,
    };

    if (andPost) {
      onUpdateErpState((prev) => postErpDocument(prev, newDoc));
    } else {
      onUpdateErpState((prev) => ({
        ...prev,
        documents: [newDoc, ...prev.documents],
      }));
    }

    setIsCreatingDoc(false);
  };

  // Проведение / Отмена проведения в журнале
  const handleToggleDocPosting = (doc: ErpDocument) => {
    if (doc.status === 'posted') {
      onUpdateErpState((prev) => unpostErpDocument(prev, doc.id));
    } else {
      onUpdateErpState((prev) => postErpDocument(prev, doc));
    }
  };

  // Функции для РМК (Кассы)
  const handleAddPosProduct = (prod: ProductItem) => {
    setPosLines((prev) => {
      const idx = prev.findIndex((l) => l.product.id === prod.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx].quantity += 1;
        return copy;
      }
      return [...prev, { product: prod, quantity: 1 }];
    });
  };

  const handlePosBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!posBarcode.trim()) return;
    const found = products.find(
      (p) =>
        String(p.id) === posBarcode.trim() ||
        p.nameRu.toLowerCase().includes(posBarcode.toLowerCase()) ||
        p.nameHy.toLowerCase().includes(posBarcode.toLowerCase())
    );
    if (found) {
      handleAddPosProduct(found);
      setPosBarcode('');
    }
  };

  const posSubtotal = posLines.reduce((s, l) => s + l.product.priceDram * l.quantity, 0);
  const posDiscountAmount = Math.round(posSubtotal * (posDiscount / 100));
  const posTotal = Math.max(0, posSubtotal - posDiscountAmount);

  const handleCheckoutPosSale = () => {
    if (posLines.length === 0) return;

    const saleDoc: ErpDocument = {
      id: `doc_pos_${Date.now()}`,
      docNumber: generateNextDocNumber('pos_sale', erpState.documents),
      type: 'pos_sale',
      status: 'posted',
      date: new Date().toLocaleDateString('ru-RU'),
      timestamp: Date.now(),
      warehouseId: 'wh_store',
      cashAccountId: posTenderType === 'cash' ? 'acc_cash_desk' : 'acc_bank_ameria',
      amountDram: posTotal,
      comment: `Чек ККМ (${posTenderType === 'cash' ? 'Наличные' : posTenderType === 'card' ? 'Банковская карта' : 'Idram QR'})`,
      author: erpState.currentShift.cashierName,
      items: posLines.map((l) => ({
        productId: l.product.id,
        productName: l.product.nameRu,
        unit: l.product.unitRu,
        quantity: l.quantity,
        priceDram: l.product.priceDram,
        totalDram: l.product.priceDram * l.quantity,
      })),
    };

    onUpdateErpState((prev) => {
      const posted = postErpDocument(prev, saleDoc);
      // Обновляем смену кассира
      const shift = { ...posted.currentShift };
      shift.totalReceiptsCount += 1;
      shift.totalRevenueDram += posTotal;
      if (posTenderType === 'cash') shift.cashRevenueDram += posTotal;
      else shift.cardRevenueDram += posTotal;

      return {
        ...posted,
        currentShift: shift,
      };
    });

    setPosLastSaleSummary(`Чек № ${saleDoc.docNumber} успешно пробит на сумму ${formatDram(posTotal)}! Склад списан.`);
    setPosLines([]);
    setTimeout(() => setPosLastSaleSummary(null), 6000);
  };

  const handleCloseShift = () => {
    if (!erpState.currentShift.isOpen) return;
    const closed = closeShiftZReport(
      erpState.currentShift,
      cashDeskBalance
    );
    onUpdateErpState((prev) => ({
      ...prev,
      currentShift: {
        id: `shift_${Date.now()}`,
        cashierName: 'Արայիկ Պետրոսյան (Ադմին)',
        openedAt: new Date().toLocaleTimeString('hy-AM', { hour: '2-digit', minute: '2-digit' }),
        isOpen: true,
        initialCashDram: cashDeskBalance,
        cashRevenueDram: 0,
        cardRevenueDram: 0,
        totalRevenueDram: 0,
        totalReceiptsCount: 0,
        cashOutDram: 0,
      },
      shiftHistory: [closed, ...prev.shiftHistory],
    }));
    alert(`Z-ОТЧЕТ СФОРМИРОВАН:\nСмена успешно закрыта.\nВыручка смены: ${formatDram(closed.totalRevenueDram)}\nЧеков: ${closed.totalReceiptsCount}\nКасса в порядке.`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-none animate-fadeIn">
      <div className="relative w-full max-w-7xl bg-slate-900 border border-amber-500/40 rounded-2xl shadow-2xl flex flex-col h-[94vh] overflow-hidden text-slate-100 font-sans">
        {/* ВЕРХНЯЯ 1C ПАНЕЛЬ (1C Enterprise Ribbon Header) */}
        <div className="flex items-center justify-between px-5 py-3 bg-gradient-to-r from-amber-600 via-amber-700 to-amber-900 text-slate-950 border-b border-amber-400/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-950 text-amber-400 font-black text-lg flex items-center justify-center shadow-lg border border-amber-300/40">
              1С
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold tracking-tight text-white flex items-center gap-2">
                  1С:Розница & Управление Складом & Бухгалтерия
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-400 text-slate-950 shadow">
                  v8.3 ERP
                </span>
                <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  База активна
                </span>
              </div>
              <p className="text-xs text-amber-100 font-medium">
                «Համակարգ 2000» Մարկետ • Օպերատիվ հաշվառում, պահեստներ, ՀԴՄ կասսա և ֆինանսներ
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPriceTagsOpen(true)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-900 text-amber-300 text-xs font-bold shadow transition-colors cursor-pointer border border-amber-400/30"
            >
              <Tag className="w-3.5 h-3.5" />
              <span>Печать ценников</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-950 hover:bg-black/20 transition-colors cursor-pointer"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>

        {/* ПАНЕЛЬ БЫСТРЫХ ИНДИКАТОРОВ 1C (Top Dashboard KPIs) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 px-5 py-2.5 bg-slate-950 border-b border-slate-800 text-xs shrink-0">
          <div className="flex flex-col p-2 rounded-lg bg-slate-900/90 border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
              <Package className="w-3 h-3 text-amber-400" />
              Остатки на складах
            </span>
            <span className="text-sm font-black text-amber-300 mt-0.5">
              {formatDram(totalStockRetailValue)}
            </span>
            <span className="text-[10px] text-slate-400">
              Себестоимость: {formatDram(totalStockCostValue)}
            </span>
          </div>

          <div className="flex flex-col p-2 rounded-lg bg-slate-900/90 border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
              <DollarSign className="w-3 h-3 text-emerald-400" />
              Касса магазина (ККМ)
            </span>
            <span className="text-sm font-black text-emerald-400 mt-0.5">
              {formatDram(cashDeskBalance)}
            </span>
            <span className="text-[10px] text-slate-400">В кассе торгового зала</span>
          </div>

          <div className="flex flex-col p-2 rounded-lg bg-slate-900/90 border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
              <Building className="w-3 h-3 text-sky-400" />
              Расчетный счет (Банк)
            </span>
            <span className="text-sm font-black text-sky-300 mt-0.5">
              {formatDram(bankAccountBalance)}
            </span>
            <span className="text-[10px] text-slate-400">Ameriabank CJSC (AMD)</span>
          </div>

          <div className="flex flex-col p-2 rounded-lg bg-slate-900/90 border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
              <Truck className="w-3 h-3 text-rose-400" />
              Долг поставщикам
            </span>
            <span className="text-sm font-black text-rose-400 mt-0.5">
              {formatDram(totalSupplierDebt)}
            </span>
            <span className="text-[10px] text-slate-400">Кредиторская задолженность</span>
          </div>

          <div className="col-span-2 sm:col-span-1 flex flex-col p-2 rounded-lg bg-slate-900/90 border border-slate-800 justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                <UserCheck className="w-3 h-3 text-teal-400" />
                Смена РМК
              </span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300">
                ОТКРЫТА
              </span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs font-bold text-white">
                {formatDram(erpState.currentShift.totalRevenueDram)}
              </span>
              <button
                onClick={handleCloseShift}
                className="px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 font-bold text-[10px] transition-colors cursor-pointer"
                title="Снять Z-отчет и закрыть кассовую смену"
              >
                Z-Отчёт
              </button>
            </div>
          </div>
        </div>

        {/* НАВИГАЦИОННЫЕ ВКЛАДКИ 1С (Tabs) */}
        <div className="flex items-center gap-1 px-5 py-2 bg-slate-950/80 border-b border-slate-800 overflow-x-auto text-xs shrink-0">
          <button
            onClick={() => setActiveTab('warehouse')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'warehouse'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>1. Склад & Остатки</span>
          </button>

          <button
            onClick={() => setActiveTab('documents')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'documents'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>2. Журнал документов 1С</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-amber-300">
              {erpState.documents.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('accounting')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'accounting'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>3. Бухгалтерия & Касса & Банк</span>
          </button>

          <button
            onClick={() => setActiveTab('pos')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'pos'
                ? 'bg-emerald-500 text-slate-950 shadow'
                : 'text-emerald-400 hover:bg-emerald-950/50 hover:text-emerald-300'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>4. РМК (Касса магазина)</span>
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'reports'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>5. Финансовые отчеты & P&L</span>
          </button>

          <button
            onClick={() => setActiveTab('nomenclature')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'nomenclature'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Tag className="w-4 h-4" />
            <span>6. Номенклатура & Ценники</span>
          </button>
        </div>

        {/* ОСНОВНОЕ ТЕЛО ВКЛАДОК */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-900/60">
          {/* ===================== TAB 1: СКЛАД И ОСТАТКИ ===================== */}
          {activeTab === 'warehouse' && (
            <div className="space-y-4">
              {/* Предупреждения о низком остатке */}
              {lowStockAlerts.length > 0 && (
                <div className="p-3 bg-amber-950/40 border border-amber-500/40 rounded-xl flex items-center justify-between flex-wrap gap-2 text-xs">
                  <div className="flex items-center gap-2 text-amber-300">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                    <span>
                      Внимание: по <strong>{lowStockAlerts.length}</strong> позициям остаток ниже нормы! Требуется дозаказ поставщику.
                    </span>
                  </div>
                  <button
                    onClick={() => handleOpenCreateDoc('receipt')}
                    className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg transition-colors cursor-pointer"
                  >
                    + Оформить Поступление (ТОРГ-12)
                  </button>
                </div>
              )}

              {/* Панель инструментов склада */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <span className="text-xs text-slate-400 shrink-0">Склад:</span>
                  <select
                    value={selectedWarehouseId}
                    onChange={(e) => setSelectedWarehouseId(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="all">Все склады предприятия (Сводно)</option>
                    {erpState.warehouses.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.nameRu} ({w.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto justify-end">
                  <button
                    onClick={() => handleOpenCreateDoc('receipt')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Приход (ТОРГ-12)</span>
                  </button>
                  <button
                    onClick={() => handleOpenCreateDoc('transfer')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-300 font-bold text-xs shadow transition-colors cursor-pointer"
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5" />
                    <span>Перемещение</span>
                  </button>
                  <button
                    onClick={() => handleOpenCreateDoc('write_off')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-rose-300 font-bold text-xs shadow transition-colors cursor-pointer"
                  >
                    <Truck className="w-3.5 h-3.5" />
                    <span>Списание брака</span>
                  </button>
                  <button
                    onClick={() => handleOpenCreateDoc('inventory')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-sky-300 font-bold text-xs shadow transition-colors cursor-pointer"
                  >
                    <ClipboardList className="w-3.5 h-3.5" />
                    <span>Инвентаризация</span>
                  </button>
                </div>
              </div>

              {/* Таблица остатков (Оборотно-сальдовая / Материальная ведомость 1С) */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-900 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        <th className="p-3">Артикул</th>
                        <th className="p-3">Номенклатура</th>
                        <th className="p-3 text-center">Ед.</th>
                        <th className="p-3 text-center">Текущий остаток</th>
                        <th className="p-3 text-right">Закупка (֏)</th>
                        <th className="p-3 text-right">Розница (֏)</th>
                        <th className="p-3 text-right">Сумма в рознице</th>
                        <th className="p-3 text-center">Статус</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono">
                      {materialReport.map((row) => (
                        <tr key={row.productId} className="hover:bg-slate-900/50 transition-colors">
                          <td className="p-3 text-slate-500 font-bold">{row.sku}</td>
                          <td className="p-3 font-sans font-semibold text-white">
                            {row.productName}
                          </td>
                          <td className="p-3 text-center text-slate-400">{row.unit}</td>
                          <td className="p-3 text-center font-bold text-sm text-amber-300">
                            {row.currentStock}
                          </td>
                          <td className="p-3 text-right text-slate-400">
                            {formatDram(row.costPriceDram)}
                          </td>
                          <td className="p-3 text-right font-bold text-white">
                            {formatDram(row.retailPriceDram)}
                          </td>
                          <td className="p-3 text-right font-extrabold text-emerald-400">
                            {formatDram(row.totalStockValueRetailDram)}
                          </td>
                          <td className="p-3 text-center font-sans">
                            {row.currentStock <= 15 ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                МАЛО
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                В НОРМЕ
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ===================== TAB 2: ЖУРНАЛ ДОКУМЕНТОВ 1С ===================== */}
          {activeTab === 'documents' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <span className="text-xs text-slate-400">Фильтр по типу:</span>
                  <select
                    value={docFilterType}
                    onChange={(e) => setDocFilterType(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="all">Все документы 1С</option>
                    <option value="receipt">Поступления (ТОРГ-12)</option>
                    <option value="transfer">Перемещения товаров</option>
                    <option value="write_off">Списания товаров</option>
                    <option value="inventory">Инвентаризации</option>
                    <option value="pko">ПКО (Приходные ордера)</option>
                    <option value="rko">РКО (Расходные ордера)</option>
                    <option value="pos_sale">Чеки продаж ККМ</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenCreateDoc('receipt')}
                    className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow transition-colors cursor-pointer"
                  >
                    + Создать документ
                  </button>
                </div>
              </div>

              {/* Таблица журнала */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-900 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        <th className="p-3 text-center w-12">Статус</th>
                        <th className="p-3">Номер 1С</th>
                        <th className="p-3">Дата</th>
                        <th className="p-3">Вид документа</th>
                        <th className="p-3">Склад / Касса</th>
                        <th className="p-3">Контрагент / Основание</th>
                        <th className="p-3 text-right">Сумма (֏)</th>
                        <th className="p-3 text-center">Действия</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono">
                      {erpState.documents
                        .filter((d) => docFilterType === 'all' || d.type === docFilterType)
                        .map((doc) => (
                          <tr key={doc.id} className="hover:bg-slate-900/50 transition-colors">
                            <td className="p-3 text-center">
                              {doc.status === 'posted' ? (
                                <span
                                  title="Проведен (Движения в регистрах активны)"
                                  className="inline-flex items-center justify-center w-6 h-6 rounded bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30"
                                >
                                  ✓
                                </span>
                              ) : (
                                <span
                                  title="Черновик (Движений нет)"
                                  className="inline-flex items-center justify-center w-6 h-6 rounded bg-slate-800 text-slate-400 font-bold"
                                >
                                  ○
                                </span>
                              )}
                            </td>
                            <td className="p-3 font-bold text-amber-300">{doc.docNumber}</td>
                            <td className="p-3 text-slate-400">{doc.date}</td>
                            <td className="p-3 font-sans font-semibold text-white">
                              {doc.type === 'receipt' && 'Поступление товаров (ТОРГ-12)'}
                              {doc.type === 'transfer' && 'Перемещение товаров'}
                              {doc.type === 'write_off' && 'Акт списания товаров'}
                              {doc.type === 'inventory' && 'Инвентаризация (ИНВ-19)'}
                              {doc.type === 'pko' && 'Приходный кассовый ордер (ПКО)'}
                              {doc.type === 'rko' && 'Расходный кассовый ордер (РКО)'}
                              {doc.type === 'pos_sale' && 'Чек ККМ / Продажа'}
                            </td>
                            <td className="p-3 font-sans text-slate-300">
                              {doc.warehouseId
                                ? erpState.warehouses.find((w) => w.id === doc.warehouseId)?.nameRu || 'Склад'
                                : doc.cashAccountId
                                ? erpState.cashAccounts.find((a) => a.id === doc.cashAccountId)?.nameRu || 'Касса'
                                : '—'}
                            </td>
                            <td className="p-3 font-sans text-slate-400 text-xs">
                              {doc.counterpartyId
                                ? erpState.counterparties.find((c) => c.id === doc.counterpartyId)?.name || doc.comment
                                : doc.comment}
                            </td>
                            <td className="p-3 text-right font-extrabold text-sm text-emerald-400">
                              {formatDram(doc.amountDram)}
                            </td>
                            <td className="p-3 text-center font-sans">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => handleToggleDocPosting(doc)}
                                  className={`px-2 py-1 rounded text-[11px] font-bold cursor-pointer transition-colors ${
                                    doc.status === 'posted'
                                      ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/40'
                                      : 'bg-emerald-600 text-white hover:bg-emerald-500'
                                  }`}
                                  title={doc.status === 'posted' ? 'Отменить проведение' : 'Провести документ'}
                                >
                                  {doc.status === 'posted' ? 'Отмена' : 'Провести'}
                                </button>
                                <button
                                  onClick={() => setPrintDoc(doc)}
                                  className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                                  title="Открыть печатную форму 1С (ТОРГ-12 / ПКО / РКО)"
                                >
                                  <Printer className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ===================== TAB 3: БУХГАЛТЕРИЯ & КАССА & БАНК ===================== */}
          {activeTab === 'accounting' && (
            <div className="space-y-6">
              {/* Кассовые и банковские счета */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                  Счета учета денежных средств (Кассы и Банк)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {erpState.cashAccounts.map((acc) => (
                    <div
                      key={acc.id}
                      className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between shadow-lg"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`p-1.5 rounded-lg ${
                              acc.type === 'cash_register'
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'bg-sky-500/20 text-sky-400'
                            }`}
                          >
                            {acc.type === 'cash_register' ? <DollarSign className="w-5 h-5" /> : <Building className="w-5 h-5" />}
                          </span>
                          <div>
                            <h5 className="font-bold text-white text-sm">{acc.nameRu}</h5>
                            <p className="text-xs text-slate-400 font-mono">Счет: {acc.accountNumber}</p>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-black text-emerald-400 font-mono">
                          {formatDram(acc.balanceDram)}
                        </span>
                        <div className="flex gap-1.5 mt-2 justify-end">
                          <button
                            onClick={() => handleOpenCreateDoc('pko')}
                            className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] cursor-pointer"
                          >
                            + ПКО (Приход)
                          </button>
                          <button
                            onClick={() => handleOpenCreateDoc('rko')}
                            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-rose-300 font-bold text-[10px] border border-slate-700 cursor-pointer"
                          >
                            - РКО (Расход)
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Взаиморасчеты с контрагентами (Акты сверки) */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                  <Truck className="w-4 h-4 text-amber-400" />
                  Взаиморасчеты с контрагентами (Поставщики и Покупатели)
                </h4>
                <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-900 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase">
                        <th className="p-3">Контрагент</th>
                        <th className="p-3">ИНН / ՀՎՀՀ</th>
                        <th className="p-3">Тип</th>
                        <th className="p-3">Контакты</th>
                        <th className="p-3 text-right">Сальдо взаиморасчетов (֏)</th>
                        <th className="p-3 text-center">Оплата / Сверка</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono">
                      {erpState.counterparties.map((c) => (
                        <tr key={c.id} className="hover:bg-slate-900/50">
                          <td className="p-3 font-sans font-bold text-white">{c.name}</td>
                          <td className="p-3 text-slate-400">{c.taxId}</td>
                          <td className="p-3 font-sans text-slate-300">
                            {c.type === 'supplier' ? 'Поставщик' : c.type === 'customer' ? 'Покупатель' : 'Поставщик/Покупатель'}
                          </td>
                          <td className="p-3 text-slate-400 font-sans">{c.phone}</td>
                          <td className="p-3 text-right font-bold text-sm">
                            {c.balanceDram > 0 ? (
                              <span className="text-rose-400 font-extrabold">
                                Наш долг: {formatDram(c.balanceDram)}
                              </span>
                            ) : c.balanceDram < 0 ? (
                              <span className="text-emerald-400 font-extrabold">
                                Долг нам: {formatDram(Math.abs(c.balanceDram))}
                              </span>
                            ) : (
                              <span className="text-slate-500">0 ֏ (Сверено)</span>
                            )}
                          </td>
                          <td className="p-3 text-center font-sans">
                            <button
                              onClick={() => {
                                setEditCounterpartyId(c.id);
                                handleOpenCreateDoc('rko');
                              }}
                              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-[11px] border border-slate-700 cursor-pointer"
                            >
                              Оплатить (РКО)
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ===================== TAB 4: РМК (РАБОЧЕЕ МЕСТО КАССИРА / 1С МАГАЗИН) ===================== */}
          {activeTab === 'pos' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Левая колонка: подбор товаров и сканер */}
              <div className="lg:col-span-7 space-y-4">
                {posLastSaleSummary && (
                  <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500 text-emerald-300 font-bold text-xs flex items-center gap-2 animate-fadeIn">
                    <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                    <span>{posLastSaleSummary}</span>
                  </div>
                )}

                {/* Сканер штрих-кода / Поиск 1С */}
                <form
                  onSubmit={handlePosBarcodeSubmit}
                  className="flex items-center gap-2 p-2 bg-slate-950 border border-amber-500/40 rounded-xl shadow-lg"
                >
                  <Search className="w-4 h-4 text-amber-400 ml-2" />
                  <input
                    type="text"
                    value={posBarcode}
                    onChange={(e) => setPosBarcode(e.target.value)}
                    placeholder="Сканировать штрихкод EAN-13 или ввести название товара..."
                    className="flex-1 bg-transparent border-none text-xs text-white placeholder-slate-500 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs cursor-pointer"
                  >
                    В чек (Enter)
                  </button>
                </form>

                {/* Быстрая панель подбора товаров */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
                  <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                    <span>Быстрый подбор номенклатуры (Торговый зал)</span>
                    <span className="text-[10px] text-amber-400">Нажмите на карточку для добавления</span>
                  </h5>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[360px] overflow-y-auto pr-1">
                    {products.map((p) => {
                      const stockInStore =
                        erpState.stockRegister.find(
                          (s) => s.warehouseId === 'wh_store' && s.productId === p.id
                        )?.quantity || 0;
                      return (
                        <button
                          key={p.id}
                          onClick={() => handleAddPosProduct(p)}
                          className="p-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/40 text-left transition-all cursor-pointer flex flex-col justify-between"
                        >
                          <div>
                            <span className="text-[10px] text-slate-400 font-mono">АРТ-{p.id}</span>
                            <h6 className="font-bold text-xs text-white line-clamp-1">{p.nameRu}</h6>
                            <p className="text-[10px] text-slate-400">{p.unitRu}</p>
                          </div>
                          <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-800/60">
                            <span className="font-black text-xs text-amber-300 font-mono">
                              {formatDram(p.priceDram)}
                            </span>
                            <span
                              className={`text-[10px] font-mono px-1 rounded ${
                                stockInStore < 10
                                  ? 'bg-rose-950 text-rose-300'
                                  : 'bg-emerald-950 text-emerald-300'
                              }`}
                            >
                              Ост: {stockInStore}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Правая колонка: Текущий кассовый чек ККМ */}
              <div className="lg:col-span-5 bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-2xl">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
                    <div>
                      <h4 className="font-extrabold text-sm text-white flex items-center gap-2">
                        <span>Текущий чек продажи</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          РМК
                        </span>
                      </h4>
                      <p className="text-[10px] text-slate-400 font-mono">
                        Кассир: {erpState.currentShift.cashierName}
                      </p>
                    </div>
                    {posLines.length > 0 && (
                      <button
                        onClick={() => setPosLines([])}
                        className="text-[10px] text-rose-400 hover:underline cursor-pointer"
                      >
                        Очистить чек
                      </button>
                    )}
                  </div>

                  {/* Список позиций в чеке */}
                  <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1">
                    {posLines.length === 0 ? (
                      <div className="py-12 text-center text-slate-500 text-xs">
                        Чек пуст. Добавьте товары из каталога или со сканера.
                      </div>
                    ) : (
                      posLines.map((line, idx) => (
                        <div
                          key={line.product.id}
                          className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800 text-xs"
                        >
                          <div className="flex-1 pr-2">
                            <span className="font-bold text-white line-clamp-1">
                              {idx + 1}. {line.product.nameRu}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {formatDram(line.product.priceDram)} × {line.quantity}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <div className="flex items-center bg-slate-950 rounded border border-slate-700">
                              <button
                                onClick={() => {
                                  setPosLines((prev) =>
                                    prev
                                      .map((l) =>
                                        l.product.id === line.product.id
                                          ? { ...l, quantity: l.quantity - 1 }
                                          : l
                                      )
                                      .filter((l) => l.quantity > 0)
                                  );
                                }}
                                className="px-1.5 py-0.5 text-slate-400 hover:text-white cursor-pointer"
                              >
                                -
                              </button>
                              <span className="px-2 text-xs font-mono font-bold text-amber-300">
                                {line.quantity}
                              </span>
                              <button
                                onClick={() => {
                                  setPosLines((prev) =>
                                    prev.map((l) =>
                                      l.product.id === line.product.id
                                        ? { ...l, quantity: l.quantity + 1 }
                                        : l
                                    )
                                  );
                                }}
                                className="px-1.5 py-0.5 text-slate-400 hover:text-white cursor-pointer"
                              >
                                +
                              </button>
                            </div>

                            <span className="font-mono font-bold text-white text-right w-16">
                              {formatDram(line.product.priceDram * line.quantity)}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Итого и Оплата */}
                <div className="mt-4 pt-3 border-t border-slate-800 space-y-3">
                  {/* Скидка по карте лояльности */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Скидка / Бонусная карта:</span>
                    <div className="flex gap-1">
                      {[0, 5, 10].map((d) => (
                        <button
                          key={d}
                          onClick={() => setPosDiscount(d)}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                            posDiscount === d
                              ? 'bg-amber-500 text-slate-950'
                              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                          }`}
                        >
                          {d}%
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Выбор типа оплаты */}
                  <div className="grid grid-cols-3 gap-1.5 text-xs">
                    <button
                      onClick={() => setPosTenderType('cash')}
                      className={`p-2 rounded-lg font-bold flex flex-col items-center gap-1 cursor-pointer transition-colors ${
                        posTenderType === 'cash'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <DollarSign className="w-4 h-4" />
                      <span>Наличные</span>
                    </button>
                    <button
                      onClick={() => setPosTenderType('card')}
                      className={`p-2 rounded-lg font-bold flex flex-col items-center gap-1 cursor-pointer transition-colors ${
                        posTenderType === 'card'
                          ? 'bg-sky-600 text-white'
                          : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>Карта / ArCa</span>
                    </button>
                    <button
                      onClick={() => setPosTenderType('qr')}
                      className={`p-2 rounded-lg font-bold flex flex-col items-center gap-1 cursor-pointer transition-colors ${
                        posTenderType === 'qr'
                          ? 'bg-amber-600 text-white'
                          : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <QrCode className="w-4 h-4" />
                      <span>Idram / QR</span>
                    </button>
                  </div>

                  {/* Итоговая сумма */}
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400">ИТОГО К ОПЛАТЕ</span>
                      {posDiscount > 0 && (
                        <p className="text-[10px] text-emerald-400 font-mono">
                          Экономия по скидке: {formatDram(posDiscountAmount)}
                        </p>
                      )}
                    </div>
                    <span className="text-2xl font-black text-emerald-400 font-mono">
                      {formatDram(posTotal)}
                    </span>
                  </div>

                  {/* Кнопка Пробить Чек */}
                  <button
                    onClick={handleCheckoutPosSale}
                    disabled={posLines.length === 0}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 disabled:opacity-40 text-white font-extrabold text-sm shadow-lg shadow-emerald-950/50 transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-5 h-5" />
                    <span>Пробить фискальный чек (Списать склад)</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ===================== TAB 5: ФИНАНСОВЫЕ ОТЧЕТЫ 1С ===================== */}
          {activeTab === 'reports' && (
            <div className="space-y-6">
              {/* Отчет о финансовых результатах (P&L 1C) */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                  <div>
                    <h4 className="font-extrabold text-base text-white flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-amber-400" />
                      1С:Отчет о прибылях и убытках (P&L / Доходы и Расходы)
                    </h4>
                    <p className="text-xs text-slate-400">Период: {pnlReport.period}</p>
                  </div>
                  <span className="px-3 py-1 rounded-lg text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Маржинальность: {pnlReport.marginPercent}%
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Выручка от продаж</span>
                    <p className="text-xl font-black text-emerald-400 mt-1 font-mono">
                      {formatDram(pnlReport.totalRevenueDram)}
                    </p>
                    <span className="text-[10px] text-slate-500">По всем каналам продаж</span>
                  </div>

                  <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Себестоимость товаров (COGS)</span>
                    <p className="text-xl font-black text-slate-300 mt-1 font-mono">
                      {formatDram(pnlReport.cogsDram)}
                    </p>
                    <span className="text-[10px] text-slate-500">Закупочная стоимость проданного</span>
                  </div>

                  <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Валовая прибыль (Gross Profit)</span>
                    <p className="text-xl font-black text-amber-400 mt-1 font-mono">
                      {formatDram(pnlReport.grossProfitDram)}
                    </p>
                    <span className="text-[10px] text-slate-500">Маржа до вычета расходов</span>
                  </div>

                  <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Чистая прибыль</span>
                    <p className="text-xl font-black text-teal-300 mt-1 font-mono">
                      {formatDram(pnlReport.netProfitDram)}
                    </p>
                    <span className="text-[10px] text-slate-500">Итоговый финансовый результат</span>
                  </div>
                </div>

                {/* Детализация расходов */}
                <div className="space-y-2 border-t border-slate-800 pt-4 text-xs font-mono">
                  <div className="flex justify-between py-1 text-slate-300">
                    <span>1. Валовая прибыль:</span>
                    <span className="font-bold text-white">{formatDram(pnlReport.grossProfitDram)}</span>
                  </div>
                  <div className="flex justify-between py-1 text-rose-400">
                    <span>2. Убытки от списания и брака товаров:</span>
                    <span>- {formatDram(pnlReport.writeOffExpenseDram)}</span>
                  </div>
                  <div className="flex justify-between py-1 text-rose-400">
                    <span>3. Операционные расходы (РКО / Аренда / Зарплата):</span>
                    <span>- {formatDram(pnlReport.operatingExpensesDram)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-t border-slate-700 text-sm font-extrabold text-emerald-400">
                    <span>Итого чистый финансовый результат:</span>
                    <span>{formatDram(pnlReport.netProfitDram)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ===================== TAB 6: НОМЕНКЛАТУРА & ЦЕННИКИ ===================== */}
          {activeTab === 'nomenclature' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-300 font-semibold">
                  Справочник номенклатуры (Всего товаров: {products.length})
                </span>
                <button
                  onClick={() => setIsPriceTagsOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow transition-colors cursor-pointer"
                >
                  <Tag className="w-3.5 h-3.5" />
                  <span>Печать полочных ценников 1С</span>
                </button>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
                <table className="w-full text-left text-xs border-collapse font-mono">
                  <thead>
                    <tr className="bg-slate-900 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase">
                      <th className="p-3">Штрих-код EAN-13</th>
                      <th className="p-3 font-sans">Наименование</th>
                      <th className="p-3 font-sans">Категория</th>
                      <th className="p-3 text-center">Ед. изм.</th>
                      <th className="p-3 text-right">Себестоимость</th>
                      <th className="p-3 text-right">Розница (֏)</th>
                      <th className="p-3 text-right">Наценка %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {products.map((p) => {
                      const cost = Math.round(p.priceDram * 0.7);
                      const markup = Math.round(((p.priceDram - cost) / cost) * 100);
                      return (
                        <tr key={p.id} className="hover:bg-slate-900/50">
                          <td className="p-3 font-bold text-amber-300">
                            48500{String(p.id).padStart(7, '0')}7
                          </td>
                          <td className="p-3 font-sans font-bold text-white">
                            {p.nameRu} ({p.nameHy})
                          </td>
                          <td className="p-3 font-sans text-slate-400">{p.categoryRu}</td>
                          <td className="p-3 text-center text-slate-400 font-sans">{p.unitRu}</td>
                          <td className="p-3 text-right text-slate-400">{formatDram(cost)}</td>
                          <td className="p-3 text-right font-extrabold text-emerald-400">
                            {formatDram(p.priceDram)}
                          </td>
                          <td className="p-3 text-right font-bold text-amber-400">+{markup}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* ДИАЛОГ СОЗДАНИЯ НОВОГО ДОКУМЕНТА 1С */}
        {isCreatingDoc && (
          <div className="absolute inset-0 z-30 bg-black/85 flex items-center justify-center p-4">
            <div className="w-full max-w-2xl bg-slate-900 border-2 border-amber-500 rounded-2xl shadow-2xl p-6 flex flex-col max-h-[90vh] overflow-hidden text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                <h4 className="text-base font-extrabold text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-amber-400" />
                  Создание документа 1С: {docTypeToCreate.toUpperCase()}
                </h4>
                <button
                  onClick={() => setIsCreatingDoc(false)}
                  className="p-1 rounded text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="overflow-y-auto space-y-4 flex-1 pr-1">
                {/* Склад и контрагент */}
                {(docTypeToCreate === 'receipt' || docTypeToCreate === 'transfer' || docTypeToCreate === 'write_off' || docTypeToCreate === 'inventory') && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 font-bold mb-1">
                        {docTypeToCreate === 'transfer' ? 'Со склада (отправитель):' : 'Склад:'}
                      </label>
                      <select
                        value={editWhId}
                        onChange={(e) => setEditWhId(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                      >
                        {erpState.warehouses.map((w) => (
                          <option key={w.id} value={w.id}>
                            {w.nameRu}
                          </option>
                        ))}
                      </select>
                    </div>

                    {docTypeToCreate === 'transfer' ? (
                      <div>
                        <label className="block text-slate-400 font-bold mb-1">
                          На склад (получатель):
                        </label>
                        <select
                          value={editTargetWhId}
                          onChange={(e) => setEditTargetWhId(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                        >
                          {erpState.warehouses.map((w) => (
                            <option key={w.id} value={w.id}>
                              {w.nameRu}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : docTypeToCreate === 'receipt' ? (
                      <div>
                        <label className="block text-slate-400 font-bold mb-1">Поставщик:</label>
                        <select
                          value={editCounterpartyId}
                          onChange={(e) => setEditCounterpartyId(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                        >
                          {erpState.counterparties.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : null}
                  </div>
                )}

                {/* Для ПКО и РКО */}
                {(docTypeToCreate === 'pko' || docTypeToCreate === 'rko') && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-400 font-bold mb-1">Касса / Счет:</label>
                        <select
                          value={editCashAccountId}
                          onChange={(e) => setEditCashAccountId(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                        >
                          {erpState.cashAccounts.map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.nameRu}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-slate-400 font-bold mb-1">Контрагент:</label>
                        <select
                          value={editCounterpartyId}
                          onChange={(e) => setEditCounterpartyId(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                        >
                          {erpState.counterparties.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-400 font-bold mb-1">Сумма операции (֏):</label>
                      <input
                        type="number"
                        value={editCashAmount}
                        onChange={(e) => setEditCashAmount(Number(e.target.value) || 0)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono font-bold text-sm"
                      />
                    </div>
                  </div>
                )}

                {/* Табличная часть товаров */}
                {editDocLines.length > 0 && (
                  <div>
                    <label className="block text-slate-400 font-bold mb-2">Табличная часть (Товары):</label>
                    <div className="bg-slate-950 border border-slate-800 rounded-lg overflow-hidden">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-900 border-b border-slate-800 font-bold text-slate-400">
                            <th className="p-2">Товар</th>
                            <th className="p-2 text-center">Кол-во</th>
                            {docTypeToCreate === 'inventory' && (
                              <th className="p-2 text-center text-blue-400">Факт (шт)</th>
                            )}
                            <th className="p-2 text-right">Цена (֏)</th>
                            <th className="p-2 text-right">Сумма</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800 font-mono">
                          {editDocLines.map((line, idx) => (
                            <tr key={idx}>
                              <td className="p-2 font-sans font-medium text-white">{line.productName}</td>
                              <td className="p-2 text-center">
                                <input
                                  type="number"
                                  value={line.quantity}
                                  onChange={(e) => {
                                    const val = Number(e.target.value) || 0;
                                    setEditDocLines((prev) =>
                                      prev.map((l, i) =>
                                        i === idx ? { ...l, quantity: val, totalDram: val * l.priceDram } : l
                                      )
                                    );
                                  }}
                                  className="w-16 bg-slate-900 border border-slate-700 rounded p-1 text-center text-white"
                                />
                              </td>
                              {docTypeToCreate === 'inventory' && (
                                <td className="p-2 text-center">
                                  <input
                                    type="number"
                                    value={line.actualQuantity ?? line.quantity}
                                    onChange={(e) => {
                                      const val = Number(e.target.value) || 0;
                                      setEditDocLines((prev) =>
                                        prev.map((l, i) => (i === idx ? { ...l, actualQuantity: val } : l))
                                      );
                                    }}
                                    className="w-16 bg-blue-950 border border-blue-600 text-blue-200 rounded p-1 text-center font-bold"
                                  />
                                </td>
                              )}
                              <td className="p-2 text-right text-slate-300">
                                {formatDram(line.priceDram)}
                              </td>
                              <td className="p-2 text-right font-bold text-emerald-400">
                                {formatDram(line.totalDram)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Комментарий */}
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Комментарий / Назначение:</label>
                  <input
                    type="text"
                    value={editComment}
                    onChange={(e) => setEditComment(e.target.value)}
                    placeholder="Например: Поступление товара по счету-фактуре №..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>
              </div>

              {/* Кнопки Провести и закрыть / Записать */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-800 mt-4">
                <button
                  onClick={() => setIsCreatingDoc(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold cursor-pointer"
                >
                  Отмена
                </button>
                <button
                  onClick={() => handleSaveAndPostDoc(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-amber-500/40 text-amber-300 font-bold cursor-pointer"
                >
                  Записать (Черновик)
                </button>
                <button
                  onClick={() => handleSaveAndPostDoc(true)}
                  className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black cursor-pointer shadow-lg"
                >
                  Провести и закрыть (1С)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* МОДАЛЬНОЕ ОКНО ПЕЧАТНЫХ ФОРМ (ТОРГ-12 / ПКО / РКО / ИНВ-19) */}
        <PrintFormsModal
          isOpen={!!printDoc}
          onClose={() => setPrintDoc(null)}
          document={printDoc}
          warehouses={erpState.warehouses}
          counterparties={erpState.counterparties}
          lang={lang}
        />

        {/* МОДАЛЬНОЕ ОКНО ПЕЧАТИ ЦЕННИКОВ */}
        <PriceTagsPrintModal
          isOpen={isPriceTagsOpen}
          onClose={() => setIsPriceTagsOpen(false)}
          products={products}
          lang={lang}
        />
      </div>
    </div>
  );
};
