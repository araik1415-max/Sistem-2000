import React, { useState } from 'react';
import {
  TrendingUp,
  Coins,
  ShieldCheck,
  CreditCard,
  ArrowRightLeft,
  Sparkles,
  Award,
  Clock,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  RotateCcw,
  FileText,
} from 'lucide-react';
import { formatDram, formatPoints, calculateYieldRates, LifelongDepositHolding } from '../utils/finance';
import { Language } from '../types';

interface BalanceCardProps {
  realBalance: number;
  deposit: number;
  activeDeposit?: number;
  cooldownDeposit?: number;
  bonusPoints: number;
  totalEarned: number;
  totalSpent: number;
  annualRate?: number;
  lang: Language;
  onOpenTopup: () => void;
  onTransferToDeposit: () => void;
  holdings?: LifelongDepositHolding[];
  onConfirmCooldown?: (holdingId: string) => void;
  onProcessRefund?: (holdingId: string) => void;
  onOpenAgreement?: () => void;
}

export const BalanceCard: React.FC<BalanceCardProps> = ({
  realBalance,
  deposit,
  activeDeposit,
  cooldownDeposit = 0,
  bonusPoints,
  totalEarned,
  totalSpent,
  annualRate = 0.10,
  lang,
  onOpenTopup,
  onTransferToDeposit,
  holdings = [],
  onConfirmCooldown,
  onProcessRefund,
  onOpenAgreement,
}) => {
  const isHy = lang === 'hy';
  const [showHoldingsList, setShowHoldingsList] = useState(false);

  // Активный депозит для ежесекундного начисления
  const effectiveActive = activeDeposit !== undefined ? activeDeposit : deposit;
  const rates = calculateYieldRates(effectiveActive, annualRate);

  const formatted = formatPoints(bonusPoints, 2);
  const [integerPart, decimalPart] = formatted.split('.');

  const activeHoldingsCount = holdings.filter((h) => h.status === 'active_lifelong').length;
  const cooldownHoldingsCount = holdings.filter((h) => h.status === 'cooldown_15d').length;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-slate-850 to-slate-900 border border-slate-750 p-5 sm:p-7 shadow-2xl shadow-emerald-950/25">
      {/* Фоновые декоративные световые акценты */}
      <div className="absolute -top-24 -right-24 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center text-center">
        {/* Заголовок главного бонусного счетчика */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/80 mb-2.5 shadow-sm">
          <Coins className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            {isHy ? 'Բոնուսային միավորներ (Վայրկյան առ վայրկյան)' : 'Бонусные баллы (Ежесекундное начисление)'}
          </span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        </div>

        {/* Главный счетчик баллов */}
        <div className="my-1.5 flex items-baseline justify-center font-mono tracking-tight text-emerald-400 select-all" aria-live="polite">
          <span className="text-4xl sm:text-5xl md:text-6xl font-extrabold drop-shadow-[0_0_25px_rgba(16,185,129,0.35)]">
            {integerPart}
          </span>
          <span className="text-2xl sm:text-3xl md:text-4xl font-bold text-emerald-400/80">
            .{decimalPart}
          </span>
          <span className="ml-2 text-base sm:text-lg font-semibold text-slate-400 font-sans">
            {isHy ? 'միավ.' : 'б.'}
          </span>
        </div>

        {/* Четкое правило зачисления: 10 000 ֏ покупка -> 10% пожизненный депозит с правом наследования, начисление спустя 15 дней без возврата */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 text-xs text-emerald-300 font-medium mt-1 bg-emerald-950/60 px-4 py-2 rounded-xl border border-emerald-600/50 max-w-xl">
          <div className="flex items-center gap-1.5 text-center sm:text-left">
            <Award className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              {isHy ? (
                <>Գնումներ <strong>10 000 ֏-ից</strong> ➔ 10% Ցմահ դեպոզիտ <strong>ժառանգության իրավունքով</strong></>
              ) : (
                <>Покупки <strong>от 10 000 ֏</strong> ➔ 10% Пожизненный депозит <strong>с правом наследования</strong></>
              )}
            </span>
          </div>
          <span className="hidden sm:inline text-emerald-500/60">•</span>
          <span className="text-[11px] text-teal-300 font-normal">
            {isHy
              ? 'Բոնուսներն ամեն վրկ.՝ 15 օր անց առանց վերադարձի'
              : 'Бонусы ежесекундно спустя 15 дней без возврата'}
          </span>
        </div>

        {/* Разделитель */}
        <div className="w-full max-w-md h-px bg-slate-800/90 my-4" />

        {/* Главная финансовая панель: ИСТИННЫЙ БАЛАНС + ПОЖИЗНЕННЫЙ ДЕПОЗИТ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full mb-3.5">
          {/* НАСТОЯЩИЙ БАЛАНС (Real Money Balance in Dram) */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 text-left relative overflow-hidden group">
            <div className="flex items-center justify-between mb-1">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-cyan-300">
                <CreditCard className="w-3.5 h-3.5 text-cyan-400" />
                <span>{isHy ? 'Իրական հաշվեկշիռ (դրամ)' : 'Настоящий баланс (драм)'}</span>
              </span>
              <button
                onClick={onOpenTopup}
                className="px-2 py-0.5 rounded-md bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-[10px] font-bold transition-colors cursor-pointer"
              >
                {isHy ? '+ Լիցքավորել' : '+ Пополнить'}
              </button>
            </div>
            <div className="text-xl sm:text-2xl font-black text-white tracking-tight font-mono">
              {formatDram(realBalance)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
              <span>{isHy ? 'Հասանելի է գնումների համար' : 'Доступно для покупок'}</span>
              {realBalance > 0 && (
                <button
                  onClick={onTransferToDeposit}
                  className="text-emerald-400 hover:text-emerald-300 underline font-medium text-[10px] cursor-pointer inline-flex items-center gap-0.5"
                  title={isHy ? 'Ուղարկել դեպոզիտ 10% աճի համար' : 'Перевести на 10% депозит'}
                >
                  <ArrowRightLeft className="w-2.5 h-2.5" />
                  <span>{isHy ? '→ Դեպոզիտ' : '→ В депозит'}</span>
                </button>
              )}
            </div>
          </div>

          {/* ПОЖИЗНЕННЫЙ ДЕПОЗИТ 10% С ПРАВОМ НАСЛЕДОВАНИЯ */}
          <div className="bg-slate-900/90 border border-emerald-500/30 rounded-xl p-3.5 text-left relative">
            <div className="flex items-center justify-between mb-1">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>
                  {isHy ? `10% Ցմահ դեպոզիտ (Ժառանգությամբ)` : `10% Пожизненный депозит (С наследием)`}
                </span>
              </span>
              <span className="text-[10px] text-emerald-300 bg-emerald-950/60 border border-emerald-500/40 px-2 py-0.5 rounded-full font-bold">
                100% {isHy ? 'Անժամկետ' : 'Пожизненно'}
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-emerald-400 tracking-tight font-mono">
              {formatDram(deposit)}
            </div>
            <div className="text-[11px] text-slate-300 mt-1 flex items-center justify-between flex-wrap gap-1">
              <span>
                {isHy ? `Ակտիվ՝ ${formatDram(effectiveActive)}` : `Активно: ${formatDram(effectiveActive)}`}
                {cooldownDeposit > 0 && (
                  <span className="text-amber-300 ml-1">
                    ({formatDram(cooldownDeposit)} {isHy ? '15 օր վերադարձի մեջ' : '15 дн. на возврат'})
                  </span>
                )}
              </span>
              {holdings.length > 0 && (
                <button
                  onClick={() => setShowHoldingsList(!showHoldingsList)}
                  className="text-teal-400 hover:text-teal-300 text-[10px] font-bold underline inline-flex items-center gap-0.5 cursor-pointer"
                >
                  <span>{isHy ? 'Մանրամասներ' : 'Список'} ({holdings.length})</span>
                  {showHoldingsList ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* РАСКРЫВАЮЩИЙСЯ СПИСОК ПОЖИЗНЕННЫХ ДЕПОЗИТОВ ПО ПОКУПКАМ */}
        {showHoldingsList && holdings.length > 0 && (
          <div className="w-full mb-3.5 p-3.5 rounded-xl bg-slate-950/90 border border-slate-750 text-left space-y-2.5 animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <Award className="w-4 h-4 text-emerald-400" />
                <span>{isHy ? 'Ձեր 10% ցմահ ավանդները (գնումներից)' : 'Ваши 10% пожизненные депозиты (с покупок от 10 000 ֏)'}</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                {activeHoldingsCount} {isHy ? 'ակտիվ' : 'активно'} • {cooldownHoldingsCount} {isHy ? '15 օրվա մեջ' : 'на проверке'}
              </span>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {holdings.map((h) => {
                const isCooldown = h.status === 'cooldown_15d';
                const isActive = h.status === 'active_lifelong';
                const isRefunded = h.status === 'refunded';
                const dateStr = new Date(h.purchaseDate).toLocaleDateString(isHy ? 'hy-AM' : 'ru-RU');

                return (
                  <div
                    key={h.id}
                    className={`p-2.5 rounded-lg border text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 ${
                      isActive
                        ? 'bg-emerald-950/20 border-emerald-600/40 text-emerald-200'
                        : isCooldown
                        ? 'bg-amber-950/20 border-amber-600/40 text-amber-200'
                        : 'bg-slate-900 border-slate-800 text-slate-500 opacity-60'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold font-mono text-white text-sm">{formatDram(h.amount)}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                          {h.orderNumber}
                        </span>
                        {isActive && (
                          <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                            <span>{isHy ? 'Ցմահ ակտիվ (վրկ. բոնուսներ)' : 'Активен пожизненно (бонусы/сек)'}</span>
                          </span>
                        )}
                        {isCooldown && (
                          <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5 text-amber-400" />
                            <span>{isHy ? '15 օր վերադարձի ստուգում' : '15 дней на возврат (Закон РА)'}</span>
                          </span>
                        )}
                        {isRefunded && (
                          <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-red-500/20 text-red-300 border border-red-500/30">
                            {isHy ? 'Վերադարձված է' : 'Возвращен'}
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {dateStr} • {h.productNames.join(', ')} • {isHy ? 'Ժառանգության իրավունք՝ Այո' : 'Право наследования: Да'}
                      </div>
                    </div>

                    {isCooldown && (
                      <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                        {onConfirmCooldown && (
                          <button
                            type="button"
                            onClick={() => onConfirmCooldown(h.id)}
                            className="px-2 py-1 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold cursor-pointer transition-colors"
                            title={isHy ? 'Ակտիվացնել ցմահ բոնուսները հիմա' : 'Подтвердить 15 дней без возврата'}
                          >
                            {isHy ? 'Ակտիվացնել բոնուսները' : 'Завершить 15 дней (активировать)'}
                          </button>
                        )}
                        {onProcessRefund && (
                          <button
                            type="button"
                            onClick={() => onProcessRefund(h.id)}
                            className="px-2 py-1 rounded-md bg-rose-900/60 hover:bg-rose-800 text-rose-200 border border-rose-750 text-[10px] font-medium cursor-pointer transition-colors"
                            title={isHy ? 'Վերադարձնել ապրանքը (15 օր)' : 'Оформить возврат товара'}
                          >
                            <RotateCcw className="w-2.5 h-2.5 inline mr-1" />
                            {isHy ? 'Վերադարձ' : 'Возврат'}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Скоростные метрики */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 w-full">
          <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-2.5 text-left">
            <div className="flex items-center gap-1 text-[10px] font-medium text-slate-400 mb-0.5">
              <TrendingUp className="w-3 h-3 text-teal-400" />
              <span>{isHy ? 'Դեպոզիտի աճ / վրկ' : 'Доход депозита / сек'}</span>
            </div>
            <div className="text-sm sm:text-base font-bold text-teal-300 font-mono">
              +{rates.perSecond.toFixed(4)} ֏
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {effectiveActive > 0 ? (isHy ? '24/7 վրկ. առ վրկ.' : '24/7 ежесекундно') : (isHy ? 'Գնումներ 10 000 ֏-ից' : 'Покупки от 10 000 ֏')}
            </div>
          </div>

          <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-2.5 text-left">
            <div className="text-[10px] font-medium text-slate-400 mb-0.5">
              {isHy ? 'Դեպոզիտի աճ / օր' : 'Доход депозита / день'}
            </div>
            <div className="text-sm sm:text-base font-bold text-slate-200 font-mono">
              +{formatDram(rates.perDay)}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              +{formatDram(rates.perMonth)} {isHy ? 'ամսական' : 'в месяц'}
            </div>
          </div>

          <div className="col-span-2 sm:col-span-1 bg-slate-900/70 border border-slate-800 rounded-xl p-2.5 text-left">
            <div className="text-[10px] font-medium text-slate-400 mb-0.5">
              {isHy ? 'Վիճակագրություն' : 'Статистика'}
            </div>
            <div className="text-xs text-slate-300 space-y-0.5">
              <div>{isHy ? 'Ընդամենը:' : 'Всего:'} <strong className="text-emerald-400 font-mono">+{totalEarned.toFixed(2)}</strong></div>
              <div>{isHy ? 'Ծախսված:' : 'Списано:'} <strong className="text-slate-400 font-mono">-{totalSpent.toFixed(2)}</strong></div>
            </div>
          </div>
        </div>

        {/* Ссылка на договор экосистемы */}
        {onOpenAgreement && (
          <div className="mt-3.5 pt-2 border-t border-slate-800/80 w-full flex items-center justify-center">
            <button
              onClick={onOpenAgreement}
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-emerald-300 transition-colors cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-emerald-400" />
              <span>
                {isHy
                  ? 'Ծանոթանալ և ընդունել 10% ցմահ ավանդի պայմանագիրը'
                  : 'Прочитать и принять условия Договора 10% пожизненного депозита'}
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
