import React from 'react';
import {
  Wallet,
  HelpCircle,
  RotateCcw,
  Sparkles,
  UserCheck,
  UserPlus,
  Globe,
  Sliders,
  ShoppingCart,
  LayoutGrid,
  CreditCard,
  Package,
  Bot,
  FileText,
  Briefcase,
  ScanLine,
  ChevronDown,
  Truck,
} from 'lucide-react';
import { UserProfile, Language } from '../types';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  onOpenRules: () => void;
  onOpenAgreement: () => void;
  onOpenAuth: () => void;
  onOpenCabinet?: () => void;
  onOpenAdmin: () => void;
  onOpenPos: () => void;
  onOpenErp: () => void;
  onOpenBuilder: () => void;
  onOpenCart: () => void;
  onReset: () => void;
  onLoadPreset: (preset: 'starter' | 'active' | 'whale') => void;
  currentUser: UserProfile;
  lang: Language;
  onToggleLang: () => void;
  currentRate: number;
  cartCount: number;
  onOpenChat: () => void;
  onOpen3dShowcase?: () => void;
  onOpenPartnerPortal?: () => void;
  onOpenScanner?: () => void;
  onOpenDeliveryTracker?: () => void;
  activeDeliveriesCount?: number;
  pendingAdminCount?: number;
  storeTitle?: string;
  storeTagline?: string;
  badgeText?: string;
}


