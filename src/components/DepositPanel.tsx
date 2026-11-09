import React, { useState } from 'react';
import { Plus, CreditCard, ShieldCheck } from 'lucide-react';
import { Language } from '../types';

interface DepositPanelProps {
  onDeposit?: (amount: number, target: 'deposit' | 'realBalance') => void;
  onOpenBankPayment?: (amount?: number, target?: 'deposit' | 'realBalance') => void;
  lang: Language;
}

export const DepositPanel: React.FC<DepositPanelProps> = ({ onDeposit, onOpenBankPayment, lang }) => {
  const isHy = lang === 'hy';
  const [customAmount, setCustomAmount] = useState<string>('15000');
  const [targetType, setTargetType] = useState<'deposit' | 'realBalance'>('deposit');

  const handleQuickClick = (amt: number) => {
    setCustomAmount(String(amt));
    if (onOpenBankPayment) {
      onOpenBankPayment(amt, targetType);
    } else if (onDeposit) {
      onDeposit(amt, targetType);
    }
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(customAmount.replace(/\s+/g, ''));
    if (!isNaN(parsed) && parsed > 0) {
      if (onOpenBankPayment) {
        onOpenBankPayment(parsed, targetType);
      } else if (onDeposit) {
        onDeposit(parsed, targetType);
      }
    }
  };

  const parsedCustom = parseFloat(customAmount.replace(/\s+/g, '')) || 0;

  return (
    <div className="rounded-2xl bg-slate-850/80 border border-slate-750 p-5 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <span>{isHy ? 'Հաշվի և դեպոզիտի համալրում' : 'Пополнение баланса и депозита'}</span>
            <span className="px-2 py-0.5 text-[10px] font-medium bg-emerald-500/10 text-emerald-300 rounded-md border border-emerald-500/20">
              {isHy ? 'Պաշտոնական վճարային դարպաս' : 'Официальный шлюз пополнения'}
            </span>
          </h2>
          <p className="text-xs text-slate-400">
            {isHy
              ? 'Իրական հաշվեկշիռը և 10% դեպոզիտը կարելի է համալրել բանկային քարտերով (ArCa, Visa, MasterCard) և բանկային համակարգերով'
              : 'Реальный баланс и 10% депозит можно пополнить банковскими картами (ArCa, Visa, MasterCard) и банковскими переводами'}
          </p>
        </div>

        {onOpenBankPayment && (
          <button
            type="button"
            onClick={() => onOpenBankPayment(parsedCustom > 0 ? parsedCustom : 10000, targetType)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition-all cursor-pointer shrink-0"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>{isHy ? 'Համալրել բանկային քարտով' : 'Пополнить банковской картой'}</span>
          </button>
        )}
      </div>

      {/* Переключатель цели пополнения */}
      <div className="flex gap-2 p-1 bg-slate-900 rounded-xl border border-slate-800 mb-4 max-w-md">
        <button
          type="button"
          onClick={() => setTargetType('deposit')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            targetType === 'deposit'
              ? 'bg-emerald-600 text-white shadow'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>{isHy ? 'Դեպոզիտ (10% տարեկան)' : 'Депозит (10% годовых)'}</span>
        </button>
        <button
          type="button"
          onClick={() => setTargetType('realBalance')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            targetType === 'realBalance'
              ? 'bg-cyan-600 text-white shadow'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5" />
          <span>{isHy ? 'Իրական հաշվեկշիռ' : 'Реальный баланс'}</span>
        </button>
      </div>

      {/* Быстрые кнопки в драмах ֏ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4">
        <button
          onClick={() => handleQuickClick(5000)}
          className="group relative overflow-hidden flex flex-col items-center justify-center p-3 rounded-xl bg-slate-800 hover:bg-emerald-950/40 border border-slate-700 hover:border-emerald-500/50 transition-all text-center cursor-pointer"
        >
          <span className="text-xs text-slate-400 group-hover:text-emerald-300 transition-colors">
            {isHy ? 'Համալրել' : 'Пополнить'}
          </span>
          <span className="text-sm sm:text-base font-bold text-white group-hover:text-emerald-400 transition-colors font-mono">
            5 000 ֏
          </span>
          <span className="text-[10px] text-slate-400 mt-0.5">ArCa / Visa</span>
        </button>

        <button
          onClick={() => handleQuickClick(15000)}
          className="group relative overflow-hidden flex flex-col items-center justify-center p-3 rounded-xl bg-slate-800 hover:bg-emerald-950/40 border border-slate-700 hover:border-emerald-500/50 transition-all text-center cursor-pointer"
        >
          <span className="text-xs text-slate-400 group-hover:text-emerald-300 transition-colors">
            {isHy ? 'Համալրել' : 'Пополнить'}
          </span>
          <span className="text-sm sm:text-base font-bold text-emerald-400 group-hover:text-emerald-300 transition-colors font-mono">
            15 000 ֏
          </span>
          <span className="text-[10px] text-slate-400 mt-0.5">ArCa / Visa</span>
        </button>

        <button
          onClick={() => handleQuickClick(50000)}
          className="group relative overflow-hidden flex flex-col items-center justify-center p-3 rounded-xl bg-slate-800 hover:bg-emerald-950/40 border border-slate-700 hover:border-emerald-500/50 transition-all text-center cursor-pointer"
        >
          <span className="text-xs text-slate-400 group-hover:text-emerald-300 transition-colors">
            {isHy ? 'Համալրել' : 'Пополнить'}
          </span>
          <span className="text-sm sm:text-base font-bold text-white group-hover:text-emerald-400 transition-colors font-mono">
            50 000 ֏
          </span>
          <span className="text-[10px] text-slate-400 mt-0.5">ArCa / Visa</span>
        </button>

        <button
          onClick={() => handleQuickClick(100000)}
          className="group relative overflow-hidden flex flex-col items-center justify-center p-3 rounded-xl bg-slate-800 hover:bg-emerald-950/40 border border-slate-700 hover:border-emerald-500/50 transition-all text-center cursor-pointer"
        >
          <span className="text-xs text-slate-400 group-hover:text-emerald-300 transition-colors">
            {isHy ? 'Համալրել' : 'Пополнить'}
          </span>
          <span className="text-sm sm:text-base font-bold text-amber-300 group-hover:text-amber-200 transition-colors font-mono">
            100 000 ֏
          </span>
          <span className="text-[10px] text-slate-400 mt-0.5">ArCa / Visa</span>
        </button>
      </div>

      {/* Пользовательская сумма */}
      <form onSubmit={handleCustomSubmit} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <div className="relative flex-1">
          <input
            type="number"
            min="500"
            max="10000000"
            step="500"
            placeholder={isHy ? 'Մուտքագրեք գումարը (օրինակ՝ 20 000 ֏)...' : 'Своя сумма (например, 20 000 ֏)...'}
            value={customAmount}
            onChange={(e) => setCustomAmount(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-mono"
            aria-label="Ввести сумму"
          />
        </div>
        <button
          type="submit"
          disabled={!parsedCustom || parsedCustom <= 0}
          className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-white font-medium text-sm transition-all shadow-lg active:scale-95 cursor-pointer disabled:opacity-40 ${
            targetType === 'deposit'
              ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-700/20'
              : 'bg-cyan-600 hover:bg-cyan-500 shadow-cyan-700/20'
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>
            {targetType === 'deposit'
              ? (isHy ? 'Մուտքագրել դեպոզիտ' : 'Внести на депозит')
              : (isHy ? 'Լիցքավորել հաշիվը' : 'Пополнить баланс')}
          </span>
        </button>
      </form>
    </div>
  );
};
