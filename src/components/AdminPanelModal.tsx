import React, { useState, useRef, useMemo } from 'react';
import {
  X,
  Sliders,
  ShoppingBag,
  Percent,
  Plus,
  Trash2,
  Edit2,
  Check,
  ShieldAlert,
  Download,
  DollarSign,
  Coins,
  RefreshCw,
  Power,
  Sparkles,
  LayoutGrid,
  CreditCard,
  Package,
  Users,
  Archive,
  RotateCcw,
  ShieldCheck,
  Search,
  Upload,
  Building2,
  Barcode,
  MapPin,
  UserCheck,
  Truck,
  Mail,
  Send,
  History,
  Palette,
  Layers,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  MessageSquare,
  HelpCircle,
  ClipboardList,
  TrendingUp,
  Globe,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  Box,
  Star,
} from 'lucide-react';
import {
  ProductItem,
  AdminSettings,
  LogItem,
  Language,
  CustomerAccount,
  CustomerPurchase,
  AccountType,
  SystemArchiveItem,
  EmailNotificationLog,
  ProductCategory,
  SiteConfig,
  ThemeId,
  HeroSlide,
  PendingSupplierProduct,
  ReturnDispute,
} from '../types';
import { getStoredEmailLogs, sendOrderNotificationEmail } from '../services/notificationService';
import { Warehouse, ErpState } from '../types/erp';
import { WalletState, formatDram } from '../utils/finance';
import { THEMES, moveSection, toggleSection, DEFAULT_SITE_CONFIG } from '../utils/builder';
import {
  computeAdminEcosystemMetrics,
  applyBulkPriceChange,
  applyBulkStockRefill,
  flattenAndFilterOrders,
} from '../utils/adminCommandCenter';
import { AdminCustomersTab } from './AdminCustomersTab';
import { AdminCategoriesTab } from './AdminCategoriesTab';
import {
  DeliveryOrder,
  DeliveryStage,
  INITIAL_LIVE_DELIVERIES,
  createDeliveryFromPurchase,
  updateDeliveryStage,
  advanceDeliveryTick,
} from '../utils/deliveryTracking';
import { STAGE_LABELS } from './DeliveryTrackingModal';

export type AdminTabId =
  | 'overview'
  | 'orders'
  | 'products'
  | 'categories'
  | 'warehouses'
  | 'customers'
  | 'site_cms'
  | 'finance'
  | 'payment_gateways'
  | 'notifications'
  | 'audit'
  | 'archive';

