import React, { useState } from 'react';
import {
  X,
  FileText,
  ShieldCheck,
  Lock,
  Coins,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Printer,
  Download,
  Calendar,
  Building,
  UserCheck,
  Check,
  ExternalLink,
} from 'lucide-react';
import { Language, UserProfile } from '../types';
import {
  SYSTEM_2000_CONTRACT_META,
  CONTRACT_ARTICLES,
  getAgreementSummaryText,
} from '../utils/agreement';

interface UserAgreementModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  currentUser: UserProfile;
  onAcceptAgreement: () => void;
}

export const UserAgreementModal: React.FC<UserAgreementModalProps> = ({
  isOpen,
  onClose,
  lang,
  currentUser,
  onAcceptAgreement,
}) => {
  const [activeArticleTab, setActiveArticleTab] = useState<number | 'all'>('all');
  const [consentChecked, setConsentChecked] = useState<boolean>(false);
  const [internalLang, setInternalLang] = useState<Language>(lang);

  if (!isOpen) return null;

  const isHy = internalLang === 'hy';
  const meta = SYSTEM_2000_CONTRACT_META;
  const isAccepted = Boolean(currentUser.agreementAccepted);
  const acceptedDate = currentUser.agreementAcceptedAt || new Date().toLocaleString(isHy ? 'hy-AM' : 'ru-RU');

  const handlePrint = () => {
    window.print();
  };

  const handleAcceptClick = () => {
    onAcceptAgreement();
  };

  return (
    <div
      id="user-agreement-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-sm overflow-y-auto"
    >
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-750 rounded-2xl shadow-2xl text-slate-100 flex flex-col my-auto max-h-[92vh] overflow-hidden">
        
        {/* ВЕРХНЯЯ ПАНЕЛЬ / ШАПКА ДОГОВОРА */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-950/90 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shrink-0">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  {isHy
                    ? 'Էկոհամակարգի օֆերտայի պայմանագիր'
                    : 'Договор-оферта экосистемы «Система 2000»'}
                </h2>
                <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-slate-800 text-teal-300 border border-slate-700">
                  № {meta.contractNumber}
                </span>
                {isAccepted ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span>{isHy ? 'Ակցեպտավորված է' : 'Акцептован'}</span>
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-amber-400" />
                    <span>{isHy ? 'Սպասում է ստորագրման' : 'Ожидает акцепта'}</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {isHy
                  ? 'Բոնուսների շրջանառության և 10% տարեկան դեպոզիտի կանոնակարգ'
                  : 'Порядок обращения бонусных баллов и пополнения 10% депозита'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Переключатель языка внутри договора */}
            <div className="flex items-center bg-slate-850 p-0.5 rounded-lg border border-slate-750 text-xs font-semibold">
              <button
                onClick={() => setInternalLang('hy')}
                className={`px-2 py-1 rounded-md transition-colors cursor-pointer ${
                  internalLang === 'hy' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                ՀԱՅ
              </button>
              <button
                onClick={() => setInternalLang('ru')}
                className={`px-2 py-1 rounded-md transition-colors cursor-pointer ${
                  internalLang === 'ru' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                РУС
              </button>
            </div>

            {/* Печать */}
            <button
              onClick={handlePrint}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer hidden sm:flex items-center gap-1 text-xs font-semibold"
              title={isHy ? 'Տպել պայմանագիրը' : 'Печать договора'}
            >
              <Printer className="w-4 h-4" />
              <span>{isHy ? 'Տպել' : 'Печать'}</span>
            </button>

            {/* Закрыть */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label={isHy ? 'Փակել' : 'Закрыть'}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 4 ГЛАВНЫХ АКЦЕНТА ВВЕРХУ (ВИЗУАЛЬНЫЕ КАРТОЧКИ СУТИ ДОГОВОРА) */}
        <div className="p-4 sm:p-5 bg-slate-950/50 border-b border-slate-800/80 shrink-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            
            {/* 1. ПОКУПКИ ОТ 10 000 ֏ — ПОЖИЗНЕННЫЙ ДЕПОЗИТ С ПРАВОМ НАСЛЕДОВАНИЯ */}
            <div className="p-3 rounded-xl bg-slate-850 border border-emerald-500/40 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
                  <TrendingUp className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{isHy ? 'ԳՆՈՒՄՆԵՐԸ 10 000 ֏-ԻՑ' : 'ПОКУПКИ ОТ 10 000 ֏'}</span>
                </div>
                <p className="text-xs text-slate-300 leading-snug">
                  {isHy
                    ? '10 000 ֏ և ավելի գնումների 100%-ը դառնում է 10% տարեկան ՑՄԱՀ ԴԵՊՈԶԻՏ՝ ԺԱՌԱՆԳՈՒԹՅԱՆ ԻՐԱՎՈՒՆՔՈՎ:'
                    : '100% затрат от 10 000 ֏ становятся ПОЖИЗНЕННЫМ ДЕПОЗИТОМ 10% годовых С ПРАВОМ НАСЛЕДОВАНИЯ!'}
                </p>
              </div>
              <div className="mt-2 text-[10px] font-mono text-emerald-300 font-bold">
                {isHy ? '● Հոդված 4 (Ցմահ և Ժառանգություն)' : '● Статья 4 (Пожизненно и наследие)'}
              </div>
            </div>

            {/* 2. 15 ДНЕЙ НА ВОЗВРАТ И ЕЖЕСЕКУНДНЫЕ БОНУСЫ */}
            <div className="p-3 rounded-xl bg-slate-850 border border-teal-500/40 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1.5 text-teal-400 text-xs font-bold uppercase tracking-wider mb-1">
                  <ShieldCheck className="w-4 h-4 text-teal-400 shrink-0" />
                  <span>{isHy ? '15 ՕՐ ԵՎ ՎՐԿ. ԲՈՆՈՒՍՆԵՐ' : '15 ДНЕЙ И БОНУСЫ / СЕК'}</span>
                </div>
                <p className="text-xs text-slate-300 leading-snug">
                  {isHy
                    ? 'Բոնուսները սկսում են հաշվեգրվել ԵՐԵՔՈՒՆԴ ԱՌ ԵՐԵՔՈՒՆԴ՝ 15 օր անց, եթե ապրանքի վերադարձ չի կատարվել:'
                    : 'Бонусные баллы зачисляются ЕЖЕСЕКУНДНО СПУСТЯ 15 ДНЕЙ при условии отсутствия возврата товаров.'}
                </p>
              </div>
              <div className="mt-2 text-[10px] font-mono text-teal-300 font-bold">
                {isHy ? '● Հոդված 5 (15 օր վերադարձի ժամկետ)' : '● Статья 5 (15 дней на возврат)'}
              </div>
            </div>

            {/* 3. ТОЛЬКО В ЭКОСИСТЕМЕ */}
            <div className="p-3 rounded-xl bg-slate-850 border border-emerald-500/30 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
                  <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{isHy ? 'ՄԻԱՅՆ ԷԿՈՀԱՄԱԿԱՐԳՈՒՄ' : 'ТОЛЬКО В ЭКОСИСТЕМЕ'}</span>
                </div>
                <p className="text-xs text-slate-300 leading-snug">
                  {isHy
                    ? 'Բոնուսները գործում են ՄԻԱՅՆ «Համակարգ 2000» խանութում և POS ցանցում: Ելքն արգելված է:'
                    : 'Бонусные баллы действуют ТОЛЬКО в онлайн-магазине и POS-кассах «Системы 2000». Вывод запрещен.'}
                </p>
              </div>
              <div className="mt-2 text-[10px] font-mono text-emerald-300/80 font-bold">
                {isHy ? '● Հոդված 2 (Փակ կոնտուր)' : '● Статья 2 (Закрытый контур)'}
              </div>
            </div>

            {/* 4. БАЛЛЫ НЕ СЧИТАЮТСЯ ДЕПОЗИТОМ */}
            <div className="p-3 rounded-xl bg-slate-850 border border-amber-500/30 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1.5 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
                  <Coins className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>{isHy ? 'ՉԵՆ ՀԱՆԴԻՍԱՆՈՒՄ ԴԵՊՈԶԻՏ' : 'НЕ ЯВЛЯЮТСЯ ДЕПОЗИТОМ'}</span>
                </div>
                <p className="text-xs text-slate-300 leading-snug">
                  {isHy
                    ? 'Բոնուսներով վճարելիս դեպոզիտի մարմինը չի ավելանում: Համակարգը 100% պաշտպանված է:'
                    : 'При списании бонусов депозит не растет. Антиинфляционная математическая защита 100%.'}
                </p>
              </div>
              <div className="mt-2 text-[10px] font-mono text-amber-300/80 font-bold">
                {isHy ? '● Հոդված 3 (Հակաինֆլյացիա)' : '● Статья 3 (Антиинфляция)'}
              </div>
            </div>

          </div>
        </div>

        {/* НАВИГАЦИЯ ПО СТАТЬЯМ */}
        <div className="flex items-center gap-1 px-4 py-2 bg-slate-950/70 border-b border-slate-800 overflow-x-auto text-xs shrink-0">
          <span className="text-[11px] text-slate-400 font-semibold uppercase pr-1 shrink-0">
            {isHy ? 'Հոդվածներ՝' : 'Статьи:'}
          </span>
          <button
            onClick={() => setActiveArticleTab('all')}
            className={`px-2.5 py-1 rounded-md whitespace-nowrap transition-colors cursor-pointer ${
              activeArticleTab === 'all'
                ? 'bg-slate-700 text-white font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            {isHy ? 'Բոլորը (1-7)' : 'Все (1-7)'}
          </button>
          {CONTRACT_ARTICLES.map((art) => (
            <button
              key={art.number}
              onClick={() => setActiveArticleTab(art.number)}
              className={`px-2.5 py-1 rounded-md whitespace-nowrap transition-colors cursor-pointer ${
                activeArticleTab === art.number
                  ? 'bg-emerald-600 text-white font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {isHy ? `Հոդված ${art.number}` : `Статья ${art.number}`}
            </button>
          ))}
        </div>

        {/* ТЕЛО ДОГОВОРА (СКРОЛЛИРУЕМЫЙ ТЕКСТ) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 text-slate-200 text-xs sm:text-sm leading-relaxed">
          
          {/* ПРЕАМБУЛА */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 text-xs space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between text-slate-400 font-mono text-[11px] border-b border-slate-850 pb-2 mb-2 gap-1">
              <span>{isHy ? `Փաստաթուղթ՝ ${meta.contractNumber}` : `Документ: ${meta.contractNumber}`}</span>
              <span>{isHy ? `Խմբագրություն՝ ${meta.version}` : `Редакция: ${meta.version}`}</span>
              <span>{isHy ? `Ուժի մեջ է՝ ${meta.effectiveDateHy}` : `Действует с: ${meta.effectiveDateRu}`}</span>
            </div>
            <p className="text-slate-300">
              {isHy
                ? `Սույն Փաստաթուղթը հանդիսանում է հրապարակային օֆերտա՝ առաջարկված «${meta.operatorNameHy}» կողմից (այսուհետ՝ «Օպերատոր»), ցանկացած ֆիզիկական կամ իրավաբանական անձի (այսուհետ՝ «Օգտատեր»), ով ցանկանում է մասնակցել «Համակարգ 2000» լոյալության և անընդհատ բոնուսային էմիսիայի ծրագրին:`
                : `Настоящий документ является официальным публичным предложением (офертой) ${meta.operatorNameRu} (далее — «Оператор») в адрес любого правоспособного физического или юридического лица (далее — «Пользователь»), изъявившего желание зарегистрироваться в сервисе «Система 2000» и участвовать в программе лояльности.`}
            </p>
          </div>

          {/* СТАТЬИ ДОГОВОРА */}
          {CONTRACT_ARTICLES.filter(
            (art) => activeArticleTab === 'all' || activeArticleTab === art.number
          ).map((art) => (
            <div
              key={art.number}
              className={`p-4 sm:p-5 rounded-2xl bg-slate-850/80 border transition-all ${
                art.number === 2
                  ? 'border-emerald-500/40 bg-emerald-950/10'
                  : art.number === 3
                  ? 'border-amber-500/40 bg-amber-950/10'
                  : art.number === 4
                  ? 'border-cyan-500/40 bg-cyan-950/10'
                  : 'border-slate-750'
              }`}
            >
              {/* Заголовок статьи */}
              <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                  <span>{isHy ? art.titleHy : art.titleRu}</span>
                </h3>
                {(art.badgeHy || art.badgeRu) && (
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      art.number === 2
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : art.number === 3
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : art.number === 4
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                        : 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    {isHy ? art.badgeHy : art.badgeRu}
                  </span>
                )}
              </div>

              {/* Ключевое выделение (если есть) */}
              {(art.keyHighlightHy || art.keyHighlightRu) && (
                <div
                  className={`p-3 rounded-xl mb-3 text-xs font-semibold leading-relaxed ${
                    art.number === 2
                      ? 'bg-emerald-950/40 border border-emerald-500/30 text-emerald-200'
                      : art.number === 3
                      ? 'bg-amber-950/40 border border-amber-500/30 text-amber-200'
                      : 'bg-cyan-950/40 border border-cyan-500/30 text-cyan-200'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{isHy ? art.keyHighlightHy : art.keyHighlightRu}</span>
                  </div>
                </div>
              )}

              {/* Абзацы статьи */}
              <div className="space-y-2 text-xs sm:text-[13px] text-slate-300 leading-relaxed">
                {(isHy ? art.paragraphsHy : art.paragraphsRu).map((paragraph, idx) => (
                  <p key={idx} className="flex items-start gap-2">
                    <span className="text-slate-500 font-mono text-xs select-none">
                      {art.number}.{idx + 1}
                    </span>
                    <span className="flex-1">{paragraph}</span>
                  </p>
                ))}
              </div>
            </div>
          ))}

          {/* РЕКВИЗИТЫ ОПЕРАТОРА И ЮРИДИЧЕСКАЯ ПЕЧАТЬ */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-950 border border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <div className="flex items-center gap-2 font-bold text-white mb-2 text-sm">
                <Building className="w-4 h-4 text-emerald-400" />
                <span>{isHy ? 'Օպերատորի վավերապայմանները' : 'Реквизиты Оператора'}</span>
              </div>
              <div className="space-y-1 text-slate-400 text-xs font-mono">
                <div>{isHy ? meta.operatorNameHy : meta.operatorNameRu}</div>
                <div>{meta.operatorTaxId}</div>
                <div>{isHy ? meta.operatorAddressHy : meta.operatorAddressRu}</div>
                <div>Էլ. փոստ: legal@sistema2000.am</div>
                <div>Հեռախոս: +374 (10) 20-00-00</div>
              </div>
            </div>

            {/* Официальный штамп / печать экосистемы */}
            <div className="flex flex-col items-center sm:items-end justify-center">
              <div className="w-36 h-36 rounded-full border-2 border-dashed border-teal-500/50 p-2 flex flex-col items-center justify-center text-center relative rotate-[-6deg] bg-teal-950/20">
                <div className="w-full h-full rounded-full border border-teal-400/60 flex flex-col items-center justify-center p-2 text-teal-300">
                  <span className="text-[9px] font-black uppercase tracking-wider">ՀԱՄԱԿԱՐԳ 2000</span>
                  <span className="text-[8px] font-mono">OFFICIAL SEAL</span>
                  <ShieldCheck className="w-6 h-6 my-0.5 text-teal-400" />
                  <span className="text-[8px] font-mono">VERIFIED 2026</span>
                  <span className="text-[7px] text-teal-400/80">YEREVAN • ARMENIA</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* ПОДВАЛ МОДАЛКИ: СТАТУС АКЦЕПТА И КНОПКА ПОДПИСИ */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950 shrink-0">
          {isAccepted ? (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                  <Check className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-white text-xs sm:text-sm flex items-center gap-1.5">
                    <span>{isHy ? 'Պայմանագիրն ակցեպտավորված է Ձեր կողմից' : 'Договор успешно акцептован и подписан'}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 bg-emerald-500/30 text-emerald-200 rounded">
                      DIGITAL SIGNED
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-300 font-mono mt-0.5">
                    {isHy ? `Օգտատեր՝ ${currentUser.name} (${currentUser.id}) • Ամսաթիվ՝ ${acceptedDate}` : `Пользователь: ${currentUser.name} (${currentUser.id}) • Дата: ${acceptedDate}`}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={handlePrint}
                  className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>{isHy ? 'Տպել' : 'Печать'}</span>
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  {isHy ? 'Փակել' : 'Закрыть'}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Чекбокс согласия */}
              <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-300 select-none group">
                <input
                  type="checkbox"
                  checked={consentChecked}
                  onChange={(e) => setConsentChecked(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-emerald-500/30 cursor-pointer"
                />
                <span className="group-hover:text-white transition-colors">
                  {isHy
                    ? 'Ես ընթերցել եմ, հասկանում եմ և անվերապահորեն ընդունում եմ «Համակարգ 2000» հրապարակային օֆերտայի բոլոր պայմանները (այդ թվում՝ 10,000 ֏ և ավելի գնումների 100%-ը 10% ցմահ դեպոզիտ դառնալը՝ ժառանգության իրավունքով, 15 օրվա վերադարձի պաշտպանիչ ժամկետը և բոնուսների վայրկյան առ վայրկյան հաշվեգրումը 15 օր անց առանց վերադարձի):'
                    : 'Я прочитал(а), полностью понимаю и безоговорочно принимаю условия Договора-оферты «Система 2000» (любая покупка от 10 000 ֏ становится пожизненным депозитом 10% годовых с правом наследования; бонусные баллы начисляются ежесекундно спустя 15 дней при условии отсутствия возврата товаров).'}
                </span>
              </label>

              {/* Кнопки действий */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-1">
                <div className="text-[11px] text-slate-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{isHy ? 'Թվային իրավական համաձայնություն' : 'Цифровой юридический акцепт оферты'}</span>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={onClose}
                    className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
                  >
                    {isHy ? 'Փակել' : 'Закрыть'}
                  </button>
                  <button
                    onClick={handleAcceptClick}
                    disabled={!consentChecked}
                    className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-lg ${
                      consentChecked
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-700/30 cursor-pointer active:scale-95'
                        : 'bg-slate-800 text-slate-500 border border-slate-750 cursor-not-allowed'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isHy ? 'Ակցեպտավորել պայմանագիրը' : 'Принять условия договора (Акцепт)'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