export const Header: React.FC<HeaderProps> = ({
  onOpenRules,
  onOpenAgreement,
  onOpenAuth,
  onOpenCabinet,
  onOpenAdmin,
  onOpenPos,
  onOpenErp,
  onOpenBuilder,
  onOpenCart,
  onReset,
  onLoadPreset,
  currentUser,
  lang,
  onToggleLang,
  currentRate,
  cartCount,
  onOpenChat,
  onOpen3dShowcase,
  onOpenPartnerPortal,
  onOpenScanner,
  onOpenDeliveryTracker,
  activeDeliveriesCount = 0,
  pendingAdminCount = 0,
  storeTitle,
  storeTagline,
  badgeText,
}) => {


  const isHy = lang === 'hy';
  const { user, isAdmin } = useAuth();
  const hasAdminAccess = Boolean(isAdmin || currentUser.isAdmin);

  const [isToolsOpen, setIsToolsOpen] = React.useState(false);
  const toolsRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (toolsRef.current && !toolsRef.current.contains(event.target as Node)) {
        setIsToolsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="w-full flex flex-col md:flex-row items-center justify-between gap-4 py-3 px-2 border-b border-slate-800/80 mb-4">
      <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 p-0.5 shadow-lg shadow-emerald-500/20 flex items-center justify-center shrink-0">
            <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center">
              <Wallet className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white font-sans">
                {storeTitle || (isHy ? 'Համակարգ 2000' : 'Система 2000')}
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full flex items-center gap-1 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                {badgeText || `${(currentRate * 100).toFixed(0)}% LIVE`}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {storeTagline ||
                (isHy
                  ? 'Կենտրոնական բոնուսային դրամապանակ՝ անընդհատ աճով'
                  : 'Центральный бонусный кошелек с непрерывным начислением')}
            </p>
          </div>
        </div>

        {/* Мобильная кнопка корзины, AI и языка */}
        <div className="flex items-center gap-1.5 md:hidden">
          {hasAdminAccess && (
            <>
              <button
                onClick={onOpenErp}
                className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-amber-950/80 border border-amber-500/60 text-amber-300 text-xs font-bold cursor-pointer shadow"
                title={isHy ? '1C Պահեստ և Հաշվապահություն' : '1C:Склад и Бухучет'}
              >
                <Package className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[10px]">1С</span>
              </button>
              <button
                onClick={onOpenPos}
                className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-emerald-950/80 border border-emerald-500/60 text-emerald-300 text-xs font-bold cursor-pointer shadow"
                title={isHy ? 'POS Տերմինալ (Միայն ադմին)' : 'POS Терминал (Только админ)'}
              >
                <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[10px]">POS</span>
              </button>
            </>
          )}
          {onOpenDeliveryTracker && (
            <button
              onClick={onOpenDeliveryTracker}
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-sky-950/80 border border-sky-500/60 text-sky-300 text-xs font-bold cursor-pointer shadow"
              title={isHy ? 'Առաքման առցանց հետևում (GPS)' : 'Онлайн-отслеживание доставки (GPS)'}
            >
              <Truck className="w-3.5 h-3.5 text-sky-400" />
              <span className="text-[10px]">GPS</span>
            </button>
          )}
          <button
            onClick={onOpenChat}
            className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 text-xs font-bold shadow cursor-pointer"
            title={isHy ? 'Gemini AI Խորհրդատու' : 'AI-Консультант Gemini'}
          >
            <Bot className="w-3.5 h-3.5" />
            <span className="text-[10px]">AI</span>
          </button>
          <button
            onClick={onOpenCart}
            className="relative flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold shadow-md cursor-pointer"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>{cartCount}</span>
          </button>
          <button
            onClick={onOpenAgreement}
            className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-teal-950/70 border border-teal-600/50 text-teal-300 text-xs font-bold cursor-pointer"
            title={isHy ? 'Պայմանագիր (Օֆերտա)' : 'Договор-оферта'}
          >
            <FileText className="w-3.5 h-3.5 text-teal-400" />
            <span className="text-[10px]">{isHy ? 'Պայմ.' : 'Дог.'}</span>
          </button>
          <button
            onClick={onToggleLang}
            className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs font-semibold text-emerald-300 cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{isHy ? 'ՀԱՅ' : 'РУС'}</span>
          </button>
        </div>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap justify-center md:justify-end w-full md:w-auto">
        {/* КНОПКА 1С:УПРАВЛЕНИЕ СКЛАДОМ И БУХГАЛТЕРИЯ (ТОЛЬКО ДЛЯ АДМИНИСТРАТОРА) */}
        {hasAdminAccess && (
          <button
            onClick={onOpenErp}
            className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold text-amber-200 bg-gradient-to-r from-amber-950/90 to-amber-900/80 hover:from-amber-900 hover:to-amber-800 border border-amber-500/70 shadow-md shadow-amber-950/60 transition-all cursor-pointer ring-1 ring-amber-400/40"
            title={isHy ? '1C:Պահեստ և Հաշվապահություն (Ամբողջական ERP)' : '1С:Розница & Управление Складом & Бухгалтерия'}
          >
            <Package className="w-3.5 h-3.5 text-amber-400" />
            <span>{isHy ? '1C:Պահեստ' : '1С:Склад'}</span>
          </button>
        )}

        {/* КНОПКА POS ТЕРМИНАЛА (ТОЛЬКО ДЛЯ АДМИНИСТРАТОРА) */}
        {hasAdminAccess && (
          <button
            onClick={onOpenPos}
            className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold text-emerald-300 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/70 shadow-md shadow-emerald-950/50 transition-all cursor-pointer ring-1 ring-emerald-500/30"
            title={isHy ? 'POS Տերմինալ • Կասսա (Միայն ադմինիստրատորի համար)' : 'POS Терминал • Касса (Только для админа)'}
          >
            <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
            <span>{isHy ? 'POS' : 'POS'}</span>
          </button>
        )}

        {/* КНОПКА КОРЗИНЫ (Десктоп) */}
        <button
          onClick={onOpenCart}
          className="relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-700/25 transition-all cursor-pointer"
          title={isHy ? 'Բացել զամբյուղը' : 'Открыть корзину'}
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          <span>{isHy ? 'Զամբյուղ' : 'Корзина'}</span>
          {cartCount > 0 && (
            <span className="ml-1 px-1.5 py-0.2 rounded-full bg-slate-950 text-emerald-300 font-mono text-[10px]">
              {cartCount}
            </span>
          )}
        </button>

        {/* КНОПКА ОНЛАЙН-ОТСЛЕЖИВАНИЯ ДОСТАВКИ (GPS LIVE) */}
        {onOpenDeliveryTracker && (
          <button
            onClick={onOpenDeliveryTracker}
            className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold text-sky-200 bg-sky-950/85 hover:bg-sky-900 border border-sky-500/70 shadow-md shadow-sky-950/50 transition-all cursor-pointer ring-1 ring-sky-400/30"
            title={isHy ? 'Առաքման առցանց հետևում (GPS LIVE)' : 'Система отслеживания доставки в онлайн-режиме (GPS LIVE)'}
          >
            <Truck className="w-3.5 h-3.5 text-sky-400" />
            <span>{isHy ? 'Առաքում LIVE' : 'Доставка LIVE'}</span>
            {activeDeliveriesCount > 0 && (
              <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-sky-500 text-slate-950 font-mono font-bold text-[10px]">
                {activeDeliveriesCount}
              </span>
            )}
          </button>
        )}

        {/* КНОПКА 3D AI ВИТРИНЫ МАГАЗИНА */}
        {onOpen3dShowcase && (
          <button
            onClick={onOpen3dShowcase}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-amber-200 bg-gradient-to-r from-amber-950 via-slate-900 to-amber-950 hover:brightness-110 border border-amber-500/70 shadow-md shadow-amber-950/60 transition-all cursor-pointer ring-1 ring-amber-400/50"
            title={isHy ? '3D AI Վիտրինա (Ինտերակտիվ 3D ցուցասրահ)' : '3D AI Витрина Магазина (Интерактивный 3D Магазин)'}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin-slow" />
            <span>{isHy ? '3D Վիտրինա' : '3D AI Витрина'}</span>
          </button>
        )}

        {/* КНОПКА GEMINI AI ЧАТ-БОТА */}
        <button
          onClick={onOpenChat}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-950 bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-400 hover:brightness-110 shadow-md shadow-emerald-500/20 transition-all cursor-pointer ring-1 ring-emerald-300/60"
          title={isHy ? 'Gemini AI Խորհրդատու' : 'AI-Консультант Gemini'}
        >
          <Bot className="w-3.5 h-3.5 text-slate-950" />
          <span>{isHy ? 'AI Օգնական' : 'AI-Консультант'}</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-800 animate-ping"></span>
        </button>


        {/* КНОПКА B2B/B2C ПАРТНЕРСКОГО ПОРТАЛА */}
        {onOpenPartnerPortal && (
          <button
            onClick={onOpenPartnerPortal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-teal-200 bg-teal-950/80 hover:bg-teal-900 border border-teal-500/60 shadow-md shadow-teal-950/40 transition-all cursor-pointer ring-1 ring-teal-500/30"
            title={isHy ? 'B2B/B2C Գործընկերային Պորտալ' : 'B2B/B2C Партнерский Портал'}
          >
            <Briefcase className="w-3.5 h-3.5 text-teal-400" />
            <span>{isHy ? 'Գործընկերներ' : 'Партнерам'}</span>
          </button>
        )}

        {/* Кнопка регистрации / профиля пользователя */}
        <button
          onClick={() => {
            if ((user || currentUser.isLoggedIn) && onOpenCabinet) {
              onOpenCabinet();
            } else {
              onOpenAuth();
            }
          }}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            user || currentUser.isLoggedIn
              ? 'bg-slate-800 hover:bg-slate-750 text-emerald-300 border border-slate-700 shadow'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-700/20'
          }`}
          title={user || currentUser.isLoggedIn ? (isHy ? 'Անձնական կաբինետ' : 'Личный кабинет') : (isHy ? 'Գրանցում / Մուտք' : 'Регистрация / Вход')}
        >
          {user ? (
            <>
              {user.photoURL ? (
                <img src={user.photoURL} alt="User" className="w-4 h-4 rounded-full object-cover" />
              ) : (
                <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
              )}
              <span className="max-w-[110px] truncate">{user.displayName || user.email || currentUser.name}</span>
            </>
          ) : currentUser.isLoggedIn ? (
            <>
              <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span className="max-w-[110px] truncate">{currentUser.name}</span>
            </>
          ) : (
            <>
              <UserPlus className="w-3.5 h-3.5" />
              <span>{isHy ? 'Մուտք' : 'Вход'}</span>
            </>
          )}
        </button>

        {/* КНОПКА АДМИН-ПАНЕЛИ (ТОЛЬКО ДЛЯ АДМИНИСТРАТОРА) */}
        {hasAdminAccess && (
          <button
            onClick={onOpenAdmin}
            className="relative inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold text-amber-300 bg-amber-950/40 hover:bg-amber-900/60 border border-amber-800/60 shadow-sm transition-all cursor-pointer"
            title={isHy ? 'Ադմինիստրատորի վահանակ' : 'Панель администратора'}
          >
            <Sliders className="w-3.5 h-3.5 text-amber-400" />
            <span>{isHy ? 'Ադմին' : 'Админ'}</span>
            {pendingAdminCount > 0 && (
              <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-rose-600 text-white font-mono text-[10px] animate-pulse">
                {pendingAdminCount}
              </span>
            )}
          </button>
        )}

        {/* Выпадающее меню «Инструменты» для компактности шапки */}
        <div className="relative group" ref={toolsRef}>
          <button
            onClick={() => setIsToolsOpen((prev) => !prev)}
            className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 transition-colors cursor-pointer"
            title={isHy ? 'Գործիքներ և կանոններ' : 'Инструменты и правила'}
          >
            <span>{isHy ? 'Գործիքներ' : 'Инструменты'}</span>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isToolsOpen ? 'rotate-180' : ''}`} />
          </button>
          <div
            className={`absolute right-0 mt-1.5 w-56 py-1.5 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl transition-all z-30 ${
              isToolsOpen
                ? 'opacity-100 visible'
                : 'opacity-0 invisible group-hover:opacity-100 group-hover:visible'
            }`}
          >
            {onOpenScanner && (
              <button
                onClick={() => {
                  onOpenScanner();
                  setIsToolsOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
              >
                <ScanLine className="w-3.5 h-3.5 text-emerald-400" />
                <span>{isHy ? 'Շտրիխ կոդերի սկաներ' : 'Сканер штрихкодов / QR'}</span>
              </button>
            )}
            <button
              onClick={() => {
                onOpenRules();
                setIsToolsOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5 text-teal-400" />
              <span>{isHy ? 'Համակարգի կանոնները' : 'Правила системы'}</span>
            </button>
            <button
              onClick={() => {
                onOpenAgreement();
                setIsToolsOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-slate-800 flex items-center justify-between cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-emerald-400" />
                <span>{isHy ? 'Պայմանագիր-օֆերտա' : 'Договор-оферта'}</span>
              </span>
              <span className={`w-2 h-2 rounded-full ${currentUser.agreementAccepted ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            </button>

            {hasAdminAccess && (
              <>
                <div className="my-1 border-t border-slate-800" />
                <button
                  onClick={() => {
                    onOpenBuilder();
                    setIsToolsOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-sky-300 hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                >
                  <LayoutGrid className="w-3.5 h-3.5 text-sky-400" />
                  <span>{isHy ? 'Կայքի Կոնստրուկտոր' : 'Конструктор сайта'}</span>
                </button>
                <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  {isHy ? 'Թեստային պրեսետներ' : 'Тестовые пресеты'}
                </div>
                <button
                  onClick={() => {
                    onLoadPreset('starter');
                    setIsToolsOpen(false);
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-slate-400" />
                  <span>{isHy ? 'Սկսնակ (0 ֏)' : 'Новый (0 ֏)'}</span>
                </button>
                <button
                  onClick={() => {
                    onLoadPreset('active');
                    setIsToolsOpen(false);
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs text-emerald-300 hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{isHy ? 'Ակտիվ (50 000 ֏)' : 'Активный (50 000 ֏)'}</span>
                </button>
                <button
                  onClick={() => {
                    onLoadPreset('whale');
                    setIsToolsOpen(false);
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs text-amber-300 hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>{isHy ? 'Պրեմիում (250 000 ֏)' : 'Премиум (250 000 ֏)'}</span>
                </button>
                <div className="my-1 border-t border-slate-800" />
                <button
                  onClick={() => {
                    onReset();
                    setIsToolsOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-rose-400 hover:bg-rose-950/30 flex items-center gap-2 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{isHy ? 'Վերակայել հաշվեկշիռը' : 'Сбросить баланс'}</span>
                </button>
              </>
            )}
          </div>
        </div>


        {/* Языковой переключатель десктоп */}
        <button
          onClick={onToggleLang}
          className="hidden md:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 transition-colors cursor-pointer"
          title={isHy ? 'Փոխել լեզուն' : 'Переключить язык'}
        >
          <Globe className="w-3.5 h-3.5 text-emerald-400" />
          <span>{isHy ? 'ՀԱՅ' : 'РУС'}</span>
        </button>
      </div>
    </header>
  );
};
