import React, { useState } from 'react';
import {
  Users,
  Search,
  Filter,
  Coins,
  DollarSign,
  TrendingUp,
  ShoppingBag,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Minus,
  CheckCircle,
  FileText,
  UserCheck,
  ChevronRight,
  X,
  CreditCard,
  QrCode,
  Tag,
  Download,
  Award,
} from 'lucide-react';
import { CustomerAccount, CustomerPurchase, LedgerEntry, Language, AccountType } from '../types';
import { formatDram } from '../utils/finance';

interface AdminCustomersTabProps {
  customers: CustomerAccount[];
  lang: Language;
  onAdjustCustomer: (customerId: string, account: AccountType, delta: number, reason: string) => void;
  onAddNote: (customerId: string, note: string) => void;
}

export const AdminCustomersTab: React.FC<AdminCustomersTabProps> = ({
  customers,
  lang,
  onAdjustCustomer,
  onAddNote,
}) => {
  const isHy = lang === 'hy';
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'vip' | 'regular' | 'new' | 'wholesale'>('all');
  const [sortBy, setSortBy] = useState<'points' | 'spent' | 'deposit' | 'recent'>('points');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  // Модальное окно корректировки баллов
  const [adjustModal, setAdjustModal] = useState<{
    customer: CustomerAccount;
    account: AccountType;
  } | null>(null);
  const [adjustDelta, setAdjustDelta] = useState<number>(500);
  const [adjustReason, setAdjustReason] = useState<string>('Бонус за активность / Բոնուս ակտիվության համար');
  const [adjustType, setAdjustType] = useState<'add' | 'deduct'>('add');

  // Заметка
  const [editingNote, setEditingNote] = useState<string>('');

  // Выбранный клиент
  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId) || null;

  // KPI метрики
  const totalCustomers = customers.length;
  const totalBonusPoints = customers.reduce((sum, c) => sum + c.bonusPoints, 0);
  const totalDeposits = customers.reduce((sum, c) => sum + c.deposit, 0);
  const totalPurchasesValue = customers.reduce((sum, c) => sum + c.totalSpentDram, 0);
  const totalOrdersCount = customers.reduce((sum, c) => sum + c.purchases.length, 0);

  // Фильтрация и поиск
  const filteredCustomers = customers
    .filter((c) => {
      const matchSearch =
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.phone.includes(searchQuery) ||
        c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.city.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = statusFilter === 'all' || c.status === statusFilter;
      return matchSearch && matchStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'points') return b.bonusPoints - a.bonusPoints;
      if (sortBy === 'spent') return b.totalSpentDram - a.totalSpentDram;
      if (sortBy === 'deposit') return b.deposit - a.deposit;
      return b.purchases.length - a.purchases.length;
    });

  const handleOpenAdjust = (customer: CustomerAccount, account: AccountType) => {
    setAdjustModal({ customer, account });
    setAdjustDelta(500);
    setAdjustType('add');
    setAdjustReason(
      account === 'BONUS_POINTS'
        ? (isHy ? 'Հավատարմության պարգևատրում' : 'Начисление подарочных баллов')
        : (isHy ? 'Հաշվեկշռի ճշգրտում' : 'Корректировка баланса')
    );
  };

  const handleConfirmAdjust = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustModal || adjustDelta <= 0) return;
    const finalDelta = adjustType === 'add' ? adjustDelta : -adjustDelta;
    onAdjustCustomer(adjustModal.customer.id, adjustModal.account, finalDelta, adjustReason);
    setAdjustModal(null);
  };

  const handleExportCustomerPurchases = (customer: CustomerAccount) => {
    const csvRows: string[] = [];
    csvRows.push('OrderNumber,Date,PaidWith,TotalAmountAMD,PointsUsed,PointsEarned,Status,ItemsCount');

    customer.purchases.forEach((p) => {
      csvRows.push(
        `"${p.orderNumber}","${p.date}","${p.paidWith}",${p.totalAmountDram},${p.pointsUsed || 0},${p.bonusPointsEarned},"${p.status}",${p.items.length}`
      );
    });

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `customer_purchases_${customer.id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5 text-slate-100 font-sans">
      {/* KPI КАРТОЧКИ СВОДКИ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-slate-400">
              {isHy ? 'Մասնակիցներ' : 'Всего клиентов'}
            </span>
            <Users className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-extrabold text-white mt-1 font-mono">
            {totalCustomers}
          </div>
          <span className="text-[10px] text-slate-400">
            {isHy ? 'Գրանցված օնլայն խանութում' : 'В базе онлайн-магазина'}
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900 border border-amber-500/30 bg-amber-950/10">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-amber-300">
              {isHy ? 'Ընդհանուր բոնուսներ' : 'Баллов на руках'}
            </span>
            <Coins className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-extrabold text-amber-300 mt-1 font-mono">
            {totalBonusPoints.toLocaleString('ru-RU')} <span className="text-xs font-normal">б.</span>
          </div>
          <span className="text-[10px] text-slate-400">
            {isHy ? 'Կուտակված հաճախորդների մոտ' : 'Накоплено участниками'}
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-teal-400">
              {isHy ? '10% Դեպոզիտներ' : 'Депозиты (10% APY)'}
            </span>
            <TrendingUp className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-xl font-extrabold text-teal-300 mt-1 font-mono">
            {formatDram(totalDeposits)}
          </div>
          <span className="text-[10px] text-slate-400">
            {isHy ? 'Աճող դեպոզիտային մարմիններ' : 'Тело депозитов участников'}
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-sky-400">
              {isHy ? 'Գնումների ծավալ' : 'Объем покупок'}
            </span>
            <ShoppingBag className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-xl font-extrabold text-white mt-1 font-mono">
            {formatDram(totalPurchasesValue)}
          </div>
          <span className="text-[10px] text-slate-400">
            {totalOrdersCount} {isHy ? 'պատվերներ կատարված' : 'заказов оформлено'}
          </span>
        </div>
      </div>

      {/* ПАНЕЛЬ ПОИСКА И ФИЛЬТРОВ */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              isHy
                ? 'Որոնել ըստ անվան, հեռախոսի, քաղաքի...'
                : 'Поиск по имени, телефону, email, городу...'
            }
            className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto justify-end">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">{isHy ? 'Կարգավիճակ:' : 'Статус:'}</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-amber-500"
            >
              <option value="all">{isHy ? 'Բոլորը' : 'Все клиенты'}</option>
              <option value="vip">VIP</option>
              <option value="wholesale">{isHy ? 'Մեծածախ' : 'Оптовики'}</option>
              <option value="regular">{isHy ? 'Պարբերական' : 'Постоянные'}</option>
              <option value="new">{isHy ? 'Նոր' : 'Новые'}</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">{isHy ? 'Տեսակավորում:' : 'Сорт:'}</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-amber-500"
            >
              <option value="points">{isHy ? 'Ըստ բոնուսների' : 'По баллам (макс)'}</option>
              <option value="spent">{isHy ? 'Ըստ գնումների' : 'По сумме покупок'}</option>
              <option value="deposit">{isHy ? 'Ըստ դեպոզիտի' : 'По депозиту'}</option>
              <option value="recent">{isHy ? 'Ըստ ակտիվության' : 'По заказам'}</option>
            </select>
          </div>
        </div>
      </div>

      {/* ТАБЛИЦА УЧАСТНИКОВ ОНЛАЙН МАГАЗИНА */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="p-3">{isHy ? 'Մասնակից' : 'Участник / Клиент'}</th>
                <th className="p-3">{isHy ? 'Կարգավիճակ' : 'Статус'}</th>
                <th className="p-3 text-right">{isHy ? 'Բոնուսներ' : 'Бонусные баллы'}</th>
                <th className="p-3 text-right">{isHy ? '10% Դեպոզիտ' : 'Депозит 10%'}</th>
                <th className="p-3 text-right">{isHy ? 'Հաշվեկշիռ' : 'Баланс (֏)'}</th>
                <th className="p-3 text-center">{isHy ? 'Պատվերներ' : 'Покупки'}</th>
                <th className="p-3 text-right">{isHy ? 'Ընդամենը ծախսել է' : 'Всего покупок'}</th>
                <th className="p-3 text-center">{isHy ? 'Գործողություն' : 'История'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400 font-sans">
                    {isHy ? 'Մասնակիցներ չեն գտնվել' : 'Клиенты по заданным критериям не найдены'}
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((cust) => (
                  <tr
                    key={cust.id}
                    onClick={() => setSelectedCustomerId(cust.id)}
                    className="hover:bg-slate-900/60 transition-colors cursor-pointer group"
                  >
                    <td className="p-3 font-sans">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-400 text-slate-950 font-bold flex items-center justify-center shrink-0 text-xs">
                          {cust.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-white group-hover:text-amber-300 transition-colors">
                            {cust.name}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {cust.phone} • {cust.city}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="p-3 font-sans">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          cust.status === 'vip'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : cust.status === 'wholesale'
                            ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                            : cust.status === 'new'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {cust.status}
                      </span>
                    </td>

                    <td className="p-3 text-right">
                      <span className="text-amber-300 font-extrabold text-sm">
                        {cust.bonusPoints.toLocaleString('ru-RU')} <span className="text-xs">б.</span>
                      </span>
                    </td>

                    <td className="p-3 text-right text-teal-300 font-bold">
                      {formatDram(cust.deposit)}
                    </td>

                    <td className="p-3 text-right text-slate-300">
                      {formatDram(cust.realBalance)}
                    </td>

                    <td className="p-3 text-center font-sans">
                      <span className="px-2 py-0.5 rounded-full bg-slate-800 text-xs font-bold text-white">
                        {cust.purchases.length}
                      </span>
                    </td>

                    <td className="p-3 text-right font-extrabold text-white">
                      {formatDram(cust.totalSpentDram)}
                    </td>

                    <td className="p-3 text-center font-sans">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenAdjust(cust, 'BONUS_POINTS');
                          }}
                          className="px-2 py-1 rounded bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 font-bold text-[10px] transition-colors cursor-pointer"
                          title={isHy ? 'Կարգավորել բոնուսները' : 'Начислить/списать баллы'}
                        >
                          ± Баллы
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCustomerId(cust.id);
                          }}
                          className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                          title={isHy ? 'Դիտել պատմությունը' : 'Открыть историю покупок'}
                        >
                          <ChevronRight className="w-4 h-4 text-emerald-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ДЕТАЛЬНАЯ КАРТОЧКА УЧАСТНИКА: ЧТО ПОКУПАЛ + ИСТОРИЯ ЛЕДЖЕРА */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-[60] bg-black/85 flex items-center justify-center p-2 sm:p-4 animate-fadeIn">
          <div className="relative w-full max-w-4xl bg-slate-900 border border-amber-500/40 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-xs">
            {/* Header карточки клиента */}
            <div className="flex items-center justify-between px-6 py-4 bg-slate-950 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-500 to-emerald-400 text-slate-950 font-black text-lg flex items-center justify-center shadow-lg">
                  {selectedCustomer.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-extrabold text-white">
                      {selectedCustomer.name}
                    </h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase">
                      {selectedCustomer.status}
                    </span>
                  </div>
                  <p className="text-slate-400 text-xs">
                    Тел: <strong className="text-white">{selectedCustomer.phone}</strong> • Email: {selectedCustomer.email} • {selectedCustomer.city}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleExportCustomerPurchases(selectedCustomer)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold transition-colors cursor-pointer"
                  title="Экспорт истории покупок в CSV"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>CSV</span>
                </button>
                <button
                  onClick={() => setSelectedCustomerId(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Быстрые финансовые показатели участника */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-950/80 border-b border-slate-800 text-xs font-mono">
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 font-sans">
                  Накоплено баллов
                </span>
                <div className="text-base font-black text-amber-300 mt-0.5">
                  {selectedCustomer.bonusPoints.toLocaleString('ru-RU')} б.
                </div>
                <button
                  onClick={() => handleOpenAdjust(selectedCustomer, 'BONUS_POINTS')}
                  className="text-[10px] text-amber-400 hover:underline font-sans mt-1"
                >
                  ± Изменить баллы
                </button>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 font-sans">
                  Депозит (10% годовых)
                </span>
                <div className="text-base font-black text-teal-300 mt-0.5">
                  {formatDram(selectedCustomer.deposit)}
                </div>
                <button
                  onClick={() => handleOpenAdjust(selectedCustomer, 'DEPOSIT')}
                  className="text-[10px] text-teal-400 hover:underline font-sans mt-1"
                >
                  ± Изменить депозит
                </button>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 font-sans">
                  Основной баланс
                </span>
                <div className="text-base font-black text-slate-200 mt-0.5">
                  {formatDram(selectedCustomer.realBalance)}
                </div>
                <button
                  onClick={() => handleOpenAdjust(selectedCustomer, 'REAL_BALANCE')}
                  className="text-[10px] text-slate-400 hover:underline font-sans mt-1"
                >
                  ± Корректировка
                </button>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 font-sans">
                  Всего покупок в магазине
                </span>
                <div className="text-base font-black text-emerald-400 mt-0.5">
                  {formatDram(selectedCustomer.totalSpentDram)}
                </div>
                <span className="text-[10px] text-slate-500 font-sans">
                  {selectedCustomer.purchases.length} заказов
                </span>
              </div>
            </div>

            {/* Контент: Что покупал + Леджер */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
              {/* РАЗДЕЛ: ЧТО ПОКУПАЛ (ИСТОРИЯ ЗАКАЗОВ С ТОВАРАМИ) */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-extrabold text-white flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-emerald-400" />
                    <span>История покупок участника (Что покупал)</span>
                    <span className="px-2 py-0.2 rounded-full bg-slate-800 text-[10px] text-slate-300 font-mono">
                      {selectedCustomer.purchases.length}
                    </span>
                  </h4>
                  <span className="text-[10px] text-slate-400">
                    С подробным списком товаров и способами оплаты
                  </span>
                </div>

                {selectedCustomer.purchases.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 bg-slate-950 rounded-xl border border-slate-800">
                    Участник пока не совершал покупок в онлайн-магазине.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedCustomer.purchases.map((purchase) => (
                      <div
                        key={purchase.id}
                        className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-colors shadow-lg"
                      >
                        {/* Верхняя строка заказа */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-800 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-amber-300 font-mono text-sm">
                              {purchase.orderNumber}
                            </span>
                            <span className="text-slate-400 font-mono text-[11px]">
                              {purchase.date}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                purchase.paidWith === 'points'
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                  : purchase.paidWith === 'idram'
                                  ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                                  : purchase.paidWith === 'telcell'
                                  ? 'bg-amber-600/20 text-amber-400 border border-amber-600/30'
                                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              }`}
                            >
                              {purchase.paidWith === 'points'
                                ? 'Оплачено баллами'
                                : purchase.paidWith === 'idram'
                                ? 'Idram QR'
                                : purchase.paidWith === 'telcell'
                                ? 'Telcell QR'
                                : 'Банковская карта'}
                            </span>
                          </div>

                          <div className="flex items-center gap-3">
                            {purchase.bonusPointsEarned > 0 && (
                              <span className="text-amber-400 font-bold font-mono text-xs flex items-center gap-1">
                                <Award className="w-3.5 h-3.5" />
                                +{purchase.bonusPointsEarned} б. кешбэк
                              </span>
                            )}
                            <span className="text-sm font-black text-emerald-400 font-mono">
                              {formatDram(purchase.totalAmountDram)}
                            </span>
                          </div>
                        </div>

                        {/* Список товаров в этом заказе */}
                        <div className="mt-2.5">
                          <div className="text-[10px] uppercase font-bold text-slate-500 mb-1.5">
                            Купленные товары ({purchase.items.length} поз.):
                          </div>
                          <div className="space-y-1.5 font-mono">
                            {purchase.items.map((item, idx) => (
                              <div
                                key={idx}
                                className="flex items-center justify-between p-2 rounded-lg bg-slate-900/80 text-xs"
                              >
                                <div className="flex items-center gap-2">
                                  <span className="text-slate-500 font-bold">{idx + 1}.</span>
                                  <span className="font-sans font-medium text-white">
                                    {item.productName}
                                  </span>
                                  <span className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.2 rounded font-sans">
                                    {item.unit}
                                  </span>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="text-slate-400 text-xs">
                                    {item.quantity} шт × {formatDram(item.priceDram)}
                                  </span>
                                  <span className="font-bold text-white text-xs w-20 text-right">
                                    {formatDram(item.totalDram)}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {purchase.note && (
                          <div className="mt-2 text-[10px] text-slate-400 italic">
                            Примечание: {purchase.note}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* РАЗДЕЛ: ФИНАНСОВЫЙ ЛЕДЖЕР / ДВИЖЕНИЕ СРЕДСТВ И БОНУСОВ */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-extrabold text-white flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-400" />
                    <span>Финансовый леджер (Начисления 10% годовых, бонусы, пополнения)</span>
                  </h4>
                  <span className="text-[10px] text-slate-400">
                    Неизменяемый журнал транзакций
                  </span>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse font-mono">
                    <thead>
                      <tr className="bg-slate-900 border-b border-slate-800 text-[10px] font-bold text-slate-400 uppercase">
                        <th className="p-2.5">Дата / Время</th>
                        <th className="p-2.5">Тип операции</th>
                        <th className="p-2.5">Счет списания</th>
                        <th className="p-2.5">Счет зачисления</th>
                        <th className="p-2.5">Детализация</th>
                        <th className="p-2.5 text-right">Сумма</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-xs">
                      {selectedCustomer.ledger.map((entry) => (
                        <tr key={entry.id} className="hover:bg-slate-900/40">
                          <td className="p-2.5 text-slate-400 text-[11px]">
                            {new Date(entry.timestamp).toLocaleString('ru-RU', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </td>
                          <td className="p-2.5 font-sans font-bold">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] ${
                                entry.type === 'INTEREST_ACCRUAL'
                                  ? 'bg-teal-500/20 text-teal-300'
                                  : entry.type === 'BONUS_REWARD'
                                  ? 'bg-amber-500/20 text-amber-300'
                                  : entry.type === 'DEPOSIT_TOPUP'
                                  ? 'bg-emerald-500/20 text-emerald-300'
                                  : entry.type === 'PURCHASE'
                                  ? 'bg-rose-500/20 text-rose-300'
                                  : 'bg-sky-500/20 text-sky-300'
                              }`}
                            >
                              {entry.type}
                            </span>
                          </td>
                          <td className="p-2.5 text-slate-400">{entry.fromAccount}</td>
                          <td className="p-2.5 text-slate-400">{entry.toAccount}</td>
                          <td className="p-2.5 font-sans text-slate-300 max-w-xs truncate">
                            {entry.details || '—'}
                          </td>
                          <td className="p-2.5 text-right font-bold text-emerald-400">
                            {entry.toAccount === 'BONUS_POINTS' || entry.fromAccount === 'BONUS_POINTS'
                              ? `${entry.amount} б.`
                              : formatDram(entry.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ДИАЛОГ КОРРЕКТИРОВКИ БАЛЛОВ / ДЕПОЗИТА АДМИНИСТРАТОРОМ */}
      {adjustModal && (
        <div className="fixed inset-0 z-[70] bg-black/85 flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-md bg-slate-900 border-2 border-amber-500 rounded-2xl p-5 shadow-2xl text-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h4 className="font-extrabold text-sm text-white flex items-center gap-2">
                <Coins className="w-4 h-4 text-amber-400" />
                <span>
                  {isHy ? 'Բալերի / Հաշվի ճշգրտում' : 'Корректировка счета клиента'}
                </span>
              </h4>
              <button
                onClick={() => setAdjustModal(null)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <div className="font-bold text-white text-xs">{adjustModal.customer.name}</div>
              <div className="text-[11px] text-slate-400">
                Счет для операции: <strong className="text-amber-400">{adjustModal.account}</strong>
              </div>
            </div>

            <form onSubmit={handleConfirmAdjust} className="space-y-3">
              <div>
                <label className="block text-slate-400 font-bold mb-1">Действие:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustType('add')}
                    className={`py-2 rounded-lg font-bold text-xs cursor-pointer ${
                      adjustType === 'add'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    + Начислить
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustType('deduct')}
                    className={`py-2 rounded-lg font-bold text-xs cursor-pointer ${
                      adjustType === 'deduct'
                        ? 'bg-rose-600 text-white'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    - Списать
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">
                  Сумма {adjustModal.account === 'BONUS_POINTS' ? '(баллы)' : '(֏)'}:
                </label>
                <input
                  type="number"
                  value={adjustDelta}
                  onChange={(e) => setAdjustDelta(Math.abs(Number(e.target.value)) || 0)}
                  min={1}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono text-sm font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">
                  Основание / Причина операции:
                </label>
                <input
                  type="text"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="Например: Подарок к празднику, компенсация..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setAdjustModal(null)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold cursor-pointer"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black cursor-pointer shadow-lg"
                >
                  Применить операцию
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
