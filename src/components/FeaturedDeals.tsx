import React, { useState, useEffect } from 'react';
import { Flame, Clock, ShoppingCart, Zap, Star } from 'lucide-react';
import { ProductItem, Language } from '../types';
import { formatDram } from '../utils/finance';

interface FeaturedDealsProps {
  products: ProductItem[];
  lang: Language;
  onAddToCart: (product: ProductItem) => void;
  onQuickBuy: (product: ProductItem) => void;
  cardRadius?: string;
}

export const FeaturedDeals: React.FC<FeaturedDealsProps> = ({
  products,
  lang,
  onAddToCart,
  onQuickBuy,
  cardRadius = 'rounded-2xl',
}) => {
  const isHy = lang === 'hy';
  const deals = products.slice(0, 3); // Take 3 top items

  // Ժամացույցի հետհաշվարկի սիմուլյացիա
  const [timeLeft, setTimeLeft] = useState({ hours: 4, minutes: 28, seconds: 45 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 6, minutes: 0, seconds: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (deals.length === 0) return null;

  return (
    <div className={`p-4 sm:p-5 bg-gradient-to-br from-amber-950/20 via-slate-900 to-slate-900/90 border border-amber-600/30 ${cardRadius} shadow-xl`}>
      <div className="flex items-center justify-between gap-2 mb-3.5 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <Flame className="w-4 h-4 fill-amber-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              {isHy ? 'Օրվա թեժ առաջարկներ' : 'Горячие предложения дня'}
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-rose-600 text-white font-bold uppercase">
                {isHy ? 'ԶԵՂՉ' : 'СКИДКА'}
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              {isHy ? 'Հատուկ գներ + 100% փոխանցում 10% աճող դեպոզիտին' : 'Спеццены + 100% зачисление в доходный депозит'}
            </p>
          </div>
        </div>

        {/* Հետհաշվարկ */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950/80 border border-amber-500/30 text-amber-300 font-mono text-xs">
          <Clock className="w-3.5 h-3.5 text-amber-400" />
          <span>
            {String(timeLeft.hours).padStart(2, '0')}:{String(timeLeft.minutes).padStart(2, '0')}:
            {String(timeLeft.seconds).padStart(2, '0')}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {deals.map((prod, idx) => {
          const originalPrice = Math.round(prod.priceDram * 1.2);
          const discountPct = Math.round(((originalPrice - prod.priceDram) / originalPrice) * 100);

          return (
            <div
              key={prod.id}
              className="bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-amber-500/40 rounded-xl p-3 flex flex-col justify-between transition-all group"
            >
              <div className="relative mb-2 overflow-hidden rounded-lg bg-slate-950 h-28">
                <img
                  src={prod.imageUrl}
                  alt={isHy ? prod.nameHy : prod.nameRu}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-rose-600 text-white text-[10px] font-black shadow-md">
                  -{discountPct}%
                </span>
                <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/75 text-amber-300 text-[10px] font-bold flex items-center gap-0.5">
                  <Star className="w-2.5 h-2.5 fill-amber-300" />
                  4.9
                </span>
              </div>

              <div>
                <h4 className="text-xs font-bold text-white line-clamp-1 mb-0.5">
                  {isHy ? prod.nameHy : prod.nameRu}
                </h4>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-sm font-extrabold text-amber-400">
                    {formatDram(prod.priceDram)}
                  </span>
                  <span className="text-[11px] text-slate-500 line-through">
                    {formatDram(originalPrice)}
                  </span>
                </div>
              </div>

              <div className="flex gap-1.5 mt-1">
                <button
                  onClick={() => onAddToCart(prod)}
                  className="flex-1 py-1.5 px-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  title={isHy ? 'Ավելացնել զամբյուղ' : 'В корзину'}
                >
                  <ShoppingCart className="w-3 h-3" />
                  <span>{isHy ? '+ Զամբյուղ' : '+ В корзину'}</span>
                </button>
                <button
                  onClick={() => onQuickBuy(prod)}
                  className="py-1.5 px-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-[11px] font-bold flex items-center justify-center transition-colors cursor-pointer shadow-sm"
                  title={isHy ? 'Արագ գնում' : 'Купить'}
                >
                  <Zap className="w-3 h-3 fill-slate-950" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
