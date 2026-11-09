/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { Header } from './components/Header';
import { BalanceCard } from './components/BalanceCard';
import { DepositPanel } from './components/DepositPanel';
import { Catalog } from './components/Catalog';
import { HistoryLog } from './components/HistoryLog';
import { AuthModal } from './components/AuthModal';
import { AdminPanelModal } from './components/AdminPanelModal';
import { AiStudioHubModal } from './components/AiStudioHubModal';
import { CartDrawer } from './components/CartDrawer';
import { PaymentModal } from './components/PaymentModal';
import { RuleExplanationModal } from './components/RuleExplanationModal';
import { UserAgreementModal } from './components/UserAgreementModal';
import { PersonalCabinetModal } from './components/PersonalCabinetModal';
import { PromoBar } from './components/PromoBar';
import { HeroBanner } from './components/HeroBanner';
import { FeaturedDeals } from './components/FeaturedDeals';
import { TrustBadges } from './components/TrustBadges';
import { ReviewsSection } from './components/ReviewsSection';
import { FaqSection } from './components/FaqSection';
import { StoreFooter } from './components/StoreFooter';
import { DeliveryTrackingModal, LiveDeliveryBanner } from './components/DeliveryTrackingModal';

// Code-split heavy 3D and subsystem modals so initial page load is instantaneous
const Warehouse3DScene = React.lazy(() => import('./components/Warehouse3DScene').then(m => ({ default: m.Warehouse3DScene })));
const BonusRunnerGame = React.lazy(() => import('./components/BonusRunnerGame').then(m => ({ default: m.BonusRunnerGame })));
const SupplierPortalModal = React.lazy(() => import('./components/SupplierPortalModal').then(m => ({ default: m.SupplierPortalModal })));
const SiteBuilderModal = React.lazy(() => import('./components/SiteBuilderModal').then(m => ({ default: m.SiteBuilderModal })));
const PosTerminalModal = React.lazy(() => import('./components/PosTerminalModal').then(m => ({ default: m.PosTerminalModal })));
const Erp1CModal = React.lazy(() => import('./components/Erp1CModal').then(m => ({ default: m.Erp1CModal })));
const GeminiChatbotModal = React.lazy(() => import('./components/GeminiChatbotModal').then(m => ({ default: m.GeminiChatbotModal })));
const PartnerPortalModal = React.lazy(() => import('./components/PartnerPortalModal').then(m => ({ default: m.PartnerPortalModal })));
const ScannerModal = React.lazy(() => import('./components/ScannerModal').then(m => ({ default: m.ScannerModal })));
import { Ai3dShowcaseModal } from './components/Ai3dShowcaseModal';


import { useAuth } from './context/AuthContext';
import { db, doc, setDoc } from './firebase/config';
import { Bot, Percent, X, Sparkles } from 'lucide-react';
import { INITIAL_PRODUCTS } from './data/products';
import { INITIAL_CUSTOMERS } from './data/initialCustomers';
import {
  sendOrderNotificationEmail,
  sendTopupNotificationEmail,
  sendAnnualRateChangeNotificationEmail,
} from './services/notificationService';
import {
  ProductItem,
  LogItem,
  LogCategory,
  UserProfile,
  Language,
  AdminSettings,
  SiteConfig,
  SectionId,
  StoreReview,
  CustomerAccount,
  CustomerPurchase,
  CustomerPurchaseItem,
  AccountType,
  SystemArchiveItem,
  ProductCategory,
} from './types';
import { loadStoredCategories, saveStoredCategories } from './data/categories';
import {
  WalletState,
  createInitialWalletState,
  applyTick,
  processDeposit,
  processRealBalanceTopup,
  processPointsPurchase,
  confirmCooldownPassed,
  processReturnRefund,
  MIN_PURCHASE_FOR_DEPOSIT,
  RETURN_COOLDOWN_MS,
  formatDram,
} from './utils/finance';
import { countFinancialTransactions } from './utils/time';
import { CartItem, calculateCartTotals, PaymentMethodId, PaymentPurpose } from './utils/payment';
import { DEFAULT_SITE_CONFIG, THEMES } from './utils/builder';
import { PosFiscalReceipt } from './utils/pos';
import { ErpState } from './types/erp';
import { createInitialErpState, postErpDocument, generateNextDocNumber } from './utils/erpEngine';
import {
  DeliveryOrder,
  DeliveryStage,
  INITIAL_LIVE_DELIVERIES,
  advanceDeliveryTick,
  updateDeliveryStage,
  createDeliveryFromPurchase,
} from './utils/deliveryTracking';

const STORAGE_KEY = 'sistema_2000_wallet_dram_v5';
const LOGS_STORAGE_KEY = 'sistema_2000_logs_dram_v5';
const USER_STORAGE_KEY = 'sistema_2000_user_v5';
const PRODUCTS_STORAGE_KEY = 'sistema_2000_products_v5';
const SETTINGS_STORAGE_KEY = 'sistema_2000_admin_settings_v5';
const CART_STORAGE_KEY = 'sistema_2000_cart_v5';
const SITE_CONFIG_STORAGE_KEY = 'sistema_2000_site_config_v1';
const ERP_STORAGE_KEY = 'sistema_2000_erp_v5';
const CUSTOMERS_STORAGE_KEY = 'sistema_2000_customers_v5';
const ARCHIVE_STORAGE_KEY = 'sistema_2000_archive_v5';
const DELIVERIES_STORAGE_KEY = 'sistema_2000_deliveries_v1';