interface AdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  onToggleLang?: () => void;
  settings: AdminSettings;
  onUpdateSettings: (newSettings: AdminSettings) => void;
  products: ProductItem[];
  onAddProduct: (product: Omit<ProductItem, 'id'>) => void;
  onUpdateProduct: (product: ProductItem) => void;
  onBatchUpdateProducts?: (updatedProducts: ProductItem[], summaryText: string) => void;
  onDeleteProduct: (productId: number) => void;
  wallet: WalletState;
  onAdminAdjustBalance: (type: 'real' | 'deposit' | 'points', amount: number) => void;
  onLoadPreset?: (preset: 'starter' | 'active' | 'whale') => void;
  onResetWallet?: () => void;
  onConfirmHoldingCooldown?: (holdingId: string) => void;
  onProcessReturnRefund?: (holdingId: string) => void;
  logs: LogItem[];
  customers?: CustomerAccount[];
  onAdjustCustomer?: (customerId: string, account: AccountType, delta: number, reason: string) => void;
  onAddCustomerNote?: (customerId: string, note: string) => void;
  onAddCustomer?: (newCustomer: Omit<CustomerAccount, 'id' | 'registeredAt' | 'lastActiveAt' | 'lastAccrualTimestamp' | 'purchases' | 'ledger' | 'totalSpentDram'>) => void;
  onUpdateOrderStatus?: (customerId: string, orderId: string, newStatus: CustomerPurchase['status']) => void;
  siteConfig?: SiteConfig;
  onSaveSiteConfig?: (newConfig: SiteConfig) => void;
  erpState?: ErpState;
  pendingSupplierProducts?: PendingSupplierProduct[];
  onApproveSupplierProduct?: (pendingId: string) => void;
  onRejectSupplierProduct?: (pendingId: string) => void;
  returnDisputes?: ReturnDispute[];
  onResolveDispute?: (disputeId: string, resolution: 'resolved_store' | 'resolved_supplier') => void;
  onOpenBuilder?: () => void;
  onOpenPos?: () => void;
  onOpenErp?: () => void;
  onOpen3dShowcase?: () => void;
  onOpen3DWarehouse?: () => void;
  onOpenPartnerPortal?: () => void;
  onOpenSupplierPortal?: () => void;
  onOpenScanner?: () => void;
  systemArchive?: SystemArchiveItem[];
  onRestoreFromArchive?: (archiveId: string) => void;
  onImportBackup?: (backupData: any) => void;
  warehouses?: Warehouse[];
  onAddWarehouse?: (wh: Omit<Warehouse, 'id'>) => void;
  onUpdateWarehouse?: (wh: Warehouse) => void;
  onDeleteWarehouse?: (whId: string) => void;
  categories?: ProductCategory[];
  onAddCategory?: (category: Omit<ProductCategory, 'id'>) => void;
  onUpdateCategory?: (id: string, updated: Partial<ProductCategory>) => void;
  onDeleteCategory?: (id: string) => void;
  deliveries?: DeliveryOrder[];
  onCreateDelivery?: (params: {
    orderNumber: string;
    customerName: string;
    address: string;
    feeDram?: number;
  }) => void;
  onUpdateDeliveryStage?: (orderId: string, stage: DeliveryStage) => void;
  onAdvanceDeliveryTick?: (orderId: string, stepPercent?: number) => void;
  onOpenDeliveryTracker?: (orderNumber?: string) => void;
}

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({
  isOpen,
  onClose,
  lang,
  onToggleLang,
  settings,
  onUpdateSettings,
  products,
  onAddProduct,
  onUpdateProduct,
  onBatchUpdateProducts,
  onDeleteProduct,
  wallet,
  onAdminAdjustBalance,
  onLoadPreset,
  onResetWallet,
  onConfirmHoldingCooldown,
  onProcessReturnRefund,
  logs,
  customers = [],
  onAdjustCustomer,
  onAddCustomerNote,
  onAddCustomer,
  onUpdateOrderStatus,
  siteConfig = DEFAULT_SITE_CONFIG,
  onSaveSiteConfig,
  erpState,
  pendingSupplierProducts = [],
  onApproveSupplierProduct,
  onRejectSupplierProduct,
  returnDisputes = [],
  onResolveDispute,
  onOpenBuilder,
  onOpenPos,
  onOpenErp,
  onOpen3dShowcase,
  onOpen3DWarehouse,
  onOpenPartnerPortal,
  onOpenSupplierPortal,
  onOpenScanner,
  systemArchive = [],
  onRestoreFromArchive,
  onImportBackup,
  warehouses = [],
  onAddWarehouse,
  onUpdateWarehouse,
  onDeleteWarehouse,
  categories = [],
  onAddCategory = () => {},
  onUpdateCategory = () => {},
  onDeleteCategory = () => {},
  deliveries: propDeliveries,
  onCreateDelivery,
  onUpdateDeliveryStage,
  onAdvanceDeliveryTick,
  onOpenDeliveryTracker,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTabId>('overview');
  const [archiveSearch, setArchiveSearch] = useState('');
  const [archiveFilterType, setArchiveFilterType] = useState<string>('all');
  const [auditSearch, setAuditSearch] = useState('');
  const [auditCategoryFilter, setAuditCategoryFilter] = useState<string>('all');
  const [emailLogs, setEmailLogs] = useState<EmailNotificationLog[]>(() => getStoredEmailLogs());
  const [testEmailAddress, setTestEmailAddress] = useState(settings.adminNotificationEmail || 'araik1415@gmail.com');
  const [isSendingTestEmail, setIsSendingTestEmail] = useState(false);
  const [testSendStatus, setTestSendStatus] = useState<string | null>(null);

  // Заказы и фильтрация
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<'all' | 'processing' | 'completed' | 'delivered'>('all');
  const [orderPaymentFilter, setOrderPaymentFilter] = useState<string>('all');

  // Быстрое создание нового клиента CRM
  const [isAddingCustomer, setIsAddingCustomer] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('+374 ');
  const [newCustEmail, setNewCustEmail] = useState('');
  const [newCustCity, setNewCustCity] = useState('Երևան / Ереван');
  const [newCustStatus, setNewCustStatus] = useState<'vip' | 'regular' | 'new' | 'wholesale'>('regular');

  // Встроенный CMS сайта
  const [cmsSubTab, setCmsSubTab] = useState<'theme_sections' | 'brand_contacts' | 'banners' | 'reviews_faq'>('theme_sections');
  const [newReviewAuthor, setNewReviewAuthor] = useState('');
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewTextHy, setNewReviewTextHy] = useState('');
  const [newReviewTextRu, setNewReviewTextRu] = useState('');
  const [newFaqQHy, setNewFaqQHy] = useState('');
  const [newFaqQRu, setNewFaqQRu] = useState('');
  const [newFaqAHy, setNewFaqAHy] = useState('');
  const [newFaqARu, setNewFaqARu] = useState('');

  // Массовое изменение цен и остатков в каталоге
  const [bulkScope, setBulkScope] = useState<'all' | 'groceries' | 'construction'>('all');
  const [bulkFeedback, setBulkFeedback] = useState<string | null>(null);

  // Настройки эквайринга, карт, API и QR-кодов
  const [cardSettings, setCardSettings] = useState(() => settings.bankCardsConfig || {
    enabled: true,
    merchantId: 'SYS2000_MERCHANT_485',
    apiKey: 'sk_live_sys2000_89324789234',
    apiEndpoint: 'https://api.arca.am/payment/v1',
    cardNumber: '4052 5800 1234 5678',
    cardHolder: 'ARAIK PETROSYAN',
    bankName: 'Ameriabank CJSC / ArCa Gateway',
    iban: 'AM452000123456789012',
    swift: 'AMERAM22',
    testMode: false,
  });

  const [qrSettings, setQrSettings] = useState(() => settings.qrPaymentConfig || {
    telcellEnabled: true,
    telcellNumber: '+374 91 123456',
    telcellQrPayload: 'TELCELL:PAY?wallet=091123456&merchant=Sistema2000',
    idramEnabled: true,
    idramId: '123456789',
    idramQrPayload: 'IDRAM:PAY?id=123456789&merchant=Sistema2000',
    arcaEnabled: true,
    arcaAccount: '220001234567',
    arcaQrPayload: 'ARCA:PAY?account=220001234567&merchant=Sistema2000',
  });

  const [paymentSaveStatus, setPaymentSaveStatus] = useState<string | null>(null);

  const handleSavePaymentSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings({
      ...settings,
      bankCardsConfig: cardSettings,
      qrPaymentConfig: qrSettings,
    });
    setPaymentSaveStatus(isHy ? 'Վճարային համակարգերի և QR կարգավորումները պահպանվել են:' : 'Настройки платежных карт, API и QR-кодов сохранены!');
    setTimeout(() => setPaymentSaveStatus(null), 5000);
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const isHy = lang === 'hy';

  // Состояние для добавления/редактирования/удаления товаров
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [productSectionFilter, setProductSectionFilter] = useState<'all' | 'groceries' | 'construction'>('all');
  const [newNameHy, setNewNameHy] = useState('');
  const [newNameRu, setNewNameRu] = useState('');
  const [newPrice, setNewPrice] = useState(500);
  const [newStoreSection, setNewStoreSection] = useState<'groceries' | 'construction'>('groceries');
  const [newCategoryHy, setNewCategoryHy] = useState('Ձավարեղեն');
  const [newUnitHy, setNewUnitHy] = useState('1 հատ');
  const [newBarcode, setNewBarcode] = useState('');
  const [newManufacturer, setNewManufacturer] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('https://images.unsplash.com/photo-1542838132-92c53300491e?w=450&auto=format&fit=crop&q=80');
  const [newDescriptionHy, setNewDescriptionHy] = useState('');

  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
  const [confirmDeleteProductId, setConfirmDeleteProductId] = useState<number | null>(null);

  // Состояние для добавления/редактирования/удаления складов и онлайн-доставки
  const [isAddingWarehouse, setIsAddingWarehouse] = useState(false);
  const [localDeliveries, setLocalDeliveries] = useState<DeliveryOrder[]>(INITIAL_LIVE_DELIVERIES);
  const deliveries = propDeliveries || localDeliveries;
  const [delOrderNum, setDelOrderNum] = useState('');
  const [delCustomer, setDelCustomer] = useState('');
  const [delAddress, setDelAddress] = useState('');
  const [delCourier, setDelCourier] = useState('');
  const [delFee, setDelFee] = useState('0');
  const [stockAdjustProdId, setStockAdjustProdId] = useState('');
  const [customRatePercent, setCustomRatePercent] = useState<string>(
    ((settings.annualRate || 0.10) * 100).toFixed(0)
  );
  const [rateChangeFeedback, setRateChangeFeedback] = useState<string | null>(null);

  const handleApplyRate = (newRate: number) => {
    const oldRate = settings.annualRate;
    onUpdateSettings({ ...settings, annualRate: newRate });
    setCustomRatePercent((newRate * 100).toFixed(0));
    const msg = isHy
      ? `⚡ Տոկոսադրույքը փոփոխվել է՝ ${(oldRate * 100).toFixed(0)}% ➔ ${(newRate * 100).toFixed(0)}%: Համակարգային ծանուցումը հաջողությամբ ուղարկված է բոլոր մասնակիցներին և ադմինիստրատորի էլ. փոստին (${settings.adminNotificationEmail || 'araik1415@gmail.com'}):`
      : `⚡ Ставка изменена с ${(oldRate * 100).toFixed(0)}% на ${(newRate * 100).toFixed(0)}% годовых! Оповещение отправлено участникам системы и на email администратора (${settings.adminNotificationEmail || 'araik1415@gmail.com'}).`;
    setRateChangeFeedback(msg);
    setTimeout(() => setRateChangeFeedback(null), 8000);
  };

  const [stockAdjustQty, setStockAdjustQty] = useState('10');
  const [stockAdjustMode, setStockAdjustMode] = useState<'in' | 'out'>('in');
  const [whNameHy, setWhNameHy] = useState('');
  const [whNameRu, setWhNameRu] = useState('');
  const [whCode, setWhCode] = useState('');
  const [whType, setWhType] = useState<'warehouse' | 'retail' | 'spoilage'>('warehouse');
  const [whAddress, setWhAddress] = useState('');
  const [whResponsible, setWhResponsible] = useState('');
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);
  const [confirmDeleteWhId, setConfirmDeleteWhId] = useState<string | null>(null);

  // Состояние ручной корректировки баланса
  const [adjustType, setAdjustType] = useState<'real' | 'deposit' | 'points'>('deposit');
  const [adjustAmount, setAdjustAmount] = useState<number>(10000);

  // Вычисляемые сквозные метрики экосистемы
  const metrics = useMemo(
    () =>
      computeAdminEcosystemMetrics({
        products,
        customers,
        wallet,
        erpState,
      }),
    [products, customers, wallet, erpState]
  );

  // Сводный список всех заказов по всем клиентам
  const flattenedOrders = useMemo(
    () => flattenAndFilterOrders(customers, orderSearch, orderStatusFilter, orderPaymentFilter),
    [customers, orderSearch, orderStatusFilter, orderPaymentFilter]
  );

  if (!isOpen) return null;

  const BASE_CATEGORY_MAP: Record<string, { hy: string; ru: string; section: 'groceries' | 'construction' }> = {
    'Հացաբուլկեղեն': { hy: 'Հացաբուլկեղեն', ru: 'Выпечка и хлеб', section: 'groceries' },
    'Կաթնամթերք': { hy: 'Կաթնամթերք', ru: 'Молочные продукты', section: 'groceries' },
    'Ձավարեղեն': { hy: 'Ձավարեղեն', ru: 'Крупы и бакалея', section: 'groceries' },
    'Բանջարեղեն': { hy: 'Բանջարեղեն', ru: 'Овощи и фрукты', section: 'groceries' },
    'Ըմպելիքներ': { hy: 'Ըմպելիքներ', ru: 'Напитки', section: 'groceries' },
    'Քաղցրավենիք': { hy: 'Քաղցրավենիք', ru: 'Сладости', section: 'groceries' },
    'Շինանյութեր': { hy: 'Շինանյութեր', ru: 'Строительные материалы', section: 'construction' },
    'Գործիքներ': { hy: 'Գործիքներ', ru: 'Инструменты', section: 'construction' },
    'Սոսինձներ': { hy: 'Սոսինձներ', ru: 'Клеи и герметики', section: 'construction' },
    'Մածիկներ': { hy: 'Մածիկներ', ru: 'Шпаклёвки и смеси', section: 'construction' },
    'Ամրակներ': { hy: 'Ամրակներ', ru: 'Крепёж и метизы', section: 'construction' },
  };

  const CATEGORY_MAP = { ...BASE_CATEGORY_MAP };
  categories.forEach((cat) => {
    CATEGORY_MAP[cat.nameHy] = { hy: cat.nameHy, ru: cat.nameRu, section: cat.department };
    if (cat.nameRu) {
      CATEGORY_MAP[cat.nameRu] = { hy: cat.nameHy, ru: cat.nameRu, section: cat.department };
    }
  });

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNameHy.trim()) return;
    const catInfo = CATEGORY_MAP[newCategoryHy] || { hy: newCategoryHy, ru: newCategoryHy, section: newStoreSection };
    const generatedBarcode = newBarcode.trim() || `485000${Math.floor(100000 + Math.random() * 900000)}`;

    onAddProduct({
      nameHy: newNameHy.trim(),
      nameRu: newNameRu.trim() || newNameHy.trim(),
      department: newStoreSection,
      category: catInfo.ru,
      categoryHy: catInfo.hy,
      categoryRu: catInfo.ru,
      priceDram: newPrice,
      pointsCost: newPrice,
      descriptionHy: newDescriptionHy.trim() || (newStoreSection === 'construction' ? 'Բարձրորակ շինանյութ' : 'Թարմ բարձրորակ մթերք'),
      descriptionRu: newDescriptionHy.trim() || (newStoreSection === 'construction' ? 'Качественный строительный материал' : 'Свежий качественный продукт'),
      unitHy: newUnitHy.trim() || '1 հատ',
      unitRu: newUnitHy.trim() || '1 шт',
      barcode: generatedBarcode,
      sku: `SKU-${generatedBarcode.slice(-6)}`,
      manufacturerHy: newManufacturer.trim() || 'Համակարգ 2000',
      manufacturerRu: newManufacturer.trim() || 'Система 2000',
      imageUrl: newImageUrl.trim() || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=450&auto=format&fit=crop&q=80',
      iconName: 'Package',
      isAvailable: true,
      stockCount: 30,
    });

    setNewNameHy('');
    setNewNameRu('');
    setNewBarcode('');
    setNewManufacturer('');
    setNewDescriptionHy('');
    setIsAddingProduct(false);
  };

  const handleCreateWarehouse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!whNameHy.trim() || !onAddWarehouse) return;
    const autoCode = whCode.trim() || `WH-00${warehouses.length + 1}`;
    onAddWarehouse({
      nameHy: whNameHy.trim(),
      nameRu: whNameRu.trim() || whNameHy.trim(),
      code: autoCode.toUpperCase(),
      type: whType,
      address: whAddress.trim() || 'Երևան, Կենտրոնական պահեստային գոտի',
      responsiblePerson: whResponsible.trim() || 'Ադմինիստրատոր',
    });
    setWhNameHy('');
    setWhNameRu('');
    setWhCode('');
    setWhAddress('');
    setWhResponsible('');
    setIsAddingWarehouse(false);
  };

  const handleExportAudit = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `system2000_audit_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleBulkPriceAction = (percentDelta: number) => {
    const nextProducts = applyBulkPriceChange(products, percentDelta, bulkScope);
    const scopeLabel =
      bulkScope === 'all'
        ? isHy
          ? 'ամբողջ կատալոգի'
          : 'всего каталога'
        : bulkScope === 'groceries'
        ? isHy
          ? 'Սուպերմարկետի'
          : 'отдела Супермаркет'
        : isHy
        ? 'Շինանյութի'
        : 'отдела Стройматериалы';
    const summary = isHy
      ? `Գների զանգվածային փոփոխություն (${percentDelta > 0 ? '+' : ''}${percentDelta}%) ${scopeLabel} համար`
      : `Массовое изменение цен (${percentDelta > 0 ? '+' : ''}${percentDelta}%) для ${scopeLabel}`;

    if (onBatchUpdateProducts) {
      onBatchUpdateProducts(nextProducts, summary);
    } else {
      nextProducts.forEach((p) => onUpdateProduct(p));
    }
    setBulkFeedback(summary);
    setTimeout(() => setBulkFeedback(null), 4000);
  };

  const handleBulkStockAction = (addQty: number) => {
    const nextProducts = applyBulkStockRefill(products, addQty, bulkScope);
    const scopeLabel =
      bulkScope === 'all'
        ? isHy
          ? 'բոլոր ապրանքների'
          : 'всех товаров'
        : bulkScope === 'groceries'
        ? isHy
          ? 'Սուպերմարկետի'
          : 'товаров Супермаркета'
        : isHy
        ? 'Շինանյութի'
        : 'товаров Стройматериалов';
    const summary = isHy
      ? `Պահեստի համալրում (+${addQty} միավ.) ${scopeLabel} համար`
      : `Массовое пополнение склада (+${addQty} ед.) для ${scopeLabel}`;

    if (onBatchUpdateProducts) {
      onBatchUpdateProducts(nextProducts, summary);
    } else {
      nextProducts.forEach((p) => onUpdateProduct(p));
    }
    setBulkFeedback(summary);
    setTimeout(() => setBulkFeedback(null), 4000);
  };

  const pendingB2BCount =
    pendingSupplierProducts.filter((s) => s.status === 'pending').length +
    returnDisputes.filter((d) => d.status === 'open').length;

  const navItems: Array<{
    id: AdminTabId;
    labelHy: string;
    labelRu: string;
    groupHy: string;
    groupRu: string;
    icon: React.ReactNode;
    badge?: string | number;
    badgeColor?: string;
  }> = [
    {
      id: 'overview',
      labelHy: 'Կենտրոն 360° (Բոլորը)',
      labelRu: 'Центр 360° (Обзор)',
      groupHy: 'ԿԱՌԱՎԱՐՈՒՄ',
      groupRu: 'КОМАНДНЫЙ ЦЕНТР',
      icon: <Sliders className="w-4 h-4 text-emerald-400" />,
      badge: 'LIVE',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    },
    {
      id: 'orders',
      labelHy: 'Պատվերներ և 15օր Ավանդ',
      labelRu: 'Заказы, 15д и B2B',
      groupHy: 'ԿԱՌԱՎԱՐՈՒՄ',
      groupRu: 'КОМАНДНЫЙ ЦЕНТР',
      icon: <ClipboardList className="w-4 h-4 text-amber-400" />,
      badge: metrics.totalOrdersCount + pendingB2BCount,
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    },
    {
      id: 'products',
      labelHy: 'Ապրանքներ և Գներ',
      labelRu: 'Каталог и Цены',
      groupHy: 'ԽԱՆՈՒԹ ԵՎ ՊԱՀԵՍՏ',
      groupRu: 'ТОРГОВЛЯ И СКЛАД',
      icon: <ShoppingBag className="w-4 h-4 text-emerald-400" />,
      badge: products.length,
    },
    {
      id: 'categories',
      labelHy: 'Կատեգորիաներ',
      labelRu: 'Категории и Отделы',
      groupHy: 'ԽԱՆՈՒԹ ԵՎ ՊԱՀԵՍՏ',
      groupRu: 'ТОРГОВЛЯ И СКЛАД',
      icon: <LayoutGrid className="w-4 h-4 text-amber-400" />,
      badge: categories.length,
    },
    {
      id: 'warehouses',
      labelHy: '1C Պահեստ և Առաքում',
      labelRu: '1С:Склады и Доставка',
      groupHy: 'ԽԱՆՈՒԹ ԵՎ ՊԱՀԵՍՏ',
      groupRu: 'ТОРГОВЛЯ И СКЛАД',
      icon: <Building2 className="w-4 h-4 text-teal-400" />,
      badge: warehouses.length,
    },
    {
      id: 'customers',
      labelHy: 'Մասնակիցներ (CRM)',
      labelRu: 'Клиенты и Баллы (CRM)',
      groupHy: 'ՀԱՃԱԽՈՐԴՆԵՐ ԵՎ ԿԱՅՔ',
      groupRu: 'КЛИЕНТЫ И САЙТ',
      icon: <Users className="w-4 h-4 text-sky-400" />,
      badge: customers.length,
    },
    {
      id: 'site_cms',
      labelHy: 'Կայք, Բաններ և Կոնտենտ',
      labelRu: 'Сайт, Дизайн и Контент',
      groupHy: 'ՀԱՃԱԽՈՐԴՆԵՐ ԵՎ ԿԱՅՔ',
      groupRu: 'КЛИЕНТЫ И САЙТ',
      icon: <Palette className="w-4 h-4 text-cyan-400" />,
      badge: siteConfig.sections.filter((s) => s.enabled).length,
    },
    {
      id: 'finance',
      labelHy: '10% APY և Ֆինանսներ',
      labelRu: 'Ставка 10% и Финансы',
      groupHy: 'ՖԻՆԱՆՍՆԵՐ ԵՎ ԱՆՎՏԱՆԳՈՒԹՅՈՒՆ',
      groupRu: 'ФИНАНСЫ И ЗАЩИТА',
      icon: <Percent className="w-4 h-4 text-emerald-400" />,
      badge: `${(settings.annualRate * 100).toFixed(0)}%`,
    },
    {
      id: 'payment_gateways',
      labelHy: 'Էկվայրինգ, Քարտ և QR',
      labelRu: 'Карты, API и QR-коды',
      groupHy: 'ՖԻՆԱՆՍՆԵՐ ԵՎ ԱՆՎՏԱՆԳՈՒԹՅՈՒՆ',
      groupRu: 'ФИНАНСЫ И ЗАЩИТА',
      icon: <CreditCard className="w-4 h-4 text-emerald-400" />,
    },
    {
      id: 'notifications',
      labelHy: 'Email Ծանուցումներ',
      labelRu: 'Email-уведомления',
      groupHy: 'ՖԻՆԱՆՍՆԵՐ ԵՎ ԱՆՎՏԱՆԳՈՒԹՅՈՒՆ',
      groupRu: 'ФИНАНСЫ И ЗАЩИТА',
      icon: <Mail className="w-4 h-4 text-sky-400" />,
      badge: emailLogs.length,
    },
    {
      id: 'audit',
      labelHy: 'Աուդիտի Մատյան',
      labelRu: 'Журнал Аудита',
      groupHy: 'ՖԻՆԱՆՍՆԵՐ ԵՎ ԱՆՎՏԱՆԳՈՒԹՅՈՒՆ',
      groupRu: 'ФИНАНСЫ И ЗАЩИТА',
      icon: <ShieldAlert className="w-4 h-4 text-amber-400" />,
      badge: logs.length,
    },
    {
      id: 'archive',
      labelHy: 'Արխիվ և JSON Бэкап',
      labelRu: 'Архив и Бэкап (JSON)',
      groupHy: 'ՖԻՆԱՆՍՆԵՐ ԵՎ ԱՆՎՏԱՆԳՈՒԹՅՈՒՆ',
      groupRu: 'ФИНАНСЫ И ЗАЩИТА',
      icon: <Archive className="w-4 h-4 text-purple-400" />,
      badge: systemArchive.length,
    },
  ];

  const activeNavObj = navItems.find((n) => n.id === activeTab) || navItems[0];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={isHy ? 'Ադմինիստրատորի միասնական կառավարման կենտրոն' : 'Единый центр управления приложением'}
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-none"
    >
      <div className="relative w-full max-w-7xl h-[94vh] overflow-hidden flex flex-col bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl text-slate-100">
        {/* ВЕРХНЯЯ ПАНЕЛЬ (TOP BAR CONTRACT: Breadcrumb / Title Left — Global Status & Primary Actions Right) */}
        <div className="flex items-center justify-between gap-4 px-4 sm:px-6 py-3.5 border-b border-slate-800 bg-slate-950 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 shrink-0">
              <Sliders className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="font-semibold text-emerald-400">Система 2000 • ROOT ADMIN</span>
                <span aria-hidden="true">/</span>
                <span className="text-slate-200 font-medium truncate">
                  {isHy ? activeNavObj.labelHy : activeNavObj.labelRu}
                </span>
              </div>
              <h2 className="text-sm sm:text-base font-bold text-white truncate">
                {isHy
                  ? 'Հավելվածի Միասնական Կառավարման Կենտրոն (Բոլորը մեկ տեղում)'
                  : 'Единый Командный Центр Управления Приложением (Всё в одном месте)'}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onToggleLang && (
              <button
                type="button"
                onClick={onToggleLang}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <Globe className="w-3.5 h-3.5 text-emerald-400" />
                <span>{isHy ? 'Հայերեն ➔ Русский' : 'Русский ➔ Հայերեն'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => onUpdateSettings({ ...settings, systemFrozen: !settings.systemFrozen })}
              className={`hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0 border ${
                settings.systemFrozen
                  ? 'bg-rose-950/90 text-rose-200 border-rose-500/60'
                  : 'bg-emerald-950/70 text-emerald-300 border-emerald-500/40 hover:bg-emerald-900/60'
              }`}
            >
              <Power className="w-3.5 h-3.5" />
              <span>
                {settings.systemFrozen
                  ? isHy
                    ? 'Համակարգը՝ ՍԱՌԵՑՎԱԾ'
                    : 'Система: ЗАМОРОЖЕНА'
                  : isHy
                  ? `Ակտիվ • ${(settings.annualRate * 100).toFixed(0)}% APY`
                  : `Активна • ${(settings.annualRate * 100).toFixed(0)}% APY`}
              </span>
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label={isHy ? 'Փակել ադմին վահանակը' : 'Закрыть панель администратора'}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <X className="w-4 h-4" />
              <span className="hidden sm:inline">{isHy ? 'Փակել' : 'Закрыть'}</span>
            </button>
          </div>
        </div>

        {/* МОБИЛЬНАЯ ГОРИЗОНТАЛЬНАЯ НАВИГАЦИЯ (только на узких экранах) */}
        <div className="flex lg:hidden items-center gap-1.5 px-3 py-2 bg-slate-950 border-b border-slate-800 overflow-x-auto shrink-0">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setActiveTab(item.id);
                  if (item.id === 'notifications') setEmailLogs(getStoredEmailLogs());
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {item.icon}
                <span>{isHy ? item.labelHy : item.labelRu}</span>
              </button>
            );
          })}
        </div>

        {/* ОСНОВНОЙ WORKSPACE: ЛЕВЫЙ САЙДБАР + ПРАВЫЙ VIEWPORT */}
        <div className="flex-1 flex min-h-0 overflow-hidden">
          {/* ЛЕВАЯ БОКОВАЯ ПАНЕЛЬ (260px) */}
          <aside className="hidden lg:flex w-64 flex-col justify-between bg-slate-950 border-r border-slate-800 p-3 overflow-y-auto shrink-0">
            <div className="space-y-4">
              {(['КОМАНДНЫЙ ЦЕНТР', 'ТОРГОВЛЯ И СКЛАД', 'КЛИЕНТЫ И САЙТ', 'ФИНАНСЫ И ЗАЩИТА'] as const).map(
                (groupRu) => {
                  const groupItems = navItems.filter((n) => n.groupRu === groupRu);
                  if (groupItems.length === 0) return null;
                  const groupTitle = isHy ? groupItems[0].groupHy : groupRu;
                  return (
                    <div key={groupRu} className="space-y-1">
                      <div className="px-2.5 text-[10px] font-bold tracking-wider text-slate-500">
                        {groupTitle}
                      </div>
                      {groupItems.map((item) => {
                        const isActive = activeTab === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => {
                              setActiveTab(item.id);
                              if (item.id === 'notifications') setEmailLogs(getStoredEmailLogs());
                            }}
                            className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                              isActive
                                ? 'bg-slate-800 text-white border border-emerald-500/50 shadow-sm'
                                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/80 border border-transparent'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              {item.icon}
                              <span className="truncate">{isHy ? item.labelHy : item.labelRu}</span>
                            </div>
                            {item.badge !== undefined && (
                              <span
                                className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border ${
                                  item.badgeColor || 'bg-slate-900 text-slate-300 border-slate-700'
                                }`}
                              >
                                {item.badge}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  );
                }
              )}
            </div>

            {/* Нижний блок быстрого запуска специализированных терминалов */}
            <div className="pt-3 mt-4 border-t border-slate-800/90 space-y-1.5">
              <div className="px-2 text-[10px] font-bold tracking-wider text-slate-500">
                {isHy ? 'ԱՐՏԱՔԻՆ ՄՈԴՈՒԼՆԵՐ' : 'ТЕРМИНАЛЫ И 3D МОДУЛИ'}
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {onOpenPos && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenPos();
                    }}
                    className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg bg-emerald-950/70 hover:bg-emerald-900/70 border border-emerald-500/40 text-emerald-300 text-[11px] font-bold transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <CreditCard className="w-3.5 h-3.5 shrink-0" />
                    <span>POS Касса</span>
                  </button>
                )}
                {onOpenErp && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenErp();
                    }}
                    className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg bg-amber-950/70 hover:bg-amber-900/70 border border-amber-500/40 text-amber-300 text-[11px] font-bold transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <Package className="w-3.5 h-3.5 shrink-0" />
                    <span>1С:Склад</span>
                  </button>
                )}
                {onOpen3dShowcase && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpen3dShowcase();
                    }}
                    className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg bg-sky-950/70 hover:bg-sky-900/70 border border-sky-500/40 text-sky-300 text-[11px] font-bold transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <Box className="w-3.5 h-3.5 shrink-0" />
                    <span>3D Витрина</span>
                  </button>
                )}
                {onOpenPartnerPortal && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenPartnerPortal();
                    }}
                    className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg bg-purple-950/70 hover:bg-purple-900/70 border border-purple-500/40 text-purple-300 text-[11px] font-bold transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <Building2 className="w-3.5 h-3.5 shrink-0" />
                    <span>B2B Портал</span>
                  </button>
                )}
              </div>
            </div>
          </aside>

          {/* ПРАВАЯ ОСНОВНАЯ РАБОЧАЯ ОБЛАСТЬ */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-slate-900">
            {/* =====================================================================
                ВКЛАДКА 0: ЕДИНЫЙ ЦЕНТР УПРАВЛЕНИЯ 360° (OVERVIEW)
               ===================================================================== */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* 1. Главные KPI карточки всей системы */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>{isHy ? 'Ընդհանուր Շրջանառություն' : 'Оборот и Касса 1С'}</span>
                      <TrendingUp className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="text-xl font-extrabold text-white font-mono tabular-nums">
                      {formatDram(metrics.totalErpCashDram || metrics.totalOrdersRevenueDram)}
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-1.5 font-mono tabular-nums">
                      <span>{metrics.totalOrdersCount} {isHy ? 'պատվեր' : 'заказов'}</span>
                      <span aria-hidden="true">·</span>
                      <span className="text-emerald-400">{formatDram(metrics.totalOrdersRevenueDram)}</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>{isHy ? '10% Ցմահ Դեպոզիտների Ֆոնդ' : 'Фонд 10% Депозитов'}</span>
                      <Percent className="w-4 h-4 text-teal-400" />
                    </div>
                    <div className="text-xl font-extrabold text-teal-300 font-mono tabular-nums">
                      {formatDram(metrics.totalCustomerDepositsDram + wallet.deposit)}
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-1.5 font-mono tabular-nums">
                      <span>APY {(settings.annualRate * 100).toFixed(0)}%</span>
                      <span aria-hidden="true">·</span>
                      <span>15д резерв: {metrics.activeHoldingsCount}</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>{isHy ? 'Ապրանքներ և 1C Պահեստ' : 'Каталог и Склад 1С'}</span>
                      <ShoppingBag className="w-4 h-4 text-amber-400" />
                    </div>
                    <div className="text-xl font-extrabold text-white font-mono tabular-nums">
                      {metrics.totalProducts} <span className="text-xs font-normal text-slate-400">SKU</span>
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-1.5 font-mono tabular-nums">
                      <span>{metrics.totalCatalogStockUnits} {isHy ? 'միավ.' : 'ед.'}</span>
                      <span aria-hidden="true">·</span>
                      <span className="text-amber-300">{formatDram(metrics.totalCatalogStockValueDram)}</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>{isHy ? 'Մասնակիցներ և Բոնուսներ' : 'Клиенты CRM и Бонусы'}</span>
                      <Users className="w-4 h-4 text-sky-400" />
                    </div>
                    <div className="text-xl font-extrabold text-sky-300 font-mono tabular-nums">
                      {metrics.totalCustomers} <span className="text-xs font-normal text-slate-400">VIP: {metrics.vipCustomers}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-1.5 font-mono tabular-nums">
                      <span>Баллы: {(metrics.totalCustomerBonusPoints + wallet.bonusPoints).toFixed(0)}</span>
                      <span aria-hidden="true">·</span>
                      <span>Счета: {formatDram(metrics.totalCustomerRealBalanceDram)}</span>
                    </div>
                  </div>
                </div>

                {/* 2. Пульт быстрого управления всеми подсистемами (Все разделы в 1 клик) */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-white">
                        {isHy
                          ? 'Արագ Կառավարման Վահանակ (Բոլոր բաժինները և մոդուլները մեկ տեղում)'
                          : 'Быстрое управление всеми модулями экосистемы из одного окна'}
                      </h3>
                      <p className="text-xs text-slate-400">
                        {isHy
                          ? 'Ընտրեք ցանկացած ենթահամակարգ՝ անմիջապես կարգավորելու կամ բացելու համար'
                          : 'Переходите к управлению любым узлом приложения без поиска по разным меню'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setActiveTab('orders')}
                      className="p-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/40 text-left transition-all cursor-pointer space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <ClipboardList className="w-4 h-4 text-amber-400" />
                        <span className="text-[11px] font-mono text-amber-300">{metrics.totalOrdersCount}</span>
                      </div>
                      <div className="text-xs font-bold text-white">
                        {isHy ? 'Պատվերներ և 15օր' : 'Заказы, Возвраты и B2B'}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {isHy ? 'Կարգավիճակներ, 15օր երաշխիք' : 'Статусы заказов, 15д холдинги'}
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab('products')}
                      className="p-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/40 text-left transition-all cursor-pointer space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <ShoppingBag className="w-4 h-4 text-emerald-400" />
                        <span className="text-[11px] font-mono text-emerald-300">{products.length} SKU</span>
                      </div>
                      <div className="text-xs font-bold text-white">
                        {isHy ? 'Ապրանքներ և Գներ' : 'Товары и Массовые Цены'}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {isHy ? 'Ավելացում, զեղչեր, մնացորդ' : 'Создание, акции ±%, наличие'}
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab('site_cms')}
                      className="p-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/40 text-left transition-all cursor-pointer space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <Palette className="w-4 h-4 text-cyan-400" />
                        <span className="text-[11px] font-mono text-cyan-300">{siteConfig.themeId}</span>
                      </div>
                      <div className="text-xs font-bold text-white">
                        {isHy ? 'Կայք, Բաններ և FAQ' : 'Сайт, Баннеры, Отзывы, FAQ'}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {isHy ? 'Դիզայն, բլոկներ, կոնտակտներ' : 'Темы, блоки, контакты, отзывы'}
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab('payment_gateways')}
                      className="p-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/40 text-left transition-all cursor-pointer space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <QrCode className="w-4 h-4 text-emerald-400" />
                        <span className="text-[11px] font-mono text-emerald-300">ArCa · Idram</span>
                      </div>
                      <div className="text-xs font-bold text-white">
                        {isHy ? 'Առցանց Վճարումներ' : 'Эквайринг, Карты и QR'}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {isHy ? 'Idram, Telcell, ArCa, IBAN' : 'API шлюзов, QR-коды, реквизиты'}
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab('customers')}
                      className="p-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-sky-500/40 text-left transition-all cursor-pointer space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <Users className="w-4 h-4 text-sky-400" />
                        <span className="text-[11px] font-mono text-sky-300">{customers.length} CRM</span>
                      </div>
                      <div className="text-xs font-bold text-white">
                        {isHy ? 'Հաճախորդների Բազա' : 'Участники и Счета CRM'}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {isHy ? 'Բալերի և դեպոզիտի կառավարում' : 'Начисление баллов, история'}
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab('warehouses')}
                      className="p-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-teal-500/40 text-left transition-all cursor-pointer space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <Building2 className="w-4 h-4 text-teal-400" />
                        <span className="text-[11px] font-mono text-teal-300">{warehouses.length} скл.</span>
                      </div>
                      <div className="text-xs font-bold text-white">
                        {isHy ? '1C Պահեստ և Առաքիչներ' : '1С:Склады, Касса и Курьеры'}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {isHy ? 'Մուտք/ելք, առաքման կարգավիճակ' : 'Приход/списание и доставка'}
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab('finance')}
                      className="p-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/40 text-left transition-all cursor-pointer space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <Percent className="w-4 h-4 text-amber-400" />
                        <span className="text-[11px] font-mono text-amber-300">{(settings.annualRate * 100).toFixed(0)}% APY</span>
                      </div>
                      <div className="text-xs font-bold text-white">
                        {isHy ? 'Ֆինանսական Քաղաքականություն' : 'Ставка APY и Счета'}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {isHy ? 'Տոկոսադրույք, համալրում, պրեսետ' : 'Управление доходностью и счетом'}
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab('archive')}
                      className="p-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-purple-500/40 text-left transition-all cursor-pointer space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <Archive className="w-4 h-4 text-purple-400" />
                        <span className="text-[11px] font-mono text-purple-300">{systemArchive.length} арх.</span>
                      </div>
                      <div className="text-xs font-bold text-white">
                        {isHy ? 'Արխիվ և JSON Бэкап' : 'Архив и Полный Бэкап'}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {isHy ? '1 կտոցով վերականգնում' : 'Восстановление удаленных данных'}
                      </div>
                    </button>
                  </div>
                </div>

                {/* 3. Два столбца: (А) Счета и Кассы 1С + Смена POS и (Б) Мгновенное управление секциями главной страницы */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Счета и Кассы 1С + Активный кошелек */}
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-white flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-emerald-400" />
                        <span>{isHy ? '1C Դրամարկղեր, Բանկային Հաշիվներ և Դրամապանակ' : 'Финансовые счета 1С и Текущий Кошелёк'}</span>
                      </h3>
                      {onOpenErp && (
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onOpenErp();
                          }}
                          className="text-[11px] text-amber-300 hover:text-amber-200 flex items-center gap-1 cursor-pointer font-semibold"
                        >
                          <span>{isHy ? 'Բացել 1C:ERP' : 'Открыть 1С:ERP'}</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    <div className="space-y-2">
                      {(erpState?.cashAccounts || []).map((acc) => (
                        <div
                          key={acc.id}
                          className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900 border border-slate-800/80 text-xs"
                        >
                          <div>
                            <div className="font-semibold text-slate-200">
                              {isHy ? acc.nameHy : acc.nameRu}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {acc.type === 'cash_register' ? 'CASH DESK' : 'BANK / ACQUIRING'}
                            </div>
                          </div>
                          <div className="font-mono font-bold text-emerald-400 tabular-nums">
                            {formatDram(acc.balanceDram)}
                          </div>
                        </div>
                      ))}

                      <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div>
                          <div className="font-semibold text-white">
                            {isHy ? 'Ակտիվ դեմո-դրամապանակի պրեսետներ' : 'Быстрые пресеты текущего кошелька'}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono tabular-nums">
                            Баланс: {formatDram(wallet.realBalance)} · Депозит: {formatDram(wallet.deposit)}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {onLoadPreset && (
                            <>
                              <button
                                type="button"
                                onClick={() => onLoadPreset('starter')}
                                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold cursor-pointer"
                              >
                                {isHy ? 'Սկսնակ' : 'Стартовый'}
                              </button>
                              <button
                                type="button"
                                onClick={() => onLoadPreset('active')}
                                className="px-2 py-1 rounded bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/30 text-[11px] font-semibold cursor-pointer"
                              >
                                50 000 ֏
                              </button>
                              <button
                                type="button"
                                onClick={() => onLoadPreset('whale')}
                                className="px-2 py-1 rounded bg-amber-950 hover:bg-amber-900 text-amber-300 border border-amber-500/30 text-[11px] font-semibold cursor-pointer"
                              >
                                250 000 ֏
                              </button>
                            </>
                          )}
                          {onResetWallet && (
                            <button
                              type="button"
                              onClick={onResetWallet}
                              className="px-2 py-1 rounded bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 border border-rose-500/30 text-[11px] font-semibold cursor-pointer"
                            >
                              0 ֏
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Быстрый переключатель видимости секций витрины */}
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-white flex items-center gap-2">
                        <Layers className="w-4 h-4 text-cyan-400" />
                        <span>{isHy ? 'Գլխավոր Էջի Բլոկների Միացում / Անջատում' : 'Мгновенное управление блоками витрины'}</span>
                      </h3>
                      <button
                        type="button"
                        onClick={() => setActiveTab('site_cms')}
                        className="text-[11px] text-cyan-400 hover:text-cyan-300 cursor-pointer font-semibold"
                      >
                        {isHy ? 'Բոլոր կարգավորումները ➔' : 'Все настройки сайта ➔'}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {siteConfig.sections.map((sec) => (
                        <button
                          key={sec.id}
                          type="button"
                          onClick={() => {
                            if (!onSaveSiteConfig) return;
                            const updated = toggleSection(siteConfig.sections, sec.id);
                            onSaveSiteConfig({ ...siteConfig, sections: updated });
                          }}
                          className={`flex items-center justify-between px-3 py-2 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                            sec.enabled
                              ? 'bg-slate-900 border-slate-700 text-white hover:border-emerald-500/50'
                              : 'bg-slate-950 border-slate-800/70 text-slate-500 hover:text-slate-300'
                          }`}
                        >
                          <span className="truncate">{isHy ? sec.nameHy : sec.nameRu}</span>
                          {sec.enabled ? (
                            <Eye className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          ) : (
                            <EyeOff className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 4. Панель запуска всех специализированных модулей */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <h3 className="text-xs font-bold text-white">
                    {isHy ? 'Մասնագիտացված Տերմինալների և 3D Մոդուլների Գործարկում' : 'Запуск специализированных терминалов и 3D-витрин'}
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                    {onOpenPos && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenPos();
                        }}
                        className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-emerald-300 flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <CreditCard className="w-4 h-4" />
                        <span>POS Терминал</span>
                      </button>
                    )}
                    {onOpenErp && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenErp();
                        }}
                        className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-amber-300 flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Package className="w-4 h-4" />
                        <span>1С:Предприятие</span>
                      </button>
                    )}
                    {onOpen3dShowcase && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpen3dShowcase();
                        }}
                        className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-sky-300 flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Box className="w-4 h-4" />
                        <span>3D Витрина</span>
                      </button>
                    )}
                    {onOpen3DWarehouse && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpen3DWarehouse();
                        }}
                        className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-teal-300 flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Building2 className="w-4 h-4" />
                        <span>3D Склад</span>
                      </button>
                    )}
                    {onOpenSupplierPortal && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenSupplierPortal();
                        }}
                        className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-purple-300 flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Truck className="w-4 h-4" />
                        <span>Кабинет B2B</span>
                      </button>
                    )}
                    {onOpenScanner && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenScanner();
                        }}
                        className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-slate-200 flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Barcode className="w-4 h-4" />
                        <span>Сканер ШК</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* =====================================================================
                ВКЛАДКА 1: ЗАКАЗЫ, 15-ДНЕВНЫЕ ХОЛДИНГИ И МОДЕРАЦИЯ ПОСТАВЩИКОВ B2B
               ===================================================================== */}
            {activeTab === 'orders' && (
              <div className="space-y-6">
                {/* СЕКЦИЯ A: 15-ДНЕВНЫЙ ГАРАНТИЙНЫЙ РЕЗЕРВ И ПОЖИЗНЕННЫЕ 10% ДЕПОЗИТЫ */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        <span>
                          {isHy
                            ? '15-օրյա Երաշխիքային Հոլդինգներ և 10% Ցմահ Դեպոզիտների Ակտիվացում'
                            : 'Управление 15-дневным резервом покупок и 10% Пожизненными Депозитами'}
                        </span>
                      </h3>
                      <p className="text-xs text-slate-400">
                        {isHy
                          ? 'Ադմինիստրատորը կարող է վաղաժամ հաստատել 15 օրվա ժամկետը կամ ձևակերպել ապրանքի վերադարձ'
                          : 'Администратор может досрочно подтвердить 15-дневный срок без возврата или оформить возврат денег покупателю'}
                      </p>
                    </div>
                  </div>

                  {!wallet.holdings || wallet.holdings.length === 0 ? (
                    <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-400 text-center">
                      {isHy
                        ? 'Այս պահին 15-օրյա սպասման մեջ գտնվող գնումներ չկան (կատարեք գնում ≥ 10 000 ֏):'
                        : 'Сейчас нет покупок в 15-дневном резерве (совершите покупку от 10 000 ֏ для создания холдинга).'}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {wallet.holdings.map((h) => (
                        <div
                          key={h.id}
                          className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-emerald-400">{h.orderNumber}</span>
                              <span className="font-mono font-extrabold text-white tabular-nums">
                                {formatDram(h.amount)}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  h.status === 'active_lifelong'
                                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                                    : h.status === 'refunded'
                                    ? 'bg-rose-950 text-rose-300 border border-rose-500/40'
                                    : 'bg-amber-950 text-amber-300 border border-amber-500/40'
                                }`}
                              >
                                {h.status === 'active_lifelong'
                                  ? isHy
                                    ? 'ԱԿՏԻՎ ՑՄԱՀ 10%'
                                    : 'АКТИВЕН ПОЖИЗНЕННО (10%)'
                                  : h.status === 'refunded'
                                  ? isHy
                                    ? 'ՎԵՐԱԴԱՐՁՎԱԾ Է'
                                    : 'ВОЗВРАЩЁН'
                                  : isHy
                                  ? '15 ՕՐ ԵՐԱՇԽԻՔ'
                                  : '15 ДНЕЙ РЕЗЕРВ'}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-400">
                              {h.productNames.join(', ')} · {h.beneficiaryName}
                            </div>
                          </div>

                          {h.status === 'cooldown_15d' && (
                            <div className="flex items-center gap-2">
                              {onConfirmHoldingCooldown && (
                                <button
                                  type="button"
                                  onClick={() => onConfirmHoldingCooldown(h.id)}
                                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer"
                                >
                                  {isHy ? 'Ակտիվացնել 10% ավանդը' : 'Подтвердить 15д (Активировать 10%)'}
                                </button>
                              )}
                              {onProcessReturnRefund && (
                                <button
                                  type="button"
                                  onClick={() => onProcessReturnRefund(h.id)}
                                  className="px-3 py-1.5 rounded-lg bg-rose-950 hover:bg-rose-900 text-rose-200 border border-rose-700 font-bold text-xs cursor-pointer"
                                >
                                  {isHy ? 'Ձևակերպել վերադարձ' : 'Оформить возврат'}
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* СЕКЦИЯ B: ВСЕ ЗАКАЗЫ ПОКУПАТЕЛЕЙ В МАГАЗИНЕ */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <ClipboardList className="w-4 h-4 text-amber-400" />
                        <span>
                          {isHy
                            ? `Բոլոր Գնորդների Պատվերների Կառավարում (${flattenedOrders.length})`
                            : `Единый реестр заказов покупателей (${flattenedOrders.length})`}
                        </span>
                      </h3>
                      <p className="text-xs text-slate-400">
                        {isHy
                          ? 'Փոխեք պատվերի կարգավիճակը (Մշակվում է ➔ Կատարված է ➔ Առաքված է) 1 կտոցով'
                          : 'Изменяйте статус любого заказа (В обработке ➔ Выполнен ➔ Доставлен) прямо в таблице'}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={orderSearch}
                          onChange={(e) => setOrderSearch(e.target.value)}
                          placeholder={isHy ? 'Պատվեր №, հաճախորդ, ապրանք...' : 'Заказ №, клиент, товар...'}
                          className="bg-slate-900 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white w-56"
                        />
                      </div>

                      <select
                        value={orderStatusFilter}
                        onChange={(e) => setOrderStatusFilter(e.target.value as any)}
                        className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                      >
                        <option value="all">{isHy ? 'Բոլոր կարգավիճակները' : 'Все статусы'}</option>
                        <option value="processing">{isHy ? 'Մշակվում է' : 'В обработке'}</option>
                        <option value="completed">{isHy ? 'Կատարված է' : 'Выполнен'}</option>
                        <option value="delivered">{isHy ? 'Առաքված է' : 'Доставлен'}</option>
                      </select>

                      <select
                        value={orderPaymentFilter}
                        onChange={(e) => setOrderPaymentFilter(e.target.value)}
                        className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                      >
                        <option value="all">{isHy ? 'Բոլոր վճարումները' : 'Все способы оплаты'}</option>
                        <option value="idram">Idram QR</option>
                        <option value="telcell">Telcell Wallet</option>
                        <option value="card">ArCa / Visa / Карта</option>
                        <option value="points">{isHy ? 'Բոնուսներ' : 'Бонусные баллы'}</option>
                      </select>
                    </div>
                  </div>

                  {flattenedOrders.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400 bg-slate-900 rounded-xl border border-slate-800">
                      {isHy ? 'Պատվերներ չեն գտնվել' : 'Заказы по выбранным фильтрам не найдены'}
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-slate-800 text-[11px] text-slate-400 bg-slate-900/70">
                            <th className="p-2.5">{isHy ? 'Պատվեր № / Ամսաթիվ' : 'Заказ № / Дата'}</th>
                            <th className="p-2.5">{isHy ? 'Գնորդ' : 'Покупатель'}</th>
                            <th className="p-2.5">{isHy ? 'Ապրանքներ' : 'Состав заказа'}</th>
                            <th className="p-2.5 text-right">{isHy ? 'Գումար / Բոնուս' : 'Сумма / Бонусы'}</th>
                            <th className="p-2.5 text-right">{isHy ? 'Կարգավիճակ' : 'Статус заказа'}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/70">
                          {flattenedOrders.map((ord) => (
                            <tr key={`${ord.customerId}_${ord.id}`} className="hover:bg-slate-900/50">
                              <td className="p-2.5 align-top font-mono">
                                <div className="font-bold text-white">{ord.orderNumber}</div>
                                <div className="text-[10px] text-slate-400">{ord.date}</div>
                              </td>
                              <td className="p-2.5 align-top">
                                <div className="font-semibold text-slate-200">{ord.customerName}</div>
                                <div className="text-[10px] text-slate-400 font-mono">{ord.customerPhone}</div>
                              </td>
                              <td className="p-2.5 align-top">
                                <div className="space-y-0.5 max-w-xs">
                                  {ord.items.map((it, i) => (
                                    <div key={i} className="text-[11px] text-slate-300 truncate">
                                      {it.productName} × {it.quantity} ({formatDram(it.totalDram)})
                                    </div>
                                  ))}
                                </div>
                              </td>
                              <td className="p-2.5 align-top text-right font-mono tabular-nums">
                                <div className="font-bold text-emerald-400">
                                  {ord.totalAmountDram > 0
                                    ? formatDram(ord.totalAmountDram)
                                    : `${ord.pointsUsed || 0} б.`}
                                </div>
                                <div className="text-[10px] text-slate-400 uppercase">
                                  {ord.paidWith} · +{ord.bonusPointsEarned} б.
                                </div>
                              </td>
                              <td className="p-2.5 align-top text-right">
                                <select
                                  aria-label={`Статус заказа ${ord.orderNumber}`}
                                  value={ord.status}
                                  onChange={(e) =>
                                    onUpdateOrderStatus &&
                                    onUpdateOrderStatus(
                                      ord.customerId,
                                      ord.id,
                                      e.target.value as CustomerPurchase['status']
                                    )
                                  }
                                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border cursor-pointer ${
                                    ord.status === 'delivered'
                                      ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                                      : ord.status === 'completed'
                                      ? 'bg-sky-950 text-sky-300 border-sky-500/40'
                                      : 'bg-amber-950 text-amber-300 border-amber-500/40'
                                  }`}
                                >
                                  <option value="processing">{isHy ? 'Մշակվում է' : 'В обработке'}</option>
                                  <option value="completed">{isHy ? 'Կատարված է' : 'Выполнен'}</option>
                                  <option value="delivered">{isHy ? 'Առաքված է' : 'Доставлен'}</option>
                                </select>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* СЕКЦИЯ C: МОДЕРАЦИЯ ПОСТАВЩИКОВ B2B И СПОРОВ ПО ВОЗВРАТАМ */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-white flex items-center gap-2">
                        <Package className="w-4 h-4 text-purple-400" />
                        <span>
                          {isHy
                            ? `Մատակարարների B2B Ապրանքների Մոդերացիա (${pendingSupplierProducts.length})`
                            : `Заявки поставщиков B2B на добавление товаров (${pendingSupplierProducts.length})`}
                        </span>
                      </h4>
                    </div>

                    {pendingSupplierProducts.length === 0 ? (
                      <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-400 text-center">
                        {isHy
                          ? 'Մատակարարներից նոր հայտեր չկան'
                          : 'Новых заявок от поставщиков на модерации нет'}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {pendingSupplierProducts.map((item) => (
                          <div
                            key={item.id}
                            className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between gap-2 text-xs"
                          >
                            <div>
                              <div className="font-bold text-white">
                                {isHy ? item.product.nameHy : item.product.nameRu}
                              </div>
                              <div className="text-[11px] text-slate-400">
                                {item.supplierName} · {formatDram(item.product.priceDram)}
                              </div>
                            </div>
                            {item.status === 'pending' ? (
                              <div className="flex items-center gap-1.5">
                                {onApproveSupplierProduct && (
                                  <button
                                    type="button"
                                    onClick={() => onApproveSupplierProduct(item.id)}
                                    className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] cursor-pointer"
                                  >
                                    {isHy ? 'Հաստատել' : 'Одобрить'}
                                  </button>
                                )}
                                {onRejectSupplierProduct && (
                                  <button
                                    type="button"
                                    onClick={() => onRejectSupplierProduct(item.id)}
                                    className="px-2.5 py-1 rounded bg-rose-950 text-rose-300 border border-rose-700 font-bold text-[11px] cursor-pointer"
                                  >
                                    {isHy ? 'Մերժել' : 'Отклонить'}
                                  </button>
                                )}
                              </div>
                            ) : (
                              <span className="text-[11px] font-mono text-slate-400 uppercase">{item.status}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-white flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-400" />
                        <span>
                          {isHy
                            ? `Վերադարձի Վեճեր և ՀՀ Օրենսդրություն (${returnDisputes.length})`
                            : `Споры по возвратам B2B / Закон РА (${returnDisputes.length})`}
                        </span>
                      </h4>
                    </div>

                    {returnDisputes.length === 0 ? (
                      <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-400 text-center">
                        {isHy ? 'Բաց վեճեր չկան' : 'Открытых споров по возвратам нет'}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {returnDisputes.map((d) => (
                          <div
                            key={d.id}
                            className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-2 text-xs"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-white">
                                {d.orderOrDocNumber} · {d.productName}
                              </span>
                              <span className="text-[10px] font-mono text-amber-300">{d.raLawArticle}</span>
                            </div>
                            <div className="text-[11px] text-slate-400">{d.reason}</div>
                            {d.status === 'open' && onResolveDispute && (
                              <div className="flex items-center gap-2 pt-1">
                                <button
                                  type="button"
                                  onClick={() => onResolveDispute(d.id, 'resolved_store')}
                                  className="px-2.5 py-1 rounded bg-emerald-600 text-white font-bold text-[11px] cursor-pointer"
                                >
                                  {isHy ? 'Հօգուտ խանութի/գնորդի' : 'В пользу магазина'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onResolveDispute(d.id, 'resolved_supplier')}
                                  className="px-2.5 py-1 rounded bg-slate-800 text-slate-200 font-bold text-[11px] cursor-pointer"
                                >
                                  {isHy ? 'Հօգուտ մատակարարի' : 'В пользу поставщика'}
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* =====================================================================
                ВКЛАДКА 2: УПРАВЛЕНИЕ ТОВАРАМИ И МАССОВЫМИ ЦЕНАМИ
               ===================================================================== */}
            {activeTab === 'products' && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      {isHy ? 'Ապրանքների կատալոգի և գների կառավարում' : 'Управление каталогом, ценами и наличием товаров'}
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      {isHy
                        ? 'Հեռացված ապրանքները տեղափոխվում են արխիվ՝ վերականգնման հնարավորությամբ'
                        : 'Удалённые товары перемещаются в архив с возможностью восстановления в 1 клик'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAddingProduct(!isAddingProduct)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-md"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{isHy ? 'Ավելացնել նոր ապրանք' : 'Создать новый товар'}</span>
                  </button>
                </div>

                {/* ПАНЕЛЬ МАССОВОГО УПРАВЛЕНИЯ ЦЕНАМИ И СКЛАДОМ */}
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-xs font-bold text-slate-200 flex items-center gap-2">
                      <Percent className="w-4 h-4 text-amber-400" />
                      <span>
                        {isHy
                          ? 'Գների և Մնացորդների Զանգվածային Կառավարում (1 կտոցով)'
                          : 'Массовое управление ценами (Акции / Наценка) и пополнение остатков'}
                      </span>
                    </div>

                    <select
                      value={bulkScope}
                      onChange={(e) => setBulkScope(e.target.value as any)}
                      className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white"
                    >
                      <option value="all">{isHy ? 'Բոլոր բաժինները' : 'Все отделы каталога'}</option>
                      <option value="groceries">{isHy ? '🍏 Սուպերմարկետ' : '🍏 Только Супермаркет'}</option>
                      <option value="construction">{isHy ? '🛠️ Շինանյութ' : '🛠️ Только Стройматериалы'}</option>
                    </select>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] text-slate-400">{isHy ? 'Գներ՝' : 'Цены:'}</span>
                    {[-10, -5, 5, 10].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => handleBulkPriceAction(pct)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold cursor-pointer border ${
                          pct < 0
                            ? 'bg-emerald-950/60 hover:bg-emerald-900/70 text-emerald-300 border-emerald-500/40'
                            : 'bg-amber-950/60 hover:bg-amber-900/70 text-amber-300 border-amber-500/40'
                        }`}
                      >
                        {pct > 0 ? `+${pct}%` : `${pct}%`}
                      </button>
                    ))}

                    <span className="text-[11px] text-slate-400 ml-2">{isHy ? 'Պահեստ՝' : 'Остатки:'}</span>
                    {[25, 50].map((qty) => (
                      <button
                        key={qty}
                        type="button"
                        onClick={() => handleBulkStockAction(qty)}
                        className="px-2.5 py-1 rounded-lg bg-sky-950/60 hover:bg-sky-900/70 text-sky-300 border border-sky-500/40 text-xs font-mono font-bold cursor-pointer"
                      >
                        +{qty} {isHy ? 'միավ.' : 'шт.'}
                      </button>
                    ))}

                    {bulkFeedback && (
                      <span className="text-xs font-semibold text-emerald-400 ml-auto">
                        ✓ {bulkFeedback}
                      </span>
                    )}
                  </div>
                </div>

                {/* Форма добавления нового товара */}
                {isAddingProduct && (
                  <form onSubmit={handleCreateProduct} className="p-4 bg-slate-800/90 rounded-xl border border-emerald-500/40 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{isHy ? 'Նոր ապրանքի ստեղծում' : 'Создание нового товара'}</span>
                      </h4>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setNewStoreSection('groceries');
                            setNewCategoryHy('Ձավարեղեն');
                          }}
                          className={`px-2.5 py-1 rounded-md text-[11px] font-bold cursor-pointer ${
                            newStoreSection === 'groceries'
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-900 text-slate-400 border border-slate-700'
                          }`}
                        >
                          🍏 {isHy ? 'Սուպերմարկետ' : 'Супермаркет'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setNewStoreSection('construction');
                            setNewCategoryHy('Շինանյութեր');
                          }}
                          className={`px-2.5 py-1 rounded-md text-[11px] font-bold cursor-pointer ${
                            newStoreSection === 'construction'
                              ? 'bg-amber-600 text-white'
                              : 'bg-slate-900 text-slate-400 border border-slate-700'
                          }`}
                        >
                          🛠️ {isHy ? 'Շինանյութ' : 'Стройматериалы'}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] text-slate-300 mb-1">
                          {isHy ? 'Անվանում (հայերեն) *' : 'Название (арм.) *'}
                        </label>
                        <input
                          type="text"
                          required
                          placeholder={newStoreSection === 'construction' ? 'Օրինակ՝ Էմուլսիոն սոսինձ ՊՎԱ' : 'Օրինակ՝ Բնական մեղր 500գ'}
                          value={newNameHy}
                          onChange={(e) => setNewNameHy(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-300 mb-1">
                          {isHy ? 'Անվանում (ռուսերեն)' : 'Название (рус.)'}
                        </label>
                        <input
                          type="text"
                          placeholder={newStoreSection === 'construction' ? 'Например: Клей ПВА' : 'Например: Мёд натуральный 500г'}
                          value={newNameRu}
                          onChange={(e) => setNewNameRu(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-[11px] text-slate-300 mb-1">
                          {isHy ? 'Գին (֏) *' : 'Цена (֏) *'}
                        </label>
                        <input
                          type="number"
                          required
                          min="50"
                          step="50"
                          value={newPrice}
                          onChange={(e) => setNewPrice(Number(e.target.value))}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-300 mb-1">
                          {isHy ? 'Բաժին' : 'Раздел'}
                        </label>
                        <select
                          value={newStoreSection}
                          onChange={(e) => setNewStoreSection(e.target.value as 'groceries' | 'construction')}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                        >
                          <option value="groceries">{isHy ? '🍏 Սուպերմարկետ' : '🍏 Супермаркет'}</option>
                          <option value="construction">{isHy ? '🛠️ Շինանյութ' : '🛠️ Стройматериалы'}</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-300 mb-1">
                          {isHy ? 'Չափաբաժին' : 'Единица'}
                        </label>
                        <input
                          type="text"
                          value={newUnitHy}
                          onChange={(e) => setNewUnitHy(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-300 mb-1">
                          {isHy ? 'Կատեգորիա' : 'Категория'}
                        </label>
                        <select
                          value={newCategoryHy}
                          onChange={(e) => {
                            const val = e.target.value;
                            setNewCategoryHy(val);
                            if (CATEGORY_MAP[val]) {
                              setNewStoreSection(CATEGORY_MAP[val].section);
                            }
                          }}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                        >
                          {Object.entries(CATEGORY_MAP).map(([key, info]) => (
                            <option key={key} value={key}>
                              {isHy ? info.hy : info.ru}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] text-slate-300 mb-1">
                          {isHy ? 'Շտրիխ կոդ (ավտո)' : 'Штрих-код (авто)'}
                        </label>
                        <input
                          type="text"
                          placeholder="485000123..."
                          value={newBarcode}
                          onChange={(e) => setNewBarcode(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-300 mb-1">
                          {isHy ? 'Արտադրող' : 'Производитель'}
                        </label>
                        <input
                          type="text"
                          placeholder="«ԱրմՍոսինձ» ՍՊԸ"
                          value={newManufacturer}
                          onChange={(e) => setNewManufacturer(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-300 mb-1">
                          {isHy ? 'Նկարի հղում (URL)' : 'Ссылка на фото (URL)'}
                        </label>
                        <input
                          type="url"
                          value={newImageUrl}
                          onChange={(e) => setNewImageUrl(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setIsAddingProduct(false)}
                        className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-xs font-semibold cursor-pointer"
                      >
                        {isHy ? 'Չեղարկել' : 'Отмена'}
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold cursor-pointer"
                      >
                        {isHy ? 'Ստեղծել ապրանք' : 'Создать товар'}
                      </button>
                    </div>
                  </form>
                )}

                {/* Поиск и фильтр товаров в админке */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      placeholder={isHy ? 'Փնտրել ապրանք, շտրիխ կոդ...' : 'Поиск товара, штрих-кода...'}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    {(['all', 'groceries', 'construction'] as const).map((sec) => (
                      <button
                        key={sec}
                        type="button"
                        onClick={() => setProductSectionFilter(sec)}
                        className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold cursor-pointer ${
                          productSectionFilter === sec
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                        }`}
                      >
                        {sec === 'all'
                          ? isHy
                            ? 'Բոլորը'
                            : 'Все'
                          : sec === 'groceries'
                          ? isHy
                            ? '🍏 Սուպերմարկետ'
                            : '🍏 Супермаркет'
                          : isHy
                          ? '🛠️ Շինանյութ'
                          : '🛠️ Стройматериалы'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Список товаров в админке */}
                <div className="space-y-2">
                  {products
                    .filter((p) => {
                      if (productSectionFilter !== 'all' && (p.department || 'groceries') !== productSectionFilter) {
                        return false;
                      }
                      if (!productSearch.trim()) return true;
                      const q = productSearch.toLowerCase();
                      return (
                        p.nameHy.toLowerCase().includes(q) ||
                        p.nameRu.toLowerCase().includes(q) ||
                        (p.barcode && p.barcode.toLowerCase().includes(q)) ||
                        p.categoryHy.toLowerCase().includes(q) ||
                        p.categoryRu.toLowerCase().includes(q)
                      );
                    })
                    .map((prod) => {
                      const isEditing = editingProduct?.id === prod.id;
                      const isConfirmingDelete = confirmDeleteProductId === prod.id;
                      const isAvail = prod.isAvailable !== false;

                      return (
                        <div
                          key={prod.id}
                          className={`p-2.5 rounded-xl border space-y-2 ${
                            isAvail
                              ? 'bg-slate-950 border-slate-800'
                              : 'bg-slate-950/50 border-slate-800/50 opacity-65'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <img
                                src={prod.imageUrl}
                                alt={prod.nameHy}
                                referrerPolicy="no-referrer"
                                className="w-12 h-12 rounded-lg object-cover border border-slate-700 shrink-0 bg-slate-900"
                                loading="lazy"
                              />
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-semibold text-xs text-white truncate">
                                    {isHy ? prod.nameHy : prod.nameRu}
                                  </span>
                                  <span
                                    className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                      prod.department === 'construction'
                                        ? 'bg-amber-500/20 text-amber-300'
                                        : 'bg-emerald-500/20 text-emerald-300'
                                    }`}
                                  >
                                    {prod.department === 'construction' ? '🛠️' : '🍏'}
                                  </span>
                                </div>
                                <div className="text-[10px] text-slate-400 flex flex-wrap items-center gap-2">
                                  <span>
                                    {prod.unitHy} · {isHy ? prod.categoryHy : prod.categoryRu} ·{' '}
                                    {isHy ? 'Մնացորդ՝' : 'Остаток:'} {prod.stockCount ?? 25}
                                  </span>
                                  {prod.barcode && (
                                    <span className="font-mono text-slate-500 flex items-center gap-0.5">
                                      <Barcode className="w-3 h-3" />
                                      {prod.barcode}
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs font-mono font-bold text-emerald-400 tabular-nums">
                                  {formatDram(prod.priceDram)}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() =>
                                  onUpdateProduct({ ...prod, isAvailable: !isAvail })
                                }
                                className={`px-2 py-1 rounded-lg text-[10px] font-bold border cursor-pointer ${
                                  isAvail
                                    ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
                                    : 'bg-slate-800 text-slate-400 border-slate-700'
                                }`}
                              >
                                {isAvail
                                  ? isHy
                                    ? 'Առկա է'
                                    : 'В наличии'
                                  : isHy
                                  ? 'Թաքնված'
                                  : 'Скрыт'}
                              </button>

                              <button
                                type="button"
                                onClick={() => setEditingProduct(isEditing ? null : { ...prod })}
                                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                  isEditing
                                    ? 'bg-amber-600 text-white'
                                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white'
                                }`}
                                title={isHy ? 'Խմբագրել ապրանքը' : 'Редактировать товар'}
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              {isConfirmingDelete ? (
                                <div className="flex items-center gap-1 bg-rose-950/60 border border-rose-700/60 rounded-lg px-2 py-1">
                                  <span className="text-[10px] text-rose-200 font-semibold">
                                    {isHy ? 'Ջնջե՞լ' : 'Удалить?'}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      onDeleteProduct(prod.id);
                                      setConfirmDeleteProductId(null);
                                    }}
                                    className="px-1.5 py-0.5 bg-rose-600 hover:bg-rose-500 text-white rounded text-[10px] font-bold cursor-pointer"
                                  >
                                    {isHy ? 'Այո' : 'Да'}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setConfirmDeleteProductId(null)}
                                    className="px-1.5 py-0.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded text-[10px] cursor-pointer"
                                  >
                                    {isHy ? 'Ոչ' : 'Нет'}
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteProductId(prod.id)}
                                  className="p-1.5 rounded-lg bg-rose-950/30 hover:bg-rose-900/50 text-rose-400 hover:text-rose-200 border border-rose-900/40 transition-colors cursor-pointer"
                                  title={isHy ? 'Հեռացնել (տեղափոխել արխիվ)' : 'Удалить (в архив)'}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Инлайн-форма редактирования товара */}
                          {isEditing && editingProduct && (
                            <div className="pt-2 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-5 gap-2">
                              <div>
                                <label className="block text-[10px] text-slate-400 mb-0.5">
                                  {isHy ? 'Անվանում' : 'Название'}
                                </label>
                                <input
                                  type="text"
                                  value={isHy ? editingProduct.nameHy : editingProduct.nameRu}
                                  onChange={(e) =>
                                    setEditingProduct({
                                      ...editingProduct,
                                      nameHy: isHy ? e.target.value : editingProduct.nameHy,
                                      nameRu: !isHy ? e.target.value : editingProduct.nameRu,
                                    })
                                  }
                                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] text-slate-400 mb-0.5">
                                  {isHy ? 'Գին (֏)' : 'Цена (֏)'}
                                </label>
                                <input
                                  type="number"
                                  min="50"
                                  value={editingProduct.priceDram}
                                  onChange={(e) => {
                                    const val = Number(e.target.value);
                                    setEditingProduct({
                                      ...editingProduct,
                                      priceDram: val,
                                      pointsCost: val,
                                    });
                                  }}
                                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white font-mono"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] text-slate-400 mb-0.5">
                                  {isHy ? 'Մնացորդ' : 'Остаток (шт)'}
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  value={editingProduct.stockCount ?? 25}
                                  onChange={(e) =>
                                    setEditingProduct({
                                      ...editingProduct,
                                      stockCount: Number(e.target.value),
                                    })
                                  }
                                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white font-mono"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] text-slate-400 mb-0.5">
                                  {isHy ? 'Շտրիխ կոդ' : 'Штрих-код'}
                                </label>
                                <input
                                  type="text"
                                  value={editingProduct.barcode || ''}
                                  onChange={(e) =>
                                    setEditingProduct({
                                      ...editingProduct,
                                      barcode: e.target.value,
                                    })
                                  }
                                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white font-mono"
                                />
                              </div>
                              <div className="flex items-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    onUpdateProduct(editingProduct);
                                    setEditingProduct(null);
                                  }}
                                  className="flex-1 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold cursor-pointer flex items-center justify-center gap-1"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>{isHy ? 'Պահել' : 'Сохранить'}</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingProduct(null)}
                                  className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded text-xs cursor-pointer"
                                >
                                  ✕
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* =====================================================================
                ВКЛАДКА 3: КАТЕГОРИИ ПРОДУКЦИИ
               ===================================================================== */}
            {activeTab === 'categories' && (
              <AdminCategoriesTab
                lang={lang}
                categories={categories}
                products={products}
                onAddCategory={onAddCategory}
                onUpdateCategory={onUpdateCategory}
                onDeleteCategory={onDeleteCategory}
              />
            )}

            {/* =====================================================================
                ВКЛАДКА 4: СКЛАДЫ 1С, КАССЫ И ДОСТАВКА
               ===================================================================== */}
            {activeTab === 'warehouses' && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-emerald-400" />
                      <span>{isHy ? 'Պահեստների և առևտրային սրահների կառավարում' : 'Управление складами 1С и доставкой'}</span>
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      {isHy
                        ? 'Ավելացված պահեստները ավտոմատ համաժամանակեցվում են 1C:Պահեստ համակարգի հետ'
                        : 'Добавленные склады автоматически синхронизируются с системой 1С:Склад'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAddingWarehouse(!isAddingWarehouse)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-md"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{isHy ? 'Ավելացնել նոր պահեստ' : 'Добавить новый склад'}</span>
                  </button>
                </div>

                {/* Форма создания нового склада */}
                {isAddingWarehouse && (
                  <form onSubmit={handleCreateWarehouse} className="p-4 bg-slate-800/90 rounded-xl border border-emerald-500/40 space-y-3">
                    <h4 className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5" />
                      <span>{isHy ? 'Նոր պահեստի գրանցում' : 'Регистрация нового склада'}</span>
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] text-slate-300 mb-1">
                          {isHy ? 'Պահեստի անվանում (հայ.) *' : 'Название склада (арм.) *'}
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Օրինակ՝ Շինանյութի պահեստ №2"
                          value={whNameHy}
                          onChange={(e) => setWhNameHy(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-300 mb-1">
                          {isHy ? 'Անվանում (ռուս.)' : 'Название склада (рус.)'}
                        </label>
                        <input
                          type="text"
                          placeholder="Например: Склад стройматериалов №2"
                          value={whNameRu}
                          onChange={(e) => setWhNameRu(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-300 mb-1">
                          {isHy ? 'Կոդ (օր. WH-004)' : 'Код склада (напр. WH-004)'}
                        </label>
                        <input
                          type="text"
                          placeholder={`WH-00${warehouses.length + 1}`}
                          value={whCode}
                          onChange={(e) => setWhCode(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono uppercase"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] text-slate-300 mb-1">
                          {isHy ? 'Պահեստի տեսակ' : 'Тип склада'}
                        </label>
                        <select
                          value={whType}
                          onChange={(e) => setWhType(e.target.value as 'warehouse' | 'retail' | 'spoilage')}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                        >
                          <option value="warehouse">{isHy ? 'Հիմնական պահեստ' : 'Основной склад'}</option>
                          <option value="retail">{isHy ? 'Առևտրային սրահ / Խանութ' : 'Торговый зал / Магазин'}</option>
                          <option value="spoilage">{isHy ? 'Խոտանի / Զեղչված պահեստ' : 'Склад брака / Уценки'}</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-300 mb-1">
                          {isHy ? 'Հասցե' : 'Адрес'}
                        </label>
                        <input
                          type="text"
                          placeholder="Երևան, Արշակունյաց 45"
                          value={whAddress}
                          onChange={(e) => setWhAddress(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-300 mb-1">
                          {isHy ? 'Պատասխանատու անձ' : 'Ответственное лицо'}
                        </label>
                        <input
                          type="text"
                          placeholder="Արմեն Սարգսյան"
                          value={whResponsible}
                          onChange={(e) => setWhResponsible(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setIsAddingWarehouse(false)}
                        className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-xs font-semibold cursor-pointer"
                      >
                        {isHy ? 'Չեղարկել' : 'Отмена'}
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold cursor-pointer"
                      >
                        {isHy ? 'Ստեղծել պահեստ' : 'Создать склад'}
                      </button>
                    </div>
                  </form>
                )}

                {/* Список складов */}
                <div className="space-y-2.5">
                  {warehouses.map((wh) => {
                    const isEditingWh = editingWarehouse?.id === wh.id;
                    const isConfirmingDelWh = confirmDeleteWhId === wh.id;
                    return (
                      <div
                        key={wh.id}
                        className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0 space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] font-mono font-bold text-amber-300">
                                {wh.code}
                              </span>
                              <span className="font-bold text-xs text-white truncate">
                                {isHy ? wh.nameHy : wh.nameRu}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                  wh.type === 'retail'
                                    ? 'bg-sky-500/20 text-sky-300'
                                    : wh.type === 'spoilage'
                                    ? 'bg-rose-500/20 text-rose-300'
                                    : 'bg-emerald-500/20 text-emerald-300'
                                }`}
                              >
                                {wh.type === 'retail'
                                  ? isHy
                                    ? 'Առևտրային սրահ'
                                    : 'Торговый зал'
                                  : wh.type === 'spoilage'
                                  ? isHy
                                    ? 'Խոտան'
                                    : 'Брак/Уценка'
                                  : isHy
                                  ? 'Հիմնական պահեստ'
                                  : 'Основной склад'}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-400 flex flex-wrap items-center gap-3">
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-slate-500" />
                                {wh.address}
                              </span>
                              <span className="flex items-center gap-1">
                                <UserCheck className="w-3 h-3 text-slate-500" />
                                {wh.responsiblePerson}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {onUpdateWarehouse && (
                              <button
                                type="button"
                                onClick={() => setEditingWarehouse(isEditingWh ? null : { ...wh })}
                                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                  isEditingWh
                                    ? 'bg-amber-600 text-white'
                                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white'
                                }`}
                                title={isHy ? 'Խմբագրել պահեստը' : 'Редактировать склад'}
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {onDeleteWarehouse && warehouses.length > 1 && (
                              isConfirmingDelWh ? (
                                <div className="flex items-center gap-1 bg-rose-950/60 border border-rose-700/60 rounded-lg px-2 py-1">
                                  <span className="text-[10px] text-rose-200 font-semibold">
                                    {isHy ? 'Ջնջե՞լ' : 'Удалить?'}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      onDeleteWarehouse(wh.id);
                                      setConfirmDeleteWhId(null);
                                    }}
                                    className="px-1.5 py-0.5 bg-rose-600 hover:bg-rose-500 text-white rounded text-[10px] font-bold cursor-pointer"
                                  >
                                    {isHy ? 'Այո' : 'Да'}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setConfirmDeleteWhId(null)}
                                    className="px-1.5 py-0.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded text-[10px] cursor-pointer"
                                  >
                                    {isHy ? 'Ոչ' : 'Нет'}
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteWhId(wh.id)}
                                  className="p-1.5 rounded-lg bg-rose-950/30 hover:bg-rose-900/50 text-rose-400 hover:text-rose-200 border border-rose-900/40 transition-colors cursor-pointer"
                                  title={isHy ? 'Հեռացնել պահեստը' : 'Удалить склад'}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )
                            )}
                          </div>
                        </div>

                        {isEditingWh && editingWarehouse && onUpdateWarehouse && (
                          <div className="pt-2 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-4 gap-2">
                            <div>
                              <label className="block text-[10px] text-slate-400 mb-0.5">
                                {isHy ? 'Անվանում' : 'Название'}
                              </label>
                              <input
                                type="text"
                                value={isHy ? editingWarehouse.nameHy : editingWarehouse.nameRu}
                                onChange={(e) =>
                                  setEditingWarehouse({
                                    ...editingWarehouse,
                                    nameHy: isHy ? e.target.value : editingWarehouse.nameHy,
                                    nameRu: !isHy ? e.target.value : editingWarehouse.nameRu,
                                  })
                                }
                                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] text-slate-400 mb-0.5">
                                {isHy ? 'Հասցե' : 'Адрес'}
                              </label>
                              <input
                                type="text"
                                value={editingWarehouse.address}
                                onChange={(e) =>
                                  setEditingWarehouse({
                                    ...editingWarehouse,
                                    address: e.target.value,
                                  })
                                }
                                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] text-slate-400 mb-0.5">
                                {isHy ? 'Պատասխանատու' : 'Ответственный'}
                              </label>
                              <input
                                type="text"
                                value={editingWarehouse.responsiblePerson}
                                onChange={(e) =>
                                  setEditingWarehouse({
                                    ...editingWarehouse,
                                    responsiblePerson: e.target.value,
                                  })
                                }
                                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                              />
                            </div>
                            <div className="flex items-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  onUpdateWarehouse(editingWarehouse);
                                  setEditingWarehouse(null);
                                }}
                                className="flex-1 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold cursor-pointer flex items-center justify-center gap-1"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>{isHy ? 'Պահել' : 'Сохранить'}</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingWarehouse(null)}
                                className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded text-xs cursor-pointer"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Быстрое управление остатками склада (Приход / Списание) */}
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                  <h4 className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                    <Package className="w-4 h-4 text-amber-400" />
                    <span>{isHy ? 'Պահեստի մնացորդների արագ կառավարում (Մուտք / Ելք)' : 'Быстрое управление остатками склада (Приход / Списание)'}</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                    <select
                      value={stockAdjustProdId || (products[0]?.id ?? '')}
                      onChange={(e) => setStockAdjustProdId(e.target.value)}
                      className="sm:col-span-2 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {isHy ? p.nameHy : p.nameRu} ({isHy ? 'Մնացորդ' : 'Остаток'}: {p.stockCount ?? 25})
                        </option>
                      ))}
                    </select>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setStockAdjustMode('in')}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                          stockAdjustMode === 'in'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-900 text-slate-400 border border-slate-700'
                        }`}
                      >
                        + {isHy ? 'Մուտք' : 'Приход'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setStockAdjustMode('out')}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                          stockAdjustMode === 'out'
                            ? 'bg-rose-600 text-white'
                            : 'bg-slate-900 text-slate-400 border border-slate-700'
                        }`}
                      >
                        - {isHy ? 'Ելք' : 'Списание'}
                      </button>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min={1}
                        value={stockAdjustQty}
                        onChange={(e) => setStockAdjustQty(e.target.value)}
                        className="w-20 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const targetId = Number(stockAdjustProdId || products[0]?.id);
                          const prod = products.find((p) => p.id === targetId);
                          const qty = Math.max(1, Number(stockAdjustQty) || 1);
                          if (!prod) return;
                          const currentStock = prod.stockCount ?? 25;
                          const nextStock =
                            stockAdjustMode === 'in' ? currentStock + qty : Math.max(0, currentStock - qty);
                          onUpdateProduct({ ...prod, stockCount: nextStock, isAvailable: nextStock > 0 });
                        }}
                        className="flex-1 py-1.5 px-3 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold cursor-pointer"
                      >
                        {isHy ? 'Կիրառել' : 'Применить'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Управление доставкой и курьерами (GPS LIVE) */}
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h4 className="text-xs font-bold text-sky-300 flex items-center gap-1.5">
                      <Truck className="w-4 h-4 text-sky-400" />
                      <span>
                        {isHy
                          ? 'Առաքման և առաքիչների կառավարում (GPS LIVE)'
                          : 'Диспетчерская онлайн-доставки и курьеров (GPS LIVE)'}
                      </span>
                    </h4>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-400 font-mono">
                        {isHy ? 'Ակտիվ առաքումներ' : 'Активных в пути'}:{' '}
                        {deliveries.filter((d) => d.stage !== 'delivered' && d.stage !== 'cancelled').length}
                      </span>
                      {onOpenDeliveryTracker && (
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onOpenDeliveryTracker();
                          }}
                          className="px-2.5 py-1 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-[11px] font-bold cursor-pointer"
                        >
                          {isHy ? 'Բացել GPS Քարտեզը' : 'Открыть GPS-карту LIVE'}
                        </button>
                      )}
                    </div>
                  </div>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!delCustomer.trim() || !delAddress.trim()) return;
                      const orderNum = delOrderNum.trim() || `ORD-${Math.floor(10000 + Math.random() * 89999)}`;
                      if (onCreateDelivery) {
                        onCreateDelivery({
                          orderNumber: orderNum,
                          customerName: delCustomer.trim(),
                          address: delAddress.trim(),
                          feeDram: Math.max(0, Number(delFee) || 0),
                        });
                      } else {
                        setLocalDeliveries((prev) => [
                          createDeliveryFromPurchase({
                            orderNumber: orderNum,
                            customerId: 'cust_admin',
                            customerName: delCustomer.trim(),
                            address: delAddress.trim(),
                            totalOrderDram: 15000,
                            itemsSummary: ['Товары со склада 1С'],
                            feeDram: Math.max(0, Number(delFee) || 0),
                          }),
                          ...prev,
                        ]);
                      }
                      setDelOrderNum('');
                      setDelCustomer('');
                      setDelAddress('');
                      setDelCourier('');
                      setDelFee('0');
                    }}
                    className="grid grid-cols-1 sm:grid-cols-6 gap-2"
                  >
                    <input
                      type="text"
                      placeholder={isHy ? 'Պատվեր №' : 'Заказ №'}
                      value={delOrderNum}
                      onChange={(e) => setDelOrderNum(e.target.value)}
                      className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                    />
                    <input
                      type="text"
                      required
                      placeholder={isHy ? 'Հաճախորդ *' : 'Клиент *'}
                      value={delCustomer}
                      onChange={(e) => setDelCustomer(e.target.value)}
                      className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                    />
                    <input
                      type="text"
                      required
                      placeholder={isHy ? 'Հասցե (Երևան / Մարզ) *' : 'Адрес доставки *'}
                      value={delAddress}
                      onChange={(e) => setDelAddress(e.target.value)}
                      className="sm:col-span-2 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                    />
                    <input
                      type="text"
                      placeholder={isHy ? 'Առաքիչ' : 'Курьер'}
                      value={delCourier}
                      onChange={(e) => setDelCourier(e.target.value)}
                      className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                    />
                    <button
                      type="submit"
                      className="py-1.5 px-3 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-bold cursor-pointer"
                    >
                      + {isHy ? 'Ուղարկել' : 'Отправить'}
                    </button>
                  </form>

                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {deliveries.map((d) => (
                      <div
                        key={d.id}
                        className="p-2.5 bg-slate-900/90 rounded-lg border border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs"
                      >
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono font-bold text-sky-300">{d.orderNumber}</span>
                            <span className="font-semibold text-white">{d.customerName}</span>
                            <span className="text-[11px] text-slate-400">
                              ({isHy ? d.courier.nameHy : d.courier.nameRu} • {d.courier.plateNumber})
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 font-mono text-[10px] text-emerald-400">
                              GPS {d.progressPercent}% • PIN {d.verificationPin}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400">{d.address}</div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {d.stage !== 'delivered' && d.stage !== 'cancelled' && (
                            <button
                              type="button"
                              onClick={() => {
                                if (onAdvanceDeliveryTick) {
                                  onAdvanceDeliveryTick(d.id, 15);
                                } else {
                                  setLocalDeliveries((prev) =>
                                    prev.map((it) => (it.id === d.id ? advanceDeliveryTick(it, 15) : it))
                                  );
                                }
                              }}
                              className="px-2 py-1 rounded bg-sky-950/90 hover:bg-sky-900 border border-sky-500/40 text-sky-300 text-[10px] font-mono font-bold cursor-pointer"
                            >
                              +15% GPS
                            </button>
                          )}

                          <select
                            value={d.stage}
                            onChange={(e) => {
                              const nextSt = e.target.value as DeliveryStage;
                              if (onUpdateDeliveryStage) {
                                onUpdateDeliveryStage(d.id, nextSt);
                              } else {
                                setLocalDeliveries((prev) =>
                                  prev.map((it) => (it.id === d.id ? updateDeliveryStage(it, nextSt) : it))
                                );
                              }
                            }}
                            className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-[11px] text-white"
                          >
                            {(Object.keys(STAGE_LABELS) as DeliveryStage[]).map((stKey) => (
                              <option key={stKey} value={stKey}>
                                {isHy ? STAGE_LABELS[stKey].hy : STAGE_LABELS[stKey].ru}
                              </option>
                            ))}
                          </select>

                          {onOpenDeliveryTracker && (
                            <button
                              type="button"
                              onClick={() => {
                                onClose();
                                onOpenDeliveryTracker(d.orderNumber);
                              }}
                              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold cursor-pointer"
                            >
                              GPS
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* =====================================================================
                ВКЛАДКА 5: КЛИЕНТЫ И УЧАСТНИКИ (CRM)
               ===================================================================== */}
            {activeTab === 'customers' && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      {isHy ? 'Մասնակիցների և Գնորդների Կառավարում (CRM)' : 'База участников, депозитов и бонусных счетов (CRM)'}
                    </h3>
                    <p className="text-xs text-slate-400">
                      {isHy
                        ? 'Ավելացրեք նոր հաճախորդ կամ կառավարեք գործող մասնակիցների հաշիվները'
                        : 'Добавляйте новых участников и корректируйте реальный баланс, 10% депозит и баллы'}
                    </p>
                  </div>
                  {onAddCustomer && (
                    <button
                      type="button"
                      onClick={() => setIsAddingCustomer(!isAddingCustomer)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>{isHy ? 'Նոր մասնակից' : 'Добавить участника CRM'}</span>
                    </button>
                  )}
                </div>

                {isAddingCustomer && onAddCustomer && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!newCustName.trim()) return;
                      onAddCustomer({
                        name: newCustName.trim(),
                        phone: newCustPhone.trim() || '+374 91 000000',
                        email: newCustEmail.trim() || 'client@sistema2000.am',
                        city: newCustCity.trim() || 'Երևան',
                        status: newCustStatus,
                        realBalance: 10000,
                        deposit: 15000,
                        bonusPoints: 500,
                        agreementAccepted: true,
                      });
                      setNewCustName('');
                      setNewCustEmail('');
                      setIsAddingCustomer(false);
                    }}
                    className="p-4 rounded-xl bg-slate-950 border border-sky-500/40 grid grid-cols-1 sm:grid-cols-5 gap-2.5 text-xs"
                  >
                    <input
                      type="text"
                      required
                      placeholder={isHy ? 'Անուն Ազգանուն *' : 'ФИО участника *'}
                      value={newCustName}
                      onChange={(e) => setNewCustName(e.target.value)}
                      className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white"
                    />
                    <input
                      type="text"
                      placeholder="+374 XX XXX XXX"
                      value={newCustPhone}
                      onChange={(e) => setNewCustPhone(e.target.value)}
                      className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white font-mono"
                    />
                    <input
                      type="email"
                      placeholder="Email"
                      value={newCustEmail}
                      onChange={(e) => setNewCustEmail(e.target.value)}
                      className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white"
                    />
                    <select
                      value={newCustStatus}
                      onChange={(e) => setNewCustStatus(e.target.value as any)}
                      className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                    >
                      <option value="regular">{isHy ? 'Պարբերական' : 'Постоянный'}</option>
                      <option value="vip">VIP</option>
                      <option value="wholesale">{isHy ? 'Մեծածախ (B2B)' : 'Оптовик (B2B)'}</option>
                      <option value="new">{isHy ? 'Նոր' : 'Новый'}</option>
                    </select>
                    <button
                      type="submit"
                      className="py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer"
                    >
                      {isHy ? 'Գրանցել' : 'Создать клиента'}
                    </button>
                  </form>
                )}

                <AdminCustomersTab
                  customers={customers}
                  lang={lang}
                  onAdjustCustomer={onAdjustCustomer || (() => {})}
                  onAddNote={onAddCustomerNote || (() => {})}
                />
              </div>
            )}

            {/* =====================================================================
                ВКЛАДКА 6: УПРАВЛЕНИЕ САЙТОМ, ДИЗАЙНОМ, БАННЕРАМИ, ОТЗЫВАМИ И FAQ
               ===================================================================== */}
            {activeTab === 'site_cms' && (
              <div className="space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      {isHy
                        ? 'Կայքի, Դիզայնի, Բաններների, Կարծիքների և FAQ-ի Կառավարում'
                        : 'Управление Сайтом, Темой, Блоками, Баннерами, Отзывами и FAQ'}
                    </h3>
                    <p className="text-xs text-slate-400">
                      {isHy
                        ? 'Բոլոր փոփոխություններն անմիջապես կիրառվում են առցանց խանութում'
                        : 'Все изменения мгновенно применяются к витрине магазина в реальном времени'}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs">
                    {(
                      [
                        { id: 'theme_sections', hy: 'Թեմա և Բլոկներ', ru: 'Тема и Блоки' },
                        { id: 'brand_contacts', hy: 'Բրենդ և Կոնտակտ', ru: 'Бренд и Контакты' },
                        { id: 'banners', hy: 'Բաններներ', ru: 'Баннеры' },
                        { id: 'reviews_faq', hy: 'Կարծիքներ և FAQ', ru: 'Отзывы и FAQ' },
                      ] as const
                    ).map((st) => (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => setCmsSubTab(st.id)}
                        className={`px-3 py-1.5 rounded-md font-semibold cursor-pointer transition-colors ${
                          cmsSubTab === st.id
                            ? 'bg-emerald-600 text-white'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {isHy ? st.hy : st.ru}
                      </button>
                    ))}
                  </div>
                </div>

                {/* ПОДВКЛАДКА 1: ТЕМА И ПОРЯДОК СЕКЦИЙ */}
                {cmsSubTab === 'theme_sections' && onSaveSiteConfig && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
                      <h4 className="text-xs font-bold text-white">
                        {isHy ? 'Գունային Պալիտրա և Ոճ' : 'Цветовая палитра и геометрия карточек'}
                      </h4>
                      <div className="grid grid-cols-2 gap-2.5">
                        {(Object.keys(THEMES) as ThemeId[]).map((themeKey) => {
                          const theme = THEMES[themeKey];
                          const isSelected = siteConfig.themeId === themeKey;
                          return (
                            <button
                              key={themeKey}
                              type="button"
                              onClick={() => onSaveSiteConfig({ ...siteConfig, themeId: themeKey })}
                              className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                                isSelected
                                  ? 'bg-slate-800 border-emerald-500'
                                  : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                              }`}
                            >
                              <div className="flex items-center gap-2.5">
                                <span
                                  className="w-5 h-5 rounded-md shrink-0"
                                  style={{ backgroundColor: theme.primaryColor }}
                                />
                                <span className="text-xs font-bold text-white">
                                  {isHy ? theme.nameHy : theme.nameRu}
                                </span>
                              </div>
                              {isSelected && <Check className="w-4 h-4 text-emerald-400" />}
                            </button>
                          );
                        })}
                      </div>

                      <div className="pt-2 border-t border-slate-800 space-y-2">
                        <div className="text-xs font-semibold text-slate-300">
                          {isHy ? 'Կենտրոնական կոնտեյների լայնություն' : 'Ширина контейнера сайта'}
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          {(['max-w-2xl', 'max-w-3xl', 'max-w-4xl'] as const).map((w) => (
                            <button
                              key={w}
                              type="button"
                              onClick={() => onSaveSiteConfig({ ...siteConfig, containerWidth: w })}
                              className={`py-1.5 px-2.5 rounded-lg text-xs font-mono font-bold border cursor-pointer ${
                                siteConfig.containerWidth === w
                                  ? 'bg-emerald-600 text-white border-emerald-500'
                                  : 'bg-slate-900 text-slate-400 border-slate-800'
                              }`}
                            >
                              {w}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-white">
                          {isHy ? 'Էջի Սեկցիաների Հերթականություն' : 'Порядок и видимость блоков главной страницы'}
                        </h4>
                        <button
                          type="button"
                          onClick={() =>
                            onSaveSiteConfig({
                              ...siteConfig,
                              sections: DEFAULT_SITE_CONFIG.sections,
                            })
                          }
                          className="text-[11px] text-slate-400 hover:text-emerald-400 cursor-pointer"
                        >
                          {isHy ? 'Վերականգնել' : 'Сбросить порядок'}
                        </button>
                      </div>

                      <div className="space-y-1.5">
                        {siteConfig.sections.map((section, idx) => (
                          <div
                            key={section.id}
                            className={`flex items-center justify-between p-2.5 rounded-lg border text-xs ${
                              section.enabled
                                ? 'bg-slate-900 border-slate-800 text-white'
                                : 'bg-slate-950 border-slate-900 text-slate-500'
                            }`}
                          >
                            <span className="font-semibold">
                              {idx + 1}. {isHy ? section.nameHy : section.nameRu}
                            </span>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                disabled={idx === 0}
                                onClick={() =>
                                  onSaveSiteConfig({
                                    ...siteConfig,
                                    sections: moveSection(siteConfig.sections, idx, 'up'),
                                  })
                                }
                                className="p-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 cursor-pointer"
                              >
                                <ArrowUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                disabled={idx === siteConfig.sections.length - 1}
                                onClick={() =>
                                  onSaveSiteConfig({
                                    ...siteConfig,
                                    sections: moveSection(siteConfig.sections, idx, 'down'),
                                  })
                                }
                                className="p-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 cursor-pointer"
                              >
                                <ArrowDown className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  onSaveSiteConfig({
                                    ...siteConfig,
                                    sections: toggleSection(siteConfig.sections, section.id),
                                  })
                                }
                                className={`p-1 rounded cursor-pointer ${
                                  section.enabled ? 'text-emerald-400 bg-emerald-950/60' : 'text-slate-500 bg-slate-800'
                                }`}
                              >
                                {section.enabled ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* ПОДВКЛАДКА 2: БРЕНД, PROMO BAR И КОНТАКТЫ */}
                {cmsSubTab === 'brand_contacts' && onSaveSiteConfig && (
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                      <h4 className="text-xs font-bold text-white">
                        {isHy ? 'Խանութի Անվանում, Կարգախոս և Գովազդային Շերտ' : 'Название магазина, слоган и верхняя строка Promo Bar'}
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div>
                          <label className="block text-[10px] text-slate-400 mb-1">Անվանում (Հայերեն)</label>
                          <input
                            type="text"
                            value={siteConfig.storeTitleHy}
                            onChange={(e) => onSaveSiteConfig({ ...siteConfig, storeTitleHy: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-400 mb-1">Название (Русский)</label>
                          <input
                            type="text"
                            value={siteConfig.storeTitleRu}
                            onChange={(e) => onSaveSiteConfig({ ...siteConfig, storeTitleRu: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-400 mb-1">Promo Bar (Հայերեն)</label>
                          <input
                            type="text"
                            value={siteConfig.promoBar.textHy}
                            onChange={(e) =>
                              onSaveSiteConfig({
                                ...siteConfig,
                                promoBar: { ...siteConfig.promoBar, textHy: e.target.value },
                              })
                            }
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-400 mb-1">Promo Bar (Русский)</label>
                          <input
                            type="text"
                            value={siteConfig.promoBar.textRu}
                            onChange={(e) =>
                              onSaveSiteConfig({
                                ...siteConfig,
                                promoBar: { ...siteConfig.promoBar, textRu: e.target.value },
                              })
                            }
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                      <h4 className="text-xs font-bold text-white">
                        {isHy ? 'Կոնտակտային Տվյալներ և Առաքման Պայմաններ' : 'Контакты магазина и бесплатная доставка'}
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                        <div>
                          <label className="block text-[10px] text-slate-400 mb-1">Телефон</label>
                          <input
                            type="text"
                            value={siteConfig.contact.phone}
                            onChange={(e) =>
                              onSaveSiteConfig({
                                ...siteConfig,
                                contact: { ...siteConfig.contact, phone: e.target.value },
                              })
                            }
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-400 mb-1">Email</label>
                          <input
                            type="email"
                            value={siteConfig.contact.email}
                            onChange={(e) =>
                              onSaveSiteConfig({
                                ...siteConfig,
                                contact: { ...siteConfig.contact, email: e.target.value },
                              })
                            }
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-400 mb-1">Telegram</label>
                          <input
                            type="text"
                            value={siteConfig.contact.telegram}
                            onChange={(e) =>
                              onSaveSiteConfig({
                                ...siteConfig,
                                contact: { ...siteConfig.contact, telegram: e.target.value },
                              })
                            }
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ПОДВКЛАДКА 3: ПРОМО-БАННЕРЫ */}
                {cmsSubTab === 'banners' && onSaveSiteConfig && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400">
                        {isHy ? 'Գլխավոր էջի սլայդեր-բաններներ' : 'Слайды главного баннера витрины'}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const newSlide: HeroSlide = {
                            id: `slide_${Date.now()}`,
                            titleHy: 'Նոր հատուկ ակցիա',
                            titleRu: 'Новая промо-акция',
                            subtitleHy: '100% գնումները դառնում են 10% ցմահ դեպոզիտ:',
                            subtitleRu: '100% покупок от 10 000 ֏ становятся 10% пожизненным депозитом.',
                            badgeHy: '⚡ Ակցիա',
                            badgeRu: '⚡ Акция',
                            ctaTextHy: 'Գնումներ',
                            ctaTextRu: 'К покупкам',
                            ctaAction: 'catalog',
                            imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80',
                            bgGradient: 'from-emerald-900/60 to-slate-900',
                          };
                          onSaveSiteConfig({
                            ...siteConfig,
                            heroSlides: [...siteConfig.heroSlides, newSlide],
                          });
                        }}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer"
                      >
                        + {isHy ? 'Ավելացնել բաններ' : 'Добавить слайд'}
                      </button>
                    </div>

                    {siteConfig.heroSlides.map((slide, idx) => (
                      <div
                        key={slide.id}
                        className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white">
                            #{idx + 1} · {isHy ? slide.titleHy : slide.titleRu}
                          </span>
                          {siteConfig.heroSlides.length > 1 && (
                            <button
                              type="button"
                              onClick={() =>
                                onSaveSiteConfig({
                                  ...siteConfig,
                                  heroSlides: siteConfig.heroSlides.filter((s) => s.id !== slide.id),
                                })
                              }
                              className="text-rose-400 hover:text-rose-300 cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={slide.titleHy}
                            onChange={(e) =>
                              onSaveSiteConfig({
                                ...siteConfig,
                                heroSlides: siteConfig.heroSlides.map((s) =>
                                  s.id === slide.id ? { ...s, titleHy: e.target.value } : s
                                ),
                              })
                            }
                            className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white"
                            placeholder="Վերնագիր (Հայ.)"
                          />
                          <input
                            type="text"
                            value={slide.titleRu}
                            onChange={(e) =>
                              onSaveSiteConfig({
                                ...siteConfig,
                                heroSlides: siteConfig.heroSlides.map((s) =>
                                  s.id === slide.id ? { ...s, titleRu: e.target.value } : s
                                ),
                              })
                            }
                            className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white"
                            placeholder="Заголовок (Рус.)"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* ПОДВКЛАДКА 4: УПРАВЛЕНИЕ ОТЗЫВАМИ И FAQ */}
                {cmsSubTab === 'reviews_faq' && onSaveSiteConfig && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Модерация Отзывов */}
                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                      <h4 className="text-xs font-bold text-white flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-emerald-400" />
                        <span>{isHy ? `Կարծիքների Կառավարում (${siteConfig.reviews.length})` : `Управление отзывами (${siteConfig.reviews.length})`}</span>
                      </h4>

                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          if (!newReviewAuthor.trim() || !newReviewTextHy.trim()) return;
                          const created = {
                            id: `rev_${Date.now()}`,
                            author: newReviewAuthor.trim(),
                            rating: newReviewRating,
                            textHy: newReviewTextHy.trim(),
                            textRu: newReviewTextRu.trim() || newReviewTextHy.trim(),
                            date: new Date().toLocaleDateString(isHy ? 'hy-AM' : 'ru-RU'),
                            verified: true,
                          };
                          onSaveSiteConfig({
                            ...siteConfig,
                            reviews: [created, ...siteConfig.reviews],
                          });
                          setNewReviewAuthor('');
                          setNewReviewTextHy('');
                          setNewReviewTextRu('');
                        }}
                        className="space-y-2 p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs"
                      >
                        <div className="flex gap-2">
                          <input
                            type="text"
                            required
                            placeholder={isHy ? 'Հեղինակի անուն *' : 'Имя автора *'}
                            value={newReviewAuthor}
                            onChange={(e) => setNewReviewAuthor(e.target.value)}
                            className="flex-1 bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-white"
                          />
                          <select
                            value={newReviewRating}
                            onChange={(e) => setNewReviewRating(Number(e.target.value))}
                            className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-amber-300 font-bold"
                          >
                            <option value={5}>5 ★</option>
                            <option value={4}>4 ★</option>
                            <option value={3}>3 ★</option>
                          </select>
                        </div>
                        <input
                          type="text"
                          required
                          placeholder={isHy ? 'Կարծիքի տեքստ (Հայերեն) *' : 'Текст отзыва (Арм./Рус.) *'}
                          value={newReviewTextHy}
                          onChange={(e) => setNewReviewTextHy(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-white"
                        />
                        <button
                          type="submit"
                          className="w-full py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer"
                        >
                          + {isHy ? 'Ավելացնել հաստատված կարծիք' : 'Опубликовать проверенный отзыв'}
                        </button>
                      </form>

                      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                        {siteConfig.reviews.map((rev) => (
                          <div
                            key={rev.id}
                            className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-start justify-between gap-2 text-xs"
                          >
                            <div>
                              <div className="font-bold text-white flex items-center gap-1.5">
                                <span>{rev.author}</span>
                                <span className="text-amber-400">{'★'.repeat(rev.rating)}</span>
                              </div>
                              <p className="text-[11px] text-slate-300 mt-0.5">
                                {isHy ? rev.textHy : rev.textRu}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                onSaveSiteConfig({
                                  ...siteConfig,
                                  reviews: siteConfig.reviews.filter((r) => r.id !== rev.id),
                                })
                              }
                              className="text-rose-400 hover:text-rose-300 p-1 cursor-pointer shrink-0"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Управление FAQ */}
                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                      <h4 className="text-xs font-bold text-white flex items-center gap-2">
                        <HelpCircle className="w-4 h-4 text-sky-400" />
                        <span>{isHy ? `Հաճախ տրվող հարցեր (${siteConfig.faqs.length})` : `Вопросы и ответы FAQ (${siteConfig.faqs.length})`}</span>
                      </h4>

                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          if (!newFaqQHy.trim() || !newFaqAHy.trim()) return;
                          const createdFaq = {
                            id: `faq_${Date.now()}`,
                            questionHy: newFaqQHy.trim(),
                            questionRu: newFaqQRu.trim() || newFaqQHy.trim(),
                            answerHy: newFaqAHy.trim(),
                            answerRu: newFaqARu.trim() || newFaqAHy.trim(),
                          };
                          onSaveSiteConfig({
                            ...siteConfig,
                            faqs: [createdFaq, ...siteConfig.faqs],
                          });
                          setNewFaqQHy('');
                          setNewFaqQRu('');
                          setNewFaqAHy('');
                          setNewFaqARu('');
                        }}
                        className="space-y-2 p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs"
                      >
                        <input
                          type="text"
                          required
                          placeholder={isHy ? 'Հարց (Հայերեն / Русский) *' : 'Вопрос (Арм./Рус.) *'}
                          value={newFaqQHy}
                          onChange={(e) => setNewFaqQHy(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-white"
                        />
                        <input
                          type="text"
                          required
                          placeholder={isHy ? 'Պատասխան *' : 'Ответ *'}
                          value={newFaqAHy}
                          onChange={(e) => setNewFaqAHy(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-white"
                        />
                        <button
                          type="submit"
                          className="w-full py-1.5 rounded bg-sky-600 hover:bg-sky-500 text-white font-bold cursor-pointer"
                        >
                          + {isHy ? 'Ավելացնել հարց FAQ-ում' : 'Добавить вопрос в FAQ'}
                        </button>
                      </form>

                      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                        {siteConfig.faqs.map((faq) => (
                          <div
                            key={faq.id}
                            className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-start justify-between gap-2 text-xs"
                          >
                            <div>
                              <div className="font-bold text-white">
                                {isHy ? faq.questionHy : faq.questionRu}
                              </div>
                              <p className="text-[11px] text-slate-400 mt-0.5">
                                {isHy ? faq.answerHy : faq.answerRu}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                onSaveSiteConfig({
                                  ...siteConfig,
                                  faqs: siteConfig.faqs.filter((f) => f.id !== faq.id),
                                })
                              }
                              className="text-rose-400 hover:text-rose-300 p-1 cursor-pointer shrink-0"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* =====================================================================
                ВКЛАДКА 7: ФИНАНСОВАЯ ПОЛИТИКА И 10% APY
               ===================================================================== */}
            {activeTab === 'finance' && (
              <div className="space-y-5">
                {/* Регулировка процентной ставки (APY) */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Percent className="w-4 h-4 text-emerald-400" />
                      <h3 className="text-sm font-bold text-white">
                        {isHy ? 'Դեպոզիտի տարեկան տոկոսադրույք (APY)' : 'Годовая ставка депозита (APY)'}
                      </h3>
                    </div>
                    <span className="font-mono text-base font-extrabold text-emerald-400 tabular-nums">
                      {(settings.annualRate * 100).toFixed(0)}% {isHy ? 'տարեկան' : 'годовых'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mb-3">
                    {isHy
                      ? 'Կարգավորեք բոնուսների անընդհատ էմիսիայի արագությունը (լռելյայն՝ 10%)'
                      : 'Регулирует ежесекундную скорость эмиссии бонусов (базовая: 10%)'}
                  </p>

                  {/* Быстрые пресеты ставок */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {[0.05, 0.08, 0.10, 0.15, 0.20, 0.30].map((rate) => (
                      <button
                        key={rate}
                        type="button"
                        onClick={() => handleApplyRate(rate)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                          Math.abs(settings.annualRate - rate) < 0.001
                            ? 'bg-emerald-600 text-white shadow-md shadow-emerald-700/30 ring-2 ring-emerald-400'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                        }`}
                      >
                        {(rate * 100).toFixed(0)}%
                      </button>
                    ))}
                  </div>

                  {/* Произвольная процентная ставка */}
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-800">
                    <span className="text-xs text-slate-400 font-medium">
                      {isHy ? 'Այլ տոկոսադրույք (%):' : 'Произвольная ставка (%):'}
                    </span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        max="100"
                        step="1"
                        value={customRatePercent}
                        onChange={(e) => setCustomRatePercent(e.target.value)}
                        placeholder="10"
                        className="w-20 px-2.5 py-1 text-xs font-mono font-bold bg-slate-900 border border-slate-700 rounded-lg text-emerald-400 focus:outline-none focus:border-emerald-500"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const val = parseFloat(customRatePercent);
                          if (!isNaN(val) && val > 0 && val <= 100) {
                            handleApplyRate(val / 100);
                          }
                        }}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs rounded-lg transition-all cursor-pointer flex items-center gap-1 shadow-sm"
                      >
                        <Check className="w-3.5 h-3.5" />
                        {isHy ? 'Կիրառել' : 'Применить'}
                      </button>
                    </div>
                  </div>

                  {rateChangeFeedback && (
                    <div className="mt-3 p-3 bg-emerald-950/70 border border-emerald-500/50 rounded-xl text-xs text-emerald-300 flex items-start gap-2.5">
                      <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-white">{rateChangeFeedback}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Ручная корректировка балансов администратором */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-4 h-4 text-cyan-400" />
                    <h3 className="text-sm font-bold text-white">
                      {isHy ? 'Ֆինանսական միջոցների ադմինիստրատիվ համալրում' : 'Административная корректировка счетов'}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-400 mb-3">
                    {isHy
                      ? 'Ուղիղ միջամտություն օգտատիրոջ հաշվեկշիռներին փորձարկումների համար'
                      : 'Прямое зачисление на счета активного пользователя'}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
                    <button
                      type="button"
                      onClick={() => setAdjustType('deposit')}
                      className={`py-2 px-3 rounded-lg text-xs font-semibold text-center border transition-all cursor-pointer ${
                        adjustType === 'deposit'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                          : 'bg-slate-900 text-slate-400 border-slate-800'
                      }`}
                    >
                      {isHy ? 'Դեպոզիտ (+֏)' : 'Депозит (+֏)'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdjustType('real')}
                      className={`py-2 px-3 rounded-lg text-xs font-semibold text-center border transition-all cursor-pointer ${
                        adjustType === 'real'
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                          : 'bg-slate-900 text-slate-400 border-slate-800'
                      }`}
                    >
                      {isHy ? 'Իրական հաշվեկշիռ (+֏)' : 'Реальный баланс (+֏)'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdjustType('points')}
                      className={`py-2 px-3 rounded-lg text-xs font-semibold text-center border transition-all cursor-pointer ${
                        adjustType === 'points'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                          : 'bg-slate-900 text-slate-400 border-slate-800'
                      }`}
                    >
                      {isHy ? 'Բոնուսներ (+միավ.)' : 'Бонусы (+баллов)'}
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="100"
                      step="500"
                      value={adjustAmount}
                      onChange={(e) => setAdjustAmount(Number(e.target.value))}
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-amber-500"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        onAdminAdjustBalance(adjustType, adjustAmount);
                      }}
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold transition-all shadow-md cursor-pointer"
                    >
                      {isHy ? 'Գրանցել հաշվեկշռում' : 'Начислить'}
                    </button>
                  </div>
                </div>

                {/* Состояние системы: Заморозка / Активность */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Power className="w-4 h-4 text-rose-400" />
                      <span>{isHy ? 'Համակարգի արտակարգ սառեցում' : 'Экстренная заморозка системы'}</span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      {isHy
                        ? 'Դադարեցնում է բոնուսների նոր հաշվարկները'
                        : 'Временно приостанавливает начисление новых бонусов'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onUpdateSettings({ ...settings, systemFrozen: !settings.systemFrozen })}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      settings.systemFrozen
                        ? 'bg-rose-600 text-white shadow-lg shadow-rose-900/40'
                        : 'bg-slate-800 text-slate-300 hover:text-white border border-slate-700'
                    }`}
                  >
                    {settings.systemFrozen
                      ? isHy
                        ? 'ՍԱՌԵՑՎԱԾ Է'
                        : 'ЗАМОРОЖЕНА'
                      : isHy
                      ? 'ԱԿՏԻՎ Է (նորմալ)'
                      : 'АКТИВНА (норма)'}
                  </button>
                </div>
              </div>
            )}

            {/* =====================================================================
                ВКЛАДКА 8: ЭКВАЙРИНГ, БАНКОВСКИЕ КАРТЫ, API И QR-КОДЫ
               ===================================================================== */}
            {activeTab === 'payment_gateways' && (
              <form onSubmit={handleSavePaymentSettings} className="space-y-5">
                {paymentSaveStatus && (
                  <div className="p-3 bg-emerald-950/70 border border-emerald-500/50 rounded-xl text-xs font-bold text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{paymentSaveStatus}</span>
                  </div>
                )}

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-white flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-emerald-400" />
                      <span>{isHy ? 'Բանկային Քարտերի և API Էկվայրինգի Կարգավորում' : 'Настройки интернет-эквайринга ArCa / Visa / Mastercard'}</span>
                    </h4>
                    <label className="flex items-center gap-1.5 text-xs text-emerald-400 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={cardSettings.enabled}
                        onChange={(e) => setCardSettings({ ...cardSettings, enabled: e.target.checked })}
                        className="accent-emerald-500"
                      />
                      <span>{isHy ? 'Ակտիվ է' : 'Включено'}</span>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">
                        Merchant ID (Идентификатор магазина)
                      </label>
                      <input
                        type="text"
                        value={cardSettings.merchantId}
                        onChange={(e) => setCardSettings({ ...cardSettings, merchantId: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">
                        API Secret Key (Секретный ключ API)
                      </label>
                      <input
                        type="password"
                        value={cardSettings.apiKey}
                        onChange={(e) => setCardSettings({ ...cardSettings, apiKey: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">
                        API Gateway Endpoint (URL шлюза)
                      </label>
                      <input
                        type="url"
                        value={cardSettings.apiEndpoint}
                        onChange={(e) => setCardSettings({ ...cardSettings, apiEndpoint: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono"
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">
                        {isHy ? 'Քարտի համարը' : 'Номер карты магазина'}
                      </label>
                      <input
                        type="text"
                        value={cardSettings.cardNumber}
                        onChange={(e) => setCardSettings({ ...cardSettings, cardNumber: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono text-emerald-300"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">IBAN / Расчетный счет</label>
                      <input
                        type="text"
                        value={cardSettings.iban}
                        onChange={(e) => setCardSettings({ ...cardSettings, iban: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">SWIFT / BIC Code</label>
                      <input
                        type="text"
                        value={cardSettings.swift}
                        onChange={(e) => setCardSettings({ ...cardSettings, swift: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* QR КОДЫ И МОБИЛЬНЫЕ КОШЕЛЬКИ */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-4">
                  <h4 className="text-xs font-bold text-white flex items-center gap-2">
                    <QrCode className="w-4 h-4 text-cyan-400" />
                    <span>{isHy ? 'QR-կոդերի և Էլեկտրոնային դրամապանակների կարգավորում' : 'Настройки QR-кодов (Telcell, Idram, ArCa)'}</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-amber-400">
                        <span>Telcell Wallet QR</span>
                        <input
                          type="checkbox"
                          checked={qrSettings.telcellEnabled}
                          onChange={(e) => setQrSettings({ ...qrSettings, telcellEnabled: e.target.checked })}
                        />
                      </div>
                      <input
                        type="text"
                        value={qrSettings.telcellNumber}
                        onChange={(e) => setQrSettings({ ...qrSettings, telcellNumber: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-xs text-white font-mono"
                      />
                    </div>

                    <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-orange-400">
                        <span>Idram / IDBank QR</span>
                        <input
                          type="checkbox"
                          checked={qrSettings.idramEnabled}
                          onChange={(e) => setQrSettings({ ...qrSettings, idramEnabled: e.target.checked })}
                        />
                      </div>
                      <input
                        type="text"
                        value={qrSettings.idramId}
                        onChange={(e) => setQrSettings({ ...qrSettings, idramId: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-xs text-white font-mono"
                      />
                    </div>

                    <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-cyan-400">
                        <span>ArCa Pay QR</span>
                        <input
                          type="checkbox"
                          checked={qrSettings.arcaEnabled}
                          onChange={(e) => setQrSettings({ ...qrSettings, arcaEnabled: e.target.checked })}
                        />
                      </div>
                      <input
                        type="text"
                        value={qrSettings.arcaAccount}
                        onChange={(e) => setQrSettings({ ...qrSettings, arcaAccount: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-xs text-white font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs rounded-xl transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>{isHy ? 'Պահպանել վճարային կարգավորումները' : 'Сохранить настройки платежей & QR'}</span>
                  </button>
                </div>
              </form>
            )}

            {/* =====================================================================
                ВКЛАДКА 9: EMAIL УВЕДОМЛЕНИЯ ПРИ ЗАКАЗЕ И ОПЛАТЕ
               ===================================================================== */}
            {activeTab === 'notifications' && (
              <div className="space-y-4">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                  <h4 className="text-xs font-bold text-white flex items-center gap-2">
                    <Mail className="w-4 h-4 text-sky-400" />
                    <span>{isHy ? 'Email Ծանուցումների Կարգավորումներ' : 'Настройки Email-уведомлений владельцу и покупателям'}</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">
                        {isHy ? 'Ադմինիստրատորի Email (Սեփականատեր) *' : 'Email владельца/администратора *'}
                      </label>
                      <input
                        type="email"
                        value={settings.adminNotificationEmail || 'araik1415@gmail.com'}
                        onChange={(e) =>
                          onUpdateSettings({
                            ...settings,
                            adminNotificationEmail: e.target.value,
                          })
                        }
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono"
                      />
                    </div>

                    <div className="space-y-2 pt-1">
                      <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.emailNotificationsEnabled !== false}
                          onChange={(e) =>
                            onUpdateSettings({
                              ...settings,
                              emailNotificationsEnabled: e.target.checked,
                            })
                          }
                        />
                        <span>{isHy ? 'Ուղարկել ադմինիստրատորին ամեն պատվերից հետո' : 'Оповещать администратора о заказах и оплатах'}</span>
                      </label>

                      <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.sendCustomerOrderReceiptEmail !== false}
                          onChange={(e) =>
                            onUpdateSettings({
                              ...settings,
                              sendCustomerOrderReceiptEmail: e.target.checked,
                            })
                          }
                        />
                        <span>{isHy ? 'Ուղարկել էլեկտրոնային չեկ գնորդի էլ. հասցեին' : 'Отправлять электронный чек покупателю'}</span>
                      </label>
                    </div>
                  </div>

                  {/* Тестовая отправка */}
                  <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="email"
                        value={testEmailAddress}
                        onChange={(e) => setTestEmailAddress(e.target.value)}
                        className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono w-60"
                      />
                      <button
                        type="button"
                        disabled={isSendingTestEmail}
                        onClick={async () => {
                          setIsSendingTestEmail(true);
                          setTestSendStatus(null);
                          try {
                            await sendOrderNotificationEmail({
                              orderNumber: `TEST-${Math.floor(1000 + Math.random() * 9000)}`,
                              items: [
                                {
                                  productName: isHy ? 'Թեստային ապրանք' : 'Тестовый товар',
                                  quantity: 1,
                                  priceDram: 5000,
                                  totalDram: 5000,
                                  unit: 'հատ',
                                },
                              ],
                              totalDram: 5000,
                              paidWith: 'ArCa / Visa',
                              customerName: 'Արաիկ Պետրոսյան (Տեստ)',
                              customerEmail: testEmailAddress || 'araik1415@gmail.com',
                              adminEmail: testEmailAddress || 'araik1415@gmail.com',
                              bonusEarned: 250,
                              isPaid: true,
                            });
                            setEmailLogs(getStoredEmailLogs());
                            setTestSendStatus(isHy ? 'Թեստային նամակն ուղարկված է!' : 'Тестовое уведомление отправлено!');
                          } catch (err: any) {
                            setTestSendStatus(err?.message || 'Սխալ');
                          } finally {
                            setIsSendingTestEmail(false);
                          }
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-bold cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>{isHy ? 'Ուղարկել թեստային նամակ' : 'Отправить тестовый email'}</span>
                      </button>
                    </div>
                    {testSendStatus && (
                      <span className="text-xs font-semibold text-emerald-400">{testSendStatus}</span>
                    )}
                  </div>
                </div>

                {/* Реестр отправленных писем */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                  <h4 className="text-xs font-bold text-white flex items-center gap-2">
                    <History className="w-4 h-4 text-sky-400" />
                    <span>{isHy ? 'Ուղարկված Email-ների Ռեեստր' : 'Реестр отправленных Email'}</span>
                  </h4>
                  {emailLogs.length === 0 ? (
                    <div className="text-center py-6 text-slate-400 text-xs">
                      {isHy ? 'Դեռևս ուղարկված էլ. ծանուցումներ չկան' : 'Пока нет отправленных уведомлений'}
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                      {emailLogs.map((log) => (
                        <div key={log.id} className="p-3 bg-slate-900 rounded-lg border border-slate-800 text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-white">{log.toEmail}</span>
                            <span className="text-[10px] font-mono text-emerald-400">SENT</span>
                          </div>
                          <div className="text-slate-300">{log.subject}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* =====================================================================
                ВКЛАДКА 10: ЖУРНАЛ АУДИТА ВСЕХ СОБЫТИЙ
               ===================================================================== */}
            {activeTab === 'audit' && (
              <div className="space-y-4">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4 text-emerald-400" />
                        <span>{isHy ? 'Համակարգային Աուդիտի Մատյան' : 'Неизменяемый реестр аудита всех операций'}</span>
                      </h3>
                      <p className="text-xs text-slate-400">
                        {isHy
                          ? 'Բոլոր գործառնությունները գրանցվում են ժամանակային դրոշմով'
                          : 'Каждое финансовое и административное действие зафиксировано в реестре'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleExportAudit}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{isHy ? 'Արտահանել JSON' : 'Экспорт JSON'}</span>
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <div className="relative flex-1 min-w-[200px]">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={auditSearch}
                        onChange={(e) => setAuditSearch(e.target.value)}
                        placeholder={isHy ? 'Որոնել մատյանում...' : 'Поиск по тексту операции...'}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white"
                      />
                    </div>
                    <select
                      value={auditCategoryFilter}
                      onChange={(e) => setAuditCategoryFilter(e.target.value)}
                      className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                    >
                      <option value="all">{isHy ? 'Բոլոր կատեգորիաները' : 'Все категории'}</option>
                      <option value="admin">Admin</option>
                      <option value="deposit">Deposit 10%</option>
                      <option value="dram_purchase">Purchases (֏)</option>
                      <option value="points_purchase">Points</option>
                      <option value="pos_terminal">POS Terminal</option>
                    </select>
                  </div>

                  <div className="space-y-1.5 max-h-96 overflow-y-auto pr-1">
                    {logs
                      .filter((l) => {
                        if (auditCategoryFilter !== 'all' && l.category !== auditCategoryFilter) return false;
                        if (!auditSearch.trim()) return true;
                        return l.text.toLowerCase().includes(auditSearch.toLowerCase());
                      })
                      .map((l) => (
                        <div
                          key={l.id}
                          className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-start justify-between gap-3 text-xs"
                        >
                          <div className="space-y-0.5">
                            <div className="text-slate-200">{l.text}</div>
                            <div className="text-[10px] text-slate-500 font-mono tabular-nums">
                              {l.time} · {l.category.toUpperCase()} · Депозит: {formatDram(l.depositSnapshot)}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}

            {/* =====================================================================
                ВКЛАДКА 11: АРХИВ И ВОССТАНОВЛЕНИЕ (DISASTER RECOVERY & JSON BACKUP)
               ===================================================================== */}
            {activeTab === 'archive' && (
              <div className="space-y-4">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Download className="w-4 h-4 text-emerald-400" />
                      <span>{isHy ? 'Ամբողջական համակարգի Бэкап (JSON)' : 'Полная резервная копия всей системы (JSON Бэкап)'}</span>
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      {isHy
                        ? 'Պահպանեք բոլոր ապրանքները, կայքի դիզայնը, հաճախորդներին, աուդիտը և արխիվը մեկ ֆայլում'
                        : 'Экспорт всех товаров, категорий, дизайна сайта, клиентов, настроек и архива в один файл'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const fullBackup = {
                          timestamp: Date.now(),
                          version: '2000.6.0',
                          settings,
                          siteConfig,
                          categories,
                          products,
                          logs,
                          customers,
                          systemArchive,
                        };
                        const dataStr =
                          'data:text/json;charset=utf-8,' +
                          encodeURIComponent(JSON.stringify(fullBackup, null, 2));
                        const dl = document.createElement('a');
                        dl.setAttribute('href', dataStr);
                        dl.setAttribute('download', `system2000_full_backup_${Date.now()}.json`);
                        document.body.appendChild(dl);
                        dl.click();
                        dl.remove();
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{isHy ? 'Ներբեռնել Бэкап' : 'Скачать Бэкап'}</span>
                    </button>

                    <input
                      type="file"
                      ref={fileInputRef}
                      accept=".json"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          try {
                            const parsed = JSON.parse(event.target?.result as string);
                            if (onImportBackup) {
                              onImportBackup(parsed);
                            }
                          } catch (err) {
                            console.warn('Invalid JSON backup file', err);
                          }
                        };
                        reader.readAsText(file);
                      }}
                    />

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold transition-colors cursor-pointer border border-slate-700"
                    >
                      <Upload className="w-3.5 h-3.5 text-sky-400" />
                      <span>{isHy ? 'Վերականգնել ֆայլից' : 'Восстановить из JSON'}</span>
                    </button>
                  </div>
                </div>

                {/* Поиск и фильтры по архиву */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
                  <div className="relative w-full sm:w-64">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
                    <input
                      type="text"
                      placeholder={isHy ? 'Փնտրել արխիվում...' : 'Поиск по архиву...'}
                      value={archiveSearch}
                      onChange={(e) => setArchiveSearch(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500"
                    />
                  </div>

                  <div className="flex items-center gap-1.5 w-full sm:w-auto">
                    {['all', 'product', 'customer_account', 'log_item'].map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setArchiveFilterType(t)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${
                          archiveFilterType === t
                            ? 'bg-purple-600 text-white font-bold'
                            : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {t === 'all'
                          ? isHy
                            ? 'Բոլորը'
                            : 'Все'
                          : t === 'product'
                          ? isHy
                            ? 'Ապրանքներ'
                            : 'Товары'
                          : t === 'customer_account'
                          ? isHy
                            ? 'Մասնակիցներ'
                            : 'Клиенты'
                          : isHy
                          ? 'Գրառումներ'
                          : 'Логи'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Список элементов в Системном Архиве */}
                <div className="space-y-2 max-h-[45vh] overflow-y-auto pr-1">
                  {systemArchive.length === 0 ? (
                    <div className="p-8 text-center bg-slate-950 rounded-xl border border-slate-800 text-slate-400 text-xs">
                      <Archive className="w-8 h-8 text-slate-600 mx-auto mb-2 opacity-50" />
                      <div>{isHy ? 'Արխիվում ջնջված օբյեկտներ չկան:' : 'В Системном Архиве нет удаленных объектов.'}</div>
                    </div>
                  ) : (
                    systemArchive
                      .filter((item) => {
                        if (archiveFilterType !== 'all' && item.type !== archiveFilterType) return false;
                        if (!archiveSearch.trim()) return true;
                        const q = archiveSearch.toLowerCase();
                        return item.title.toLowerCase().includes(q) || item.type.toLowerCase().includes(q);
                      })
                      .map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-purple-500/40 transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 shrink-0">
                              <Archive className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-xs text-white truncate">{item.title}</span>
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-slate-800 text-purple-300 border border-purple-500/30">
                                  {item.type}
                                </span>
                              </div>
                              <div className="text-[10px] text-slate-400 mt-0.5">
                                {isHy ? 'Ջնջվել է՝' : 'Удалено:'} {item.deletedAt}
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => onRestoreFromArchive && onRestoreFromArchive(item.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow cursor-pointer shrink-0"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>{isHy ? 'Վերականգնել' : 'Восстановить'}</span>
                          </button>
                        </div>
                      ))
                  )}
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};
