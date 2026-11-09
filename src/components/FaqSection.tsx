import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { FaqItem, Language } from '../types';

interface FaqSectionProps {
  faqs: FaqItem[];
  lang: Language;
  cardRadius?: string;
}

export const FaqSection: React.FC<FaqSectionProps> = ({
  faqs,
  lang,
  cardRadius = 'rounded-2xl',
}) => {
  const isHy = lang === 'hy';
  const [openIds, setOpenIds] = useState<Record<string, boolean>>({ [faqs[0]?.id || '']: true });

  const toggle = (id: string) => {
    setOpenIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className={`p-4 sm:p-5 bg-slate-900/90 border border-slate-800 ${cardRadius} shadow-xl`}>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-lg bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400">
          <HelpCircle className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-white">
            {isHy ? 'Հաճախ տրվող հարցեր (FAQ)' : 'Частые вопросы (FAQ)'}
          </h3>
          <p className="text-[11px] text-slate-400">
            {isHy
              ? 'Պարզաբանումներ 10% բոնուսային հաշվիչի և վճարային համակարգերի վերաբերյալ'
              : 'Ответы о механике бонусов, пополнении и покупках'}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {faqs.map((faq) => {
          const isOpen = openIds[faq.id];
          return (
            <div
              key={faq.id}
              className="rounded-xl bg-slate-800/50 border border-slate-800 overflow-hidden transition-colors"
            >
              <button
                type="button"
                onClick={() => toggle(faq.id)}
                className="w-full p-3 text-left flex items-center justify-between gap-3 text-xs font-semibold text-slate-200 hover:text-white transition-colors cursor-pointer"
              >
                <span>{isHy ? faq.questionHy : faq.questionRu}</span>
                {isOpen ? (
                  <ChevronUp className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
                )}
              </button>

              {isOpen && (
                <div className="px-3 pb-3 text-[11px] text-slate-300 leading-relaxed border-t border-slate-800/80 pt-2 font-normal">
                  {isHy ? faq.answerHy : faq.answerRu}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
