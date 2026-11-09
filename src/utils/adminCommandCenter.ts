import { CustomerAccount, CustomerPurchase, ProductItem } from '../types';
import { ErpState } from '../types/erp';
import { WalletState } from './finance';

export interface FlattenedOrder extends CustomerPurchase {
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
}

export interface AdminEcosystemMetrics {
  totalProducts: number;
  availableProducts: number;
  hiddenProducts: number;
  lowStockProducts: number;
  totalCatalogStockUnits: number;
  totalCatalogStockValueDram: number;
  totalCustomers: number;
  vipCustomers: number;
  totalCustomerDepositsDram: number;
  totalCustomerRealBalanceDram: number;
  totalCustomerBonusPoints: number;
  totalOrdersCount: number;
  totalOrdersRevenueDram: number;
  totalErpCashDram: number;
  activeHoldingsCount: number;
  activeHoldingsDram: number;
}

export function computeAdminEcosystemMetrics(params: {
  products: ProductItem[];
  customers: CustomerAccount[];
  wallet: WalletState;
  erpState?: ErpState;
}): AdminEcosystemMetrics {
  const { products, customers, wallet, erpState } = params;

  const totalProducts = products.length;
  const availableProducts = products.filter((p) => p.isAvailable !== false).length;
  const hiddenProducts = totalProducts - availableProducts;
  const lowStockProducts = products.filter((p) => (p.stockCount ?? 25) <= 5).length;

  const totalCatalogStockUnits = products.reduce((sum, p) => sum + (p.stockCount ?? 25), 0);
  const totalCatalogStockValueDram = products.reduce(
    (sum, p) => sum + p.priceDram * (p.stockCount ?? 25),
    0
  );

  const totalCustomers = customers.length;
  const vipCustomers = customers.filter((c) => c.status === 'vip' || c.status === 'wholesale').length;
  const totalCustomerDepositsDram = customers.reduce((sum, c) => sum + c.deposit, 0);
  const totalCustomerRealBalanceDram = customers.reduce((sum, c) => sum + c.realBalance, 0);
  const totalCustomerBonusPoints = Number(
    customers.reduce((sum, c) => sum + c.bonusPoints, 0).toFixed(2)
  );

  const totalOrdersCount = customers.reduce((sum, c) => sum + c.purchases.length, 0);
  const totalOrdersRevenueDram = customers.reduce((sum, c) => sum + c.totalSpentDram, 0);

  const totalErpCashDram = erpState
    ? erpState.cashAccounts.reduce((sum, acc) => sum + acc.balanceDram, 0)
    : 0;

  const holdings = wallet.holdings || [];
  const activeHoldingsCount = holdings.filter(
    (h) => h.status === 'cooldown_15d' || h.status === 'active_lifelong'
  ).length;
  const activeHoldingsDram = holdings
    .filter((h) => h.status === 'cooldown_15d' || h.status === 'active_lifelong')
    .reduce((sum, h) => sum + h.amount, 0);

  return {
    totalProducts,
    availableProducts,
    hiddenProducts,
    lowStockProducts,
    totalCatalogStockUnits,
    totalCatalogStockValueDram,
    totalCustomers,
    vipCustomers,
    totalCustomerDepositsDram,
    totalCustomerRealBalanceDram,
    totalCustomerBonusPoints,
    totalOrdersCount,
    totalOrdersRevenueDram,
    totalErpCashDram,
    activeHoldingsCount,
    activeHoldingsDram,
  };
}

export function applyBulkPriceChange(
  products: ProductItem[],
  percentDelta: number,
  departmentFilter: 'all' | 'groceries' | 'construction' = 'all'
): ProductItem[] {
  const factor = 1 + percentDelta / 100;
  return products.map((prod) => {
    const dept = prod.department || 'groceries';
    if (departmentFilter !== 'all' && dept !== departmentFilter) {
      return prod;
    }
    const rawNewPrice = prod.priceDram * factor;
    const roundedPrice = Math.max(50, Math.round(rawNewPrice / 10) * 10);
    return {
      ...prod,
      priceDram: roundedPrice,
      pointsCost: roundedPrice,
    };
  });
}

export function applyBulkStockRefill(
  products: ProductItem[],
  addQuantity: number,
  departmentFilter: 'all' | 'groceries' | 'construction' = 'all'
): ProductItem[] {
  const safeAdd = Math.max(1, Math.round(addQuantity));
  return products.map((prod) => {
    const dept = prod.department || 'groceries';
    if (departmentFilter !== 'all' && dept !== departmentFilter) {
      return prod;
    }
    const nextStock = (prod.stockCount ?? 20) + safeAdd;
    return {
      ...prod,
      stockCount: nextStock,
      isAvailable: true,
    };
  });
}

export function flattenAndFilterOrders(
  customers: CustomerAccount[],
  searchQuery: string = '',
  statusFilter: 'all' | 'processing' | 'completed' | 'delivered' = 'all',
  paymentFilter: string = 'all'
): FlattenedOrder[] {
  const allOrders: FlattenedOrder[] = [];
  for (const cust of customers) {
    for (const purchase of cust.purchases) {
      allOrders.push({
        ...purchase,
        customerId: cust.id,
        customerName: cust.name,
        customerPhone: cust.phone,
        customerEmail: cust.email,
      });
    }
  }

  allOrders.sort((a, b) => b.timestamp - a.timestamp);

  const q = searchQuery.trim().toLowerCase();

  return allOrders.filter((order) => {
    if (statusFilter !== 'all' && order.status !== statusFilter) return false;
    if (paymentFilter !== 'all' && order.paidWith !== paymentFilter) return false;
    if (!q) return true;

    const matchOrderNum = order.orderNumber.toLowerCase().includes(q);
    const matchCustomer =
      order.customerName.toLowerCase().includes(q) ||
      order.customerPhone.toLowerCase().includes(q) ||
      order.customerEmail.toLowerCase().includes(q);
    const matchItems = order.items.some((it) => it.productName.toLowerCase().includes(q));
    return matchOrderNum || matchCustomer || matchItems;
  });
}
