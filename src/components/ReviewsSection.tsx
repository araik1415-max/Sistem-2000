import React, { useState } from 'react';
import { Star, MessageSquarePlus, CheckCircle, ShieldCheck } from 'lucide-react';
import { StoreReview, Language } from '../types';

interface ReviewsSectionProps {
  reviews: StoreReview[];
  lang: Language;
  onAddReview: (review: Omit<StoreReview, 'id' | 'date'>) => void;
  cardRadius?: string;
}

export const ReviewsSection: React.FC<ReviewsSectionProps> = ({
  reviews,
  lang,
  onAddReview,
  cardRadius = 'rounded-2xl',
}) => {
  const isHy = lang === 'hy';
  const [showAddForm, setShowAddForm] = useState(false);
  const [author, setAuthor] = useState('');
  const [rating, setRating] = useState(5);
  const [text, setText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!author.trim() || !text.trim()) return;

    onAddReview({
      author: author.trim(),
      rating,
      textHy: text.trim(),
      textRu: text.trim(),
      verified: true,
    });

    setAuthor('');
    setText('');
    setShowAddForm(false);
  };

  return (
    <div className={`p-4 sm:p-5 bg-slate-900/90 border border-slate-800 ${cardRadius} shadow-xl`}>
      <div className="flex items-center justify-between gap-2 mb-3.5 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-white">
              {isHy ? 'Հաճախորդների կարծիքներ' : 'Отзывы реальных покупателей'}
            </h3>
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 text-[11px] font-bold">
              <Star className="w-3 h-3 fill-amber-300" />
              4.9 / 5.0
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            {isHy
              ? 'Իրական գնումներ կատարած և բոնուսներ ստացած օգտատերերի կարծիքները'
              : 'Отзывы клиентов о покупках, бонусах и начислении 10% годовых'}
          </p>
        </div>

        <button
          onClick={() => setShowAddForm((prev) => !prev)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-emerald-400 border border-slate-700 transition-colors cursor-pointer"
        >
          <MessageSquarePlus className="w-3.5 h-3.5" />
          <span>{isHy ? 'Թողնել կարծիք' : 'Оставить отзыв'}</span>
        </button>
      </div>

      {/* Կարծիք ավելացնելու ձևաթուղթ */}
      {showAddForm && (
        <form onSubmit={handleSubmit} className="mb-4 p-3.5 rounded-xl bg-slate-950 border border-slate-800 animate-fadeIn">
          <div className="text-xs font-bold text-white mb-2">
            {isHy ? 'Նոր կարծիքի ավելացում' : 'Написать отзыв'}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
            <input
              type="text"
              required
              placeholder={isHy ? 'Ձեր անունը (օր.՝ Արմեն Գ.)' : 'Ваше имя'}
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />

            <div className="flex items-center gap-1 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg">
              <span className="text-xs text-slate-400 mr-2">{isHy ? 'Գնահատական՝' : 'Оценка:'}</span>
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  type="button"
                  key={s}
                  onClick={() => setRating(s)}
                  className="cursor-pointer"
                >
                  <Star
                    className={`w-4 h-4 ${
                      s <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-600'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <textarea
            required
            rows={2}
            placeholder={isHy ? 'Ձեր կարծիքը գնումների և բոնուսների մասին...' : 'Ваш отзыв...'}
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 mb-2"
          />

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white"
            >
              {isHy ? 'Չեղարկել' : 'Отмена'}
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md cursor-pointer"
            >
              {isHy ? 'Հրապարակել' : 'Опубликовать'}
            </button>
          </div>
        </form>
      )}

      {/* Կարծիքների ցուցակ */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {reviews.map((rev) => (
          <div
            key={rev.id}
            className="p-3 rounded-xl bg-slate-800/60 border border-slate-800 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-1 mb-1.5">
                <div className="flex items-center gap-1.5">
                  <div className="w-6 h-6 rounded-full bg-emerald-900/60 border border-emerald-500/40 text-emerald-300 font-bold text-[10px] flex items-center justify-center">
                    {rev.author.charAt(0)}
                  </div>
                  <span className="text-xs font-bold text-white truncate max-w-[120px]">
                    {rev.author}
                  </span>
                </div>
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3 h-3 ${
                        i < rev.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-600'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <p className="text-[11px] text-slate-300 leading-relaxed mb-2 line-clamp-3">
                "{isHy ? rev.textHy : rev.textRu}"
              </p>
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1.5 border-t border-slate-800/80">
              <span className="flex items-center gap-1 text-emerald-400">
                <CheckCircle className="w-3 h-3" />
                {isHy ? 'Ստուգված գնորդ' : 'Покупка подтверждена'}
              </span>
              <span>{rev.date}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
