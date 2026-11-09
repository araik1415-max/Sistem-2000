import React from 'react';
import {
  X,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  CreditCard,
  Coins,
  Sparkles,
  ArrowRight,
  ShoppingBag,
  FileText,
  ShieldCheck,
} from 'lucide-react';
import { CartItem, calculateCartTotals } from '../utils/payment';
import { Language } from '../types';
import { formatDram, calculateIncrement } from '../utils/finance';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onUpdateQuantity: (productId: number, delta: number) => void;
  onRemoveItem: (productId: number) => void;
  onClearCart: () => void;
  onCheckoutPaymentGateway: (totalDram: number) => void;
  onCheckoutPoints: (totalPoints: number) => void;
  userBonusPoints: number;
  lang: Language;
  onOpenAgreement?: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onCheckoutPaymentGateway,
  onCheckoutPoints,
  userBonusPoints,
  lang,
  onOpenAgreement,
}) => {
  if (!isOpen) return null;
  const isHy = lang === 'hy';

  const { totalDram, totalPoints, itemCount } = calculateCartTotals(cart);
  const canAffordPoints = userBonusPoints >= totalPoints;
  const dailyBonusBoost = calculateIncrement(totalDram, 86400);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/75 backdrop-blur-none animate-fade-in">
      <div className="relative w-full max-w-md bg-slate-900 border-l border-slate-750 h-full flex flex-col shadow-2xl text-slate-100">
        {/* Шапка корзины */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>{isHy ? 'Գնումների զամբյուղ' : 'Корзина покупок'}</span>
                <span className="px-2 py-0.5 text-[10px] font-mono bg-emerald-500/20 text-emerald-300 rounded-full">
                  {itemCount} {isHy ? 'հատ' : 'шт'}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                {isHy ? 'Վճարեք դրամով (Idram/ArCa) կամ բոնուսներով' : 'Оплата в драмах или бонусами'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Список товаров в корзине */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-500">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">
                  {isHy ? 'Ձեր զամբյուղը դատարկ է' : 'Ваша корзина пуста'}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  {isHy ? 'Ավելացրեք ապրանքներ կատալոգից' : 'Добавьте товары из каталога'}
                </p>
              </div>
              <button
                onClick={onClose}
                className="mt-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                {isHy ? 'Անցնել կատալոգ' : 'Перейти в каталог'}
              </button>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.product.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-slate-850 border border-slate-750"
              >
                <img
                  src={item.product.imageUrl}
                  alt={isHy ? item.product.nameHy : item.product.nameRu}
                  className="w-14 h-14 rounded-lg object-cover border border-slate-700 shrink-0 bg-slate-900"
                  loading="lazy"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-semibold text-white truncate">
                    {isHy ? item.product.nameHy : item.product.nameRu}
                  </h4>
                  <div className="text-[10px] text-slate-400">{item.product.unitHy}</div>
                  <div className="text-xs font-mono font-bold text-white mt-1">
                    {formatDram(item.product.priceDram * item.quantity)}
                  </div>
                </div>

                {/* Количество */}
                <div className="flex items-center gap-1.5 shrink-0 bg-slate-900 p-1 rounded-lg border border-slate-750">
                  <button
                    onClick={() => onUpdateQuantity(item.product.id, -1)}
                    className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="font-mono text-xs font-bold px-1.5 text-white">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => onUpdateQuantity(item.product.id, 1)}
                    className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                {/* Удалить */}
                <button
                  onClick={() => onRemoveItem(item.product.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 transition-colors cursor-pointer"
                  title={isHy ? 'Ջնջել' : 'Удалить'}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Подвал с итогами и выбором оплаты */}
        {cart.length > 0 && (
          <div className="p-4 bg-slate-950 border-t border-slate-800 space-y-3">
            {/* Превращение покупки в 10% пожизненный депозит с правом наследования */}
            {totalDram >= 10000 ? (
              <div className="p-3 bg-gradient-to-r from-emerald-950/60 to-teal-950/60 border border-emerald-500/50 rounded-xl space-y-1">
                <div className="flex items-center gap-1.5 text-emerald-300 font-bold text-xs">
                  <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{isHy ? '🎉 Գնում 10 000 ֏-ից ➔ 10% ՑՄԱՀ ԴԵՊՈԶԻՏ' : '🎉 Покупка от 10 000 ֏ ➔ 10% ПОЖИЗНЕННЫЙ ДЕПОЗИТ'}</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-snug">
                  {isHy
                    ? `100% գումարը (${formatDram(totalDram)}) կդառնա ցմահ ավանդ՝ ԺԱՌԱՆԳՈՒԹՅԱՆ ԻՐԱՎՈՒՆՔՈՎ: Բոնուսները կհաշվեգրվեն ամեն վայրկյան 15 օր անց առանց վերադարձի:`
                    : `100% затрат (${formatDram(totalDram)}) станут пожизненным депозитом С ПРАВОМ НАСЛЕДОВАНИЯ! Ежесекундные бонусы спустя 15 дней без возврата.`}
                </p>
                <div className="text-[10px] text-teal-400 font-mono font-semibold pt-0.5">
                  🛡️ {isHy ? 'ՀՀ Սպառողների պաշտպանություն • 15 օր վերադարձի երաշխիք' : 'Закон о защите потребителей РА • 15 дней на возврат'}
                </div>
              </div>
            ) : (
              <div className="p-2.5 bg-amber-950/20 border border-amber-600/40 rounded-xl space-y-1 text-xs">
                <div className="flex items-center justify-between text-amber-300 font-semibold text-[11px]">
                  <span>{isHy ? 'Մինչև ցմահ 10% դեպոզիտը՝' : 'До пожизненного 10% депозита:'}</span>
                  <span className="font-mono">{formatDram(totalDram)} / 10 000 ֏</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400 transition-all duration-300 rounded-full"
                    style={{ width: `${Math.min(100, (totalDram / 10000) * 100)}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-400">
                  {isHy
                    ? `Գնեք ևս ${formatDram(10000 - totalDram)}-ով, որպեսզի գնումը դառնա 10% ցմահ ավանդ ժառանգության իրավունքով:`
                    : `Купите еще на ${formatDram(10000 - totalDram)}, чтобы вся покупка стала 10% депозитом с правом наследования!`}
                </p>
              </div>
            )}

            {/* Итоговые суммы */}
            <div className="flex items-center justify-between font-mono">
              <span className="text-xs text-slate-400 font-sans">
                {isHy ? 'Ընդամենը վճարման՝' : 'Итого к оплате:'}
              </span>
              <div className="text-right">
                <div className="text-xl font-black text-white">{formatDram(totalDram)}</div>
                <div className="text-[11px] text-teal-300 font-semibold flex items-center gap-1 justify-end">
                  <Coins className="w-3 h-3" />
                  <span>{totalPoints} {isHy ? 'բոնուս' : 'баллов'}</span>
                </div>
              </div>
            </div>

            {/* Две кнопки оплаты */}
            <div className="space-y-2 pt-1">
              {/* 1. Оплата через платежные системы (Idram, Telcell, ArCa) */}
              <button
                onClick={() => {
                  onCheckoutPaymentGateway(totalDram);
                  onClose();
                }}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs transition-all shadow-lg shadow-emerald-700/20 cursor-pointer flex items-center justify-between px-3"
              >
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 shrink-0" />
                  <div className="text-left">
                    <div>{isHy ? 'Վճարել Idram / Telcell / ArCa-ով' : 'Оплатить через Idram / Telcell / ArCa'}</div>
                    <div className="text-[10px] text-emerald-200 font-normal">
                      {totalDram >= 10000
                        ? (isHy ? '★ 100% գումարը ➔ 10% Ցմահ դեպոզիտ ժառանգությամբ' : '★ 100% затрат ➔ Пожизненный депозит 10% с наследованием')
                        : (isHy ? '★ 5% բոնուսային քեշբեք' : '★ 5% бонусный кешбэк')}
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 shrink-0" />
              </button>

              {/* 2. Оплата бонусами */}
              <div>
                <button
                  onClick={() => {
                    onCheckoutPoints(totalPoints);
                  }}
                  disabled={!canAffordPoints}
                  className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between px-3 border ${
                    canAffordPoints
                      ? 'bg-slate-850 hover:bg-slate-800 text-teal-300 border-teal-500/40 hover:border-teal-400 cursor-pointer'
                      : 'bg-slate-900 text-slate-600 border-slate-800 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center gap-2 text-left">
                    <Coins className="w-4 h-4 text-teal-400 shrink-0" />
                    <div>
                      <div>
                        {canAffordPoints
                          ? (isHy ? `Վճարել ${totalPoints} բոնուսով (Անվճար)` : `Оплатить ${totalPoints} баллами (Бесплатно)`)
                          : (isHy ? `Անբավարար բոնուսներ (ունեք ${userBonusPoints.toFixed(0)})` : `Недостаточно баллов`)}
                      </div>
                      <div className="text-[10px] text-slate-400 font-normal">
                        {isHy ? '⚠️ Բոնուսներով վճարելիս դեպոզիտ ՉԻ առաջանում (Հոդված 3)' : '⚠️ Оплата баллами НЕ является депозитом (Статья 3)'}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-teal-400 shrink-0">
                    {totalPoints} б.
                  </span>
                </button>
              </div>

              {/* Сноска на Договор экосистемы */}
              {onOpenAgreement && (
                <div className="pt-1 text-center">
                  <button
                    onClick={() => {
                      onClose();
                      onOpenAgreement();
                    }}
                    className="inline-flex items-center gap-1 text-[10px] text-slate-400 hover:text-emerald-300 underline underline-offset-2 transition-colors cursor-pointer"
                  >
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    <span>
                      {isHy
                        ? 'Կանոնակարգվում է Էկոհամակարգի Պայմանագրով (№ SYS-2000)'
                        : 'Регулируется Договором-офертой экосистемы (№ SYS-2000)'}
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
