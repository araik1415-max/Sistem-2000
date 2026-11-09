export type Language = 'hy' | 'ru';

export type UserRole = 'customer' | 'supplier' | 'admin';

export interface UserProfile {
  id: string;
  name: string;
  emailOrPhone: string;
  isLoggedIn: boolean;
  registeredAt: string;
  role?: UserRole;
  isAdmin?: boolean;
  birthDate?: string;
  phone?: string;
  email?: string;
  b2cContractStatus?: 'none' | 'pending' | 'approved' | 'rejected';
  b2bContractStatus?: 'none' | 'pending' | 'approved' | 'rejected';
  totalUsageSeconds?: number;
  totalTransactions?: number;
  agreementAccepted?: boolean;
  agreementAcceptedAt?: string;
}

export interface PendingSupplierProduct {
  id: string;
  supplierId: string;
  supplierName: string;
  submittedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  product: Omit<ProductItem, 'id'>;
}

export interface ReturnDispute {
  id: string;
  supplierId: string;
  supplierName: string;
  orderOrDocNumber: string;
  productName: string;
  reason: string;
  raLawArticle: string;
  createdAt: string;
  status: 'open' | 'resolved_supplier' | 'resolved_store';
  adminComment?: string;
}

export interface ProductCategory {
  id: string;
  nameHy: string;
  nameRu: string;
  department: 'groceries' | 'construction';
  iconName?: string;
  descriptionHy?: string;
  descriptionRu?: string;
  isCustom?: boolean;
  createdAt?: string;
}

export interface ProductItem {
  id: number;
  nameHy: string;
  nameRu: string;
  category?: string;
  categoryHy: string;
  categoryRu: string;
  priceDram: number; // Գինը դրամով (֏)
  pointsCost: number; // Գինը բոնուսներով
  descriptionHy: string;
  descriptionRu: string;
  unitHy: string;
  unitRu: string;
  imageUrl: string; // Ապրանքի նկարը
  iconName: string;
  isAvailable?: boolean;
  manufacturerHy?: string;
  manufacturerRu?: string;
  shelfLifeHy?: string;
  shelfLifeRu?: string;
  originCountryHy?: string;
  originCountryRu?: string;
  storageConditionsHy?: string;
  storageConditionsRu?: string;
  sku?: string;
  barcode?: string;
  imageKeywords?: string[];
  department?: 'groceries' | 'construction';
  usageInstructionsRu?: string;
  usageInstructionsHy?: string;
  loadCapacityRu?: string;
  loadCapacityHy?: string;
  wholesalePriceDram?: number;
  wholesaleMinQty?: number;
  stockCount?: number;
}

export interface B2bInvoiceItem {
  productId: number;
  productName: string;
  quantity: number;
  unitPriceDram: number;
  discountPercent: number;
  finalPriceDram: number;
  totalDram: number;
}

export interface B2bInvoice {
  id: string;
  invoiceNumber: string;
  companyName: string;
  taxId: string;
  date: string;
  timestamp: number;
  items: B2bInvoiceItem[];
  subtotalDram: number;
  vatAmountDram: number;
  totalAmountDram: number;
  paymentTermsDays: number;
  status: 'draft' | 'issued' | 'approved' | 'paid';
  notes?: string;
}

export interface BankCardPaymentConfig {
  enabled: boolean;
  merchantId: string;
  apiKey: string;
  apiEndpoint: string;
  cardNumber: string;
  cardHolder: string;
  bankName: string;
  iban: string;
  swift: string;
  testMode: boolean;
}

export interface QrPaymentConfig {
  telcellEnabled: boolean;
  telcellNumber: string;
  telcellQrPayload: string;
  idramEnabled: boolean;
  idramId: string;
  idramQrPayload: string;
  arcaEnabled: boolean;
  arcaAccount: string;
  arcaQrPayload: string;
}

export interface AdminSettings {
  annualRate: number; // e.g. 0.10 (10%)
  systemFrozen: boolean;
  welcomeBonusAmount: number;
  bonusMultiplier: number;
  adminNotificationEmail?: string;
  emailNotificationsEnabled?: boolean;
  sendCustomerOrderReceiptEmail?: boolean;
  bankCardsConfig?: BankCardPaymentConfig;
  qrPaymentConfig?: QrPaymentConfig;
}


export interface EmailNotificationLog {
  id: string;
  timestamp: number;
  toEmail: string;
  recipientType: 'admin' | 'customer';
  subject: string;
  event: 'order_created' | 'order_paid' | 'deposit_topup' | 'rate_changed' | 'test_ping';
  status: 'sent' | 'simulated' | 'failed';
  contentPreview: string;
  details?: {
    orderNumber?: string;
    amountDram?: number;
    paymentMethod?: string;
    customerName?: string;
    itemsCount?: number;
    oldRate?: number;
    newRate?: number;
  };
}

export type LogCategory = 'deposit' | 'real_topup' | 'dram_purchase' | 'points_purchase' | 'system' | 'auth' | 'admin' | 'pos_terminal';

