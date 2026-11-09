import React, { useState, useEffect } from 'react';
import {
  X,
  Truck,
  MapPin,
  Navigation,
  Clock,
  Phone,
  ShieldCheck,
  CheckCircle2,
  Package,
  ThermometerSnowflake,
  Send,
  Search,
  Play,
  Pause,
  FastForward,
  KeyRound,
  Sparkles,
  UserCheck,
  Compass,
  Radio,
  Building2,
  Edit3,
  Check,
} from 'lucide-react';
import { Language } from '../types';
import { formatDram } from '../utils/finance';
import {
  DeliveryOrder,
  DeliveryStage,
  STAGE_ORDER,
  YEREVAN_DISTRICTS,
  computeCourierLivePosition,
  filterDeliveriesByQuery,
  generateCourierAutoReply,
} from '../utils/deliveryTracking';

interface DeliveryTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  deliveries: DeliveryOrder[];
  initialOrderNumber?: string | null;
  isAdmin?: boolean;
  onAdvanceTick: (orderId: string, stepPercent?: number) => void;
  onUpdateStage: (orderId: string, stage: DeliveryStage) => void;
  onSendChatMessage: (orderId: string, text: string, sender?: 'customer' | 'courier' | 'system') => void;
  onUpdateDeliveryDetails: (
    orderId: string,
    patch: Partial<Pick<DeliveryOrder, 'address' | 'entranceNotes' | 'contactless' | 'districtHy' | 'districtRu' | 'destinationCoords'>>
  ) => void;
}

export const STAGE_LABELS: Record<
  DeliveryStage,
  { hy: string; ru: string; descHy: string; descRu: string }
> = {
  accepted: {
    hy: 'Պատվերն ընդունված է (1C)',
    ru: 'Заказ принят в 1С',
    descHy: 'Գրանցված է կենտրոնական բազայում',
    descRu: 'Зарегистрирован в учетной системе',
  },
  packing: {
    hy: 'Հավաքագրում պահեստում',
    ru: 'Сборка на складе 1С',
    descHy: 'Ստուգում և տեղադրում թերմոբոքսում',
    descRu: 'Комплектация и пломбировка термобокса',
  },
  courier_assigned: {
    hy: 'Առաքիչը նշանակված է',
    ru: 'Назначен курьер',
    descHy: 'Պատվերը բեռնվում է մեքենա',
    descRu: 'Заказ погружен в курьерский борт',
  },
  in_transit: {
    hy: 'Ճանապարհին է (GPS LIVE)',
    ru: 'Курьер в пути (GPS LIVE)',
    descHy: 'Առաքիչը շարժվում է դեպի Ձեր հասցե',
    descRu: 'Движение по маршруту в реальном времени',
  },
  arriving: {
    hy: 'Մոտենում է շենքին',
    ru: 'Курьер у подъезда',
    descHy: 'Պատրաստեք ստացման 4-անիշ PIN կոդը',
    descRu: 'Приготовьте 4-значный PIN-код получения',
  },
  delivered: {
    hy: 'Առաքված է հաճախորդին',
    ru: 'Заказ доставлен',
    descHy: 'Հանձնված է PIN կոդով • 10% ավանդն ակտիվ է',
    descRu: 'Вручен по PIN-коду • 10% депозит активен',
  },
  cancelled: {
    hy: 'Չեղարկված է',
    ru: 'Отменен',
    descHy: 'Առաքումը չեղարկվել է',
    descRu: 'Доставка отменена',
  },
};