export default function App() {
  const [lang, setLang] = useState<Language>('hy'); // Լռելյայն հայերեն
  const { user, profile, updateWallet } = useAuth();
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);

  // Ադմինիստրատիվ կարգավորումներ
  const [adminSettings, setAdminSettings] = useState<AdminSettings>(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // ignore
    }
    return {
      annualRate: 0.10, // 10%
      systemFrozen: false,
      welcomeBonusAmount: 500,
      bonusMultiplier: 1.0,
      adminNotificationEmail: 'araik1415@gmail.com',
      emailNotificationsEnabled: true,
      sendCustomerOrderReceiptEmail: true,
      bankCardsConfig: {
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
      },
      qrPaymentConfig: {
        telcellEnabled: true,
        telcellNumber: '+374 91 123456',
        telcellQrPayload: 'TELCELL:PAY?wallet=091123456&merchant=Sistema2000',
        idramEnabled: true,
        idramId: '123456789',
        idramQrPayload: 'IDRAM:PAY?id=123456789&merchant=Sistema2000',
        arcaEnabled: true,
        arcaAccount: '220001234567',
        arcaQrPayload: 'ARCA:PAY?account=220001234567&merchant=Sistema2000',
      },
    };

  });

  // Օգտատիրոջ պրոֆիլ
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem(USER_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // ignore
    }
    return {
      id: 'usr_araik',
      name: 'Արայիկ Պետրոսյան',
      emailOrPhone: '+374 91 123456',
      isLoggedIn: true,
      registeredAt: new Date().toLocaleDateString('hy-AM'),
      isAdmin: true,
      totalUsageSeconds: 980,
      agreementAccepted: true,
      agreementAcceptedAt: '12.01.2026',
    };
  });

  // Օգտագործման ընդհանուր վայրկյաններ
  const [usageSeconds, setUsageSeconds] = useState<number>(() => currentUser.totalUsageSeconds || 980);

  // Կատալոգի ապրանքներ (նկարներով)
  const [products, setProducts] = useState<ProductItem[]>(() => {
    try {
      const saved = localStorage.getItem(PRODUCTS_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // ignore
    }
    return INITIAL_PRODUCTS;
  });

  // Զամբյուղ (Cart)
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // ignore
    }
    return [];
  });

  // Դրամապանակի վիճակ (Իրական հաշվեկշիռ, Դեպոզիտ, Բոնուսներ)
  const [wallet, setWallet] = useState<WalletState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...parsed,
          realBalance: parsed.realBalance ?? 35000,
          deposit: parsed.deposit ?? 15000,
          lastTick: Date.now(),
        };
      }
    } catch (e) {
      console.warn('Failed to load wallet state from storage', e);
    }
    return createInitialWalletState(0, 0, 0);
  });

  // Սինքրոնիզացիա Firestore տվյալների բազայի հետ
  useEffect(() => {
    if (profile) {
      setWallet((prev) => ({
        ...prev,
        realBalance: profile.realBalance,
        deposit: profile.deposit,
        bonusPoints: profile.bonusPoints,
        lastTick: profile.lastAccrualTimestamp || prev.lastTick,
      }));
    }
  }, [profile]);

  // Գործառնությունների պատմություն
  const [logs, setLogs] = useState<LogItem[]>(() => {
    try {
      const saved = localStorage.getItem(LOGS_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to load logs', e);
    }
    return [
      {
        id: 'initial',
        time: new Date().toLocaleTimeString('hy-AM'),
        timestamp: Date.now(),
        text: '«Համակարգ 2000» դրամապանակը և առցանց խանութը ակտիվացված են:',
        category: 'system',
        depositSnapshot: 15000,
        pointsSnapshot: 50.0,
        realBalanceSnapshot: 35000,
      },
    ];
  });

  // Մոդալներ
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const [isAgreementOpen, setIsAgreementOpen] = useState(false);
  const [isCabinetOpen, setIsCabinetOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isAiStudioOpen, setIsAiStudioOpen] = useState(false);
  const [is3DWarehouseOpen, setIs3DWarehouseOpen] = useState(false);
  const [isGameOpen, setIsGameOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isAndroidInstallOpen, setIsAndroidInstallOpen] = useState(false);
  const [isSupplierPortalOpen, setIsSupplierPortalOpen] = useState(false);
  const [pendingSupplierProducts, setPendingSupplierProducts] = useState<import('./types').PendingSupplierProduct[]>([]);
  const [returnDisputes, setReturnDisputes] = useState<import('./types').ReturnDispute[]>([]);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [isPosOpen, setIsPosOpen] = useState(false);
  const [isErpOpen, setIsErpOpen] = useState(false);
  const [isPartnerModalOpen, setIsPartnerModalOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [is3dShowcaseOpen, setIs3dShowcaseOpen] = useState(false);
  const [isDeliveryTrackerOpen, setIsDeliveryTrackerOpen] = useState(false);
  const [trackingOrderNumber, setTrackingOrderNumber] = useState<string | null>(null);

  // Живая система онлайн-отслеживания доставки (GPS LIVE)
  const [deliveries, setDeliveries] = useState<DeliveryOrder[]>(() => {
    try {
      const saved = localStorage.getItem(DELIVERIES_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return INITIAL_LIVE_DELIVERIES;
  });

  // Կատեգորիաներ
  const [categories, setCategories] = useState<ProductCategory[]>(loadStoredCategories);

  // 1C:Enterprise ERP & Управление Складом & Бухгалтерия
  const [erpState, setErpState] = useState<ErpState>(() => {
    try {
      const saved = localStorage.getItem(ERP_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // ignore
    }
    return createInitialErpState(INITIAL_PRODUCTS);
  });

  // Կայքի Կոնստրուկտորի կարգավորումներ (Դիզայն, սեկցիաներ, բաններներ)
  const [siteConfig, setSiteConfig] = useState<SiteConfig>(() => {
    try {
      const saved = localStorage.getItem(SITE_CONFIG_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // ignore
    }
    return DEFAULT_SITE_CONFIG;
  });

  // Համակարգ 2000 - Մասնակիցների և Գնորդների Բազա (CRM & Бонусы участников)
  const [customers, setCustomers] = useState<CustomerAccount[]>(() => {
    try {
      const saved = localStorage.getItem(CUSTOMERS_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // ignore
    }
    return INITIAL_CUSTOMERS;
  });

  // Համակարգ 2000 - Սիստեմային Արխիվ (Disaster Recovery System Archive)
  const [systemArchive, setSystemArchive] = useState<SystemArchiveItem[]>(() => {
    try {
      const saved = localStorage.getItem(ARCHIVE_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // ignore
    }
    return [];
  });

  // Ավտոմատ պահպանում տեղային հիշողության մեջ
  useEffect(() => {
    try {
      localStorage.setItem(CUSTOMERS_STORAGE_KEY, JSON.stringify(customers));
      localStorage.setItem(ARCHIVE_STORAGE_KEY, JSON.stringify(systemArchive));
    } catch (e) {
      // ignore
    }
  }, [customers, systemArchive]);


  const [paymentModal, setPaymentModal] = useState<{
    isOpen: boolean;
    amount: number;
    title: string;
    isCartCheckout?: boolean;
    paymentPurpose?: PaymentPurpose;
    product?: ProductItem;
  } | null>(null);

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [rateChangeNotice, setRateChangeNotice] = useState<{
    oldRate: number;
    newRate: number;
    timestamp: number;
  } | null>(null);
  const isHy = lang === 'hy';

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ message, type });
    toastTimerRef.current = setTimeout(() => setToast(null), 3500);
  }, []);

  const walletRef = useRef(wallet);
  useEffect(() => {
    walletRef.current = wallet;
  }, [wallet]);

  const addLog = useCallback(
    (
      text: string,
      category: LogCategory = 'system',
      deposit?: number,
      points?: number,
      real?: number
    ) => {
      const w = walletRef.current;
      const newEntry: LogItem = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        time: new Date().toLocaleTimeString(isHy ? 'hy-AM' : 'ru-RU'),
        timestamp: Date.now(),
        text,
        category,
        depositSnapshot: deposit ?? w.deposit,
        pointsSnapshot: points ?? w.bonusPoints,
        realBalanceSnapshot: real ?? w.realBalance,
      };
      setLogs((prev) => [newEntry, ...prev.slice(0, 199)]);
    },
    [isHy]
  );

  const handleAddCategory = useCallback(
    (newCat: Omit<ProductCategory, 'id'>) => {
      const created: ProductCategory = {
        ...newCat,
        id: `cat_custom_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        isCustom: true,
        createdAt: new Date().toISOString(),
      };
      setCategories((prev) => {
        const updated = [...prev, created];
        saveStoredCategories(updated);
        return updated;
      });
      addLog(
        isHy
          ? `Ավելացվել է ապրանքի նոր կատեգորիա՝ ${created.nameHy} (${created.nameRu})`
          : `Добавлена новая категория продукции: ${created.nameRu} (${created.nameHy})`,
        'admin'
      );
      showToast(
        isHy
          ? `Կատեգորիան «${created.nameHy}» հաջողությամբ ավելացվել է:`
          : `Категория «${created.nameRu}» успешно добавлена!`,
        'success'
      );
    },
    [addLog, showToast, isHy]
  );

  const handleUpdateCategory = useCallback(
    (id: string, updatedCat: Partial<ProductCategory>) => {
      setCategories((prev) => {
        const updated = prev.map((c) => (c.id === id ? { ...c, ...updatedCat } : c));
        saveStoredCategories(updated);
        return updated;
      });
      showToast(isHy ? 'Կատեգորիան թարմացվել է:' : 'Категория обновлена', 'info');
    },
    [showToast, isHy]
  );

  const handleDeleteCategory = useCallback(
    (id: string) => {
      setCategories((prev) => {
        const cat = prev.find((c) => c.id === id);
        if (cat) {
          showToast(
            isHy ? `Կատեգորիան «${cat.nameHy}» հեռացվել է:` : `Категория «${cat.nameRu}» удалена`,
            'info'
          );
        }
        const updated = prev.filter((c) => c.id !== id);
        saveStoredCategories(updated);
        return updated;
      });
    },
    [showToast, isHy]
  );

  const handleAcceptAgreement = useCallback(() => {
    const acceptedAt = new Date().toLocaleString(isHy ? 'hy-AM' : 'ru-RU');
    setCurrentUser((prev) => ({
      ...prev,
      agreementAccepted: true,
      agreementAcceptedAt: acceptedAt,
    }));

    setCustomers((prevCusts) =>
      prevCusts.map((c) =>
        c.id === currentUser.id || c.email === currentUser.emailOrPhone
          ? { ...c, agreementAccepted: true, agreementAcceptedAt: acceptedAt }
          : c
      )
    );

    addLog(
      isHy
        ? `Էկոհամակարգի օֆերտայի պայմանագիրը (№ SYS-2000) հաջողությամբ ակցեպտավորվել է:`
        : `Договор-оферта экосистемы (№ SYS-2000) успешно акцептован:`,
      'auth'
    );

    setToast({
      message:
        isHy
          ? 'Պայմանագիրը հաջողությամբ ակցեպտավորված է:'
          : 'Договор успешно акцептован и подписан!',
      type: 'success',
    });
  }, [isHy, currentUser.id, currentUser.emailOrPhone, addLog]);

  // Միասնական 1 վրկ տիկեր (Առանց ավելորդ 100մս ռենդերների և 3D պատուհանների ժամանակ դադարով)
  const isHeavyModalOpen =
    is3dShowcaseOpen || is3DWarehouseOpen || isGameOpen || isErpOpen || isAdminOpen || isDeliveryTrackerOpen;
  useEffect(() => {
    const timer = setInterval(() => {
      if (document.hidden || isHeavyModalOpen) return;

      setUsageSeconds((prev) => prev + 1);

      if (!adminSettings.systemFrozen) {
        setWallet((prev) => {
          const effectiveDeposit = prev.activeDeposit !== undefined ? prev.activeDeposit : prev.deposit;
          if (effectiveDeposit <= 0) return prev;
          const now = Date.now();
          const { nextState } = applyTick(prev, now, adminSettings.annualRate);
          return nextState;
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [adminSettings.annualRate, adminSettings.systemFrozen, isHeavyModalOpen]);

  // Պահպանում LocalStorage-ում (Ավտոմատ 3 վրկ պարբերականությամբ՝ առանց UI-ի արգելափակման)
  useEffect(() => {
    const saveTimer = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(walletRef.current));
        localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(logs.slice(0, 80)));
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(currentUser));
        localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(products));
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(adminSettings));
        localStorage.setItem(DELIVERIES_STORAGE_KEY, JSON.stringify(deliveries));
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
        localStorage.setItem(SITE_CONFIG_STORAGE_KEY, JSON.stringify(siteConfig));
        localStorage.setItem(ERP_STORAGE_KEY, JSON.stringify(erpState));
      } catch (e) {
        // ignore
      }
    }, 1500);
    return () => clearTimeout(saveTimer);
  }, [logs, currentUser, products, adminSettings, cart, siteConfig, erpState]);

  // Գործառնություններ զամբյուղի հետ
  const handleAddToCart = useCallback((product: ProductItem, quantity: number = 1) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + quantity } : item
        );
      }
      return [...prev, { product, quantity }];
    });
  }, []);

  const handleBatchAddToCart = useCallback((items: Array<{ product: ProductItem; quantity: number }>) => {
    setCart((prev) => {
      let nextCart = [...prev];
      items.forEach(({ product, quantity }) => {
        const existingIdx = nextCart.findIndex((item) => item.product.id === product.id);
        if (existingIdx >= 0) {
          nextCart[existingIdx] = {
            ...nextCart[existingIdx],
            quantity: nextCart[existingIdx].quantity + quantity,
          };
        } else {
          nextCart.push({ product, quantity });
        }
      });
      return nextCart;
    });

    const totalItemsCount = items.reduce((sum, i) => sum + i.quantity, 0);
    showToast(
      isHy
        ? `AI Օգնականը ${totalItemsCount} ապրանք ավելացրեց Ձեր զամբյուղում!`
        : `AI Ассистент добавил ${totalItemsCount} товаров в вашу корзину!`,
      'success'
    );
  }, [isHy, showToast]);

  const handleUpdateCartQuantity = useCallback((productId: number, delta: number) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.product.id === productId) {
            const nextQty = item.quantity + delta;
            return nextQty > 0 ? { ...item, quantity: nextQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  }, []);

  const handleRemoveCartItem = useCallback((productId: number) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  }, []);

  const handleClearCart = useCallback(() => {
    setCart([]);
  }, []);

  // Գնումների արձանագրում մասնակցի քարտում (CRM Purchase & History Engine)
  const recordCustomerOrder = useCallback(
    (
      items: CustomerPurchaseItem[],
      totalDram: number,
      paymentMethod: CustomerPurchase['paidWith'],
      bonusEarned: number,
      bonusSpent: number = 0,
      receiptNumber?: string
    ) => {
      const activeCustomerId = currentUser.id || 'usr_araik';
      const orderId = receiptNumber || `ord_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      const now = Date.now();

      const newPurchase: CustomerPurchase = {
        id: orderId,
        orderNumber: orderId,
        date: new Date().toLocaleDateString(isHy ? 'hy-AM' : 'ru-RU'),
        timestamp: now,
        totalAmountDram: totalDram,
        paidWith: paymentMethod,
        bonusPointsEarned: bonusEarned,
        pointsUsed: bonusSpent,
        items,
        status: 'completed',
      };

      setCustomers((prevCustomers) =>
        prevCustomers.map((cust) => {
          if (cust.id !== activeCustomerId) return cust;

          const updatedPurchases = [newPurchase, ...cust.purchases];
          const newBonusPoints = Number((Math.max(0, cust.bonusPoints + bonusEarned - bonusSpent)).toFixed(2));
          const newTotalSpent = cust.totalSpentDram + totalDram;

          const newLedgerEntries = [...cust.ledger];
          if (totalDram > 0) {
            newLedgerEntries.unshift({
              id: `tx_${now}_pur`,
              userId: cust.id,
              type: 'PURCHASE',
              amount: totalDram,
              fromAccount: 'REAL_BALANCE',
              toAccount: 'EXTERNAL_SYSTEM',
              timestamp: now,
            });
          }
          if (bonusEarned > 0) {
            newLedgerEntries.unshift({
              id: `tx_${now}_bon`,
              userId: cust.id,
              type: 'BONUS_REWARD',
              amount: bonusEarned,
              fromAccount: 'EXTERNAL_SYSTEM',
              toAccount: 'BONUS_POINTS',
              timestamp: now,
            });
          }

          return {
            ...cust,
            bonusPoints: newBonusPoints,
            totalSpentDram: newTotalSpent,
            purchases: updatedPurchases,
            ledger: newLedgerEntries,
          };
        })
      );

      // Автоматическое создание онлайн-отправления в системе GPS-доставки
      const newLiveDelivery = createDeliveryFromPurchase({
        orderNumber: orderId,
        customerId: activeCustomerId,
        customerName: currentUser.name || 'Հաճախորդ / Клиент',
        customerPhone: currentUser.phone || '+374 91 123456',
        address: 'Ереван, пр. Комитаса 44, кв. 18',
        totalOrderDram: totalDram,
        itemsSummary: items.map((it) => `${it.productName} × ${it.quantity}`),
      });
      setDeliveries((prev) => [newLiveDelivery, ...prev]);

      // Отправка автоматического Email-уведомления при заказе и оплате
      if (adminSettings.emailNotificationsEnabled !== false) {
        sendOrderNotificationEmail({
          orderNumber: orderId,
          items: items.map((it) => ({
            productName: it.productName,
            quantity: it.quantity,
            priceDram: it.priceDram,
            totalDram: it.totalDram,
            unit: it.unit,
          })),
          totalDram,
          paidWith: paymentMethod,
          customerName: currentUser.name || 'Հաճախորդ / Клиент',
          customerEmail: currentUser.emailOrPhone?.includes('@') ? currentUser.emailOrPhone : 'araik1415@gmail.com',
          adminEmail: adminSettings.adminNotificationEmail || 'araik1415@gmail.com',
          bonusEarned,
          bonusSpent,
          isPaid: true,
        }).catch((err) => console.warn('Order email notification error:', err));
      }
    },
    [currentUser.id, currentUser.name, currentUser.phone, currentUser.emailOrPhone, isHy, adminSettings.emailNotificationsEnabled, adminSettings.adminNotificationEmail]
  );

  // Обработчики системы онлайн-отслеживания доставки (GPS LIVE)
  const handleOpenDeliveryTracker = useCallback((orderNumber?: string) => {
    setTrackingOrderNumber(orderNumber || null);
    setIsDeliveryTrackerOpen(true);
  }, []);

  const handleAdvanceDeliveryTick = useCallback((orderId: string, stepPercent: number = 8) => {
    setDeliveries((prev) =>
      prev.map((d) => (d.id === orderId ? advanceDeliveryTick(d, stepPercent) : d))
    );
  }, []);

  const handleUpdateDeliveryStage = useCallback((orderId: string, nextStage: DeliveryStage) => {
    setDeliveries((prev) =>
      prev.map((d) => (d.id === orderId ? updateDeliveryStage(d, nextStage) : d))
    );
  }, []);

  const handleSendDeliveryChat = useCallback(
    (orderId: string, text: string, sender: 'customer' | 'courier' | 'system' = 'customer') => {
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setDeliveries((prev) =>
        prev.map((d) =>
          d.id === orderId
            ? {
                ...d,
                chatMessages: [
                  ...d.chatMessages,
                  {
                    id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
                    sender,
                    text,
                    time: timeStr,
                  },
                ],
              }
            : d
        )
      );
    },
    []
  );

  const handleUpdateDeliveryDetails = useCallback(
    (
      orderId: string,
      patch: Partial<
        Pick<
          DeliveryOrder,
          'address' | 'entranceNotes' | 'contactless' | 'districtHy' | 'districtRu' | 'destinationCoords'
        >
      >
    ) => {
      setDeliveries((prev) =>
        prev.map((d) => (d.id === orderId ? { ...d, ...patch } : d))
      );
    },
    []
  );

  const handleCreateAdminDelivery = useCallback(
    (params: { orderNumber: string; customerName: string; address: string; feeDram?: number }) => {
      const newDel = createDeliveryFromPurchase({
        orderNumber: params.orderNumber,
        customerId: 'cust_admin',
        customerName: params.customerName,
        address: params.address,
        totalOrderDram: 15000,
        itemsSummary: ['Товары со склада 1С'],
        feeDram: params.feeDram,
      });
      setDeliveries((prev) => [newDel, ...prev]);
    },
    []
  );

  // Ադմինիստրատիվ հաշվեկշռի կարգավորում (բալեր, դեպոզիտ, իրական գումար)
  const handleAdjustCustomer = useCallback(
    (customerId: string, account: AccountType, delta: number, reason: string) => {
      const now = Date.now();
      setCustomers((prev) =>
        prev.map((cust) => {
          if (cust.id !== customerId) return cust;

          let updated = { ...cust };
          if (account === 'BONUS_POINTS') {
            updated.bonusPoints = Number((Math.max(0, updated.bonusPoints + delta)).toFixed(2));
          } else if (account === 'DEPOSIT') {
            updated.deposit = Number((Math.max(0, updated.deposit + delta)).toFixed(2));
          } else if (account === 'REAL_BALANCE') {
            updated.realBalance = Number((Math.max(0, updated.realBalance + delta)).toFixed(2));
          }

          updated.ledger = [
            {
              id: `tx_adj_${now}_${Math.random().toString(36).slice(2, 6)}`,
              userId: cust.id,
              type: 'BONUS_REWARD',
              amount: Math.abs(delta),
              fromAccount: delta >= 0 ? 'EXTERNAL_SYSTEM' : account,
              toAccount: delta >= 0 ? account : 'EXTERNAL_SYSTEM',
              timestamp: now,
            },
            ...updated.ledger,
          ];

          return updated;
        })
      );

      // Սինխրոնացնում ենք ընթացիկ օգտատիրոջ դրամապանակի հետ
      if (customerId === currentUser.id || customerId === 'usr_araik') {
        if (account === 'BONUS_POINTS') {
          setWallet((w) => ({ ...w, bonusPoints: Number((Math.max(0, w.bonusPoints + delta)).toFixed(2)) }));
        } else if (account === 'DEPOSIT') {
          setWallet((w) => ({ ...w, deposit: Number((Math.max(0, w.deposit + delta)).toFixed(2)) }));
        } else if (account === 'REAL_BALANCE') {
          setWallet((w) => ({ ...w, realBalance: Number((Math.max(0, w.realBalance + delta)).toFixed(2)) }));
        }
      }

      showToast(
        isHy
          ? `Հաշիվը փոփոխվեց (${delta > 0 ? '+' : ''}${delta})`
          : `Баланс участника скорректирован (${delta > 0 ? '+' : ''}${delta})`,
        'success'
      );
    },
    [currentUser.id, isHy, showToast]
  );

  // Նշումի ավելացում հաճախորդին
  const handleAddCustomerNote = useCallback((customerId: string, note: string) => {
    setCustomers((prev) =>
      prev.map((c) => (c.id === customerId ? { ...c, notes: note } : c))
    );
  }, []);

  // Համալրման գործողություն (կամ դեպոզիտ, կամ իրական հաշվեկշիռ)
  const handleDeposit = useCallback(
    (amount: number, target: 'deposit' | 'realBalance') => {
      try {
        if (target === 'deposit') {
          const { nextState, logEntry } = processDeposit(wallet, amount, false);
          setWallet(nextState);
          addLog(logEntry, 'deposit', nextState.deposit, nextState.bonusPoints, nextState.realBalance);
          showToast(
            isHy
              ? `Դեպոզիտը հաջողությամբ համալրվեց՝ +${formatDram(amount)}`
              : `Депозит успешно пополнен на ${formatDram(amount)}!`,
            'success'
          );
        } else {
          const { nextState, logEntry } = processRealBalanceTopup(wallet, amount);
          setWallet(nextState);
          addLog(logEntry, 'real_topup', nextState.deposit, nextState.bonusPoints, nextState.realBalance);
          showToast(
            isHy
              ? `Իրական հաշվեկշիռը համալրվեց՝ +${formatDram(amount)}`
              : `Реальный баланс пополнен на ${formatDram(amount)}!`,
            'success'
          );
        }

        // Email-уведомление о пополнении депозита / баланса
        if (adminSettings.emailNotificationsEnabled !== false) {
          sendTopupNotificationEmail({
            amountDram: amount,
            paymentMethod: target === 'deposit' ? '10% Դեպոզիտ (Депозит)' : 'Իրական հաշվեկշիռ (Реальный баланс)',
            customerName: currentUser.name || 'Հաճախորդ / Клиент',
            customerEmail: currentUser.emailOrPhone?.includes('@') ? currentUser.emailOrPhone : 'araik1415@gmail.com',
            adminEmail: adminSettings.adminNotificationEmail || 'araik1415@gmail.com',
          }).catch((err) => console.warn('Topup email notification error:', err));
        }

        confetti({
          particleCount: 40,
          spread: 60,
          origin: { y: 0.7 },
          colors: ['#10b981', '#06b6d4', '#059669'],
        });
      } catch (err: any) {
        showToast(err.message || 'Սխալ', 'error');
      }
    },
    [wallet, addLog, showToast, isHy]
  );

  // Փոխանցում իրական հաշվեկշռից դեպոզիտ
  const handleTransferToDeposit = useCallback(() => {
    if (wallet.realBalance <= 0) {
      showToast(isHy ? 'Իրական հաշվեկշիռը դատարկ է' : 'Реальный баланс пуст', 'error');
      return;
    }
    const transferAmount = Math.min(wallet.realBalance, 10000);
    try {
      const { nextState, logEntry } = processDeposit(wallet, transferAmount, true);
      setWallet(nextState);
      addLog(
        isHy
          ? `Փոխանցում դեպոզիտ՝ ${formatDram(transferAmount)} ➔ Դեպոզիտը դարձավ ${formatDram(nextState.deposit)}`
          : `Перевод на депозит: ${formatDram(transferAmount)} ➔ Итого: ${formatDram(nextState.deposit)}`,
        'deposit',
        nextState.deposit,
        nextState.bonusPoints,
        nextState.realBalance
      );
      showToast(
        isHy
          ? `${formatDram(transferAmount)} փոխանցվեց 10% դեպոզիտի հաշվին`
          : `${formatDram(transferAmount)} переведено на 10% депозит`,
        'success'
      );
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  }, [wallet, addLog, showToast, isHy]);

  // 1-Click վճարում վճարային համակարգով (Idram, Telcell, ArCa)
  const handleQuickBuyGateway = useCallback(
    (product: ProductItem) => {
      const prodName = isHy ? product.nameHy : product.nameRu;
      setPaymentModal({
        isOpen: true,
        amount: product.priceDram,
        title: `${prodName} (${isHy ? product.unitHy : product.unitRu})`,
        isCartCheckout: false,
        paymentPurpose: 'store_purchase',
        product,
      });
    },
    [isHy]
  );

  // Զամբյուղի վճարում վճարային համակարգով (Idram, Telcell, ArCa)
  const handleCheckoutCartPaymentGateway = useCallback(
    (totalDram: number) => {
      const itemsCount = cart.reduce((acc, c) => acc + c.quantity, 0);
      setPaymentModal({
        isOpen: true,
        amount: totalDram,
        title: isHy ? `Գնումների զամբյուղ (${itemsCount} ապրանք)` : `Корзина покупок (${itemsCount} тов.)`,
        isCartCheckout: true,
        paymentPurpose: 'store_purchase',
      });
    },
    [cart, isHy]
  );

  // Զամբյուղի վճարում բոնուսներով
  const handleCheckoutCartPoints = useCallback(
    (totalPoints: number) => {
      if (wallet.bonusPoints < totalPoints) {
        showToast(
          isHy
            ? `Անբավարար բոնուսներ: Պահանջվում է ${totalPoints}, ունեք ${wallet.bonusPoints.toFixed(2)}`
            : `Недостаточно баллов`,
          'error'
        );
        return;
      }

      const itemsCount = cart.reduce((acc, c) => acc + c.quantity, 0);
      setWallet((prev) => ({
        ...prev,
        bonusPoints: prev.bonusPoints - totalPoints,
        totalSpentPoints: prev.totalSpentPoints + totalPoints,
      }));

      addLog(
        isHy
          ? `Զամբյուղի վճարում բոնուսներով՝ ${itemsCount} ապրանք (-${totalPoints} բոնուս)։ Դեպոզիտն անփոփոխ է:`
          : `Оплата корзины баллами: ${itemsCount} товаров (-${totalPoints} баллов). Депозит неизменен.`,
        'points_purchase',
        wallet.deposit,
        wallet.bonusPoints - totalPoints,
        wallet.realBalance
      );

      // 1C ERP: Գրանցում ենք վաճառքի փաստաթուղթը և դուրսգրում պահեստից (1C Stock deduction)
      setErpState((prevErp) => {
        const saleDoc = {
          id: `doc_sale_${Date.now()}`,
          docNumber: generateNextDocNumber('pos_sale', prevErp.documents),
          type: 'pos_sale' as const,
          status: 'posted' as const,
          date: new Date().toLocaleDateString('ru-RU'),
          timestamp: Date.now(),
          warehouseId: 'wh_store',
          cashAccountId: 'acc_cash_desk',
          amountDram: totalPoints,
          comment: isHy ? `Առցանց զամբյուղի վաճառք (${itemsCount} ապրանք, Բոնուս)` : `Продажа через онлайн-магазин (${itemsCount} тов., Бонусы)`,
          author: 'Առցանց Խանութ / Интернет-магазин',
          items: cart.map((c) => ({
            productId: c.product.id,
            productName: c.product.nameRu,
            unit: c.product.unitRu,
            quantity: c.quantity,
            priceDram: c.product.priceDram,
            totalDram: c.product.priceDram * c.quantity,
          })),
        };
        return postErpDocument(prevErp, saleDoc);
      });

      // CRM: Գրանցում ենք պատվերը մասնակցի պատմության մեջ
      recordCustomerOrder(
        cart.map((c) => ({
          productId: c.product.id,
          productName: isHy ? c.product.nameHy : c.product.nameRu,
          quantity: c.quantity,
          priceDram: c.product.priceDram,
          totalDram: c.product.priceDram * c.quantity,
          unit: isHy ? c.product.unitHy : c.product.unitRu,
        })),
        0,
        'points',
        0,
        totalPoints
      );

      setCart([]);
      setIsCartOpen(false);

      showToast(
        isHy
          ? `Զամբյուղը հաջողությամբ վճարվեց բոնուսներով (-${totalPoints} միավոր)! Պահեստից դուրսգրվեց:`
          : `Корзина успешно оплачена баллами! Товар списан со склада.`,
        'success'
      );

      confetti({
        particleCount: 50,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#f59e0b', '#10b981'],
      });
    },
    [wallet, cart, addLog, showToast, isHy, recordCustomerOrder]
  );

  // Գնում առանձին ապրանքի բոնուսային միավորներով
  const handleBuyWithPoints = useCallback(
    (product: ProductItem) => {
      const prodName = isHy ? product.nameHy : product.nameRu;
      const result = processPointsPurchase(wallet, product.pointsCost, prodName);

      if (!result.success) {
        addLog(result.logEntry, 'points_purchase', wallet.deposit, wallet.bonusPoints, wallet.realBalance);
        showToast(
          isHy
            ? `Անբավարար բոնուսներ: Պահանջվում է ${product.pointsCost}, ունեք ${wallet.bonusPoints.toFixed(2)}`
            : `Недостаточно баллов`,
          'error'
        );
        return;
      }

      setWallet(result.nextState);
      addLog(result.logEntry, 'points_purchase', result.nextState.deposit, result.nextState.bonusPoints, result.nextState.realBalance);

      // 1C ERP: դուրսգրում ենք ապրանքը խանութի սրահի պահեստից
      setErpState((prevErp) => {
        const saleDoc = {
          id: `doc_sale_${Date.now()}`,
          docNumber: generateNextDocNumber('pos_sale', prevErp.documents),
          type: 'pos_sale' as const,
          status: 'posted' as const,
          date: new Date().toLocaleDateString('ru-RU'),
          timestamp: Date.now(),
          warehouseId: 'wh_store',
          cashAccountId: 'acc_cash_desk',
          amountDram: product.pointsCost,
          comment: isHy ? `Առցանց գնում (Բոնուսներ): ${prodName}` : `Онлайн заказ (Бонусы): ${prodName}`,
          author: 'Առցանց Խանութ / Интернет-магазин',
          items: [
            {
              productId: product.id,
              productName: product.nameRu,
              unit: product.unitRu,
              quantity: 1,
              priceDram: product.priceDram,
              totalDram: product.priceDram,
            },
          ],
        };
        return postErpDocument(prevErp, saleDoc);
      });

      // CRM: Գրանցում ենք պատվերը մասնակցի պատմության մեջ
      recordCustomerOrder(
        [
          {
            productId: product.id,
            productName: prodName,
            quantity: 1,
            priceDram: product.priceDram,
            totalDram: product.priceDram,
            unit: isHy ? product.unitHy : product.unitRu,
          },
        ],
        0,
        'points',
        0,
        product.pointsCost
      );

      showToast(
        isHy
          ? `«${prodName}» հաջողությամբ վճարվեց բոնուսներով (-${product.pointsCost} միավոր)! Պահեստից դուրսգրվեց:`
          : `Успешно оплачено «${prodName}» (-${product.pointsCost} баллов)! Списано со склада 1С.`,
        'success'
      );

      confetti({
        particleCount: 35,
        spread: 55,
        origin: { y: 0.75 },
        colors: ['#f59e0b', '#10b981'],
      });
    },
    [wallet, addLog, showToast, isHy, recordCustomerOrder]
  );

  // Հաստատում, որ 15 օրը լրացել է առանց վերադարձի (ակտիվացնում է ցմահ ավանդը և վրկ. բոնուսները)
  const handleConfirmHoldingCooldown = useCallback(
    (holdingId: string) => {
      setWallet((prev) => {
        const { nextState, logEntry } = confirmCooldownPassed(prev, holdingId);
        addLog(logEntry, 'deposit');
        return nextState;
      });
      showToast(
        isHy
          ? '15 օրվա երաշխիքային ժամկետը հաստատված է (առանց վերադարձի)՝ 10% ցմահ ավանդն ակտիվացված է (վրկ. բոնուսներով):'
          : '15-дневный гарантийный срок завершен без возврата! 10% пожизненный депозит с правом наследования активирован, ежесекундные бонусы запущены.',
        'success'
      );
    },
    [addLog, showToast, isHy]
  );

  // Ապրանքի վերադարձ 15 օրվա ընթացքում
  const handleProcessReturnRefund = useCallback(
    (holdingId: string) => {
      setWallet((prev) => {
        const { success, nextState, refundAmount, logEntry } = processReturnRefund(prev, holdingId);
        if (success) {
          addLog(logEntry, 'deposit');
          showToast(
            isHy
              ? `Ապրանքի վերադարձը կատարված է՝ ${formatDram(refundAmount)} վերադարձվել է Ձեր հաշվեկշռին:`
              : `Возврат товара оформлен: ${formatDram(refundAmount)} возвращены на ваш баланс.`,
            'info'
          );
        }
        return nextState;
      });
    },
    [addLog, showToast, isHy]
  );

  // Հաջողված վճարում վճարային դարպասով (Idram, Telcell, ArCa, Visa, Баланс)
  const handlePaymentSuccess = useCallback(
    (
      amount: number,
      gatewayName: string,
      receiptId: string,
      gatewayId?: PaymentMethodId,
      purposeOverride?: PaymentPurpose
    ) => {
      const activePurpose = purposeOverride || paymentModal?.paymentPurpose || 'store_purchase';

      // 1. Онлайн-пополнение Реального баланса (wallet_topup)
      if (activePurpose === 'wallet_topup') {
        setWallet((prev) => {
          const nextReal = prev.realBalance + amount;
          const next: WalletState = {
            ...prev,
            realBalance: nextReal,
          };
          addLog(
            isHy
              ? `[${gatewayName}] Իրական հաշվեկշռի առցանց համալրում՝ +${formatDram(amount)} (ՀԴՄ Կտրոն՝ ${receiptId})`
              : `[${gatewayName}] Онлайн-пополнение реального баланса: +${formatDram(amount)} (Чек: ${receiptId})`,
            'real_topup',
            prev.deposit,
            prev.bonusPoints,
            nextReal
          );
          return next;
        });

        showToast(
          isHy
            ? `Իրական հաշվեկշիռը համալրվել է +${formatDram(amount)}-ով (${gatewayName}):`
            : `Реальный баланс пополнен на +${formatDram(amount)} через ${gatewayName}!`,
          'success'
        );
        confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
        return;
      }

      // 2. Онлайн-пополнение 10% Пожизненного депозита (deposit_topup)
      if (activePurpose === 'deposit_topup') {
        setWallet((prev) => {
          const nextDeposit = prev.deposit + amount;
          const nextActiveDeposit = (prev.activeDeposit || 0) + amount;
          const next: WalletState = {
            ...prev,
            deposit: nextDeposit,
            activeDeposit: nextActiveDeposit,
          };
          addLog(
            isHy
              ? `[${gatewayName}] 10% Ցմահ դեպոզիտի առցանց համալրում՝ +${formatDram(amount)} (ՀԴՄ Կտրոն՝ ${receiptId})`
              : `[${gatewayName}] Онлайн-пополнение 10% Пожизненного депозита: +${formatDram(amount)} (Чек: ${receiptId})`,
            'deposit',
            nextDeposit,
            prev.bonusPoints,
            prev.realBalance
          );
          return next;
        });

        showToast(
          isHy
            ? `10% Ցմահ դեպոզիտը համալրվել է +${formatDram(amount)}-ով (${gatewayName}): Վայրկյանական բոնուսներն արագացված են!`
            : `10% Пожизненный депозит пополнен на +${formatDram(amount)} через ${gatewayName}! Начисление бонусов ускорено!`,
          'success'
        );
        confetti({ particleCount: 65, spread: 75, origin: { y: 0.6 } });
        return;
      }

      // 3. Оплата заказа в магазине (store_purchase)
      const bonusEarned = Math.round(amount * 0.05);
      const isQualifyingLifelong = amount >= MIN_PURCHASE_FOR_DEPOSIT;
      const targetSingleProduct = paymentModal?.product || products[0];

      setWallet((prev) => {
        let nextDeposit = prev.deposit;
        let nextCooldown = prev.cooldownDeposit || 0;
        let nextHoldings = [...(prev.holdings || [])];
        const nextRealBalance =
          gatewayId === 'wallet_balance' ? Math.max(0, prev.realBalance - amount) : prev.realBalance;

        if (isQualifyingLifelong) {
          const itemNames =
            paymentModal?.isCartCheckout && cart.length > 0
              ? cart.map((c) => (isHy ? c.product.nameHy : c.product.nameRu))
              : [isHy ? targetSingleProduct.nameHy : targetSingleProduct.nameRu];

          const newHolding = {
            id: `holding_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            orderNumber: `ORD-${Date.now().toString().slice(-6)}`,
            amount,
            purchaseDate: Date.now(),
            cooldownEndsAt: Date.now() + RETURN_COOLDOWN_MS,
            status: 'cooldown_15d' as const,
            inheritedRight: true,
            beneficiaryName: 'Օրինական ժառանգորդներ / Законные наследники',
            productNames: itemNames,
          };
          nextDeposit += amount;
          nextCooldown += amount;
          nextHoldings.push(newHolding);
        }

        const nextPoints = prev.bonusPoints + bonusEarned;
        const next: WalletState = {
          ...prev,
          realBalance: nextRealBalance,
          deposit: nextDeposit,
          cooldownDeposit: nextCooldown,
          bonusPoints: nextPoints,
          totalEarnedPoints: prev.totalEarnedPoints + bonusEarned,
          totalPurchasedDram: prev.totalPurchasedDram + amount,
          holdings: nextHoldings,
        };

        const depositMsg = isQualifyingLifelong
          ? (isHy
              ? `➔ 100% գումարը (${formatDram(amount)}) դարձավ 10% Ցմահ դեպոզիտ ժառանգության իրավունքով (15 օրից՝ վրկ. բոնուսներ)`
              : `➔ 100% затрат (${formatDram(amount)}) стали 10% Пожизненным депозитом с правом наследования (спустя 15 дней без возврата — ежесекундные бонусы)`)
          : (isHy ? `➔ Ստանդարտ գնում (5% քեշբեք)` : `➔ Стандартная покупка (5% кешбэк)`);

        addLog(
          isHy
            ? `[${gatewayName}] Վճարումը կատարված է՝ ${formatDram(amount)} (Կտրոն՝ ${receiptId}) ${depositMsg}, Բոնուսներ (+${bonusEarned} միավ.)`
            : `[${gatewayName}] Оплата покупки: ${formatDram(amount)} (Чек: ${receiptId}) ${depositMsg}, Начислено бонусов (+${bonusEarned} б.)`,
          'dram_purchase',
          nextDeposit,
          nextPoints,
          nextRealBalance
        );
        return next;
      });

      // 1C ERP: դուրսգրում ենք ապրանքները պահեստից և գրանցում մուտքը հաշվարկային հաշվում
      setErpState((prevErp) => {
        const docItems =
          paymentModal?.isCartCheckout && cart.length > 0
            ? cart.map((c) => ({
                productId: c.product.id,
                productName: c.product.nameRu,
                unit: c.product.unitRu,
                quantity: c.quantity,
                priceDram: c.product.priceDram,
                totalDram: c.product.priceDram * c.quantity,
              }))
            : [
                {
                  productId: targetSingleProduct.id,
                  productName: targetSingleProduct.nameRu,
                  unit: targetSingleProduct.unitRu,
                  quantity: 1,
                  priceDram: amount,
                  totalDram: amount,
                },
              ];

        const saleDoc = {
          id: `doc_sale_${Date.now()}`,
          docNumber: generateNextDocNumber('pos_sale', prevErp.documents),
          type: 'pos_sale' as const,
          status: 'posted' as const,
          date: new Date().toLocaleDateString('ru-RU'),
          timestamp: Date.now(),
          warehouseId: 'wh_store',
          cashAccountId: 'acc_bank_ameria',
          amountDram: amount,
          comment: `Առցանց վճարում [${gatewayName}] (Կտրոն՝ ${receiptId})`,
          author: 'Առցանց Խանութ / Интернет-магазин',
          items: docItems,
        };
        return postErpDocument(prevErp, saleDoc);
      });

      // CRM: Գրանցում ենք պատվերը մասնակցի քարտում
      const cItems: CustomerPurchaseItem[] =
        paymentModal?.isCartCheckout && cart.length > 0
          ? cart.map((c) => ({
              productId: c.product.id,
              productName: isHy ? c.product.nameHy : c.product.nameRu,
              quantity: c.quantity,
              priceDram: c.product.priceDram,
              totalDram: c.product.priceDram * c.quantity,
              unit: isHy ? c.product.unitHy : c.product.unitRu,
            }))
          : [
              {
                productId: targetSingleProduct.id,
                productName: isHy ? targetSingleProduct.nameHy : targetSingleProduct.nameRu,
                quantity: 1,
                priceDram: amount,
                totalDram: amount,
                unit: isHy ? targetSingleProduct.unitHy : targetSingleProduct.unitRu,
              },
            ];

      const pMethod = gatewayName.toLowerCase().includes('idram')
        ? 'idram'
        : gatewayName.toLowerCase().includes('telcell')
        ? 'telcell'
        : 'card';
      recordCustomerOrder(cItems, amount, pMethod, bonusEarned, 0, receiptId);

      if (paymentModal?.isCartCheckout) {
        setCart([]);
      }

      if (isQualifyingLifelong) {
        showToast(
          isHy
            ? `Վճարումը հաստատված է (${gatewayName}): 100% գումարը (${formatDram(amount)}) դարձավ 10% Ցմահ դեպոզիտ ժառանգության իրավունքով: Բոնուսները կհաշվեգրվեն ամեն վրկ. 15 օր անց առանց վերադարձի!`
            : `Оплата через ${gatewayName} подтверждена: 100% средств (${formatDram(amount)}) стали 10% Пожизненным депозитом с правом наследования! Ежесекундные бонусы активируются спустя 15 дней без возврата!`,
          'success'
        );
      } else {
        showToast(
          isHy
            ? `Վճարումը հաստատված է (${gatewayName}): Շնորհվել է +${bonusEarned} բոնուս: (10% ցմահ ավանդի համար անհրաժեշտ է գնում 10 000 ֏-ից):`
            : `Оплата через ${gatewayName} подтверждена: Начислено +${bonusEarned} бонусов. (Для пожизненного 10% депозита необходима покупка от 10 000 ֏).`,
          'success'
        );
      }

      confetti({
        particleCount: 60,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#10b981', '#06b6d4', '#f59e0b'],
      });
    },
    [addLog, showToast, isHy, paymentModal, cart, products, recordCustomerOrder]
  );

  // POS Տերմինալի վճարում (միայն ադմինիստրատորի համար)
  const handlePosTransactionSuccess = useCallback(
    (receipt: PosFiscalReceipt) => {
      const amount = receipt.finalTotal;

      if (receipt.depositCredited) {
        setWallet((prev) => ({
          ...prev,
          deposit: prev.deposit + amount,
          totalPurchasedDram: prev.totalPurchasedDram + amount,
        }));
        addLog(
          isHy
            ? `[POS Տերմինալ] Վճարումը հաստատված է՝ ${formatDram(amount)} (${receipt.methodLabelHy}, Կտրոն՝ ${receipt.receiptId}, Գանձապահ՝ ${receipt.cashierName}) ➔ 10% APY դեպոզիտն ավելացավ (+${formatDram(amount)})`
            : `[POS Терминал] Оплата подтверждена: ${formatDram(amount)} (${receipt.methodLabelRu}, Чек: ${receipt.receiptId}, Кассир: ${receipt.cashierName}) ➔ Депозит 10% APY пополнен (+${formatDram(amount)})`,
          'pos_terminal',
          wallet.deposit + amount,
          wallet.bonusPoints,
          wallet.realBalance
        );
      } else {
        setWallet((prev) => ({
          ...prev,
          realBalance: prev.realBalance + amount,
          totalPurchasedDram: prev.totalPurchasedDram + amount,
        }));
        addLog(
          isHy
            ? `[POS Տերմինալ] Կանխիկ/Քարտ մուտք դրամարկղ՝ ${formatDram(amount)} (${receipt.methodLabelHy}, Կտրոն՝ ${receipt.receiptId}, Գանձապահ՝ ${receipt.cashierName})`
            : `[POS Терминал] Приход в кассу: ${formatDram(amount)} (${receipt.methodLabelRu}, Чек: ${receipt.receiptId}, Кассир: ${receipt.cashierName})`,
          'pos_terminal',
          wallet.deposit,
          wallet.bonusPoints,
          wallet.realBalance + amount
        );
      }

      // 1C ERP: դուրսգրում ենք ապրանքը և ավելացնում կանխիկ կամ բանկային կասսայի մնացորդը
      setErpState((prevErp) => {
        const isCash = receipt.methodLabelRu.includes('Наличные');
        const saleDoc = {
          id: `doc_pos_${Date.now()}`,
          docNumber: generateNextDocNumber('pos_sale', prevErp.documents),
          type: 'pos_sale' as const,
          status: 'posted' as const,
          date: new Date().toLocaleDateString('ru-RU'),
          timestamp: Date.now(),
          warehouseId: 'wh_store',
          cashAccountId: isCash ? 'acc_cash_desk' : 'acc_bank_ameria',
          amountDram: amount,
          comment: `POS Терминал (Чек ${receipt.receiptId}, Кассир: ${receipt.cashierName})`,
          author: receipt.cashierName,
          items: [
            {
              productId: products[0].id,
              productName: 'Վաճառք POS Տերմինալով / Продажа через POS',
              unit: '1 գործ.',
              quantity: 1,
              priceDram: amount,
              totalDram: amount,
            },
          ],
        };
        const updated = postErpDocument(prevErp, saleDoc);
        const shift = { ...updated.currentShift };
        shift.totalReceiptsCount += 1;
        shift.totalRevenueDram += amount;
        if (isCash) shift.cashRevenueDram += amount;
        else shift.cardRevenueDram += amount;

        return {
          ...updated,
          currentShift: shift,
        };
      });

      showToast(
        isHy
          ? `POS Տերմինալ: Վճարումը հաջողվեց (${formatDram(amount)})`
          : `POS Терминал: Платеж успешно проведен (${formatDram(amount)})`,
        'success'
      );

      confetti({
        particleCount: 55,
        spread: 75,
        origin: { y: 0.6 },
        colors: ['#10b981', '#38bdf8', '#fbbf24'],
      });
    },
    [addLog, showToast, isHy, wallet.deposit, wallet.bonusPoints, wallet.realBalance]
  );

  // Գրանցում / Մուտք
  const handleLogin = useCallback(
    (user: UserProfile) => {
      setCurrentUser(user);
      // ԿԱՆՈՆ: Բոնուսային միավորները հաշվեգրվում են ՄԻԱՅՆ ապրանքների գնման դեպքում (գրանցման ժամանակ բոնուսներ չեն տրվում)
      // ПРАВИЛО: Бонусные баллы зачисляются ТОЛЬКО при покупке продукции (при входе/регистрации бонусы не начисляются)
      addLog(
        isHy
          ? `Օգտատեր «${user.name}» հաջողությամբ մուտք գործեց համակարգ:`
          : `Пользователь «${user.name}» успешно авторизован в системе.`,
        'auth'
      );
      showToast(
        isHy
          ? `Բարի գալուստ, ${user.name}! Դուք հաջողությամբ մուտք եք գործել:`
          : `Добро пожаловать, ${user.name}! Вы успешно вошли в личный кабинет.`,
        'success'
      );

      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.5 },
      });
    },
    [addLog, showToast, isHy]
  );

  const handleLogout = useCallback(() => {
    setCurrentUser({
      id: 'guest',
      name: isHy ? 'Հյուր' : 'Гость',
      emailOrPhone: '',
      isLoggedIn: false,
      registeredAt: '',
    });
    addLog(isHy ? 'Ելք համակարգից:' : 'Выход из аккаунта.', 'auth');
    showToast(isHy ? 'Դուք դուրս եկաք հաշվից' : 'Вы вышли из системы', 'info');
  }, [addLog, showToast, isHy]);

  // Կարգավորումների թարմացում և տոկոսադրույքի փոփոխության համակարգային ծանուցում (annualRate change notification)
  const handleUpdateAdminSettings = useCallback(
    (newSettings: AdminSettings) => {
      const oldRate = adminSettings.annualRate;
      const newRate = newSettings.annualRate;

      if (Math.abs(oldRate - newRate) > 0.0001) {
        const oldPercent = (oldRate * 100).toFixed(0);
        const newPercent = (newRate * 100).toFixed(0);

        // 1. Ակտիվացնել ծանուցման բաններ օգտատերերի համար
        setRateChangeNotice({
          oldRate,
          newRate,
          timestamp: Date.now(),
        });

        // 2. Լողացող Toast ծանուցում
        const toastMsg = isHy
          ? `⚡ Դեպոզիտի տարեկան տոկոսադրույքը փոփոխվել է՝ ${oldPercent}% ➔ ${newPercent}%: Նոր եկամտաբերությունն ակտիվացված է:`
          : `⚡ Годовая ставка депозита изменена: ${oldPercent}% ➔ ${newPercent}%. Новая доходность вступила в силу!`;
        showToast(toastMsg, 'info');

        // 3. Գրանցել համակարգային աուդիտի մատյանում (System Audit & CRM Log)
        const logMsg = isHy
          ? `«Համակարգ 2000» ադմինիստրատորը փոխեց դեպոզիտի տոկոսադրույքը՝ ${oldPercent}%-ից ➔ ${newPercent}% (APY)`
          : `«Система 2000» Администратор изменил процентную ставку депозита с ${oldPercent}% ➔ ${newPercent}% годовых (APY)`;
        addLog(logMsg, 'admin', wallet.deposit, wallet.bonusPoints, wallet.realBalance);

        // 4. Ուղարկել պաշտոնական Email ծանուցում ադմինիստրատորին (araik1415@gmail.com)
        if (newSettings.emailNotificationsEnabled !== false) {
          sendAnnualRateChangeNotificationEmail({
            oldRate,
            newRate,
            adminEmail: newSettings.adminNotificationEmail || 'araik1415@gmail.com',
          }).catch((err) => console.warn('Rate change email notification error:', err));
        }
      }

      setAdminSettings(newSettings);
      try {
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(newSettings));
      } catch (e) {
        // ignore
      }
    },
    [adminSettings.annualRate, isHy, showToast, addLog, wallet.deposit, wallet.bonusPoints, wallet.realBalance]
  );

  // Ադմինիստրատիվ հաշվեկշռի ճշգրտում
  const handleAdminAdjustBalance = useCallback(
    (type: 'real' | 'deposit' | 'points', amount: number) => {
      setWallet((prev) => {
        let nextReal = prev.realBalance;
        let nextDeposit = prev.deposit;
        let nextPoints = prev.bonusPoints;

        if (type === 'real') nextReal += amount;
        if (type === 'deposit') nextDeposit += amount;
        if (type === 'points') nextPoints += amount;

        const next: WalletState = {
          ...prev,
          realBalance: nextReal,
          deposit: nextDeposit,
          bonusPoints: nextPoints,
        };

        const label =
          type === 'real'
            ? `Իրական հաշվեկշիռ (+${formatDram(amount)})`
            : type === 'deposit'
            ? `Դեպոզիտ (+${formatDram(amount)})`
            : `Բոնուսներ (+${amount})`;

        addLog(`[Ադմին] Ձեռքով համալրում՝ ${label}`, 'admin', nextDeposit, nextPoints, nextReal);
        return next;
      });

      showToast(isHy ? 'Ադմինիստրատիվ համալրումը հաջողվեց' : 'Средства успешно начислены админом', 'success');
    },
    [addLog, showToast, isHy]
  );

  // Ապրանքների ադմինիստրատիվ կառավարում
  const handleAddProduct = useCallback(
    (newProdData: Omit<ProductItem, 'id'>) => {
      const newId = Math.max(0, ...products.map((p) => p.id)) + 1;
      const created: ProductItem = { ...newProdData, id: newId };
      setProducts((prev) => [created, ...prev]);
      addLog(`[Ադմին] Նոր ապրանք ավելացվեց՝ «${created.nameHy}» (${formatDram(created.priceDram)})`, 'admin');
      showToast(isHy ? 'Նոր ապրանքը հաջողությամբ ստեղծվեց' : 'Товар успешно добавлен', 'success');
    },
    [products, addLog, showToast, isHy]
  );

  const handleUpdateProduct = useCallback(
    (updated: ProductItem) => {
      setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      addLog(`[Ադմին] Ապրանքը թարմացվեց՝ «${updated.nameHy}» (${formatDram(updated.priceDram)})`, 'admin');
      showToast(isHy ? 'Ապրանքը թարմացվեց' : 'Товар обновлен', 'info');
    },
    [addLog, showToast, isHy]
  );

  const handleBatchUpdateProducts = useCallback(
    (updatedProducts: ProductItem[], summaryText: string) => {
      setProducts(updatedProducts);
      addLog(`[Ադմին] ${summaryText}`, 'admin');
      showToast(summaryText, 'success');
    },
    [addLog, showToast]
  );

  const handleUpdateOrderStatus = useCallback(
    (customerId: string, orderId: string, newStatus: CustomerPurchase['status']) => {
      setCustomers((prev) =>
        prev.map((cust) => {
          if (cust.id !== customerId) return cust;
          return {
            ...cust,
            purchases: cust.purchases.map((ord) =>
              ord.id === orderId ? { ...ord, status: newStatus } : ord
            ),
          };
        })
      );
      addLog(
        isHy
          ? `[Ադմին] Պատվերի (${orderId}) կարգավիճակը փոխվեց՝ ${newStatus}`
          : `[Админ] Статус заказа (${orderId}) изменен на: ${newStatus}`,
        'admin'
      );
      showToast(
        isHy ? 'Պատվերի կարգավիճակը թարմացվեց' : 'Статус заказа успешно обновлен',
        'success'
      );
    },
    [addLog, showToast, isHy]
  );

  const handleAddCustomer = useCallback(
    (
      newCust: Omit<
        CustomerAccount,
        | 'id'
        | 'registeredAt'
        | 'lastActiveAt'
        | 'lastAccrualTimestamp'
        | 'purchases'
        | 'ledger'
        | 'totalSpentDram'
      >
    ) => {
      const now = Date.now();
      const dateStr = new Date().toLocaleDateString(isHy ? 'hy-AM' : 'ru-RU');
      const created: CustomerAccount = {
        ...newCust,
        id: `cust_${now}_${Math.random().toString(36).slice(2, 6)}`,
        registeredAt: dateStr,
        lastActiveAt: dateStr,
        lastAccrualTimestamp: now,
        purchases: [],
        ledger: [],
        totalSpentDram: 0,
      };
      setCustomers((prev) => [created, ...prev]);
      addLog(
        isHy
          ? `[Ադմին] Գրանցվեց նոր մասնակից CRM-ում՝ «${created.name}»`
          : `[Админ] Добавлен новый участник в CRM: «${created.name}»`,
        'admin'
      );
      showToast(
        isHy ? `Մասնակից «${created.name}» ավելացվեց` : `Участник «${created.name}» добавлен в CRM!`,
        'success'
      );
    },
    [addLog, showToast, isHy]
  );

  const handleApproveSupplierProduct = useCallback(
    (pendingId: string) => {
      const target = pendingSupplierProducts.find((p) => p.id === pendingId);
      if (!target) return;
      handleAddProduct(target.product);
      setPendingSupplierProducts((prev) =>
        prev.map((p) => (p.id === pendingId ? { ...p, status: 'approved' } : p))
      );
    },
    [pendingSupplierProducts, handleAddProduct]
  );

  const handleRejectSupplierProduct = useCallback((pendingId: string) => {
    setPendingSupplierProducts((prev) =>
      prev.map((p) => (p.id === pendingId ? { ...p, status: 'rejected' } : p))
    );
  }, []);

  const handleResolveDispute = useCallback(
    (disputeId: string, resolution: 'resolved_store' | 'resolved_supplier') => {
      setReturnDisputes((prev) =>
        prev.map((d) => (d.id === disputeId ? { ...d, status: resolution } : d))
      );
      showToast(
        isHy ? 'Վեճը կարգավորվեց' : 'Спор по возврату урегулирован администратором',
        'info'
      );
    },
    [showToast, isHy]
  );

  const handleDeleteProduct = useCallback(
    (productId: number) => {
      const found = products.find((p) => p.id === productId);
      if (found) {
        const archiveItem: SystemArchiveItem = {
          id: `arch_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          type: 'product',
          title: isHy ? found.nameHy : found.nameRu,
          deletedAt: new Date().toLocaleString(isHy ? 'hy-AM' : 'ru-RU'),
          deletedTimestamp: Date.now(),
          data: found,
        };
        setSystemArchive((prev) => [archiveItem, ...prev]);
      }
      setProducts((prev) => prev.filter((p) => p.id !== productId));
      addLog(`[Ադմին] Ապրանքը տեղափոխվեց արխիվ՝ «${found?.nameHy || productId}»`, 'admin');
      showToast(isHy ? 'Ապրանքը տեղափոխվեց արխիվ (հնարավոր է վերականգնել)' : 'Товар перемещен в архив (доступно восстановление)', 'info');
    },
    [products, addLog, showToast, isHy]
  );

  // Պահեստների (սկլադների) ադմինիստրատիվ կառավարում
  const handleAddWarehouse = useCallback(
    (newWhData: Omit<import('./types/erp').Warehouse, 'id'>) => {
      const newId = `wh_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`;
      const created: import('./types/erp').Warehouse = { ...newWhData, id: newId };
      setErpState((prev) => ({
        ...prev,
        warehouses: [...prev.warehouses, created],
      }));
      addLog(`[Ադմին] Նոր պահեստ ավելացվեց՝ «${created.nameHy}» (${created.code})`, 'admin');
      showToast(isHy ? 'Նոր պահեստը հաջողությամբ ավելացվեց' : 'Новый склад успешно добавлен', 'success');
    },
    [addLog, showToast, isHy]
  );

  const handleUpdateWarehouse = useCallback(
    (updated: import('./types/erp').Warehouse) => {
      setErpState((prev) => ({
        ...prev,
        warehouses: prev.warehouses.map((w) => (w.id === updated.id ? updated : w)),
      }));
      addLog(`[Ադմին] Պահեստը թարմացվեց՝ «${updated.nameHy}» (${updated.code})`, 'admin');
      showToast(isHy ? 'Պահեստի տվյալները թարմացվեցին' : 'Данные склада обновлены', 'info');
    },
    [addLog, showToast, isHy]
  );

  const handleDeleteWarehouse = useCallback(
    (whId: string) => {
      const found = erpState.warehouses.find((w) => w.id === whId);
      setErpState((prev) => ({
        ...prev,
        warehouses: prev.warehouses.filter((w) => w.id !== whId),
      }));
      addLog(`[Ադմին] Պահեստը հեռացվեց՝ «${found?.nameHy || whId}»`, 'admin');
      showToast(isHy ? 'Պահեստը հեռացվեց' : 'Склад удалён', 'info');
    },
    [erpState.warehouses, addLog, showToast, isHy]
  );

  const handleRestoreFromArchive = useCallback(
    (archiveId: string) => {
      const item = systemArchive.find((a) => a.id === archiveId);
      if (!item) return;

      if (item.type === 'product') {
        const restoredProduct = item.data as ProductItem;
        const exists = products.some((p) => p.id === restoredProduct.id);
        const targetId = exists ? Math.max(0, ...products.map((p) => p.id)) + 1 : restoredProduct.id;
        const finalProd = { ...restoredProduct, id: targetId };
        setProducts((prev) => [finalProd, ...prev]);
        addLog(
          isHy
            ? `[Ադմին] Ապրանքը վերականգնվեց արխիվից՝ «${finalProd.nameHy}»`
            : `[Админ] Товар восстановлен из архива: «${finalProd.nameRu}»`,
          'admin'
        );
      } else if (item.type === 'customer_account') {
        const restoredCust = item.data as CustomerAccount;
        setCustomers((prev) => [restoredCust, ...prev.filter((c) => c.id !== restoredCust.id)]);
        addLog(`[Админ] Аккаунт клиента восстановлен из архива: «${restoredCust.name}»`, 'admin');
      } else if (item.type === 'log_item') {
        const restoredLog = item.data as LogItem;
        setLogs((prev) => [restoredLog, ...prev]);
        addLog(`[Админ] Запись лога восстановлена из архива: «${restoredLog.text}»`, 'admin');
      }

      setSystemArchive((prev) => prev.filter((a) => a.id !== archiveId));
      showToast(
        isHy ? 'Օբյեկտը հաջողությամբ վերականգնվեց արխիվից' : 'Объект успешно восстановлен из архива!',
        'success'
      );
    },
    [systemArchive, products, addLog, showToast, isHy]
  );

  const handleImportBackup = useCallback(
    (backupData: any) => {
      if (!backupData || typeof backupData !== 'object') return;

      if (backupData.products && Array.isArray(backupData.products)) {
        setProducts(backupData.products);
      }
      if (backupData.settings && typeof backupData.settings === 'object') {
        setAdminSettings(backupData.settings);
      }
      if (backupData.logs && Array.isArray(backupData.logs)) {
        setLogs(backupData.logs);
      }
      if (backupData.customers && Array.isArray(backupData.customers)) {
        setCustomers(backupData.customers);
      }
      if (backupData.siteConfig && typeof backupData.siteConfig === 'object') {
        setSiteConfig(backupData.siteConfig);
      }
      if (backupData.categories && Array.isArray(backupData.categories)) {
        setCategories(backupData.categories);
        saveStoredCategories(backupData.categories);
      }
      if (backupData.systemArchive && Array.isArray(backupData.systemArchive)) {
        setSystemArchive(backupData.systemArchive);
      }

      addLog(
        isHy
          ? 'Համակարգը ամբողջությամբ վերականգնվեց JSON бէկապից:'
          : 'Система полностью восстановлена из JSON бэкапа!',
        'admin'
      );
      showToast(
        isHy ? 'Համակարգի бէկապը հաջողությամբ ներբեռնվեց' : 'Бэкап системы успешно загружен!',
        'success'
      );
    },
    [addLog, showToast, isHy]
  );


  // Վերակայել
  const handleReset = useCallback(() => {
    const s = createInitialWalletState(0, 0, 0);
    setWallet(s);
    setCart([]);
    addLog(isHy ? 'Հաշվեկշիռները վերակայված են 0 ֏:' : 'Баланс и депозит сброшены к 0 ֏.', 'system', 0, 0, 0);
    showToast(isHy ? 'Հաշիվները զրոյացված են' : 'Кошелек сброшен до 0 ֏', 'info');
  }, [addLog, showToast, isHy]);

  // Պրեսետներ
  const handleLoadPreset = useCallback(
    (preset: 'starter' | 'active' | 'whale') => {
      if (preset === 'starter') {
        setWallet(createInitialWalletState(10000, 0, 0));
        addLog(isHy ? 'Ակտիվացված է «Սկսնակ» պրեսետը (10 000 ֏ իրական):' : 'Загружен пресет «Новый».', 'system');
        showToast(isHy ? 'Սկսնակ պրեսետ' : 'Пресет «Новый»', 'info');
      } else if (preset === 'active') {
        setWallet(createInitialWalletState(50000, 50000, 350));
        addLog(isHy ? 'Ակտիվացված է «Ակտիվ» պրեսետը (50 000 ֏ դեպոզիտ):' : 'Загружен «Активный» (50 000 ֏).', 'system');
        showToast(isHy ? 'Ակտիվ պրեսետ (50 000 ֏)' : 'Пресет «Активный»', 'success');
      } else if (preset === 'whale') {
        setWallet(createInitialWalletState(200000, 250000, 1500));
        addLog(isHy ? 'Ակտիվացված է «Պրեմիում» պրեսետը (250 000 ֏ դեպոզիտ):' : 'Загружен «Премиум» (250 000 ֏).', 'system');
        showToast(isHy ? 'Պրեմիում պրեսետ (250 000 ֏)' : 'Пресет «Премиум»', 'success');
      }
    },
    [addLog, showToast, isHy]
  );

  const handleSaveSiteConfig = useCallback(
    (newConfig: SiteConfig) => {
      setSiteConfig(newConfig);
      addLog(
        isHy
          ? 'Կայքի ձևավորումն ու սեկցիաները թարմացվեցին Կոնստրուկտորում:'
          : 'Настройки оформления и структуры сайта сохранены в Конструкторе.',
        'admin'
      );
      showToast(isHy ? 'Կայքի կարգավորումները պահպանվեցին' : 'Настройки сайта сохранены', 'success');
    },
    [addLog, showToast, isHy]
  );

  const handleAddReview = useCallback(
    (newRev: Omit<StoreReview, 'id' | 'date'>) => {
      const reviewObj: StoreReview = {
        ...newRev,
        id: `rev_${Date.now()}`,
        date: new Date().toLocaleDateString(isHy ? 'hy-AM' : 'ru-RU'),
      };
      setSiteConfig((prev) => ({
        ...prev,
        reviews: [reviewObj, ...prev.reviews],
      }));
      addLog(
        isHy
          ? `Նոր կարծիք ավելացվեց «${newRev.author}»-ից:`
          : `Добавлен новый отзыв от «${newRev.author}».`,
        'system'
      );
      showToast(isHy ? 'Շնորհակալություն կարծիքի համար' : 'Спасибо за ваш отзыв!', 'success');
    },
    [addLog, showToast, isHy]
  );

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const transactionCount = countFinancialTransactions(logs);

  const stockMap = useMemo(() => {
    const map: Record<number, number> = {};
    erpState.stockRegister
      .filter((s) => s.warehouseId === 'wh_store')
      .forEach((s) => {
        map[s.productId] = s.quantity;
      });
    return map;
  }, [erpState.stockRegister]);

  const renderSection = (secId: SectionId) => {
    switch (secId) {
      case 'hero_banner':
        return (
          <HeroBanner
            key={secId}
            slides={siteConfig.heroSlides}
            lang={lang}
            cardRadius={siteConfig.cardRadius}
            onNavigate={(action) => {
              if (action === 'catalog') {
                const el = document.getElementById('catalog-section');
                el?.scrollIntoView({ behavior: 'smooth' });
              } else if (action === 'deposit') {
                handleDeposit(15000, 'deposit');
              } else if (action === 'cart') {
                setIsCartOpen(true);
              }
            }}
          />
        );

      case 'balance_card':
        return (
          <BalanceCard
            key={secId}
            realBalance={wallet.realBalance}
            deposit={wallet.deposit}
            activeDeposit={wallet.activeDeposit}
            cooldownDeposit={wallet.cooldownDeposit}
            bonusPoints={wallet.bonusPoints}
            totalEarned={wallet.totalEarnedPoints}
            totalSpent={wallet.totalSpentPoints}
            annualRate={adminSettings.annualRate}
            lang={lang}
            onOpenTopup={() => {
              setPaymentModal({
                isOpen: true,
                amount: 15000,
                paymentPurpose: 'wallet_topup',
                title: isHy
                  ? 'Իրական հաշվեկշռի առցանց համալրում (Idram / ArCa / Visa)'
                  : 'Онлайн-пополнение реального баланса (Idram / ArCa / Visa)',
              });
            }}
            onTransferToDeposit={handleTransferToDeposit}
            holdings={wallet.holdings}
            onConfirmCooldown={handleConfirmHoldingCooldown}
            onProcessRefund={handleProcessReturnRefund}
            onOpenAgreement={() => setIsAgreementOpen(true)}
          />
        );

      case 'deposit_panel':
        return (
          <DepositPanel
            key={secId}
            onDeposit={handleDeposit}
            onOpenBankPayment={(amt, target) => {
              const isRealTarget = target === 'realBalance';
              setPaymentModal({
                isOpen: true,
                amount: amt || 15000,
                paymentPurpose: isRealTarget ? 'wallet_topup' : 'deposit_topup',
                title: isRealTarget
                  ? isHy
                    ? 'Իրական հաշվեկշռի առցանց համալրում (Idram / ArCa / Visa)'
                    : 'Онлайн-пополнение реального баланса (Idram / ArCa / Visa)'
                  : isHy
                  ? '10% Ցմահ դեպոզիտի առցանց համալրում (Idram / ArCa / Visa)'
                  : 'Онлайн-пополнение 10% Пожизненного депозита (Idram / ArCa / Visa)',
              });
            }}
            lang={lang}
          />
        );

      case 'featured_deals':
        return (
          <FeaturedDeals
            key={secId}
            products={products}
            lang={lang}
            cardRadius={siteConfig.cardRadius}
            onAddToCart={handleAddToCart}
            onQuickBuy={handleQuickBuyGateway}
          />
        );

      case 'catalog':
        return (
          <div key={secId} id="catalog-section">
            <Catalog
              products={products}
              userPoints={Math.floor(wallet.bonusPoints)}
              realBalance={wallet.realBalance}
              cart={cart}
              stockMap={stockMap}
              categoriesList={categories}
              onAddToCart={handleAddToCart}
              onQuickBuyGateway={handleQuickBuyGateway}
              onBuyWithPoints={handleBuyWithPoints}
              lang={lang}
              onOpenScanner={() => setIsScannerOpen(true)}
            />
          </div>
        );


      case 'trust_badges':
        return <TrustBadges key={secId} lang={lang} cardRadius={siteConfig.cardRadius} />;

      case 'reviews':
        return (
          <ReviewsSection
            key={secId}
            reviews={siteConfig.reviews}
            lang={lang}
            cardRadius={siteConfig.cardRadius}
            onAddReview={handleAddReview}
          />
        );

      case 'faq':
        return (
          <FaqSection
            key={secId}
            faqs={siteConfig.faqs}
            lang={lang}
            cardRadius={siteConfig.cardRadius}
          />
        );

      case 'history_log':
        return <HistoryLog key={secId} logs={logs} lang={lang} />;

      case 'store_footer':
        return (
          <StoreFooter
            key={secId}
            contact={siteConfig.contact}
            lang={lang}
            annualRate={adminSettings.annualRate}
            onOpenAgreement={() => setIsAgreementOpen(true)}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div
      className={`min-h-screen bg-[#0b1120] bg-gradient-to-b ${
        THEMES[siteConfig.themeId]?.bgGradient || 'from-emerald-950/20 via-slate-900 to-slate-950'
      } text-slate-100 flex flex-col items-center font-sans transition-all duration-300`}
    >
      {/* Վերևի գովազդային շերտ (Promo Bar) */}
      <PromoBar
        promo={siteConfig.promoBar}
        lang={lang}
        onActionClick={() => setIsRulesOpen(true)}
      />

      <div className={`w-full ${siteConfig.containerWidth} flex flex-col gap-4 sm:gap-5 p-3 sm:p-6`}>
        {/* Համակարգային ծանուցում տարեկան տոկոսադրույքի փոփոխության մասին (annualRate notification) */}
        {rateChangeNotice && (
          <div className="w-full bg-gradient-to-r from-emerald-950/90 via-slate-900 to-teal-950/90 border-2 border-emerald-500/70 rounded-2xl p-4 shadow-2xl shadow-emerald-950/50 flex items-start justify-between gap-3 animate-fadeIn relative overflow-hidden ring-2 ring-emerald-500/20 backdrop-blur-md">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 bg-emerald-500/20 border border-emerald-400/50 rounded-xl text-emerald-400 shrink-0 mt-0.5 shadow-inner">
                <Percent className="w-5 h-5 animate-bounce" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/30 text-emerald-300 border border-emerald-400/50 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-emerald-400" />
                    {isHy ? 'Համակարգային Ծանուցում • APY' : 'Системное Уведомление • APY'}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {new Date(rateChangeNotice.timestamp).toLocaleTimeString(isHy ? 'hy-AM' : 'ru-RU')}
                  </span>
                </div>
                <h4 className="text-sm font-extrabold text-white flex items-center gap-2 flex-wrap">
                  <span>
                    {isHy
                      ? `⚡ Դեպոզիտի տարեկան տոկոսադրույքը փոփոխվել է՝ ${(rateChangeNotice.oldRate * 100).toFixed(0)}% ➔ ${(rateChangeNotice.newRate * 100).toFixed(0)}%`
                      : `⚡ Годовая процентная ставка депозита изменена: ${(rateChangeNotice.oldRate * 100).toFixed(0)}% ➔ ${(rateChangeNotice.newRate * 100).toFixed(0)}% годовых`}
                  </span>
                </h4>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  {isHy
                    ? `Ուշադրություն. Ձեր 10% դեպոզիտի բոնուսների վայրկյանական էմիսիան և եկամտաբերության հաշվիչը վերահաշվարկվել են ${(rateChangeNotice.newRate * 100).toFixed(0)}% տարեկան տոկոսադրույքով: Բոլոր հաշվեգրումներն ընթանում են ավտոմատ:`
                    : `Внимание: Начисление бонусов и калькулятор доходности депозита пересчитаны по ставке ${(rateChangeNotice.newRate * 100).toFixed(0)}% годовых. Начисление баллов происходит автоматически в режиме реального времени.`}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setRateChangeNotice(null)}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
              title={isHy ? 'Փակել' : 'Закрыть'}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Գլխամաս */}
        <Header
          onOpenRules={() => setIsRulesOpen(true)}
          onOpenAgreement={() => setIsAgreementOpen(true)}
          onOpenAuth={() => setIsAuthOpen(true)}
          onOpenCabinet={() => setIsCabinetOpen(true)}
          onOpenAdmin={() => setIsAdminOpen(true)}
          onOpenPos={() => setIsPosOpen(true)}
          onOpenErp={() => setIsErpOpen(true)}
          onOpenBuilder={() => setIsBuilderOpen(true)}
          onOpenCart={() => setIsCartOpen(true)}
          onReset={handleReset}
          onLoadPreset={handleLoadPreset}
          currentUser={currentUser}
          lang={lang}
          onToggleLang={() => setLang((prev) => (prev === 'hy' ? 'ru' : 'hy'))}
          currentRate={adminSettings.annualRate}
          cartCount={totalCartCount}
          onOpenChat={() => setIsChatOpen(true)}
          onOpen3dShowcase={() => setIs3dShowcaseOpen(true)}
          onOpenPartnerPortal={() => setIsPartnerModalOpen(true)}
          onOpenScanner={() => setIsScannerOpen(true)}
          onOpenDeliveryTracker={() => handleOpenDeliveryTracker()}
          activeDeliveriesCount={
            deliveries.filter((d) => d.stage !== 'delivered' && d.stage !== 'cancelled').length
          }
          pendingAdminCount={
            pendingSupplierProducts.filter((s) => s.status === 'pending').length +
            returnDisputes.filter((d) => d.status === 'open').length
          }
          storeTitle={isHy ? siteConfig.storeTitleHy : siteConfig.storeTitleRu}
          storeTagline={isHy ? siteConfig.storeTaglineHy : siteConfig.storeTaglineRu}
          badgeText={isHy ? siteConfig.badgeTextHy : siteConfig.badgeTextRu}
        />

        {/* Виджет онлайн-отслеживания активной доставки на главной витрине */}
        <LiveDeliveryBanner
          deliveries={deliveries}
          lang={lang}
          onOpenTracker={handleOpenDeliveryTracker}
        />

        {/* Ծանուցում (Toast) */}
        {toast && (
          <div
            className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-2xl text-xs font-semibold border flex items-center gap-2 animate-bounce transition-all ${
              toast.type === 'success'
                ? 'bg-emerald-950/95 text-emerald-200 border-emerald-500/50'
                : toast.type === 'error'
                ? 'bg-rose-950/95 text-rose-200 border-rose-500/50'
                : 'bg-slate-800/95 text-slate-200 border-slate-700'
            }`}
          >
            <span>{toast.message}</span>
          </div>
        )}

        {/* Դինամիկ սեկցիաներ ըստ Կոնստրուկտորի դասավորության */}
        {siteConfig.sections
          .filter((section) => section.enabled)
          .map((section) => renderSection(section.id))}
      </div>

      {/* Զամբյուղ (Cart Drawer) */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onClearCart={handleClearCart}
        onCheckoutPaymentGateway={handleCheckoutCartPaymentGateway}
        onCheckoutPoints={handleCheckoutCartPoints}
        userBonusPoints={wallet.bonusPoints}
        lang={lang}
        onOpenAgreement={() => setIsAgreementOpen(true)}
      />

      {/* Վճարային համակարգի մոդալ (Idram, Telcell QR, ArCa, Visa, Баланс) */}
      {paymentModal?.isOpen && (
        <PaymentModal
          isOpen={paymentModal.isOpen}
          onClose={() => setPaymentModal(null)}
          amountDram={paymentModal.amount}
          title={paymentModal.title}
          lang={lang}
          paymentPurpose={paymentModal.paymentPurpose || 'store_purchase'}
          userRealBalance={wallet.realBalance}
          onPaymentSuccess={handlePaymentSuccess}
          onOpenAgreement={() => setIsAgreementOpen(true)}
        />
      )}

      {/* Գրանցման և մուտքի մոդալ պատուհան */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        currentUser={currentUser}
        onLogin={handleLogin}
        onLogout={handleLogout}
        lang={lang}
        totalUsageSeconds={usageSeconds}
        transactionCount={transactionCount}
      />

      {/* Ադմինիստրատորի կառավարման վահանակ */}
      <AdminPanelModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        lang={lang}
        onToggleLang={() => setLang((prev) => (prev === 'hy' ? 'ru' : 'hy'))}
        settings={adminSettings}
        onUpdateSettings={handleUpdateAdminSettings}
        products={products}
        onAddProduct={handleAddProduct}
        onUpdateProduct={handleUpdateProduct}
        onBatchUpdateProducts={handleBatchUpdateProducts}
        onDeleteProduct={handleDeleteProduct}
        wallet={wallet}
        onAdminAdjustBalance={handleAdminAdjustBalance}
        onLoadPreset={handleLoadPreset}
        onResetWallet={handleReset}
        onConfirmHoldingCooldown={handleConfirmHoldingCooldown}
        onProcessReturnRefund={handleProcessReturnRefund}
        logs={logs}
        customers={customers}
        onAdjustCustomer={handleAdjustCustomer}
        onAddCustomerNote={handleAddCustomerNote}
        onAddCustomer={handleAddCustomer}
        onUpdateOrderStatus={handleUpdateOrderStatus}
        siteConfig={siteConfig}
        onSaveSiteConfig={handleSaveSiteConfig}
        erpState={erpState}
        pendingSupplierProducts={pendingSupplierProducts}
        onApproveSupplierProduct={handleApproveSupplierProduct}
        onRejectSupplierProduct={handleRejectSupplierProduct}
        returnDisputes={returnDisputes}
        onResolveDispute={handleResolveDispute}
        onOpenBuilder={() => setIsBuilderOpen(true)}
        onOpenPos={() => setIsPosOpen(true)}
        onOpenErp={() => setIsErpOpen(true)}
        onOpen3dShowcase={() => setIs3dShowcaseOpen(true)}
        onOpen3DWarehouse={() => setIs3DWarehouseOpen(true)}
        onOpenPartnerPortal={() => setIsPartnerModalOpen(true)}
        onOpenSupplierPortal={() => setIsSupplierPortalOpen(true)}
        onOpenScanner={() => setIsScannerOpen(true)}
        systemArchive={systemArchive}
        onRestoreFromArchive={handleRestoreFromArchive}
        onImportBackup={handleImportBackup}
        warehouses={erpState.warehouses}
        onAddWarehouse={handleAddWarehouse}
        onUpdateWarehouse={handleUpdateWarehouse}
        onDeleteWarehouse={handleDeleteWarehouse}
        categories={categories}
        onAddCategory={handleAddCategory}
        onUpdateCategory={handleUpdateCategory}
        onDeleteCategory={handleDeleteCategory}
        deliveries={deliveries}
        onCreateDelivery={handleCreateAdminDelivery}
        onUpdateDeliveryStage={handleUpdateDeliveryStage}
        onAdvanceDeliveryTick={handleAdvanceDeliveryTick}
        onOpenDeliveryTracker={handleOpenDeliveryTracker}
      />

      {/* Система отслеживания доставки в онлайн-режиме (GPS LIVE) */}
      <DeliveryTrackingModal
        isOpen={isDeliveryTrackerOpen}
        onClose={() => setIsDeliveryTrackerOpen(false)}
        lang={lang}
        deliveries={deliveries}
        initialOrderNumber={trackingOrderNumber}
        isAdmin={Boolean(currentUser.isAdmin)}
        onAdvanceTick={handleAdvanceDeliveryTick}
        onUpdateStage={handleUpdateDeliveryStage}
        onSendChatMessage={handleSendDeliveryChat}
        onUpdateDeliveryDetails={handleUpdateDeliveryDetails}
      />

      {/* AI և 3D Ստուդիա 2000 */}
      <AiStudioHubModal
        isOpen={isAiStudioOpen}
        onClose={() => setIsAiStudioOpen(false)}
        lang={lang}
        onOpen3DWarehouse={() => setIs3DWarehouseOpen(true)}
        onOpenGame={() => setIsGameOpen(true)}
      />

      {/* Կանոնների մոդալ պատուհան */}
      <RuleExplanationModal
        isOpen={isRulesOpen}
        onClose={() => setIsRulesOpen(false)}
        lang={lang}
      />

      {/* Էկոհամակարգի օֆերտայի պայմանագրի մոդալ (SYS-2000) */}
      <UserAgreementModal
        isOpen={isAgreementOpen}
        onClose={() => setIsAgreementOpen(false)}
        lang={lang}
        currentUser={currentUser}
        onAcceptAgreement={handleAcceptAgreement}
      />

      {/* Անձնական կաբինետի մոդալ (Personal Cabinet) */}
      <PersonalCabinetModal
        isOpen={isCabinetOpen}
        onClose={() => setIsCabinetOpen(false)}
        lang={lang}
        currentUser={currentUser}
        wallet={wallet}
        logs={logs}
        customers={customers}
        totalUsageSeconds={usageSeconds}
        onLogout={handleLogout}
        onOpenAgreement={() => {
          setIsCabinetOpen(false);
          setIsAgreementOpen(true);
        }}
        onOpenTopup={() => {
          setIsCabinetOpen(false);
          setPaymentModal({
            isOpen: true,
            amount: 15000,
            paymentPurpose: 'deposit_topup',
            title: isHy
              ? '10% Ցմահ դեպոզիտի առցանց համալրում (Система 2000)'
              : 'Онлайн-пополнение 10% Пожизненного депозита (Система 2000)',
          });
        }}
        onOpenPartnerPortal={() => {
          setIsCabinetOpen(false);
          setIsPartnerModalOpen(true);
        }}
      />

      {/* Floating Gemini AI Assistant Button */}
      <button
        onClick={() => setIsChatOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 text-slate-950 font-bold shadow-2xl shadow-emerald-500/40 hover:scale-105 active:scale-95 transition-all cursor-pointer border border-white/20 group ring-2 ring-emerald-400/40"
        title={isHy ? 'Gemini AI Խորհրդատու' : 'AI-Консультант Gemini'}
      >
        <div className="relative">
          <Bot className="w-5 h-5 text-slate-950" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-900 animate-ping"></span>
        </div>
        <span className="text-xs font-extrabold tracking-wide">
          {isHy ? 'AI Խորհրդատու' : 'AI-Консультант'}
        </span>
      </button>

      <button
        type="button"
        onClick={() => setIsAiStudioOpen(true)}
        className="fixed bottom-16 right-4 z-40 inline-flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-400 to-amber-500 text-slate-950 font-extrabold text-xs shadow-xl shadow-amber-500/25 hover:brightness-110 transition-all cursor-pointer ring-1 ring-amber-300/60"
        title={isHy ? '3D Պահեստ, Խաղ և AI Ստուդիա' : '3D Склад, Игра и AI Студия'}
      >
        <span>✨ {isHy ? '3D & AI Ստուդիա' : '3D & AI Студия'}</span>
      </button>

      {currentUser.role === 'supplier' && (
        <button
          type="button"
          onClick={() => setIsSupplierPortalOpen(true)}
          className="fixed bottom-40 right-4 z-40 inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xl cursor-pointer"
        >
          <span>📦 {isHy ? 'Մատակարարի գրասենյակ (B2B)' : 'Кабинет Поставщика (B2B)'}</span>
        </button>
      )}

      <button
        type="button"
        onClick={async () => {
          if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
              setDeferredPrompt(null);
            }
          } else {
            setIsAndroidInstallOpen(true);
          }
        }}
        className="fixed bottom-28 right-4 z-40 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/90 backdrop-blur-md hover:bg-slate-800 text-emerald-300 font-semibold text-xs shadow-lg border border-emerald-500/30 hover:border-emerald-400/60 transition-all cursor-pointer"
        title={isHy ? 'Ներբեռնել Android հավելվածը' : 'Скачать приложение на Android'}
      >
        <span>📱 {isHy ? 'Android' : 'Android'}</span>
      </button>

      {isAndroidInstallOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>📱</span>
                <span>{isHy ? 'Տեղադրել «Համակարգ 2000»-ը Android-ում' : 'Установить «Система 2000» на Android'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAndroidInstallOpen(false)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {isHy
                ? '«Համակարգ 2000»-ը լիարժեք Android PWA հավելված է՝ օֆլայն աշխատանքով, 1C պահեստով և 10% բոնուսային դրամապանակով:'
                : '«Система 2000» — полноценное Android-приложение (PWA) с офлайн-режимом, 1С:Складом и бонусным кошельком 10% годовых.'}
            </p>
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-2 text-xs text-slate-300">
              <div className="font-bold text-emerald-400">
                {isHy ? 'Ինչպես տեղադրել Android հեռախոսում (Chrome)՝' : 'Как установить на Android (Chrome):'}
              </div>
              <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-300">
                <li>{isHy ? 'Բացեք կայքը Google Chrome-ով Android սարքում' : 'Откройте сайт в Google Chrome на Android'}</li>
                <li>{isHy ? 'Սեղմեք վերևի աջ անկյունի մենյուն (⋮)' : 'Нажмите меню (⋮) в правом верхнем углу'}</li>
                <li>{isHy ? 'Ընտրեք «Տեղադրել հավելվածը» կամ «Ավելացնել էկրանին»' : 'Выберите «Установить приложение» или «Добавить на гл. экран»'}</li>
              </ol>
            </div>
            <div className="flex flex-col gap-2">
              <a
                href={typeof window !== 'undefined' ? window.location.origin : '/'}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs text-center flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>🚀</span>
                <span>{isHy ? 'Բացել Android-ում տեղադրելու համար' : 'Открыть для установки на Android'}</span>
              </a>
              <button
                type="button"
                onClick={() => setIsAndroidInstallOpen(false)}
                className="w-full py-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-400 font-semibold text-xs cursor-pointer"
              >
                {isHy ? 'Փակել' : 'Закрыть'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3D Պահեստ և Վիտրինա (Three.js) & Heavy Subsystems */}
      <React.Suspense fallback={null}>
        {isPosOpen && (
          <PosTerminalModal
            isOpen={isPosOpen}
            onClose={() => setIsPosOpen(false)}
            currentUser={currentUser}
            lang={lang}
            onPosTransactionSuccess={handlePosTransactionSuccess}
          />
        )}

        {is3DWarehouseOpen && (
          <Warehouse3DScene
            isOpen={is3DWarehouseOpen}
            onClose={() => setIs3DWarehouseOpen(false)}
            lang={lang}
            warehouseCount={erpState.warehouses.length}
            productCount={products.length}
          />
        )}

        {isGameOpen && (
          <BonusRunnerGame
            isOpen={isGameOpen}
            onClose={() => setIsGameOpen(false)}
            lang={lang}
            onEarnBonusPoints={(pts) => {
              if (pts > 0) {
                showToast(
                  isHy
                    ? `Խաղն ավարտվեց: Ձեր արդյունքը՝ ${pts} միավոր: Հիշեցում. Ֆինանսական բոնուսային միավորները շնորհվում են ՄԻԱՅՆ ապրանքների գնումների դեպքում (+5% քեշբեք):`
                    : `Игра завершена! Ваш результат: ${pts} очков. Напоминание: финансовые бонусные баллы начисляются ТОЛЬКО при покупке продукции (+5% кешбэк).`,
                  'info'
                );
              }
            }}
          />
        )}

        {isErpOpen && (
          <Erp1CModal
            isOpen={isErpOpen}
            onClose={() => setIsErpOpen(false)}
            lang={lang}
            products={products}
            erpState={erpState}
            onUpdateErpState={setErpState}
            onOpenStorefront={() => setIsErpOpen(false)}
          />
        )}

        {isBuilderOpen && (
          <SiteBuilderModal
            isOpen={isBuilderOpen}
            onClose={() => setIsBuilderOpen(false)}
            config={siteConfig}
            onSaveConfig={handleSaveSiteConfig}
            lang={lang}
          />
        )}

        {isSupplierPortalOpen && (
          <SupplierPortalModal
            isOpen={isSupplierPortalOpen}
            onClose={() => setIsSupplierPortalOpen(false)}
            lang={lang}
            currentUser={currentUser}
            onRequestB2BContract={() => {
              setCurrentUser((prev) => ({ ...prev, b2bContractStatus: 'approved' }));
              showToast(isHy ? 'B2B պայմանագիրը կնքված է ՀՀ օրենքով' : 'B2B договор заключён по Закону РА', 'success');
            }}
            pendingProducts={pendingSupplierProducts}
            onSubmitProduct={(prod) => {
              const item: import('./types').PendingSupplierProduct = {
                id: `pend_${Date.now()}`,
                supplierId: currentUser.id,
                supplierName: currentUser.name,
                submittedAt: new Date().toLocaleString(),
                status: 'pending',
                product: prod,
              };
              setPendingSupplierProducts((prev) => [item, ...prev]);
              showToast(isHy ? 'Ապրանքը ուղարկվեց ադմինի ստուգմանը' : 'Товар отправлен на проверку администратору', 'info');
            }}
            disputes={returnDisputes}
            onSubmitDispute={(orderOrDocNumber, productName, reason, raLawArticle) => {
              const disp: import('./types').ReturnDispute = {
                id: `disp_${Date.now()}`,
                supplierId: currentUser.id,
                supplierName: currentUser.name,
                orderOrDocNumber,
                productName,
                reason,
                raLawArticle,
                createdAt: new Date().toLocaleString(),
                status: 'open',
              };
              setReturnDisputes((prev) => [disp, ...prev]);
              showToast(isHy ? 'Վիճարկումը գրանցված է' : 'Спор по возврату зарегистрирован', 'info');
            }}
          />
        )}

        {isChatOpen && (
          <GeminiChatbotModal
            isOpen={isChatOpen}
            onClose={() => setIsChatOpen(false)}
            language={lang}
            userBalance={wallet.realBalance}
            userDeposit={wallet.deposit}
            userBonusPoints={wallet.bonusPoints}
            products={products}
            onAddToCart={handleAddToCart}
            onAddBatchToCart={handleBatchAddToCart}
          />
        )}

        {isPartnerModalOpen && (
          <PartnerPortalModal
            isOpen={isPartnerModalOpen}
            onClose={() => setIsPartnerModalOpen(false)}
            lang={lang}
            products={products}
            userBalance={wallet.realBalance}
            userDeposit={wallet.deposit}
            userBonusPoints={wallet.bonusPoints}
            onAddToCart={handleAddToCart}
            onAddBatchToCart={handleBatchAddToCart}
          />
        )}

        {isScannerOpen && (
          <ScannerModal
            isOpen={isScannerOpen}
            onClose={() => setIsScannerOpen(false)}
            lang={lang}
            products={products}
            onAddToCart={handleAddToCart}
            onQuickBuy={(prod) => {
              setIsScannerOpen(false);
              handleQuickBuyGateway(prod);
            }}
            onAskAiProduct={(prod) => {
              setIsScannerOpen(false);
              setIsChatOpen(true);
            }}
          />
        )}

        {is3dShowcaseOpen && (
          <Ai3dShowcaseModal
            isOpen={is3dShowcaseOpen}
            onClose={() => setIs3dShowcaseOpen(false)}
            lang={lang}
            products={products}
            onAddToCart={handleAddToCart}
          />
        )}
      </React.Suspense>
    </div>
  );
}



