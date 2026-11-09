import React, { useState } from 'react';
import { Sparkles, ArrowRight, X } from 'lucide-react';
import { Language, SiteConfig } from '../types';

interface PromoBarProps {
  promo: SiteConfig['promoBar'];
  lang: Language;
  onActionClick: () => void;
}

export const PromoBar: React.FC<PromoBarProps> = ({ promo, lang, onActionClick }) => {
  const [dismissed, setDismissed] = useState(false);
  const isHy = lang === 'hy';

  if (!promo.enabled || dismissed) return null;

  return (
    <div className={`w-full ${promo.bgColor || 'bg-emerald-600'} text-white py-2 px-3 text-xs shadow-md transition-all relative z-20`}>
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-hidden flex-1 justify-center sm:justify-start">
          <span className="shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-white/20 text-white">
            <Sparkles className="w-3 h-3 animate-spin" style={{ animationDuration: '4s' }} />
          </span>
          <p className="truncate font-medium text-[11px] sm:text-xs">
            {isHy ? promo.textHy : promo.textRu}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onActionClick}
            className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded bg-white text-slate-900 font-bold hover:bg-slate-100 transition-colors cursor-pointer text-[11px]"
          >
            <span>{isHy ? promo.actionTextHy : promo.actionTextRu}</span>
            <ArrowRight className="w-3 h-3" />
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="p-1 rounded hover:bg-white/20 transition-colors text-white/80 hover:text-white cursor-pointer"
            title={isHy ? 'Փակել' : 'Закрыть'}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
