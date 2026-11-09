import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, TrendingUp, ShoppingBag, ArrowRight } from 'lucide-react';
import { HeroSlide, Language } from '../types';

interface HeroBannerProps {
  slides: HeroSlide[];
  lang: Language;
  onNavigate: (action: 'catalog' | 'cart' | 'deposit') => void;
  cardRadius?: string;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  slides,
  lang,
  onNavigate,
  cardRadius = 'rounded-2xl',
}) => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const isHy = lang === 'hy';

  useEffect(() => {
    if (slides.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [slides.length]);

  if (!slides || slides.length === 0) return null;

  const currentSlide = slides[currentSlideIndex] || slides[0];

  const handlePrev = () => {
    setCurrentSlideIndex((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const handleNext = () => {
    setCurrentSlideIndex((prev) => (prev + 1) % slides.length);
  };

  return (
    <div
      className={`relative w-full overflow-hidden border border-slate-700/80 shadow-2xl ${cardRadius} bg-slate-900 group`}
    >
      {/* Ֆոնային պատկեր և գրադիենտ */}
      <div className="absolute inset-0">
        <img
          src={currentSlide.imageUrl}
          alt={isHy ? currentSlide.titleHy : currentSlide.titleRu}
          className="w-full h-full object-cover object-center opacity-30 transform scale-105 transition-all duration-700 group-hover:scale-100"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/90 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/40" />
      </div>

      {/* Բովանդակություն */}
      <div className="relative z-10 p-5 sm:p-7 flex flex-col justify-between min-h-[220px] sm:min-h-[250px]">
        <div className="max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[11px] font-bold mb-3 shadow-sm backdrop-blur-xs">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            <span>{isHy ? currentSlide.badgeHy : currentSlide.badgeRu}</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-snug mb-2 font-sans drop-shadow-md">
            {isHy ? currentSlide.titleHy : currentSlide.titleRu}
          </h2>

          <p className="text-xs sm:text-sm text-slate-300 font-normal leading-relaxed line-clamp-2 max-w-md">
            {isHy ? currentSlide.subtitleHy : currentSlide.subtitleRu}
          </p>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 flex-wrap">
          <button
            onClick={() => onNavigate(currentSlide.ctaAction)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-emerald-500/25 transition-all cursor-pointer transform hover:-translate-y-0.5"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>{isHy ? currentSlide.ctaTextHy : currentSlide.ctaTextRu}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          {/* Սլայդի կառավարում */}
          {slides.length > 1 && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                {slides.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentSlideIndex(i)}
                    className={`h-1.5 rounded-full transition-all cursor-pointer ${
                      i === currentSlideIndex
                        ? 'w-6 bg-emerald-400'
                        : 'w-2 bg-slate-600 hover:bg-slate-400'
                    }`}
                    title={`Slide ${i + 1}`}
                  />
                ))}
              </div>

              <div className="flex items-center gap-1 ml-2">
                <button
                  onClick={handlePrev}
                  className="w-7 h-7 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center border border-slate-700 cursor-pointer"
                  title={isHy ? 'Նախորդ' : 'Назад'}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={handleNext}
                  className="w-7 h-7 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center border border-slate-700 cursor-pointer"
                  title={isHy ? 'Հաջորդ' : 'Вперед'}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
