import React from 'react';
import { ShieldCheck, Zap, Truck, TrendingUp } from 'lucide-react';
import { Language } from '../types';

interface TrustBadgesProps {
  lang: Language;
  cardRadius?: string;
}

export const TrustBadges: React.FC<TrustBadgesProps> = ({ lang, cardRadius = 'rounded-2xl' }) => {
  const isHy = lang === 'hy';

  const badges = [
    {
      icon: <TrendingUp className="w-5 h-5 text-emerald-400" />,
      titleHy: '10% Տարեկան դեպոզիտ',
      titleRu: '10% Годовой депозит',
      descHy: 'Գնումների 100%-ը գնում է դեպոզիտ',
      descRu: '100% покупок идут в депозит',
    },
    {
      icon: <Zap className="w-5 h-5 text-sky-400" />,
      titleHy: 'Idram & Telcell QR',
      titleRu: 'Idram и Telcell QR',
      descHy: 'Ակնթարթային անվտանգ վճարումներ',
      descRu: 'Мгновенная оплата по QR',
    },
    {
      icon: <Truck className="w-5 h-5 text-amber-400" />,
      titleHy: 'Առաքում Երևանում',
      titleRu: 'Доставка по Еревану',
      descHy: 'Անվճար 10 000 ֏-ից բարձր',
      descRu: 'Бесплатно от 10 000 ֏',
    },
    {
      icon: <ShieldCheck className="w-5 h-5 text-teal-400" />,
      titleHy: 'Անփոփոխ պատմություն',
      titleRu: 'Надежный аудит',
      descHy: 'Գործարքները չեն ջնջվում',
      descRu: 'История защищена от удаления',
    },
  ];

  return (
    <div className={`grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3`}>
      {badges.map((badge, idx) => (
        <div
          key={idx}
          className={`p-3 bg-slate-900/80 border border-slate-800 hover:border-slate-700 ${cardRadius} flex flex-col items-center text-center transition-all`}
        >
          <div className="w-9 h-9 rounded-xl bg-slate-800/90 flex items-center justify-center mb-2 shadow-inner">
            {badge.icon}
          </div>
          <h4 className="text-xs font-bold text-white mb-0.5">
            {isHy ? badge.titleHy : badge.titleRu}
          </h4>
          <p className="text-[10px] text-slate-400">
            {isHy ? badge.descHy : badge.descRu}
          </p>
        </div>
      ))}
    </div>
  );
};
