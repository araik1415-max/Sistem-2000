import React, { useState } from 'react';
import {
  Palette,
  Layers,
  Image as ImageIcon,
  FileText,
  Download,
  Upload,
  RotateCcw,
  X,
  Check,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  Plus,
  Trash2,
  Sparkles,
  Sliders,
  CheckCircle,
} from 'lucide-react';
import {
  SiteConfig,
  SiteSectionConfig,
  HeroSlide,
  ThemeId,
  Language,
} from '../types';
import {
  THEMES,
  moveSection,
  toggleSection,
  exportSiteConfig,
  importSiteConfig,
  DEFAULT_SITE_CONFIG,
} from '../utils/builder';

interface SiteBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: SiteConfig;
  onSaveConfig: (newConfig: SiteConfig) => void;
  lang: Language;
}

type BuilderTab = 'sections' | 'theme' | 'banners' | 'content' | 'backup';

export const SiteBuilderModal: React.FC<SiteBuilderModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  lang,
}) => {
  const isHy = lang === 'hy';
  const [activeTab, setActiveTab] = useState<BuilderTab>('sections');
  const [draftConfig, setDraftConfig] = useState<SiteConfig>(config);
  const [importJsonText, setImportJsonText] = useState('');
  const [statusMessage, setStatusMessage] = useState<{ text: string; error?: boolean } | null>(null);

  // Sync draft when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setDraftConfig(config);
      setStatusMessage(null);
    }
  }, [isOpen, config]);

  if (!isOpen) return null;

  const handleApplyChanges = () => {
    onSaveConfig(draftConfig);
    setStatusMessage({ text: isHy ? 'Փոփոխությունները պահպանվեցին:' : 'Настройки сайта сохранены!' });
    setTimeout(() => {
      onClose();
    }, 400);
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const updated = moveSection(draftConfig.sections, index, direction);
    setDraftConfig({ ...draftConfig, sections: updated });
  };

  const handleToggle = (id: any) => {
    const updated = toggleSection(draftConfig.sections, id);
    setDraftConfig({ ...draftConfig, sections: updated });
  };

  const handleResetSections = () => {
    setDraftConfig({
      ...draftConfig,
      sections: DEFAULT_SITE_CONFIG.sections,
    });
    setStatusMessage({ text: isHy ? 'Սեկցիաների դասավորությունը վերականգնվեց' : 'Порядок секций сброшен' });
  };

  const handleAddSlide = () => {
    const newSlide: HeroSlide = {
      id: `slide_${Date.now()}`,
      titleHy: 'Նոր հատուկ ակցիա',
      titleRu: 'Новая промо-акция',
      subtitleHy: '100% կանխիկ վճարումները վերածվում են աճող դեպոզիտի:',
      subtitleRu: 'Оплата картой или QR увеличивает ваш депозит.',
      badgeHy: '⚡ Հատուկ առաջարկ',
      badgeRu: '⚡ Спецпредложение',
      ctaTextHy: 'Գնումներ կատարել',
      ctaTextRu: 'Купить сейчас',
      ctaAction: 'catalog',
      imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80',
      bgGradient: 'from-emerald-900/60 to-slate-900',
    };
    setDraftConfig({
      ...draftConfig,
      heroSlides: [...draftConfig.heroSlides, newSlide],
    });
  };

  const handleDeleteSlide = (id: string) => {
    if (draftConfig.heroSlides.length <= 1) {
      setStatusMessage({ text: isHy ? 'Առնվազն 1 բաններ պետք է մնա' : 'Должен остаться хотя бы один баннер', error: true });
      return;
    }
    setDraftConfig({
      ...draftConfig,
      heroSlides: draftConfig.heroSlides.filter((s) => s.id !== id),
    });
  };

  const handleUpdateSlide = (id: string, updates: Partial<HeroSlide>) => {
    setDraftConfig({
      ...draftConfig,
      heroSlides: draftConfig.heroSlides.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    });
  };

  const handleImportJson = () => {
    const res = importSiteConfig(importJsonText);
    if (res.success && res.config) {
      setDraftConfig(res.config);
      onSaveConfig(res.config);
      setStatusMessage({ text: isHy ? 'Կոնֆիգուրացիան հաջողությամբ ներմուծվեց' : 'Конфигурация успешно импортирована!' });
      setImportJsonText('');
    } else {
      setStatusMessage({ text: res.error || 'Սխալ JSON', error: true });
    }
  };

  const handleResetToFactory = () => {
    setDraftConfig(DEFAULT_SITE_CONFIG);
    onSaveConfig(DEFAULT_SITE_CONFIG);
    setStatusMessage({ text: isHy ? 'Բոլոր կարգավորումները վերականգնվեցին գործարանային վիճակի' : 'Сброшено к заводским настройкам' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-slate-100">
        {/* Վերնագիր */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-sky-500 p-0.5 shadow-lg shadow-emerald-500/20 flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Sliders className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white">
                  {isHy ? 'Կայքի Կոնստրուկտոր և Կառավարում' : 'Конструктор и управление сайтом'}
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  LIVE BUILDER
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {isHy
                  ? 'Կառավարեք էջի դասավորությունը, թեմաները, բաններները և տեքստերը'
                  : 'Управляйте структурой блоков, темами оформления, баннерами и текстом'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Կարգավիճակի հաղորդագրություն */}
        {statusMessage && (
          <div
            className={`px-4 py-2 text-xs font-semibold flex items-center gap-2 ${
              statusMessage.error
                ? 'bg-rose-950/80 text-rose-300 border-b border-rose-800'
                : 'bg-emerald-950/80 text-emerald-300 border-b border-emerald-800'
            }`}
          >
            <CheckCircle className="w-4 h-4" />
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Նավիգացիոն ներդիրներ (Tabs) */}
        <div className="flex items-center gap-1 px-4 py-2 bg-slate-950/40 border-b border-slate-800 overflow-x-auto text-xs font-semibold">
          <button
            onClick={() => setActiveTab('sections')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all shrink-0 cursor-pointer ${
              activeTab === 'sections'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{isHy ? 'Սեկցիաների դասավորություն' : 'Блоки и порядок'}</span>
          </button>

          <button
            onClick={() => setActiveTab('theme')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all shrink-0 cursor-pointer ${
              activeTab === 'theme'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>{isHy ? 'Թեմա և ոճ' : 'Темы и стиль'}</span>
          </button>

          <button
            onClick={() => setActiveTab('banners')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all shrink-0 cursor-pointer ${
              activeTab === 'banners'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>{isHy ? 'Պրոմո-բաններներ' : 'Баннеры'}</span>
          </button>

          <button
            onClick={() => setActiveTab('content')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all shrink-0 cursor-pointer ${
              activeTab === 'content'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>{isHy ? 'Տեքստեր և կոնտակտներ' : 'Контент и бренд'}</span>
          </button>

          <button
            onClick={() => setActiveTab('backup')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all shrink-0 cursor-pointer ${
              activeTab === 'backup'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isHy ? 'JSON / Վերականգնում' : 'JSON Экспорт/Импорт'}</span>
          </button>
        </div>

        {/* Ներդիրի հիմնական բովանդակություն */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* TAB 1: ՍԵԿՑԻԱՆԵՐԻ ԴԱՍԱՎՈՐՈՒԹՅՈՒՆ */}
          {activeTab === 'sections' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400 pb-1">
                <span>
                  {isHy
                    ? 'Տեղափոխեք սլաքներով՝ էջի հերթականությունը փոխելու համար:'
                    : 'Используйте стрелки для смены порядка блоков на странице:'}
                </span>
                <button
                  onClick={handleResetSections}
                  className="flex items-center gap-1 text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>{isHy ? 'Վերականգնել լռելյայն' : 'Сбросить порядок'}</span>
                </button>
              </div>

              <div className="space-y-2">
                {draftConfig.sections.map((section, idx) => (
                  <div
                    key={section.id}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                      section.enabled
                        ? 'bg-slate-800/80 border-slate-700 text-white'
                        : 'bg-slate-900/60 border-slate-800/80 text-slate-500 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-lg bg-slate-950 flex items-center justify-center font-mono text-[11px] text-slate-400">
                        {idx + 1}
                      </span>
                      <div>
                        <div className="text-xs font-bold">
                          {isHy ? section.nameHy : section.nameRu}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          ID: {section.id}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Վերև */}
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => handleMove(idx, 'up')}
                        className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none text-slate-300 transition-colors cursor-pointer"
                        title={isHy ? 'Բարձրացնել վերև' : 'Переместить вверх'}
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>

                      {/* Ներքև */}
                      <button
                        type="button"
                        disabled={idx === draftConfig.sections.length - 1}
                        onClick={() => handleMove(idx, 'down')}
                        className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none text-slate-300 transition-colors cursor-pointer"
                        title={isHy ? 'Իջեցնել ներքև' : 'Переместить вниз'}
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>

                      {/* Միացնել/Անջատել */}
                      <button
                        type="button"
                        onClick={() => handleToggle(section.id)}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ml-1 ${
                          section.enabled
                            ? 'bg-emerald-950/60 text-emerald-400 hover:bg-emerald-900/60'
                            : 'bg-slate-900 text-slate-500 hover:bg-slate-800'
                        }`}
                        title={
                          section.enabled
                            ? (isHy ? 'Թաքցնել սեկցիան' : 'Скрыть блок')
                            : (isHy ? 'Ցուցադրել սեկցիան' : 'Показать блок')
                        }
                      >
                        {section.enabled ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: ԹԵՄԱՆԵՐ ԵՎ ՈՃ */}
          {activeTab === 'theme' && (
            <div className="space-y-5">
              <div>
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5">
                  {isHy ? 'Ընտրեք գունային գամման' : 'Цветовая палитра оформления'}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(Object.keys(THEMES) as ThemeId[]).map((themeKey) => {
                    const theme = THEMES[themeKey];
                    const isSelected = draftConfig.themeId === themeKey;
                    return (
                      <div
                        key={themeKey}
                        onClick={() => setDraftConfig({ ...draftConfig, themeId: themeKey })}
                        className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'bg-slate-800 border-emerald-500 shadow-lg'
                            : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-7 h-7 rounded-lg shadow-md flex items-center justify-center"
                            style={{ backgroundColor: theme.primaryColor }}
                          >
                            {isSelected && <Check className="w-4 h-4 text-slate-950 font-black" />}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-white">
                              {isHy ? theme.nameHy : theme.nameRu}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {theme.primaryColor}
                            </div>
                          </div>
                        </div>

                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                            isSelected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {isSelected ? (isHy ? 'Ակտիվ' : 'Активно') : (isHy ? 'Ընտրել' : 'Выбрать')}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Քարտերի կորություն (Card Radius) */}
              <div>
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5">
                  {isHy ? 'Քարտերի անկյունների կլորացում' : 'Скругление углов карточек'}
                </h4>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'rounded-xl', labelHy: 'Ստանդարտ (12px)', labelRu: 'Стандарт (12px)' },
                    { id: 'rounded-2xl', labelHy: 'Մոդեռն (16px)', labelRu: 'Модерн (16px)' },
                    { id: 'rounded-3xl', labelHy: 'Փափուկ (24px)', labelRu: 'Мягкий (24px)' },
                  ].map((rad) => (
                    <button
                      key={rad.id}
                      type="button"
                      onClick={() => setDraftConfig({ ...draftConfig, cardRadius: rad.id as any })}
                      className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                        draftConfig.cardRadius === rad.id
                          ? 'bg-emerald-600 text-white border-emerald-500 shadow-md'
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                      }`}
                    >
                      {isHy ? rad.labelHy : rad.labelRu}
                    </button>
                  ))}
                </div>
              </div>

              {/* Էջի լայնություն (Container Width) */}
              <div>
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5">
                  {isHy ? 'Կենտրոնական կոնտեյների լայնություն' : 'Ширина контейнера сайта'}
                </h4>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'max-w-2xl', labelHy: 'Կոմպակտ (672px)', labelRu: 'Компактный' },
                    { id: 'max-w-3xl', labelHy: 'Միջին (768px)', labelRu: 'Средний' },
                    { id: 'max-w-4xl', labelHy: 'Լայն (896px)', labelRu: 'Широкий' },
                  ].map((w) => (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() => setDraftConfig({ ...draftConfig, containerWidth: w.id as any })}
                      className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                        draftConfig.containerWidth === w.id
                          ? 'bg-emerald-600 text-white border-emerald-500 shadow-md'
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                      }`}
                    >
                      {isHy ? w.labelHy : w.labelRu}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ԲԱՆՆԵՐՆԵՐ */}
          {activeTab === 'banners' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  {isHy ? 'Գլխավոր էջի պրոմո-բաններներ' : 'Управление слайдером акций'}
                </span>
                <button
                  type="button"
                  onClick={handleAddSlide}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isHy ? 'Ավելացնել բաններ' : 'Добавить баннер'}</span>
                </button>
              </div>

              <div className="space-y-3">
                {draftConfig.heroSlides.map((slide, idx) => (
                  <div
                    key={slide.id}
                    className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-900 text-emerald-400 flex items-center justify-center text-[10px]">
                          {idx + 1}
                        </span>
                        {isHy ? slide.titleHy : slide.titleRu}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteSlide(slide.id)}
                        className="p-1 rounded text-rose-400 hover:bg-rose-950/60 cursor-pointer"
                        title={isHy ? 'Հեռացնել' : 'Удалить'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="text-[10px] text-slate-400 mb-0.5 block">Վերնագիր (Հայերեն)</label>
                        <input
                          type="text"
                          value={slide.titleHy}
                          onChange={(e) => handleUpdateSlide(slide.id, { titleHy: e.target.value })}
                          className="w-full px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700 text-white text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 mb-0.5 block">Заголовок (Русский)</label>
                        <input
                          type="text"
                          value={slide.titleRu}
                          onChange={(e) => handleUpdateSlide(slide.id, { titleRu: e.target.value })}
                          className="w-full px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700 text-white text-xs"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="text-[10px] text-slate-400 mb-0.5 block">Ենթավերնագիր (Հայերեն)</label>
                        <input
                          type="text"
                          value={slide.subtitleHy}
                          onChange={(e) => handleUpdateSlide(slide.id, { subtitleHy: e.target.value })}
                          className="w-full px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700 text-white text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 mb-0.5 block">Подзаголовок (Русский)</label>
                        <input
                          type="text"
                          value={slide.subtitleRu}
                          onChange={(e) => handleUpdateSlide(slide.id, { subtitleRu: e.target.value })}
                          className="w-full px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700 text-white text-xs"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                      <div>
                        <label className="text-[10px] text-slate-400 mb-0.5 block">Պիտակ / Бейдж (Հայերեն)</label>
                        <input
                          type="text"
                          value={slide.badgeHy}
                          onChange={(e) => handleUpdateSlide(slide.id, { badgeHy: e.target.value })}
                          className="w-full px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700 text-white text-xs"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="text-[10px] text-slate-400 mb-0.5 block">Նկարի հղում (Image URL)</label>
                        <input
                          type="text"
                          value={slide.imageUrl}
                          onChange={(e) => handleUpdateSlide(slide.id, { imageUrl: e.target.value })}
                          className="w-full px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700 text-white text-xs font-mono"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: ՏԵՔՍՏԵՐ ԵՎ ԿՈՆՏԱԿՏՆԵՐ */}
          {activeTab === 'content' && (
            <div className="space-y-4">
              {/* Խանութի անուն */}
              <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700 space-y-2">
                <h4 className="text-xs font-bold text-white mb-1">
                  {isHy ? 'Խանութի անվանում և կարգախոս' : 'Название магазина и слоган'}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400 mb-0.5 block">Անվանում (Հայերեն)</label>
                    <input
                      type="text"
                      value={draftConfig.storeTitleHy}
                      onChange={(e) => setDraftConfig({ ...draftConfig, storeTitleHy: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700 text-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 mb-0.5 block">Название (Русский)</label>
                    <input
                      type="text"
                      value={draftConfig.storeTitleRu}
                      onChange={(e) => setDraftConfig({ ...draftConfig, storeTitleRu: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700 text-white text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="text-[10px] text-slate-400 mb-0.5 block">Կարգախոս (Հայերեն)</label>
                    <input
                      type="text"
                      value={draftConfig.storeTaglineHy}
                      onChange={(e) => setDraftConfig({ ...draftConfig, storeTaglineHy: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700 text-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 mb-0.5 block">Слоган (Русский)</label>
                    <input
                      type="text"
                      value={draftConfig.storeTaglineRu}
                      onChange={(e) => setDraftConfig({ ...draftConfig, storeTaglineRu: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700 text-white text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Վերևի պրոմո-գոտի (Promo Bar) */}
              <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white">
                    {isHy ? 'Վերևի գովազդային շերտ (Promo Bar)' : 'Верхняя строка объявлений (Promo Bar)'}
                  </h4>
                  <label className="flex items-center gap-1.5 text-xs text-emerald-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={draftConfig.promoBar.enabled}
                      onChange={(e) =>
                        setDraftConfig({
                          ...draftConfig,
                          promoBar: { ...draftConfig.promoBar, enabled: e.target.checked },
                        })
                      }
                      className="rounded accent-emerald-500"
                    />
                    <span>{isHy ? 'Ակտիվացնել' : 'Включено'}</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400 mb-0.5 block">Հայտարարության տեքստ (Հայերեն)</label>
                    <input
                      type="text"
                      value={draftConfig.promoBar.textHy}
                      onChange={(e) =>
                        setDraftConfig({
                          ...draftConfig,
                          promoBar: { ...draftConfig.promoBar, textHy: e.target.value },
                        })
                      }
                      className="w-full px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700 text-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 mb-0.5 block">Текст объявления (Русский)</label>
                    <input
                      type="text"
                      value={draftConfig.promoBar.textRu}
                      onChange={(e) =>
                        setDraftConfig({
                          ...draftConfig,
                          promoBar: { ...draftConfig.promoBar, textRu: e.target.value },
                        })
                      }
                      className="w-full px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700 text-white text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Կոնտակտներ և առաքում */}
              <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700 space-y-2">
                <h4 className="text-xs font-bold text-white mb-1">
                  {isHy ? 'Կոնտակտային տվյալներ և առաքման պայմաններ' : 'Реквизиты и условия доставки'}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400 mb-0.5 block">Հեռախոսահամար</label>
                    <input
                      type="text"
                      value={draftConfig.contact.phone}
                      onChange={(e) =>
                        setDraftConfig({
                          ...draftConfig,
                          contact: { ...draftConfig.contact, phone: e.target.value },
                        })
                      }
                      className="w-full px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700 text-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 mb-0.5 block">Էլ. հասցե (Email)</label>
                    <input
                      type="email"
                      value={draftConfig.contact.email}
                      onChange={(e) =>
                        setDraftConfig({
                          ...draftConfig,
                          contact: { ...draftConfig.contact, email: e.target.value },
                        })
                      }
                      className="w-full px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700 text-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 mb-0.5 block">Telegram</label>
                    <input
                      type="text"
                      value={draftConfig.contact.telegram}
                      onChange={(e) =>
                        setDraftConfig({
                          ...draftConfig,
                          contact: { ...draftConfig.contact, telegram: e.target.value },
                        })
                      }
                      className="w-full px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700 text-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 mb-0.5 block">Առաքման տարածք</label>
                    <input
                      type="text"
                      value={draftConfig.contact.deliveryCity}
                      onChange={(e) =>
                        setDraftConfig({
                          ...draftConfig,
                          contact: { ...draftConfig.contact, deliveryCity: e.target.value },
                        })
                      }
                      className="w-full px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700 text-white text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: JSON BACKUP / IMPORT / FACTORY RESET */}
          {activeTab === 'backup' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700 space-y-2">
                <h4 className="text-xs font-bold text-white">
                  {isHy ? 'Արտահանել կայքի ամբողջ կոնֆիգուրացիան (Export JSON)' : 'Экспорт текущих настроек сайта'}
                </h4>
                <p className="text-[11px] text-slate-400">
                  {isHy
                    ? 'Պատճենեք այս JSON կոդը՝ կայքի ձևավորումը և սեկցիաները պահպանելու համար:'
                    : 'Скопируйте этот JSON для сохранения шаблона.'}
                </p>
                <textarea
                  readOnly
                  rows={4}
                  value={exportSiteConfig(draftConfig)}
                  className="w-full p-2.5 rounded bg-slate-950 font-mono text-[10px] text-emerald-400 border border-slate-800 select-all"
                />
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(exportSiteConfig(draftConfig));
                    setStatusMessage({ text: isHy ? 'JSON կոդը պատճենվեց' : 'JSON скопирован в буфер' });
                  }}
                  className="px-3 py-1.5 rounded bg-slate-700 hover:bg-slate-600 text-xs font-bold text-white cursor-pointer"
                >
                  {isHy ? 'Պատճենել բուֆեր' : 'Скопировать JSON'}
                </button>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700 space-y-2">
                <h4 className="text-xs font-bold text-white">
                  {isHy ? 'Ներմուծել կոնֆիգուրացիա (Import JSON)' : 'Импорт конфигурации (JSON)'}
                </h4>
                <textarea
                  rows={3}
                  placeholder={isHy ? 'Տեղադրեք JSON կոդը այստեղ...' : 'Вставьте валидный JSON...'}
                  value={importJsonText}
                  onChange={(e) => setImportJsonText(e.target.value)}
                  className="w-full p-2.5 rounded bg-slate-900 font-mono text-[10px] text-white border border-slate-700 focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="button"
                  disabled={!importJsonText.trim()}
                  onClick={handleImportJson}
                  className="px-3 py-1.5 rounded bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-xs font-bold text-white cursor-pointer"
                >
                  {isHy ? 'Ներմուծել և կիրառել' : 'Импортировать и применить'}
                </button>
              </div>

              <div className="p-3.5 rounded-xl bg-rose-950/20 border border-rose-900/40 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-rose-300">
                    {isHy ? 'Վերականգնել գործարանային կարգավորումները' : 'Заводской сброс'}
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    {isHy ? 'Վերականգնում է լռելյայն դիզայնը, սեկցիաները և բաններները' : 'Сбрасывает все визуальные настройки к исходным'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleResetToFactory}
                  className="px-3 py-1.5 rounded bg-rose-800 hover:bg-rose-700 text-xs font-bold text-white cursor-pointer"
                >
                  {isHy ? 'Վերականգնել' : 'Сбросить'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Ներքևի կոճակներ */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-800 bg-slate-950/70">
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>{isHy ? 'Փոփոխությունները կիրառվում են ակնթարթորեն' : 'Мгновенное применение к сайту'}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {isHy ? 'Փակել' : 'Закрыть'}
            </button>
            <button
              type="button"
              onClick={handleApplyChanges}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-700/25 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{isHy ? 'Պահպանել կայքը' : 'Сохранить сайт'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
