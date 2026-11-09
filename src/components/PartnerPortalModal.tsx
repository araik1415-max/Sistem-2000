import React, { useState } from 'react';
import {
  X,
  Building2,
  Users,
  Briefcase,
  FileText,
  CreditCard,
  Percent,
  CheckCircle2,
  Copy,
  Printer,
  Download,
  ShieldCheck,
  Zap,
  TrendingUp,
  Coins,
  Package,
  Plus,
  Trash2,
  Sparkles,
  ArrowRight,
  BadgeCheck,
  Lock,
} from 'lucide-react';
import { ProductItem, Language, B2bInvoice, B2bInvoiceItem } from '../types';
import { formatDram } from '../utils/finance';

interface PartnerPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  products: ProductItem[];
  userBalance?: number;
  userDeposit?: number;
  userBonusPoints?: number;
  onAddToCart?: (product: ProductItem, quantity?: number) => void;
  onAddBatchToCart?: (items: Array<{ product: ProductItem; quantity: number }>) => void;
}

export const PartnerPortalModal: React.FC<PartnerPortalModalProps> = ({
  isOpen,
  onClose,
  lang,
  products,
  userBalance = 50000,
  userDeposit = 150000,
  userBonusPoints = 1500,
  onAddToCart,
  onAddBatchToCart,
}) => {
  const isHy = lang === 'hy';
  const [activeTab, setActiveTab] = useState<'b2b' | 'b2c'>('b2b');

  // B2B State
  const [companyName, setCompanyName] = useState('ООО «Арм-Стройтехнологии»');
  const [taxId, setTaxId] = useState('02584912');
  const [bankDetails, setBankDetails] = useState('ЗАО «Америабанк», р/с 157002849102910');
  const [paymentTermsDays, setPaymentTermsDays] = useState<number>(14);
  const [creditLimitDram] = useState<number>(500000);
  const [usedCreditDram, setUsedCreditDram] = useState<number>(120000);
  const [b2bAgreed, setB2bAgreed] = useState<boolean>(true);

  // Invoice / Commercial Proposal Items
  const [invoiceItems, setInvoiceItems] = useState<
    Array<{ productId: number; quantity: number; discountPercent: number }>
  >([
    { productId: 15, quantity: 10, discountPercent: 15 },
    { productId: 16, quantity: 5, discountPercent: 15 },
    { productId: 19, quantity: 2, discountPercent: 20 },
  ]);

  // B2C Referral state
  const [copiedReferral, setCopiedReferral] = useState(false);
  const referralCode = 'SYS2000-REF-8921';
  const referralLink = `https://sistema2000.am/?ref=${referralCode}`;

  if (!isOpen) return null;

  // Calculate Invoice Totals
  const preparedInvoiceItems: B2bInvoiceItem[] = invoiceItems
    .map((item) => {
      const p = products.find((prod) => prod.id === item.productId);
      if (!p) return null;
      const unitPriceDram = p.priceDram;
      const finalPriceDram = Math.round(unitPriceDram * (1 - item.discountPercent / 100));
      return {
        productId: p.id,
        productName: isHy ? p.nameHy : p.nameRu,
        quantity: item.quantity,
        unitPriceDram,
        discountPercent: item.discountPercent,
        finalPriceDram,
        totalDram: finalPriceDram * item.quantity,
      };
    })
    .filter((item): item is B2bInvoiceItem => item !== null);

  const subtotalDram = preparedInvoiceItems.reduce((acc, curr) => acc + curr.totalDram, 0);
  const vatAmountDram = Math.round(subtotalDram * 0.2); // 20% VAT
  const totalInvoiceAmountDram = subtotalDram + vatAmountDram;

  const handleCopyReferral = () => {
    navigator.clipboard.writeText(referralLink);
    setCopiedReferral(true);
    setTimeout(() => setCopiedReferral(false), 2000);
  };

  const handlePrintInvoice = () => {
    window.print();
  };

  const handleAddInvoiceToCart = () => {
    if (onAddBatchToCart) {
      const batch = preparedInvoiceItems.map((inv) => {
        const prod = products.find((p) => p.id === inv.productId)!;
        return { product: prod, quantity: inv.quantity };
      });
      onAddBatchToCart(batch);
      onClose();
    }
  };

  return (
    <div
      id="partner-portal-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto"
    >
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-750 rounded-2xl sm:rounded-3xl shadow-2xl text-slate-100 overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* КНОПКА ЗАКРЫТИЯ */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-xl bg-slate-950/80 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors border border-slate-700 cursor-pointer shadow-lg"
          aria-label={isHy ? 'Փակել' : 'Закрыть'}
        >
          <X className="w-5 h-5" />
        </button>

        {/* ШАПКА ПОРТАЛА */}
        <div className="p-4 sm:p-6 border-b border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 shadow-lg shadow-emerald-500/20">
              <Briefcase className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                  {isHy ? '🤝 B2B և B2C Գործընկերային Պորտալ' : '🤝 Партнерский Портал B2B & B2C'}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {isHy ? 'Պրո' : 'PRO Hub'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {isHy
                  ? 'Կորպորատիվ մեծածախ գնումներ (B2B) և ռեֆերալային բոնուսային ցանց (B2C)'
                  : 'Корпоративные оптовые закупки (B2B) и реферальная бонусная экосистема (B2C)'}
              </p>
            </div>
          </div>

          {/* ПЕРЕКЛЮЧАТЕЛЬ B2B / B2C */}
          <div className="mt-4 flex items-center gap-2 p-1.5 bg-slate-950 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('b2b')}
              className={`flex-1 py-2 px-4 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === 'b2b'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>{isHy ? '🏢 B2B Կորպորատիվ / Մեծածախ' : '🏢 B2B Оптовый Портал'}</span>
            </button>
            <button
              onClick={() => setActiveTab('b2c')}
              className={`flex-1 py-2 px-4 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === 'b2c'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>{isHy ? '👥 B2C Ռեֆերալային Ցանց' : '👥 B2C Реферальная Сеть'}</span>
            </button>
          </div>
        </div>

        {/* ТЕЛО ПОРТАЛА */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* ======================= B2B СЕКЦИЯ ======================= */}
          {activeTab === 'b2b' && (
            <div className="space-y-6">
              {/* РЕКВИЗИТЫ КОМПАНИИ И КРЕДИТНАЯ ЛИНИЯ */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. Реквизиты B2B партнера */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <h3 className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 uppercase tracking-wider">
                      <Building2 className="w-4 h-4" />
                      <span>{isHy ? 'Կազմակերպության տվյալներ' : 'Профиль B2B Организации'}</span>
                    </h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      ИНН Verified
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-0.5">
                        {isHy ? 'Կազմակերպության անվանում:' : 'Название компании (ООО / ИП / ՓԲԸ):'}
                      </label>
                      <input
                        type="text"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-750 rounded-xl px-3 py-1.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-0.5">
                          {isHy ? 'ՀՎՀՀ (ИНН):' : 'ИНН / ՀՎՀՀ:'}
                        </label>
                        <input
                          type="text"
                          value={taxId}
                          onChange={(e) => setTaxId(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-750 rounded-xl px-3 py-1.5 text-xs text-white font-mono focus:border-emerald-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-400 block mb-0.5">
                          {isHy ? 'Վճարման հետաձգում:' : 'Отсрочка платежа:'}
                        </label>
                        <select
                          value={paymentTermsDays}
                          onChange={(e) => setPaymentTermsDays(Number(e.target.value))}
                          className="w-full bg-slate-900 border border-slate-750 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:border-emerald-500 focus:outline-none"
                        >
                          <option value={0}>Предоплата 100%</option>
                          <option value={14}>14 дней отсрочки</option>
                          <option value={30}>30 дней отсрочки</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 block mb-0.5">
                        {isHy ? 'Բանկային реквизиты:' : 'Банковские реквизиты:'}
                      </label>
                      <input
                        type="text"
                        value={bankDetails}
                        onChange={(e) => setBankDetails(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-750 rounded-xl px-3 py-1.5 text-xs text-white font-mono focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Кредитный лимит B2B и статус договора */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <h3 className="text-xs font-bold text-amber-400 flex items-center gap-1.5 uppercase tracking-wider">
                        <CreditCard className="w-4 h-4" />
                        <span>{isHy ? 'B2B Վարկային լիմիտ' : 'B2B Кредитная Линия'}</span>
                      </h3>
                      <span className="text-[11px] font-mono text-emerald-400 font-bold">
                        10% APY
                      </span>
                    </div>

                    <div className="mt-3 space-y-2.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">{isHy ? 'Հաստատված լիմիտ:' : 'Утвержденный лимит:'}</span>
                        <span className="font-mono font-bold text-white">{formatDram(creditLimitDram)}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">{isHy ? 'Использовано (отсрочка):' : 'Использовано (отсрочка):'}</span>
                        <span className="font-mono font-bold text-amber-400">{formatDram(usedCreditDram)}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800">
                        <span className="text-emerald-400 font-bold">{isHy ? 'Доступно для заказа:' : 'Доступно для заказа:'}</span>
                        <span className="font-mono font-black text-emerald-400">
                          {formatDram(creditLimitDram - usedCreditDram)}
                        </span>
                      </div>

                      {/* Индикатор загрузки кредитной линии */}
                      <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800 mt-1">
                        <div
                          className="bg-amber-500 h-full transition-all"
                          style={{ width: `${(usedCreditDram / creditLimitDram) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {/* Статус B2B Договора поставки */}
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs mt-2">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <div>
                        <span className="font-bold text-white block">Договор поставки B2B №ARM-2026-B2B</span>
                        <span className="text-[10px] text-slate-400">Подписан ЭЦП • Действует до 31.12.2026</span>
                      </div>
                    </div>
                    <button
                      onClick={() => setB2bAgreed(!b2bAgreed)}
                      className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 text-[11px] font-bold border border-emerald-500/30"
                    >
                      {b2bAgreed ? 'Активен' : 'Подписать'}
                    </button>
                  </div>
                </div>
              </div>

              {/* ГЕНЕРАТОР КОММЕРЧЕСКОГО ПРЕДЛОЖЕНИЯ И СЧЕТА-ФАКТУРЫ (B2B INVOICE) */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-950 border border-emerald-500/30 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <FileText className="w-4 h-4 text-emerald-400" />
                      <span>{isHy ? 'Генератор Счета-Фактуры и КП (B2B Invoice)' : 'Конструктор Оптового Счета-Фактуры & КП'}</span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      {isHy
                        ? 'Ավտոմատ մեծածախ զեղչեր, ԱԱՀ (20%) և տպագրության պատրաստ փաստաթուղթ'
                        : 'Автоматические оптовые скидки от объема, расчет НДС (20%) и печать официального счета'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handlePrintInvoice}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-bold border border-slate-700 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5 text-teal-400" />
                      <span>Печать счета</span>
                    </button>
                    <button
                      onClick={handleAddInvoiceToCart}
                      className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 text-xs font-extrabold flex items-center gap-1.5 shadow cursor-pointer"
                    >
                      <Package className="w-3.5 h-3.5" />
                      <span>Оформить B2B заказ ({formatDram(totalInvoiceAmountDram)})</span>
                    </button>
                  </div>
                </div>

                {/* Таблица B2B позиций */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-900 text-slate-400 uppercase font-mono text-[10px]">
                      <tr>
                        <th className="p-2.5 rounded-l-lg">Товар / Материал</th>
                        <th className="p-2.5">Кол-во</th>
                        <th className="p-2.5">Розница</th>
                        <th className="p-2.5">Скидка Опт %</th>
                        <th className="p-2.5">Оптовая цена</th>
                        <th className="p-2.5 rounded-r-lg text-right">Итого (֏)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80">
                      {preparedInvoiceItems.map((inv, idx) => (
                        <tr key={idx} className="hover:bg-slate-900/60">
                          <td className="p-2.5 font-bold text-white">{inv.productName}</td>
                          <td className="p-2.5 font-mono">
                            <input
                              type="number"
                              min={1}
                              value={inv.quantity}
                              onChange={(e) => {
                                const newQty = Math.max(1, parseInt(e.target.value) || 1);
                                setInvoiceItems((prev) =>
                                  prev.map((item, i) => (i === idx ? { ...item, quantity: newQty } : item))
                                );
                              }}
                              className="w-16 bg-slate-900 border border-slate-750 rounded px-2 py-1 text-xs text-white font-mono"
                            />
                          </td>
                          <td className="p-2.5 font-mono text-slate-400">{formatDram(inv.unitPriceDram)}</td>
                          <td className="p-2.5 font-mono">
                            <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px]">
                              -{inv.discountPercent}%
                            </span>
                          </td>
                          <td className="p-2.5 font-mono font-bold text-teal-300">
                            {formatDram(inv.finalPriceDram)}
                          </td>
                          <td className="p-2.5 font-mono font-black text-right text-emerald-400">
                            {formatDram(inv.totalDram)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Расчет НДС и Итоговые суммы счета */}
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
                  <div className="space-y-1 text-slate-400 text-[11px]">
                    <div>Организация: <span className="text-white font-bold">{companyName}</span> (ИНН: {taxId})</div>
                    <div>Условия оплаты: <span className="text-amber-400 font-bold">{paymentTermsDays} дней отсрочки B2B</span></div>
                    <div>Договор поставки: <span className="text-emerald-400 font-bold">№ARM-2026-B2B</span></div>
                  </div>

                  <div className="space-y-1.5 text-right w-full sm:w-auto font-mono">
                    <div className="flex justify-between sm:justify-end gap-4 text-slate-400">
                      <span>Сумма без НДС:</span>
                      <span className="font-bold text-slate-200">{formatDram(subtotalDram)}</span>
                    </div>
                    <div className="flex justify-between sm:justify-end gap-4 text-slate-400">
                      <span>НДС (20%):</span>
                      <span className="font-bold text-teal-300">{formatDram(vatAmountDram)}</span>
                    </div>
                    <div className="flex justify-between sm:justify-end gap-4 text-sm font-black text-white pt-1 border-t border-slate-750">
                      <span>Итого к оплате:</span>
                      <span className="text-emerald-400 text-base">{formatDram(totalInvoiceAmountDram)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======================= B2C СЕКЦИЯ ======================= */}
          {activeTab === 'b2c' && (
            <div className="space-y-6">
              {/* РЕФЕРАЛЬНАЯ ССЫЛКА И КЕШБЭК ЭКОСИСТЕМА */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-emerald-500/30 space-y-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Users className="w-5 h-5 text-emerald-400" />
                      <span>{isHy ? 'B2C Ռեֆերալային ծրագիր • 2% Քեշբեք' : 'Реферальная Программа B2C (+2% от друзей)'}</span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      {isHy
                        ? 'Հրավիրեք ընկերներին և ստացեք 2% բոնուսային միավորներ նրանց բոլոր գնումներից'
                        : 'Делитесь персональной ссылкой и получайте +2% бонусными баллами с каждой покупки приглашенного друга!'}
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-xs font-bold border border-emerald-500/30">
                    2% Lifetime Cashback
                  </span>
                </div>

                {/* Поле генерации реферальной ссылки */}
                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <div className="relative flex-1 w-full">
                    <input
                      type="text"
                      readOnly
                      value={referralLink}
                      className="w-full bg-slate-950 border border-slate-750 rounded-xl pl-4 pr-10 py-2.5 text-xs text-emerald-300 font-mono focus:outline-none"
                    />
                    <Sparkles className="w-4 h-4 text-emerald-400 absolute right-3 top-3" />
                  </div>
                  <button
                    onClick={handleCopyReferral}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-2 cursor-pointer shadow hover:brightness-110 transition-all"
                  >
                    {copiedReferral ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-slate-950" />
                        <span>Скопировано!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Скопировать ссылку</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Статистика B2C реферальной сети */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 block">{isHy ? 'Приглашено друзей:' : 'Приглашено друзей:'}</span>
                    <span className="text-lg font-black text-white font-mono">14 человек</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 block">{isHy ? 'Оборот сети:' : 'Оборот рефералов:'}</span>
                    <span className="text-lg font-black text-emerald-400 font-mono">1,450,000 ֏</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-center">
                    <span className="text-[10px] text-teal-300 block font-semibold">{isHy ? 'Заработано баллов:' : 'Заработанный доход:'}</span>
                    <span className="text-lg font-black text-teal-300 font-mono flex items-center justify-center gap-1">
                      <Coins className="w-4 h-4" />
                      29,000 б.
                    </span>
                  </div>
                </div>
              </div>

              {/* СЕКЦИЯ VIP СТАТУСОВ B2C ЛОЯЛЬНОСТИ */}
              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
                  <BadgeCheck className="w-4 h-4 text-amber-400" />
                  <span>Уровни Привилегий B2C Участников</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                    <span className="text-amber-400 font-bold block">🥉 Silver Partner</span>
                    <p className="text-[11px] text-slate-400">Накопление 10% APY + 5% кешбэк баллами со всех покупок.</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-amber-500/40 space-y-1">
                    <span className="text-amber-300 font-bold block">🥈 Gold VIP Partner</span>
                    <p className="text-[11px] text-slate-400">Кешбэк 7% баллами + приоритетная экспресс-доставка.</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-teal-500/50 space-y-1">
                    <span className="text-teal-300 font-bold block">💎 Platinum Premier</span>
                    <p className="text-[11px] text-slate-400">Кешбэк 10% баллами + персональный AI-ассистент 24/7.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ПОДВАЛ ПОРТАЛА */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>
              {isHy
                ? '«Համակարգ 2000» • Պաշտոնական B2B/B2C գործընկերություն'
                : 'Официальная B2B/B2C интеграция Системы 2000'}
            </span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-white font-bold text-xs cursor-pointer transition-colors"
          >
            {isHy ? 'Փակել' : 'Закрыть окно'}
          </button>
        </div>
      </div>
    </div>
  );
};