export const DeliveryTrackingModal: React.FC<DeliveryTrackingModalProps> = ({
  isOpen,
  onClose,
  lang,
  deliveries,
  initialOrderNumber,
  isAdmin = false,
  onAdvanceTick,
  onUpdateStage,
  onSendChatMessage,
  onUpdateDeliveryDetails,
}) => {
  const isHy = lang === 'hy';
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'delivered'>('all');
  const [selectedOrderId, setSelectedOrderId] = useState<string>(() => {
    if (initialOrderNumber) {
      const found = deliveries.find((d) => d.orderNumber === initialOrderNumber);
      if (found) return found.id;
    }
    return deliveries[0]?.id || '';
  });

  const [isAutoSimulating, setIsAutoSimulating] = useState<boolean>(false);
  const [chatInput, setChatInput] = useState('');
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [editAddressVal, setEditAddressVal] = useState('');
  const [editNotesVal, setEditNotesVal] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [pinFeedback, setPinFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (initialOrderNumber) {
      const found = deliveries.find(
        (d) => d.orderNumber.toLowerCase() === initialOrderNumber.toLowerCase()
      );
      if (found) {
        setSelectedOrderId(found.id);
      }
    } else if (deliveries.length > 0 && !deliveries.some((d) => d.id === selectedOrderId)) {
      setSelectedOrderId(deliveries[0].id);
    }
  }, [initialOrderNumber, deliveries, selectedOrderId]);

  const filteredDeliveries = filterDeliveriesByQuery(deliveries, searchQuery, statusFilter);
  const activeOrder =
    deliveries.find((d) => d.id === selectedOrderId) ||
    filteredDeliveries[0] ||
    deliveries[0];

  // Автоматическое живое продвижение по GPS при включенном режиме симуляции
  useEffect(() => {
    if (!isOpen || !isAutoSimulating || !activeOrder) return;
    if (activeOrder.stage === 'delivered' || activeOrder.stage === 'cancelled') {
      setIsAutoSimulating(false);
      return;
    }
    const interval = setInterval(() => {
      onAdvanceTick(activeOrder.id, 3);
    }, 2000);
    return () => clearInterval(interval);
  }, [isOpen, isAutoSimulating, activeOrder, onAdvanceTick]);

  if (!isOpen || !activeOrder) return null;

  const livePos = computeCourierLivePosition(
    activeOrder.warehouseOrigin,
    activeOrder.destinationCoords,
    activeOrder.progressPercent
  );

  const currentStageIdx = STAGE_ORDER.indexOf(
    activeOrder.stage === 'cancelled' ? 'accepted' : activeOrder.stage
  );

  const handleSendChat = (textToSend?: string) => {
    const msg = (textToSend ?? chatInput).trim();
    if (!msg) return;
    onSendChatMessage(activeOrder.id, msg, 'customer');
    if (!textToSend) setChatInput('');

    // Автоматический реалистичный ответ курьера
    const reply = generateCourierAutoReply(msg, lang, activeOrder);
    setTimeout(() => {
      onSendChatMessage(activeOrder.id, reply, 'courier');
    }, 450);
  };

  const handleConfirmByPin = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPin = pinInput.trim() || activeOrder.verificationPin;
    if (cleanPin !== activeOrder.verificationPin) {
      setPinFeedback(
        isHy
          ? `Սխալ PIN կոդ: Ճիշտ կոդն է՝ ${activeOrder.verificationPin}`
          : `Неверный PIN-код! Код этого заказа: ${activeOrder.verificationPin}`
      );
      return;
    }
    onUpdateStage(activeOrder.id, 'delivered');
    onSendChatMessage(
      activeOrder.id,
      isHy
        ? `✅ Պատվերը հաջողությամբ հանձնվել է հաճախորդին PIN կոդով (${activeOrder.verificationPin}):`
        : `✅ Заказ успешно вручен клиенту по PIN-коду (${activeOrder.verificationPin}).`,
      'system'
    );
    setPinFeedback(
      isHy
        ? '✅ Առաքումը հաստատված է PIN կոդով:'
        : '✅ Получение заказа успешно подтверждено по PIN-коду!'
    );
    setPinInput('');
    setTimeout(() => setPinFeedback(null), 5000);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={isHy ? 'Առաքման առցանց հետևման համակարգ' : 'Система отслеживания доставки в онлайн-режиме'}
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-none"
    >
      <div className="relative w-full max-w-7xl h-[93vh] overflow-hidden flex flex-col bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl text-slate-100">
        {/* ВЕРХНЯЯ ПАНЕЛЬ (TOP BAR) */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-3.5 border-b border-slate-800 bg-slate-950 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-sky-500/15 border border-sky-500/40 text-sky-400">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-white">
                  {isHy
                    ? 'Առաքման Առցանց Հետևման Համակարգ (GPS LIVE)'
                    : 'Система отслеживания доставки в онлайн-режиме (GPS LIVE)'}
                </h2>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-[10px] font-mono font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  <span>5G GPS ТЕЛЕМЕТРИЯ</span>
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {isHy
                  ? 'Իրական ժամանակում առաքիչի տեղաշարժ, ջերմային հսկողություն և ուղիղ կապ'
                  : 'Отслеживание курьера на карте Еревана в реальном времени, контроль термобокса и чат с курьером'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Кнопка включения/паузы живого движения по маршруту */}
            {activeOrder.stage !== 'delivered' && activeOrder.stage !== 'cancelled' && (
              <button
                type="button"
                onClick={() => setIsAutoSimulating((prev) => !prev)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                  isAutoSimulating
                    ? 'bg-emerald-600 text-white border-emerald-400 shadow-lg shadow-emerald-600/20'
                    : 'bg-slate-800 hover:bg-slate-700 text-emerald-300 border-slate-700'
                }`}
              >
                {isAutoSimulating ? (
                  <>
                    <Pause className="w-3.5 h-3.5" />
                    <span>{isHy ? 'Կանգնեցնել GPS սիմուլյացիան' : 'Пауза авто-движения GPS'}</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5" />
                    <span>{isHy ? 'Միացնել LIVE շարժումը' : 'Запустить LIVE движение GPS'}</span>
                  </>
                )}
              </button>
            )}

            {/* Кнопка ручного шага маршрута (+10%) */}
            {activeOrder.stage !== 'delivered' && activeOrder.stage !== 'cancelled' && (
              <button
                type="button"
                onClick={() => onAdvanceTick(activeOrder.id, 10)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition-colors cursor-pointer"
                title={isHy ? 'Առաջ տանել երթուղին +10%-ով' : 'Продвинуть курьера вперед по маршруту на +10%'}
              >
                <FastForward className="w-3.5 h-3.5" />
                <span>+10% GPS</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              aria-label={isHy ? 'Փակել' : 'Закрыть окно доставки'}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ОСНОВНОЙ КОНТЕНТ: СПИСОК ЗАКАЗОВ СЛЕВА + КАРТА И ДЕТАЛИ СПРАВА */}
        <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
          {/* ЛЕВАЯ КОЛОНКА: ПОИСК ПО ТРЕК-НОМЕРУ И СПИСОК ОТПРАВЛЕНИЙ */}
          <aside className="w-full lg:w-80 bg-slate-950 border-b lg:border-b-0 lg:border-r border-slate-800 flex flex-col shrink-0 max-h-56 lg:max-h-none">
            <div className="p-3 border-b border-slate-800 space-y-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={
                    isHy
                      ? 'Փնտրել պատվեր (ORD-88412), հեռախոս...'
                      : 'Номер заказа (ORD-88412), телефон, адрес...'
                  }
                  className="w-full pl-8 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-1">
                {(
                  [
                    { id: 'all', labelHy: 'Բոլորը', labelRu: 'Все' },
                    { id: 'active', labelHy: 'Ակտիվ', labelRu: 'В пути' },
                    { id: 'delivered', labelHy: 'Առաքված', labelRu: 'Доставлены' },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setStatusFilter(tab.id)}
                    className={`py-1.5 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                      statusFilter === tab.id
                        ? 'bg-sky-600 text-white'
                        : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    {isHy ? tab.labelHy : tab.labelRu}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
              {filteredDeliveries.map((del) => {
                const isSelected = del.id === activeOrder.id;
                const stInfo = STAGE_LABELS[del.stage];
                return (
                  <button
                    key={del.id}
                    type="button"
                    onClick={() => {
                      setSelectedOrderId(del.id);
                      setIsEditingAddress(false);
                      setPinFeedback(null);
                    }}
                    className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-slate-800/95 border-sky-500/70 shadow-md'
                        : 'bg-slate-900/70 hover:bg-slate-900 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono font-bold text-xs text-sky-300">
                        {del.orderNumber}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          del.stage === 'delivered'
                            ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                            : del.stage === 'arriving'
                            ? 'bg-amber-950/80 text-amber-300 border-amber-500/40'
                            : 'bg-sky-950/80 text-sky-300 border-sky-500/40'
                        }`}
                      >
                        {isHy ? stInfo.hy : stInfo.ru}
                      </span>
                    </div>

                    <div className="mt-1.5 text-xs font-semibold text-white truncate">
                      {del.address}
                    </div>
                    <div className="mt-0.5 text-[11px] text-slate-400 flex items-center justify-between">
                      <span className="truncate">{del.customerName}</span>
                      <span className="font-mono text-emerald-400 font-bold shrink-0">
                        {del.progressPercent}%
                      </span>
                    </div>

                    {/* Прогресс-бар */}
                    <div className="mt-2 h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${
                          del.stage === 'delivered' ? 'bg-emerald-500' : 'bg-sky-400'
                        }`}
                        style={{ width: `${del.progressPercent}%` }}
                      />
                    </div>
                  </button>
                );
              })}

              {filteredDeliveries.length === 0 && (
                <div className="p-6 text-center text-xs text-slate-500">
                  {isHy ? 'Առաքումներ չեն գտնվել' : 'Отправления по вашему запросу не найдены'}
                </div>
              )}
            </div>
          </aside>

          {/* ПРАВАЯ ОБЛАСТЬ: КАРТА GPS В РЕАЛЬНОМ ВРЕМЕНИ + ЭТАПЫ + КУРЬЕР И ЧАТ */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-slate-900">
            {/* ВЕРХНЯЯ СВОДКА ЗАКАЗА И ТЕЛЕМЕТРИИ */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>{isHy ? 'Ժամանման ժամանակ (ETA)' : 'Расчетное время (ETA)'}</span>
                  <Clock className="w-4 h-4 text-sky-400" />
                </div>
                <div className="mt-1 text-lg sm:text-xl font-black font-mono text-white">
                  {activeOrder.stage === 'delivered'
                    ? isHy
                      ? 'Առաքված է'
                      : 'Доставлен'
                    : `~${activeOrder.etaMinutes} ${isHy ? 'րոպե' : 'мин'}`}
                </div>
                <div className="mt-0.5 text-[11px] text-sky-300">
                  {activeOrder.stage === 'delivered'
                    ? `${isHy ? 'Ժամը՝' : 'Вручено в'} ${activeOrder.updatedAt}`
                    : `${isHy ? 'Մնացել է՝' : 'Осталось:'} ${activeOrder.distanceKm} км (${activeOrder.speedKmh} км/ч)`}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>{isHy ? 'Ստացման PIN կոդ' : 'PIN-код получения'}</span>
                  <KeyRound className="w-4 h-4 text-amber-400" />
                </div>
                <div className="mt-1 text-lg sm:text-xl font-black font-mono tracking-widest text-amber-300">
                  {activeOrder.verificationPin}
                </div>
                <div className="mt-0.5 text-[11px] text-slate-400">
                  {isHy ? 'Հայտնեք առաքիչին ստանալիս' : 'Назовите курьеру при вручении'}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>{isHy ? 'Թերմոբոքսի ջերմաստիճան' : 'Контроль термобокса'}</span>
                  <ThermometerSnowflake className="w-4 h-4 text-cyan-400" />
                </div>
                <div className="mt-1 text-lg sm:text-xl font-black font-mono text-cyan-300">
                  +{activeOrder.thermoBoxTempC.toFixed(1)}°C
                </div>
                <div className="mt-0.5 text-[11px] text-emerald-400">
                  {isHy ? 'Կապարակնքված է 1C պահեստում' : 'Пломба 1С • Свежесть 100%'}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>{isHy ? 'Պատվերի գումար և 10% ֆոնդ' : 'Сумма и 10% Депозит'}</span>
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="mt-1 text-lg sm:text-xl font-black font-mono text-emerald-400">
                  {formatDram(activeOrder.totalOrderDram)}
                </div>
                <div className="mt-0.5 text-[11px] text-slate-400">
                  {activeOrder.feeDram === 0
                    ? isHy
                      ? 'Անվճար առաքում Երևանում'
                      : 'Бесплатная доставка по Еревану'
                    : `${isHy ? 'Առաքում՝' : 'Доставка:'} ${formatDram(activeOrder.feeDram)}`}
                </div>
              </div>
            </div>

            {/* ИНТЕРАКТИВНАЯ ОНЛАЙН GPS-КАРТА ЕРЕВАНА */}
            <div className="rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden shadow-xl">
              <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-slate-900/90 border-b border-slate-800">
                <div className="flex items-center gap-2 text-xs">
                  <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                  <span className="font-bold text-white">
                    {isHy ? 'Երևանի GPS Քարտեզ (Առցանց Ռադար)' : 'Интерактивная GPS-карта маршрута по г. Ереван'}
                  </span>
                  <span className="text-slate-400 font-mono">
                    • {activeOrder.orderNumber} ({activeOrder.progressPercent}%)
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[11px]">
                  <span className="flex items-center gap-1 text-amber-300">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
                    {isHy ? '1C Պահեստ' : 'Склад 1С'}
                  </span>
                  <span className="flex items-center gap-1 text-sky-300">
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-400 inline-block" />
                    {isHy ? 'Առաքիչ (GPS)' : 'Курьер (LIVE)'}
                  </span>
                  <span className="flex items-center gap-1 text-emerald-300">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />
                    {isHy ? 'Հաճախորդի հասցե' : 'Адрес клиента'}
                  </span>
                </div>
              </div>

              <div className="relative w-full h-72 sm:h-80 bg-[#07111e] overflow-hidden select-none">
                <svg
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                  className="w-full h-full"
                  aria-label="Yerevan Live GPS Map"
                >
                  <defs>
                    <pattern id="yerevanGrid" width="10" height="10" patternUnits="userSpaceOnUse">
                      <path
                        d="M 10 0 L 0 0 0 10"
                        fill="none"
                        stroke="rgba(56, 189, 248, 0.07)"
                        strokeWidth="0.3"
                      />
                    </pattern>
                    <linearGradient id="routeActiveGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#f59e0b" />
                      <stop offset="50%" stopColor="#38bdf8" />
                      <stop offset="100%" stopColor="#10b981" />
                    </linearGradient>
                  </defs>

                  {/* Координатная сетка */}
                  <rect width="100" height="100" fill="url(#yerevanGrid)" />

                  {/* Река Раздан (Разданское ущелье) */}
                  <path
                    d="M 32 0 Q 38 28, 35 50 T 30 100"
                    fill="none"
                    stroke="rgba(14, 165, 233, 0.18)"
                    strokeWidth="2.4"
                  />

                  {/* Кольцевые и радиальные проспекты Еревана */}
                  <circle
                    cx="52"
                    cy="50"
                    r="14"
                    fill="none"
                    stroke="rgba(148, 163, 184, 0.14)"
                    strokeWidth="0.8"
                  />
                  <circle
                    cx="52"
                    cy="50"
                    r="28"
                    fill="none"
                    stroke="rgba(148, 163, 184, 0.1)"
                    strokeWidth="0.6"
                    strokeDasharray="2 2"
                  />
                  <path
                    d="M 20 62 L 52 50 L 78 32 M 44 78 L 52 50 L 46 26 M 24 34 L 52 50 L 66 74"
                    fill="none"
                    stroke="rgba(148, 163, 184, 0.14)"
                    strokeWidth="0.7"
                  />

                  {/* Узлы административных районов Еревана */}
                  {YEREVAN_DISTRICTS.map((dist) => (
                    <g key={dist.id}>
                      <circle
                        cx={dist.x}
                        cy={dist.y}
                        r="1.1"
                        fill="rgba(148, 163, 184, 0.35)"
                      />
                      <text
                        x={dist.x + 1.8}
                        y={dist.y + 0.8}
                        fill="rgba(148, 163, 184, 0.55)"
                        fontSize="2.7"
                        fontWeight="600"
                      >
                        {isHy ? dist.nameHy.split(' ')[0] : dist.nameRu.split(' ')[0]}
                      </text>
                    </g>
                  ))}

                  {/* Полная траектория маршрута (пунктир) */}
                  <path
                    d={`M ${activeOrder.warehouseOrigin.x} ${activeOrder.warehouseOrigin.y} Q ${livePos.controlPoint.x} ${livePos.controlPoint.y} ${activeOrder.destinationCoords.x} ${activeOrder.destinationCoords.y}`}
                    fill="none"
                    stroke="rgba(56, 189, 248, 0.28)"
                    strokeWidth="1.2"
                    strokeDasharray="2.2 1.8"
                  />

                  {/* Пройденный участок маршрута от Склада 1С до текущей точки курьера */}
                  <line
                    x1={activeOrder.warehouseOrigin.x}
                    y1={activeOrder.warehouseOrigin.y}
                    x2={livePos.x}
                    y2={livePos.y}
                    stroke="url(#routeActiveGrad)"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />

                  {/* Маркер Склада 1С (Точка отправления) */}
                  <g transform={`translate(${activeOrder.warehouseOrigin.x}, ${activeOrder.warehouseOrigin.y})`}>
                    <circle r="3.2" fill="rgba(245, 158, 11, 0.25)" />
                    <circle r="1.8" fill="#f59e0b" stroke="#0f172a" strokeWidth="0.6" />
                  </g>

                  {/* Маркер Адреса клиента (Точка назначения) */}
                  <g transform={`translate(${activeOrder.destinationCoords.x}, ${activeOrder.destinationCoords.y})`}>
                    <circle r="4.2" fill="rgba(16, 185, 129, 0.22)" />
                    <circle r="2.2" fill="#10b981" stroke="#0f172a" strokeWidth="0.6" />
                  </g>

                  {/* ЖИВОЙ МАРКЕР КУРЬЕРА НА КАРТЕ */}
                  <g transform={`translate(${livePos.x}, ${livePos.y})`}>
                    <circle r="5.5" fill="rgba(56, 189, 248, 0.2)" />
                    <circle r="2.6" fill="#38bdf8" stroke="#ffffff" strokeWidth="0.8" />
                  </g>
                </svg>

                {/* Плавающая плашка курьера поверх карты */}
                <div
                  className="absolute pointer-events-none transition-all duration-500"
                  style={{
                    left: `${Math.min(82, Math.max(12, livePos.x))}%`,
                    top: `${Math.min(82, Math.max(14, livePos.y))}%`,
                    transform: 'translate(-50%, -125%)',
                  }}
                >
                  <div className="px-2.5 py-1 rounded-lg bg-slate-950/95 border border-sky-400/70 shadow-lg text-[10px] whitespace-nowrap flex items-center gap-1.5">
                    <Navigation className="w-3 h-3 text-sky-400" />
                    <span className="font-bold text-white">
                      {isHy ? activeOrder.courier.nameHy : activeOrder.courier.nameRu}
                    </span>
                    <span className="font-mono text-sky-300 font-bold">
                      {activeOrder.courier.plateNumber}
                    </span>
                  </div>
                </div>

                {/* Нижний оверлей координат на карте */}
                <div className="absolute bottom-2.5 left-3 right-3 flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-xl bg-slate-950/90 border border-slate-800/90 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <Building2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="text-slate-400 truncate">
                      {isHy ? activeOrder.warehouseOrigin.nameHy : activeOrder.warehouseOrigin.nameRu}
                    </span>
                    <span className="text-slate-600">➔</span>
                    <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="font-bold text-white truncate">{activeOrder.address}</span>
                  </div>
                  <div className="font-mono text-[11px] text-sky-300 font-bold">
                    GPS: {(40.15 + (100 - livePos.y) * 0.0012).toFixed(4)}°N,{' '}
                    {(44.48 + livePos.x * 0.0012).toFixed(4)}°E
                  </div>
                </div>
              </div>
            </div>

            {/* 5-СТУПЕНЧАТАЯ ШКАЛА ЭТАПОВ ДОСТАВКИ В РЕАЛЬНОМ ВРЕМЕНИ */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <Compass className="w-4 h-4 text-emerald-400" />
                  <span>
                    {isHy ? 'Առաքման փուլերը իրական ժամանակում' : 'Этапы выполнения доставки в реальном времени'}
                  </span>
                </h3>
                {isAdmin && (
                  <div className="flex items-center gap-1 flex-wrap">
                    <span className="text-[10px] text-amber-300 font-mono mr-1">
                      {isHy ? 'Դիսպետչեր՝' : 'Диспетчер 1С:'}
                    </span>
                    {STAGE_ORDER.map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => onUpdateStage(activeOrder.id, st)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
                          activeOrder.stage === st
                            ? 'bg-emerald-600 text-white border-emerald-400'
                            : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700'
                        }`}
                      >
                        {isHy ? STAGE_LABELS[st].hy.split(' ')[0] : STAGE_LABELS[st].ru.split(' ')[0]}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                {STAGE_ORDER.map((stageKey, index) => {
                  const isCompleted = index <= currentStageIdx;
                  const isCurrent = index === currentStageIdx;
                  const info = STAGE_LABELS[stageKey];
                  const timestamp = activeOrder.stageTimestamps[stageKey];

                  return (
                    <div
                      key={stageKey}
                      onClick={() => onUpdateStage(activeOrder.id, stageKey)}
                      className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                        isCurrent
                          ? 'bg-sky-950/50 border-sky-500/70 shadow-md'
                          : isCompleted
                          ? 'bg-emerald-950/25 border-emerald-500/40'
                          : 'bg-slate-900/50 border-slate-800/80 opacity-60'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span
                          className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center ${
                            isCompleted
                              ? 'bg-emerald-500 text-slate-950'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {isCompleted ? <Check className="w-3 h-3" /> : index + 1}
                        </span>
                        {timestamp && (
                          <span className="text-[10px] font-mono text-emerald-400">
                            {timestamp}
                          </span>
                        )}
                      </div>
                      <div className="mt-1.5 text-xs font-bold text-white leading-snug">
                        {isHy ? info.hy : info.ru}
                      </div>
                      <div className="mt-0.5 text-[10px] text-slate-400 leading-tight">
                        {isHy ? info.descHy : info.descRu}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* НИЖНИЙ РЯД: КАРТОЧКА КУРЬЕРА + ПАРАМЕТРЫ ДОСТАВКИ И PIN + ОНЛАЙН-ЧАТ С КУРЬЕРОМ */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* ЛЕВЫЙ БЛОК (7 КОЛОНОК): КУРЬЕР, СОСТАВ ЗАКАЗА, АДРЕС И ПОДТВЕРЖДЕНИЕ ПО PIN */}
              <div className="lg:col-span-7 space-y-4">
                {/* Карточка курьера */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-sky-500/15 border border-sky-500/40 flex items-center justify-center text-sky-300 font-black text-base shrink-0">
                      {(isHy ? activeOrder.courier.nameHy : activeOrder.courier.nameRu).charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-white">
                          {isHy ? activeOrder.courier.nameHy : activeOrder.courier.nameRu}
                        </h4>
                        <span className="px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-mono font-bold">
                          ★ {activeOrder.courier.rating} ({activeOrder.courier.completedDeliveries})
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {isHy ? activeOrder.courier.vehicleHy : activeOrder.courier.vehicleRu} •{' '}
                        <span className="font-mono text-sky-300 font-bold">
                          {activeOrder.courier.plateNumber}
                        </span>
                      </div>
                    </div>
                  </div>

                  <a
                    href={`tel:${activeOrder.courier.phone}`}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>{activeOrder.courier.phone}</span>
                  </a>
                </div>

                {/* Управление адресом, бесконтактной доставкой и PIN-подтверждением */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-emerald-400" />
                      <span>{isHy ? 'Առաքման հասցե և հրահանգներ' : 'Адрес доставки и параметры вручения'}</span>
                    </h4>
                    <button
                      type="button"
                      onClick={() => {
                        setEditAddressVal(activeOrder.address);
                        setEditNotesVal(activeOrder.entranceNotes);
                        setIsEditingAddress((prev) => !prev);
                      }}
                      className="inline-flex items-center gap-1 text-xs text-sky-400 hover:text-sky-300 font-semibold cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>{isHy ? 'Փոխել հասցեն' : 'Изменить адрес / домофон'}</span>
                    </button>
                  </div>

                  {isEditingAddress ? (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (!editAddressVal.trim()) return;
                        onUpdateDeliveryDetails(activeOrder.id, {
                          address: editAddressVal.trim(),
                          entranceNotes: editNotesVal.trim(),
                        });
                        setIsEditingAddress(false);
                      }}
                      className="space-y-2 pt-1"
                    >
                      <input
                        type="text"
                        value={editAddressVal}
                        onChange={(e) => setEditAddressVal(e.target.value)}
                        placeholder={isHy ? 'Առաքման հասցե' : 'Адрес доставки'}
                        className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                      />
                      <input
                        type="text"
                        value={editNotesVal}
                        onChange={(e) => setEditNotesVal(e.target.value)}
                        placeholder={isHy ? 'Մուտք, հարկ, դոմոֆոն' : 'Подъезд, этаж, код домофона'}
                        className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setIsEditingAddress(false)}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold cursor-pointer"
                        >
                          {isHy ? 'Չեղարկել' : 'Отмена'}
                        </button>
                        <button
                          type="submit"
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold cursor-pointer"
                        >
                          {isHy ? 'Պահպանել' : 'Сохранить адрес'}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="text-xs space-y-1">
                      <div className="font-semibold text-slate-100">{activeOrder.address}</div>
                      <div className="text-slate-400">{activeOrder.entranceNotes}</div>
                    </div>
                  )}

                  {/* Переключатель бесконтактной доставки */}
                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
                    <span className="text-xs text-slate-300">
                      {isHy
                        ? 'Անհպում առաքում (թողնել դռան մոտ)'
                        : 'Бесконтактная доставка (оставить у двери с фото)'}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateDeliveryDetails(activeOrder.id, {
                          contactless: !activeOrder.contactless,
                        })
                      }
                      className={`px-3 py-1 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                        activeOrder.contactless
                          ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                          : 'bg-slate-900 text-slate-400 border-slate-700'
                      }`}
                    >
                      {activeOrder.contactless
                        ? isHy
                          ? 'ՄԻԱՑՎԱԾ Է'
                          : 'ВКЛЮЧЕНА'
                        : isHy
                        ? 'ԱՆՋԱՏՎԱԾ Է'
                        : 'ВЫКЛЮЧЕНА'}
                    </button>
                  </div>

                  {/* Состав заказа */}
                  <div className="pt-2 border-t border-slate-800 space-y-1.5">
                    <div className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5 text-amber-400" />
                      <span>{isHy ? 'Պատվերի պարունակությունը' : 'Состав отправления (проверено 1С):'}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {activeOrder.itemsSummary.map((item, i) => (
                        <span
                          key={i}
                          className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-200"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Подтверждение получения по PIN-коду */}
                  {activeOrder.stage !== 'delivered' && activeOrder.stage !== 'cancelled' && (
                    <form
                      onSubmit={handleConfirmByPin}
                      className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          maxLength={4}
                          value={pinInput}
                          onChange={(e) => setPinInput(e.target.value)}
                          placeholder={`PIN (${activeOrder.verificationPin})`}
                          className="w-28 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono text-amber-300"
                        />
                        <button
                          type="submit"
                          className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer"
                        >
                          {isHy ? 'Հաստատել ստացումը (PIN)' : 'Подтвердить получение по PIN'}
                        </button>
                      </div>
                      {pinFeedback && (
                        <span className="text-xs text-emerald-300 font-semibold">{pinFeedback}</span>
                      )}
                    </form>
                  )}
                </div>
              </div>

              {/* ПРАВЫЙ БЛОК (5 КОЛОНОК): ОНЛАЙН-ЧАТ С КУРЬЕРОМ В РЕАЛЬНОМ ВРЕМЕНИ */}
              <div className="lg:col-span-5 p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
                    <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-sky-400" />
                      <span>{isHy ? 'Ուղիղ չաթ առաքիչի հետ' : 'Онлайн-чат с курьером'}</span>
                    </h4>
                    <span className="text-[10px] font-mono text-emerald-400">● ONLINE</span>
                  </div>

                  {/* Быстрые подсказки */}
                  <div className="flex flex-wrap gap-1.5 py-2">
                    {(isHy
                      ? ['Թողեք դռան մոտ', 'Զանգեք 5 րոպե առաջ', 'Որտե՞ղ եք հիմա']
                      : ['Оставьте у двери', 'Позвоните за 5 минут', 'Где вы сейчас?']
                    ).map((quickText) => (
                      <button
                        key={quickText}
                        type="button"
                        onClick={() => handleSendChat(quickText)}
                        className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-[11px] text-sky-300 font-medium cursor-pointer"
                      >
                        {quickText}
                      </button>
                    ))}
                  </div>

                  {/* Лента сообщений */}
                  <div className="space-y-2 max-h-52 overflow-y-auto pr-1 py-1">
                    {activeOrder.chatMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`p-2.5 rounded-xl text-xs ${
                          msg.sender === 'customer'
                            ? 'bg-sky-600/25 border border-sky-500/40 text-white ml-6'
                            : msg.sender === 'courier'
                            ? 'bg-slate-900 border border-slate-800 text-slate-200 mr-6'
                            : 'bg-emerald-950/30 border border-emerald-500/30 text-emerald-200 text-[11px]'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[10px] text-slate-400 mb-0.5">
                          <span className="font-bold">
                            {msg.sender === 'customer'
                              ? isHy
                                ? 'Դուք'
                                : 'Вы (Клиент)'
                              : msg.sender === 'courier'
                              ? isHy
                                ? activeOrder.courier.nameHy
                                : activeOrder.courier.nameRu
                              : '1C & GPS Система'}
                          </span>
                          <span className="font-mono">{msg.time}</span>
                        </div>
                        <div>{msg.text}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Поле отправки сообщения курьеру */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendChat();
                  }}
                  className="flex items-center gap-2 pt-2 border-t border-slate-800"
                >
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder={
                      isHy
                        ? 'Գրել հաղորդագրություն առաքիչին...'
                        : 'Написать курьеру (домофон, ориентир)...'
                    }
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:border-sky-500 focus:outline-none"
                  />
                  <button
                    type="submit"
                    aria-label={isHy ? 'Ուղարկել' : 'Отправить сообщение курьеру'}
                    className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

interface LiveDeliveryBannerProps {
  deliveries: DeliveryOrder[];
  lang: Language;
  onOpenTracker: (orderNumber?: string) => void;
}

export const LiveDeliveryBanner: React.FC<LiveDeliveryBannerProps> = ({
  deliveries,
  lang,
  onOpenTracker,
}) => {
  const isHy = lang === 'hy';
  const activeDeliveries = deliveries.filter(
    (d) => d.stage !== 'delivered' && d.stage !== 'cancelled'
  );
  const primary = activeDeliveries[0];

  if (!primary) return null;

  const stInfo = STAGE_LABELS[primary.stage];

  return (
    <div className="w-full mb-4 p-3 sm:p-3.5 rounded-2xl bg-gradient-to-r from-slate-900 via-sky-950/60 to-slate-900 border border-sky-500/40 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <div className="relative p-2.5 rounded-xl bg-sky-500/15 border border-sky-500/40 text-sky-400 shrink-0">
          <Truck className="w-5 h-5" />
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping absolute -top-0.5 -right-0.5" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30 text-[10px] font-mono font-bold">
              GPS LIVE • {primary.orderNumber}
            </span>
            <span className="text-xs font-bold text-white">
              {isHy ? stInfo.hy : stInfo.ru} ({primary.progressPercent}%)
            </span>
            <span className="text-xs text-emerald-400 font-mono font-bold">
              ~{primary.etaMinutes} {isHy ? 'րոպե' : 'мин'}
            </span>
          </div>
          <p className="text-xs text-slate-300 truncate mt-0.5">
            {isHy ? primary.courier.nameHy : primary.courier.nameRu} ({primary.courier.plateNumber}) ➔{' '}
            <span className="text-white font-medium">{primary.address}</span> • PIN:{' '}
            <span className="font-mono font-bold text-amber-300">{primary.verificationPin}</span>
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0">
        {activeDeliveries.length > 1 && (
          <span className="text-[11px] text-slate-400 font-mono">
            +{activeDeliveries.length - 1} {isHy ? 'առաքում' : 'в пути'}
          </span>
        )}
        <button
          type="button"
          onClick={() => onOpenTracker(primary.orderNumber)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-md shadow-sky-900/50 transition-all cursor-pointer whitespace-nowrap"
        >
          <MapPin className="w-3.5 h-3.5" />
          <span>{isHy ? 'Հետևել քարտեզով (GPS)' : 'Отследить на карте (GPS)'}</span>
        </button>
      </div>
    </div>
  );
};