export interface LogItem {
  id: string;
  time: string;
  timestamp: number;
  text: string;
  category: LogCategory;
  depositSnapshot: number;
  pointsSnapshot: number;
  realBalanceSnapshot?: number;
}

export type ThemeId = 'emerald' | 'sapphire' | 'amber' | 'amethyst' | 'crimson' | 'cyber';

export type SectionId =
  | 'hero_banner'
  | 'balance_card'
  | 'deposit_panel'
  | 'featured_deals'
  | 'catalog'
  | 'yield_calc_preview'
  | 'trust_badges'
  | 'reviews'
  | 'faq'
  | 'history_log'
  | 'store_footer';

export interface SiteSectionConfig {
  id: SectionId;
  nameHy: string;
  nameRu: string;
  enabled: boolean;
  iconName?: string;
}

export interface HeroSlide {
  id: string;
  titleHy: string;
  titleRu: string;
  subtitleHy: string;
  subtitleRu: string;
  badgeHy: string;
  badgeRu: string;
  ctaTextHy: string;
  ctaTextRu: string;
  ctaAction: 'catalog' | 'cart' | 'deposit';
  imageUrl: string;
  bgGradient: string;
}

export interface StoreReview {
  id: string;
  author: string;
  rating: number;
  textHy: string;
  textRu: string;
  date: string;
  verified: boolean;
}

export interface FaqItem {
  id: string;
  questionHy: string;
  questionRu: string;
  answerHy: string;
  answerRu: string;
}

export interface StoreContactInfo {
  phone: string;
  email: string;
  telegram: string;
  whatsapp: string;
  deliveryCity: string;
  freeDeliveryMinAmount: number;
}

export interface SiteConfig {
  version: number;
  themeId: ThemeId;
  cardRadius: 'rounded-xl' | 'rounded-2xl' | 'rounded-3xl';
  containerWidth: 'max-w-2xl' | 'max-w-3xl' | 'max-w-4xl';
  storeTitleHy: string;
  storeTitleRu: string;
  storeTaglineHy: string;
  storeTaglineRu: string;
  badgeTextHy: string;
  badgeTextRu: string;
  promoBar: {
    enabled: boolean;
    textHy: string;
    textRu: string;
    bgColor: string;
    actionTextHy: string;
    actionTextRu: string;
  };
  sections: SiteSectionConfig[];
  heroSlides: HeroSlide[];
  reviews: StoreReview[];
  faqs: FaqItem[];
  contact: StoreContactInfo;
}

export type AccountType = 'REAL_BALANCE' | 'DEPOSIT' | 'BONUS_POINTS';
export type TransactionType = 'DEPOSIT_TOPUP' | 'INTEREST_ACCRUAL' | 'PURCHASE' | 'BONUS_REWARD' | 'EXTERNAL_PAYMENT' | 'ADMIN_ADJUSTMENT';

export interface LedgerEntry {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  fromAccount: AccountType | 'EXTERNAL_SYSTEM';
  toAccount: AccountType | 'EXTERNAL_SYSTEM';
  timestamp: number;
  details?: string;
}

export interface UserState {
  userId: string;
  realBalance: number;
  deposit: number;
  bonusPoints: number;
  lastAccrualTimestamp: number;
}

export interface CustomerPurchaseItem {
  productId: number;
  productName: string;
  quantity: number;
  priceDram: number;
  unit: string;
  totalDram: number;
}

export interface CustomerPurchase {
  id: string;
  orderNumber: string;
  date: string;
  timestamp: number;
  items: CustomerPurchaseItem[];
  totalAmountDram: number;
  paidWith: 'dram' | 'points' | 'idram' | 'telcell' | 'card' | 'mixed';
  pointsUsed?: number;
  bonusPointsEarned: number;
  status: 'completed' | 'delivered' | 'processing';
  note?: string;
}

export interface CustomerAccount {
  id: string;
  name: string;
  phone: string;
  email: string;
  city: string;
  avatarUrl?: string;
  registeredAt: string;
  lastActiveAt: string;
  status: 'vip' | 'regular' | 'new' | 'wholesale';
  realBalance: number;
  deposit: number;
  bonusPoints: number;
  lastAccrualTimestamp: number;
  purchases: CustomerPurchase[];
  ledger: LedgerEntry[];
  notes?: string;
  totalSpentDram: number;
  agreementAccepted?: boolean;
  agreementAcceptedAt?: string;
  partnerType?: 'b2c_retail' | 'b2b_corporate' | 'b2b_distributor';
  companyName?: string;
  taxId?: string;
  creditLimitDram?: number;
  usedCreditDram?: number;
  referralCode?: string;
  referredUsersCount?: number;
  referralEarningsPoints?: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model' | 'system';
  content: string;
  timestamp: number;
  recipeData?: any;
  addedToCart?: boolean;
}

export type ChatBotRole = 'finance' | 'store' | 'admin';

export interface SystemArchiveItem {
  id: string;
  type: 'product' | 'customer_account' | 'log_item' | 'customer_note';
  title: string;
  deletedAt: string;
  deletedTimestamp: number;
  data: any;
}


