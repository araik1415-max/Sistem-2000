import React, { useState } from 'react';
import {
  X,
  User,
  Wallet,
  TrendingUp,
  Coins,
  History,
  ShoppingBag,
  FileText,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Activity,
  LogOut,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  ExternalLink,
  Printer,
  Sparkles,
  CreditCard,
  Building,
  AlertTriangle,
  ChevronRight,
  Lock,
  BarChart3,
} from 'lucide-react';
import {
  UserProfile,
  Language,
  LogItem,
  CustomerAccount,
  CustomerPurchase,
} from '../types';
import { WalletState, formatDram, calculateIncrement } from '../utils/finance';
import { formatUsageDuration } from '../utils/time';
import { SYSTEM_2000_CONTRACT_META, CONTRACT_ARTICLES } from '../utils/agreement';
import { useAuth } from '../context/AuthContext';
import { AnalyticsDashboard } from './AnalyticsDashboard';

interface PersonalCabinetModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  currentUser: UserProfile;
  wallet: WalletState;
  logs: LogItem[];
  customers: CustomerAccount[];
  totalUsageSeconds: number;
  onLogout: () => void;
  onOpenAgreement: () => void;
  onOpenTopup: () => void;
  onOpenPartnerPortal?: () => void;
}

export const PersonalCabinetModal: React.FC<PersonalCabinetModalProps> = ({
  isOpen,
  onClose,
  lang,
  currentUser,
  wallet,
  logs,
  customers,
  totalUsageSeconds,
  onLogout,
  onOpenAgreement,
  onOpenTopup,
  onOpenPartnerPortal,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'transactions' | 'purchases' | 'agreements' | 'profile'>('overview');
  const [txSearch, setTxSearch] = useState('');
  const [txCategory, setTxCategory] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<CustomerPurchase | null>(null);

  const { user, signOutUser } = useAuth();

  if (!isOpen) return null;

  const isHy = lang === 'hy';
  const isAccepted = Boolean(currentUser.agreementAccepted);
  const acceptedDate = currentUser.agreementAcceptedAt || (isAccepted ? '12.01.2026' : '');

  // Найти записи покупок текущего пользователя
  const customerAccount = customers.find(
    (c) => c.id === currentUser.id || c.email === currentUser.emailOrPhone || c.phone === currentUser.emailOrPhone
  ) || customers[0];

  const userPurchases = customerAccount?.purchases || [];

  // Фильтрация транзакций
  const filteredLogs = logs.filter((log) => {
    const matchesSearch = log.text.toLowerCase().includes(txSearch.toLowerCase()) || log.time.includes(txSearch);
    const matchesCat = txCategory === 'all' || log.category === txCategory;
    return matchesSearch && matchesCat;
  });

  const dailyGrowth = calculateIncrement(wallet.deposit, 86400);

  const handleLogoutAction = async () => {
    try {
      await signOutUser();
    } catch {
      // ignore
    }
    onLogout();
    onClose();
  };

  return (
    <div
      id="personal-cabinet-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-sm overflow-y-auto"
    >
      <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-750 rounded-2xl shadow-2xl text-slate-100 flex flex-col my-auto max-h-[92vh] overflow-hidden">
        
        {/* ВЕРХНЯЯ ШАПКА ЛИЧНОГО КАБИНЕТА */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-950/90 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-lg shadow-emerald-500/20 flex items-center justify-center shrink-0">
              {user?.photoURL ? (
                <img src={user.photoURL} alt="User" className="w-full h-full rounded-[10px] object-cover" />
              ) : (
                <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center text-emerald-400 font-bold text-lg">
                  {currentUser.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  {isHy ? 'Անձնական կաբինետ' : 'Личный кабинет'}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>{currentUser.name}</span>
                </span>
                {currentUser.isAdmin && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    ADMIN
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {currentUser.emailOrPhone} • {isHy ? 'Համակարգում է՝ ' : 'В системе с '} {currentUser.registeredAt}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label={isHy ? 'Փակել' : 'Закрыть'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* НАВИГАЦИОННЫЕ ТАБЫ (5 ВЛАДОК) */}
        <div className="flex items-center gap-1 p-2 bg-slate-950/80 border-b border-slate-800 overflow-x-auto text-xs font-semibold shrink-0">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'overview'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-700/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Wallet className="w-4 h-4 text-emerald-300" />
            <span>{isHy ? 'Ֆինանսական ակնարկ' : 'Обзор и финансы'}</span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'analytics'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-700/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-sky-400" />
            <span>{isHy ? 'Անալիտիկա (30 օր)' : 'Аналитика (30 дней)'}</span>
            <span className="px-1.5 py-0.2 rounded-full bg-sky-500/20 text-sky-300 text-[10px] font-mono font-bold">
              30d
            </span>
          </button>

          <button
            onClick={() => setActiveTab('transactions')}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'transactions'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-700/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <History className="w-4 h-4 text-teal-300" />
            <span>{isHy ? 'Գործարքներ' : 'История транзакций'}</span>
            <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-[10px] font-mono">
              {logs.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('purchases')}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'purchases'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-700/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <ShoppingBag className="w-4 h-4 text-sky-300" />
            <span>{isHy ? 'Գնումներ' : 'История покупок'}</span>
            <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-[10px] font-mono">
              {userPurchases.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('agreements')}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'agreements'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-700/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <FileText className="w-4 h-4 text-amber-300" />
            <span>{isHy ? 'Պայմանագրեր' : 'Статус соглашений'}</span>
            {isAccepted ? (
              <span className="w-2 h-2 rounded-full bg-emerald-400" title={isHy ? 'Ակցեպտավորված է' : 'Подписано'}></span>
            ) : (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" title={isHy ? 'Սպասում է ստորագրման' : 'Требует акцепта'}></span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'profile'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-700/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <User className="w-4 h-4 text-cyan-300" />
            <span>{isHy ? 'Պրոֆիլ' : 'Профиль и настройки'}</span>
          </button>
        </div>

        {/* КОНТЕНТ ВЛАДОК */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          
          {/* ТАБ 1: ОБЗОР И ФИНАНСЫ */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* 3 ОСНОВНЫЕ КАРТОЧКИ БАЛАНСА */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 1. ИРАКАН БԱԼԱՆՍ */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-850 to-slate-900 border border-slate-750 shadow-lg relative overflow-hidden group">
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                    <span className="font-semibold">{isHy ? 'Իրական հաշվեկշիռ (դրամ)' : 'Основной баланс (AMD)'}</span>
                    <Wallet className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-2xl font-black text-white font-mono tracking-tight">
                    {formatDram(wallet.realBalance)}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-2 flex items-center justify-between">
                    <span>{isHy ? 'Հասանելի է գնումների համար' : 'Доступно для покупок'}</span>
                    <button
                      onClick={onOpenTopup}
                      className="px-2.5 py-1 rounded-lg bg-emerald-600/80 hover:bg-emerald-500 text-white font-bold text-[11px] transition-colors cursor-pointer"
                    >
                      + {isHy ? 'Լիցքավորել' : 'Пополнить'}
                    </button>
                  </div>
                </div>

                {/* 2. 10% ДЕПОЗИТ */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-850 to-slate-900 border border-emerald-500/30 shadow-lg relative overflow-hidden group">
                  <div className="flex items-center justify-between text-xs text-emerald-400 mb-2 font-semibold">
                    <span>10% {isHy ? 'Տարեկան Դեպոզիտ' : 'Годовой Депозит'}</span>
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-2xl font-black text-emerald-400 font-mono tracking-tight">
                    {formatDram(wallet.deposit)}
                  </div>
                  <div className="text-[11px] text-emerald-300/80 mt-2 flex items-center justify-between">
                    <span>+{dailyGrowth.toFixed(2)} {isHy ? 'բոնուս/օր' : 'б./день'}</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold">
                      24/7 LIVE APY
                    </span>
                  </div>
                </div>

                {/* 3. БОНУСНЫЕ БАЛЛЫ */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-850 to-slate-900 border border-amber-500/30 shadow-lg relative overflow-hidden group">
                  <div className="flex items-center justify-between text-xs text-amber-400 mb-2 font-semibold">
                    <span>⭐ {isHy ? 'Բոնուսային միավորներ' : 'Бонусные баллы'}</span>
                    <Coins className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="text-2xl font-black text-amber-400 font-mono tracking-tight">
                    {wallet.bonusPoints.toFixed(2)} {isHy ? 'բ.' : 'баллов'}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-2 flex items-center justify-between">
                    <span>{isHy ? '1 բոնուս = 1 ֏ անվճար' : '1 балл = 1 ֏ скидки'}</span>
                    <span className="text-teal-300 font-semibold">{isHy ? '100% մարում' : '100% списание'}</span>
                  </div>
                </div>
              </div>

              {/* МЕТРИКИ АԿՏԻՎՈՒԹՅԱՆ */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <div className="text-slate-400 mb-1">{isHy ? 'Ընդամենը գնումներ' : 'Всего покупок'}</div>
                  <div className="text-base font-bold text-white font-mono">
                    {formatDram(customerAccount?.totalSpentDram || 118500)}
                  </div>
                </div>
                <div>
                  <div className="text-slate-400 mb-1">{isHy ? 'Գործարքների քանակ' : 'Всего транзакций'}</div>
                  <div className="text-base font-bold text-emerald-400 font-mono">
                    {logs.length} {isHy ? 'գործարք' : 'операций'}
                  </div>
                </div>
                <div>
                  <div className="text-slate-400 mb-1">{isHy ? 'Ժամանակը համակարգում' : 'Время в системе'}</div>
                  <div className="text-base font-bold text-cyan-400 font-mono">
                    {formatUsageDuration(totalUsageSeconds, lang)}
                  </div>
                </div>
                <div>
                  <div className="text-slate-400 mb-1">{isHy ? 'Պայմանագրի կարգավիճակ' : 'Статус Договора'}</div>
                  <div className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>{isAccepted ? (isHy ? 'Ակցեպտավորված' : 'Подписан') : (isHy ? 'Սպասում է' : 'Не подписан')}</span>
                  </div>
                </div>
              </div>

              {/* БЫСТРЫЕ ДЕЙСТВИЯ */}
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <button
                  onClick={onOpenTopup}
                  className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-lg shadow-emerald-700/20 cursor-pointer flex items-center justify-center gap-2"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>{isHy ? 'Լիցքավորել հաշիվը / Դեպոզիտը' : 'Пополнить счет / Депозит'}</span>
                </button>
                <button
                  onClick={onOpenAgreement}
                  className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <FileText className="w-4 h-4 text-teal-400" />
                  <span>{isHy ? 'Կարդալ / Ստորագրել Պայմանագիրը' : 'Открыть Договор-оферту'}</span>
                </button>
              </div>
            </div>
          )}

          {/* ТАБ 2: ИСТОРИЯ ТРАНЗАКЦИЙ */}
          {activeTab === 'transactions' && (
            <div className="space-y-4">
              {/* ФИЛЬТРЫ И ПОИСК */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs">
                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={txSearch}
                    onChange={(e) => setTxSearch(e.target.value)}
                    placeholder={isHy ? 'Որոնել գործարքներով...' : 'Поиск по истории...'}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <span className="text-slate-400">{isHy ? 'Կատեգորիա:' : 'Категория:'}</span>
                  <select
                    value={txCategory}
                    onChange={(e) => setTxCategory(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="all">{isHy ? 'Բոլորը' : 'Все категории'}</option>
                    <option value="deposit">{isHy ? 'Դեպոզիտ' : 'Депозит'}</option>
                    <option value="real_topup">{isHy ? 'Լիցքավորում' : 'Пополнение'}</option>
                    <option value="dram_purchase">{isHy ? 'Գնումներ ֏' : 'Покупки ֏'}</option>
                    <option value="points_purchase">{isHy ? 'Բոնուսներով' : 'Оплата бонусами'}</option>
                    <option value="auth">{isHy ? 'Ավտորիզացիա' : 'Авторизация / Договор'}</option>
                  </select>
                </div>
              </div>

              {/* СПИСОК ТРАНЗАКЦИЙ */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse font-mono">
                    <thead>
                      <tr className="bg-slate-900 border-b border-slate-800 font-bold text-slate-400 uppercase text-[11px]">
                        <th className="p-3">{isHy ? 'Ժամանակ' : 'Время'}</th>
                        <th className="p-3">{isHy ? 'Կատեգորիա' : 'Категория'}</th>
                        <th className="p-3">{isHy ? 'Նկարագրություն' : 'Описание операции'}</th>
                        <th className="p-3 text-right">{isHy ? 'Դեպոզիտ' : 'Депозит'}</th>
                        <th className="p-3 text-right">{isHy ? 'Բոնուսներ' : 'Баллы'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {filteredLogs.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-slate-500 font-sans">
                            {isHy ? 'Գործարքներ չեն գտնվել' : 'Операции не найдены'}
                          </td>
                        </tr>
                      ) : (
                        filteredLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-slate-900/50 transition-colors">
                            <td className="p-3 text-slate-400 whitespace-nowrap">{log.time}</td>
                            <td className="p-3">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                  log.category === 'deposit' || log.category === 'real_topup'
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                    : log.category === 'dram_purchase'
                                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                                    : log.category === 'points_purchase'
                                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                    : 'bg-slate-800 text-slate-300'
                                }`}
                              >
                                {log.category}
                              </span>
                            </td>
                            <td className="p-3 text-slate-200 font-sans">{log.text}</td>
                            <td className="p-3 text-right text-emerald-400 font-bold whitespace-nowrap">
                              {formatDram(log.depositSnapshot)}
                            </td>
                            <td className="p-3 text-right text-amber-400 font-bold whitespace-nowrap">
                              {log.pointsSnapshot.toFixed(2)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ТАБ: АНАЛИТИЧЕСКИЙ ДАШБОРД (ДИНАМИКА БАЛАНСА, БОНУСОВ И ПОКУПОК ЗА 30 ДНЕЙ) */}
          {activeTab === 'analytics' && (
            <AnalyticsDashboard
              wallet={wallet}
              purchases={userPurchases}
              logs={logs}
              lang={lang}
            />
          )}

          {/* ТАБ 3: ИСТОРИЯ ПОКУПОК */}
          {activeTab === 'purchases' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-300 flex items-center justify-between">
                <span>{isHy ? 'Ձեր բոլոր պատվերները և էլեկտրոնային անդորրագրերը:' : 'Все ваши заказы и фискальные чеки:'}</span>
                <span className="font-bold text-white font-mono">{userPurchases.length} {isHy ? 'պատվեր' : 'заказов'}</span>
              </div>

              <div className="space-y-3">
                {userPurchases.length === 0 ? (
                  <div className="p-12 text-center text-slate-500 bg-slate-950 rounded-2xl border border-slate-800">
                    <ShoppingBag className="w-12 h-12 mx-auto mb-2 text-slate-600" />
                    <div>{isHy ? 'Գնումների պատմությունը դատարկ է' : 'История покупок пуста'}</div>
                  </div>
                ) : (
                  userPurchases.map((purchase) => (
                    <div
                      key={purchase.id}
                      className="p-4 rounded-2xl bg-slate-850 border border-slate-750 hover:border-slate-700 transition-all space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-750 pb-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-white text-sm">
                            {purchase.orderNumber}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            {purchase.status}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 font-mono">
                          {purchase.date}
                        </div>
                      </div>

                      {/* СПИСОК ТОВАРОВ В ЗАКАЗЕ */}
                      <div className="space-y-2 text-xs">
                        {purchase.items.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between text-slate-300 font-sans">
                            <div>
                              <span className="font-semibold text-white">{item.productName}</span>
                              <span className="text-slate-500 ml-2">x{item.quantity} ({item.unit})</span>
                            </div>
                            <span className="font-mono font-bold text-white">{formatDram(item.totalDram)}</span>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-750 text-xs">
                        <div className="text-slate-400">
                          {isHy ? 'Վճարման եղանակ՝' : 'Способ оплаты:'}{' '}
                          <span className="font-bold text-teal-300 uppercase">{purchase.paidWith}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-slate-400 mr-2">{isHy ? 'Ընդամենը՝' : 'Итого:'}</span>
                          <span className="text-base font-black text-white font-mono">
                            {formatDram(purchase.totalAmountDram)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ТАБ 4: СТАТУС СОГЛАШЕНИЙ */}
          {activeTab === 'agreements' && (
            <div className="space-y-6">
              {/* СТАТУС-БАННЕР ДОГОВОРА */}
              <div
                className={`p-5 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-4 ${
                  isAccepted
                    ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
                    : 'bg-amber-950/40 border-amber-500/50 text-amber-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${
                      isAccepted
                        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                        : 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                    }`}
                  >
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-base font-bold text-white flex items-center gap-2">
                      <span>{isHy ? '«Համակարգ 2000» Էկոհամակարգի Օֆերտայի Պայմանագիր' : 'Договор-оферта экосистемы «Система 2000»'}</span>
                    </div>
                    <p className="text-xs text-slate-300 mt-0.5">
                      № {SYSTEM_2000_CONTRACT_META.contractNumber} • {isHy ? 'Խմբագրություն 2.4 (2026)' : 'Редакция 2.4 (2026)'}
                    </p>
                    <div className="text-[11px] font-mono text-slate-400 mt-1">
                      {isAccepted
                        ? (isHy ? `Ակցեպտավորված է՝ ${acceptedDate}` : `Подписан и акцептован: ${acceptedDate}`)
                        : (isHy ? '⚠️ Պայմանագիրը սպասում է Ձեր ակցեպտավորմանը' : '⚠️ Договор ожидает вашего акцепта')}
                    </div>
                  </div>
                </div>

                <button
                  onClick={onOpenAgreement}
                  className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all shadow-lg cursor-pointer whitespace-nowrap ${
                    isAccepted
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-700/30'
                      : 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-700/30 animate-pulse'
                  }`}
                >
                  {isAccepted ? (isHy ? 'Կարդալ / Տպել' : 'Читать / Печать') : (isHy ? 'Ստորագրել Պայմանագիրը' : 'Акцептовать Договор')}
                </button>
              </div>

              {/* B2B / B2C ГՈՐԾԸՆԿԵՐԱՅԻՆ ՊԱՅՄԱՆԱԳԻՐ ԵՎ ՊՈՐՏԱԼ */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-teal-500/40 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-500/40 text-teal-400 flex items-center justify-center shrink-0 font-bold">
                    🤝
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white flex items-center gap-2">
                      <span>{isHy ? 'B2B/B2C Գործընկերային Ծրագիր և Մեծածախ Պայմանագրեր' : 'B2B/B2C Партнерский Модуль & Договоры Опта'}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] bg-teal-500/20 text-teal-300 font-mono">
                        ИНН / Опт / Рефералы
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {isHy
                        ? 'Կորպորատիվ հաշիվ-ապրանքագրեր, վճարման հետաձգում 14-30 օր և ռեֆերալային հղումներ'
                        : 'Счета-фактуры с НДС 20%, кредитная линия до 500,000 ֏ и реферальный кешбэк'}
                    </p>
                  </div>
                </div>

                {onOpenPartnerPortal && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenPartnerPortal();
                    }}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold text-xs shadow-md hover:brightness-110 transition-all cursor-pointer whitespace-nowrap"
                  >
                    {isHy ? 'Բացել Պորտալը' : 'Открыть Портал B2B/B2C'}
                  </button>
                )}
              </div>

              {/* 3 КЛЮЧЕВЫХ ПРАВИЛА ДОГОВОРА */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-4 rounded-xl bg-slate-950 border border-emerald-500/30 text-xs">
                  <div className="font-bold text-emerald-400 mb-1 flex items-center gap-1.5">
                    <Lock className="w-4 h-4" />
                    <span>{isHy ? '1. Փակ էկոհամակարգ' : '1. Закрытый контур'}</span>
                  </div>
                  <p className="text-slate-300 text-[11px]">
                    {isHy
                      ? 'Բոնուսները գործում են ՄԻԱՅՆ խանութում և POS ցանցում: Ելքը և կանխիկացումն արգելված են (Հոդված 2):'
                      : 'Бонусные баллы действуют ТОЛЬКО в экосистеме «Система 2000». Вывод запрещен (Статья 2).'}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-amber-500/30 text-xs">
                  <div className="font-bold text-amber-400 mb-1 flex items-center gap-1.5">
                    <Coins className="w-4 h-4" />
                    <span>{isHy ? '2. Բոնուսը դեպոզիտ չէ' : '2. Баллы не депозит'}</span>
                  </div>
                  <p className="text-slate-300 text-[11px]">
                    {isHy
                      ? 'Բոնուսներով վճարելիս դեպոզիտի մարմինը ՉԻ ԱՎԵԼԱՆՈՒՄ: Դեպոզիտը մնում է անփոփոխ (Հոդված 3):'
                      : 'Оплата бонусами НЕ является депозитом и НЕ увеличивает тело 10% депозита (Статья 3).'}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-cyan-500/30 text-xs">
                  <div className="font-bold text-cyan-400 mb-1 flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4" />
                    <span>{isHy ? '3. 10% դեպոզիտ' : '3. Депозит 10%'}</span>
                  </div>
                  <p className="text-slate-300 text-[11px]">
                    {isHy
                      ? 'Դեպոզիտն աճում է ԲԱՑԱՌԱՊԵՍ ԻՐԱԿԱՆ ԴՐԱՄՈՎ (Idram, Telcell, քարտեր, կանխիկ) վճարելիս (Հոդված 4):'
                      : 'Депозит пополняется ИСКЛЮЧИТЕЛЬНО при оплате НАСТОЯЩИМИ ДЕНЬГАМИ (Статья 4).'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ТАБ 5: ПРОФИЛЬ И НАСТРОЙКИ */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4 text-xs">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <span className="text-slate-400">{isHy ? 'Օգտատիրոջ ID' : 'Идентификатор пользователя'}</span>
                  <span className="font-mono font-bold text-emerald-400">{currentUser.id}</span>
                </div>

                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <span className="text-slate-400">{isHy ? 'Անուն Ազգանուն' : 'Имя пользователя'}</span>
                  <span className="font-bold text-white">{currentUser.name}</span>
                </div>

                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <span className="text-slate-400">{isHy ? 'Կոնտակտներ' : 'Телефон / Email'}</span>
                  <span className="font-mono text-slate-200">{currentUser.emailOrPhone}</span>
                </div>

                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <span className="text-slate-400">{isHy ? 'Գրանցման ամսաթիվ' : 'Дата регистрации'}</span>
                  <span className="font-mono text-slate-200">{currentUser.registeredAt}</span>
                </div>

                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <span className="text-slate-400">{isHy ? 'Ժամանակը համակարգում' : 'Общее время сессий'}</span>
                  <span className="font-mono text-cyan-400 font-bold">{formatUsageDuration(totalUsageSeconds, lang)}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">{isHy ? 'Անվտանգության մակարդակ' : 'Безопасность'}</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold">
                    FIRESTORE AUTH SECURE
                  </span>
                </div>
              </div>

              {/* КНОПКА ВЫХОДА */}
              <div className="pt-2">
                <button
                  onClick={handleLogoutAction}
                  className="w-full py-3 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/50 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <LogOut className="w-4 h-4 text-rose-400" />
                  <span>{isHy ? 'Դուրս գալ անձնական հաշվից' : 'Выйти из личного кабинета'}</span>
                </button>
              </div>
            </div>
          )}

        </div>

        {/* ПОДВАЛ ЛИЧНОГО КАБИНЕТА */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs shrink-0">
          <div className="text-slate-500 font-mono text-[11px]">
            {isHy ? '«Համակարգ 2000» Անձնական կաբինետ' : '«Система 2000» Личный кабинет'}
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors cursor-pointer"
          >
            {isHy ? 'Փակել' : 'Закрыть'}
          </button>
        </div>

      </div>
    </div>
  );
};
