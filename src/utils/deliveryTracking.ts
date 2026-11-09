import { Language } from '../types';

export type DeliveryStage =
  | 'accepted'
  | 'packing'
  | 'courier_assigned'
  | 'in_transit'
  | 'arriving'
  | 'delivered'
  | 'cancelled';

export interface CourierInfo {
  id: string;
  nameHy: string;
  nameRu: string;
  phone: string;
  vehicleHy: string;
  vehicleRu: string;
  plateNumber: string;
  rating: number;
  completedDeliveries: number;
}

export interface DeliveryChatMessage {
  id: string;
  sender: 'customer' | 'courier' | 'system';
  text: string;
  time: string;
}

export interface DeliveryOrder {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  address: string;
  districtHy: string;
  districtRu: string;
  entranceNotes: string;
  contactless: boolean;
  stage: DeliveryStage;
  progressPercent: number; // 0..100
  totalDistanceKm: number;
  distanceKm: number;
  etaMinutes: number;
  speedKmh: number;
  thermoBoxTempC: number;
  verificationPin: string;
  feeDram: number;
  totalOrderDram: number;
  itemsSummary: string[];
  courier: CourierInfo;
  warehouseOrigin: {
    nameHy: string;
    nameRu: string;
    x: number;
    y: number;
  };
  destinationCoords: {
    x: number;
    y: number;
  };
  createdAt: string;
  updatedAt: string;
  stageTimestamps: Partial<Record<DeliveryStage, string>>;
  chatMessages: DeliveryChatMessage[];
}

export const STAGE_PROGRESS_MAP: Record<DeliveryStage, number> = {
  accepted: 10,
  packing: 25,
  courier_assigned: 42,
  in_transit: 68,
  arriving: 92,
  delivered: 100,
  cancelled: 0,
};

export const STAGE_ORDER: DeliveryStage[] = [
  'accepted',
  'packing',
  'courier_assigned',
  'in_transit',
  'arriving',
  'delivered',
];

export const DEFAULT_COURIERS: CourierInfo[] = [
  {
    id: 'cour_1',
    nameHy: 'Կարեն Հակոբյան',
    nameRu: 'Карен Акопян',
    phone: '+374 91 44-55-11',
    vehicleHy: 'Էլեկտրական ֆուրգոն BYD T3 (Սառնարանային)',
    vehicleRu: 'Электрофургон BYD T3 (Термобокс)',
    plateNumber: '34 AM 200',
    rating: 4.96,
    completedDeliveries: 1420,
  },
  {
    id: 'cour_2',
    nameHy: 'Դավիթ Սարգսյան',
    nameRu: 'Давид Саргсян',
    phone: '+374 93 77-88-22',
    vehicleHy: 'Արագընթաց սกուտեր NIU Cargo',
    vehicleRu: 'Скоростной электроскутер NIU Cargo',
    plateNumber: '01 OO 777',
    rating: 4.92,
    completedDeliveries: 985,
  },
  {
    id: 'cour_3',
    nameHy: 'Հայկ Պետրոսյան',
    nameRu: 'Айк Петросян',
    phone: '+374 94 22-33-99',
    vehicleHy: 'Բեռնատար Ford Transit (Շինանյութ և Մեծածախ)',
    vehicleRu: 'Грузовой Ford Transit (Стройматериалы и Опт)',
    plateNumber: '88 SS 800',
    rating: 4.98,
    completedDeliveries: 2150,
  },
];

export const YEREVAN_DISTRICTS: Array<{
  id: string;
  nameHy: string;
  nameRu: string;
  x: number;
  y: number;
  distanceKm: number;
}> = [
  { id: 'kentron', nameHy: 'Կենտրոն', nameRu: 'Кентрон (Центр)', x: 52, y: 50, distanceKm: 3.4 },
  { id: 'arabkir', nameHy: 'Արաբկիր (Կոմիտաս)', nameRu: 'Арабкир (пр. Комитаса)', x: 46, y: 26, distanceKm: 5.8 },
  { id: 'ajapnyak', nameHy: 'Աջափնյակ', nameRu: 'Ачапняк', x: 24, y: 34, distanceKm: 6.5 },
  { id: 'davtashen', nameHy: 'Դավթաշեն', nameRu: 'Давташен', x: 28, y: 16, distanceKm: 8.2 },
  { id: 'nor_nork', nameHy: 'Նոր Նորք', nameRu: 'Нор-Норк', x: 78, y: 32, distanceKm: 7.4 },
  { id: 'avan', nameHy: 'Ավան', nameRu: 'Аван', x: 74, y: 18, distanceKm: 8.9 },
  { id: 'erebuni', nameHy: 'Էրեբունի', nameRu: 'Эребуни', x: 66, y: 74, distanceKm: 4.1 },
  { id: 'shengavit', nameHy: 'Շենգավիթ', nameRu: 'Шенгавит (Склад 1С)', x: 44, y: 78, distanceKm: 2.2 },
  { id: 'malatia', nameHy: 'Մալաթիա-Սեբաստիա', nameRu: 'Малатия-Себастия', x: 20, y: 62, distanceKm: 5.3 },
];

export const INITIAL_LIVE_DELIVERIES: DeliveryOrder[] = [
  {
    id: 'del_live_1',
    orderNumber: 'ORD-88412',
    customerId: 'usr_araik',
    customerName: 'Արայիկ Պետրոսյան / Араик Петросян',
    customerPhone: '+374 91 123456',
    address: 'Ереван, пр. Комитаса 44, кв. 18',
    districtHy: 'Արաբկիր (Կոմիտաս)',
    districtRu: 'Арабкир (пр. Комитаса)',
    entranceNotes: 'Подъезд 2, этаж 4, домофон 18#',
    contactless: false,
    stage: 'in_transit',
    progressPercent: 68,
    totalDistanceKm: 5.8,
    distanceKm: 1.9,
    etaMinutes: 6,
    speedKmh: 44,
    thermoBoxTempC: 4.1,
    verificationPin: '4820',
    feeDram: 0,
    totalOrderDram: 14850,
    itemsSummary: [
      'Хлеб пшеничный (свежий) × 2',
      'Молоко коровье 1л (3.2%) × 2',
      'Сливочное масло 82.5% × 3',
      'Оливковое масло Extra Virgin 500мл × 2',
    ],
    courier: DEFAULT_COURIERS[0],
    warehouseOrigin: {
      nameHy: '1C Կենտրոնական Պահեստ (Արշակունյաց 34)',
      nameRu: 'Центральный склад 1С (пр. Аршакуняц 34)',
      x: 44,
      y: 78,
    },
    destinationCoords: {
      x: 46,
      y: 26,
    },
    createdAt: '11:15',
    updatedAt: '11:28',
    stageTimestamps: {
      accepted: '11:15',
      packing: '11:18',
      courier_assigned: '11:22',
      in_transit: '11:25',
    },
    chatMessages: [
      {
        id: 'msg_1',
        sender: 'system',
        text: 'Заказ собран на Центральном складе 1С и помещен в пломбированный термобокс (+4.1°C).',
        time: '11:20',
      },
      {
        id: 'msg_2',
        sender: 'courier',
        text: 'Здравствуйте! Я курьер Карен. Выехал по проспекту Комитаса, буду у вас примерно через 6 минут.',
        time: '11:26',
      },
    ],
  },
  {
    id: 'del_live_2',
    orderNumber: 'ORD-88419',
    customerId: 'cust_2',
    customerName: 'Անահիտ Ղազարյան / Анаит Казарян',
    customerPhone: '+374 93 456789',
    address: 'Ереван, ул. Абовяна 18, офис 5',
    districtHy: 'Կենտրոն',
    districtRu: 'Кентрон (Центр)',
    entranceNotes: 'Вход со двора, стеклянная дверь',
    contactless: true,
    stage: 'arriving',
    progressPercent: 92,
    totalDistanceKm: 3.4,
    distanceKm: 0.3,
    etaMinutes: 2,
    speedKmh: 28,
    thermoBoxTempC: 3.8,
    verificationPin: '7194',
    feeDram: 0,
    totalOrderDram: 22400,
    itemsSummary: [
      'Сыр Лори домашний × 2',
      'Клей ПВА Extra-Heavy D3 1кг × 2',
      'Шуруповерт аккумуляторный 18V × 1',
    ],
    courier: DEFAULT_COURIERS[1],
    warehouseOrigin: {
      nameHy: '1C Կենտրոնական Պահեստ (Արշակունյաց 34)',
      nameRu: 'Центральный склад 1С (пр. Аршакуняц 34)',
      x: 44,
      y: 78,
    },
    destinationCoords: {
      x: 52,
      y: 50,
    },
    createdAt: '11:02',
    updatedAt: '11:29',
    stageTimestamps: {
      accepted: '11:02',
      packing: '11:06',
      courier_assigned: '11:12',
      in_transit: '11:16',
      arriving: '11:28',
    },
    chatMessages: [
      {
        id: 'msg_201',
        sender: 'courier',
        text: 'Подъезжаю к ул. Абовяна 18, паркуюсь у арки.',
        time: '11:28',
      },
    ],
  },
  {
    id: 'del_live_3',
    orderNumber: 'ORD-88390',
    customerId: 'cust_3',
    customerName: 'Տիգրան Հակոբյան / Тигран Акопян',
    customerPhone: '+374 94 987654',
    address: 'Ереван, Нор-Норк 2-й массив, д. 12',
    districtHy: 'Նոր Նորք',
    districtRu: 'Нор-Норк',
    entranceNotes: 'Домофон 12, 3 этаж',
    contactless: false,
    stage: 'delivered',
    progressPercent: 100,
    totalDistanceKm: 7.4,
    distanceKm: 0,
    etaMinutes: 0,
    speedKmh: 0,
    thermoBoxTempC: 4.0,
    verificationPin: '5510',
    feeDram: 0,
    totalOrderDram: 18500,
    itemsSummary: [
      'Монтажный клей SuperFix «Жидкие гвозди» × 4',
      'Саморезы по дереву 3.5x35мм × 3',
      'Шпаклевка акриловая 1кг × 2',
    ],
    courier: DEFAULT_COURIERS[2],
    warehouseOrigin: {
      nameHy: '1C Կենտրոնական Պահեստ (Արշակունյաց 34)',
      nameRu: 'Центральный склад 1С (пр. Аршакуняц 34)',
      x: 44,
      y: 78,
    },
    destinationCoords: {
      x: 78,
      y: 32,
    },
    createdAt: '10:10',
    updatedAt: '10:48',
    stageTimestamps: {
      accepted: '10:10',
      packing: '10:15',
      courier_assigned: '10:20',
      in_transit: '10:24',
      arriving: '10:45',
      delivered: '10:48',
    },
    chatMessages: [
      {
        id: 'msg_301',
        sender: 'system',
        text: 'Заказ успешно вручен клиенту по PIN-коду 5510. Начисление 10% депозита активировано.',
        time: '10:48',
      },
    ],
  },
];

/**
 * Вычисляет текущие координаты курьера на карте Еревана (0..100) по кривой Безье (имитация дорожной сети через центр)
 * и угол поворота иконки транспорта.
 */
export function computeCourierLivePosition(
  origin: { x: number; y: number },
  destination: { x: number; y: number },
  progressPercent: number
): {
  x: number;
  y: number;
  controlPoint: { x: number; y: number };
  angleDeg: number;
} {
  const clamped = Math.max(0, Math.min(100, progressPercent));
  const t = clamped / 100;

  // Контрольная точка через транспортный узел Кентрон (x: 50, y: 54) для реалистичного изгиба маршрута по проспектам
  const controlPoint = {
    x: Number(((origin.x + destination.x) / 2 + (destination.y < origin.y ? 6 : -4)).toFixed(2)),
    y: Number(((origin.y + destination.y) / 2).toFixed(2)),
  };

  // Квадратичная кривая Безье: B(t) = (1-t)^2 * P0 + 2(1-t)t * P1 + t^2 * P2
  const oneMinusT = 1 - t;
  const x = Number(
    (
      oneMinusT * oneMinusT * origin.x +
      2 * oneMinusT * t * controlPoint.x +
      t * t * destination.x
    ).toFixed(2)
  );
  const y = Number(
    (
      oneMinusT * oneMinusT * origin.y +
      2 * oneMinusT * t * controlPoint.y +
      t * t * destination.y
    ).toFixed(2)
  );

  // Касательный вектор dB/dt для угла направления движения
  const dx = 2 * oneMinusT * (controlPoint.x - origin.x) + 2 * t * (destination.x - controlPoint.x);
  const dy = 2 * oneMinusT * (controlPoint.y - origin.y) + 2 * t * (destination.y - controlPoint.y);
  const angleDeg = Number(((Math.atan2(dy, dx) * 180) / Math.PI).toFixed(1));

  return { x, y, controlPoint, angleDeg };
}

/**
 * Вычисляет оставшееся расстояние (км), расчетное время прибытия (мин) и текущую скорость курьера.
 */
export function calculateRemainingMetrics(
  totalDistanceKm: number,
  progressPercent: number,
  stage: DeliveryStage
): {
  remainingKm: number;
  etaMinutes: number;
  speedKmh: number;
} {
  if (stage === 'delivered' || stage === 'cancelled' || progressPercent >= 100) {
    return { remainingKm: 0, etaMinutes: 0, speedKmh: 0 };
  }

  const clamped = Math.max(0, Math.min(99, progressPercent));
  const remainingRatio = (100 - clamped) / 100;
  const remainingKm = Number(Math.max(0.1, totalDistanceKm * remainingRatio).toFixed(1));

  let speedKmh = 0;
  if (stage === 'in_transit') {
    speedKmh = 42;
  } else if (stage === 'arriving') {
    speedKmh = 24;
  } else if (stage === 'courier_assigned') {
    speedKmh = 18;
  }

  // Время на сборку + время в пути
  const prepMinutes = stage === 'accepted' ? 8 : stage === 'packing' ? 5 : stage === 'courier_assigned' ? 3 : 0;
  const driveMinutes = Math.ceil((remainingKm / 36) * 60);
  const etaMinutes = Math.max(1, prepMinutes + driveMinutes);

  return {
    remainingKm,
    etaMinutes,
    speedKmh,
  };
}

/**
 * Определяет стадию доставки по проценту прогресса (0..100).
 */
export function resolveStageFromProgress(progressPercent: number, currentStage: DeliveryStage): DeliveryStage {
  if (currentStage === 'cancelled') return 'cancelled';
  if (progressPercent >= 100) return 'delivered';
  if (progressPercent >= 88) return 'arriving';
  if (progressPercent >= 45) return 'in_transit';
  if (progressPercent >= 30) return 'courier_assigned';
  if (progressPercent >= 15) return 'packing';
  return 'accepted';
}

/**
 * Продвигает доставку вперед на заданный шаг прогресса (для живой GPS-симуляции в реальном времени).
 */
export function advanceDeliveryTick(
  order: DeliveryOrder,
  stepPercent: number = 4,
  nowTimeStr?: string
): DeliveryOrder {
  if (order.stage === 'delivered' || order.stage === 'cancelled') {
    return order;
  }

  const timeLabel =
    nowTimeStr || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const nextProgress = Math.min(100, order.progressPercent + Math.max(1, stepPercent));
  const nextStage = resolveStageFromProgress(nextProgress, order.stage);
  const metrics = calculateRemainingMetrics(order.totalDistanceKm, nextProgress, nextStage);

  const nextTimestamps = { ...order.stageTimestamps };
  if (!nextTimestamps[nextStage]) {
    nextTimestamps[nextStage] = timeLabel;
  }

  return {
    ...order,
    progressPercent: nextProgress,
    stage: nextStage,
    distanceKm: metrics.remainingKm,
    etaMinutes: metrics.etaMinutes,
    speedKmh: metrics.speedKmh,
    updatedAt: timeLabel,
    stageTimestamps: nextTimestamps,
  };
}

/**
 * Принудительно устанавливает стадию доставки (например, из панели диспетчера / админа).
 */
export function updateDeliveryStage(
  order: DeliveryOrder,
  nextStage: DeliveryStage,
  nowTimeStr?: string
): DeliveryOrder {
  const timeLabel =
    nowTimeStr || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const nextProgress = STAGE_PROGRESS_MAP[nextStage];
  const metrics = calculateRemainingMetrics(order.totalDistanceKm, nextProgress, nextStage);

  const nextTimestamps = { ...order.stageTimestamps, [nextStage]: timeLabel };

  return {
    ...order,
    stage: nextStage,
    progressPercent: nextProgress,
    distanceKm: metrics.remainingKm,
    etaMinutes: metrics.etaMinutes,
    speedKmh: metrics.speedKmh,
    updatedAt: timeLabel,
    stageTimestamps: nextTimestamps,
  };
}

/**
 * Создает новый заказ доставки при покупке в магазине или из диспетчерской админ-панели.
 */
export function createDeliveryFromPurchase(params: {
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerPhone?: string;
  address?: string;
  entranceNotes?: string;
  contactless?: boolean;
  totalOrderDram: number;
  itemsSummary: string[];
  feeDram?: number;
  courierIndex?: number;
  nowTimeStr?: string;
}): DeliveryOrder {
  const timeLabel =
    params.nowTimeStr || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const addressText = params.address?.trim() || 'Ереван, пр. Комитаса 44';
  const lowerAddr = addressText.toLowerCase();

  const matchedDistrict =
    YEREVAN_DISTRICTS.find(
      (d) =>
        lowerAddr.includes(d.nameRu.toLowerCase().split(' ')[0]) ||
        lowerAddr.includes(d.nameHy.toLowerCase().split(' ')[0])
    ) || YEREVAN_DISTRICTS[1]; // По умолчанию Арабкир

  const courier =
    DEFAULT_COURIERS[
      params.courierIndex !== undefined
        ? params.courierIndex % DEFAULT_COURIERS.length
        : Math.abs(params.orderNumber.length) % DEFAULT_COURIERS.length
    ];

  const initialProgress = 32; // Сразу стадия назначения курьера / выезда со склада
  const initialStage: DeliveryStage = 'courier_assigned';
  const metrics = calculateRemainingMetrics(matchedDistrict.distanceKm, initialProgress, initialStage);
  const pin = String(1000 + ((params.totalOrderDram + 482) % 8999)).padStart(4, '0');

  return {
    id: `del_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    orderNumber: params.orderNumber,
    customerId: params.customerId,
    customerName: params.customerName,
    customerPhone: params.customerPhone || '+374 91 123456',
    address: addressText,
    districtHy: matchedDistrict.nameHy,
    districtRu: matchedDistrict.nameRu,
    entranceNotes: params.entranceNotes || 'Позвонить по прибытии',
    contactless: Boolean(params.contactless),
    stage: initialStage,
    progressPercent: initialProgress,
    totalDistanceKm: matchedDistrict.distanceKm,
    distanceKm: metrics.remainingKm,
    etaMinutes: metrics.etaMinutes,
    speedKmh: metrics.speedKmh,
    thermoBoxTempC: 4.0,
    verificationPin: pin,
    feeDram: params.feeDram ?? (params.totalOrderDram >= 10000 ? 0 : 1000),
    totalOrderDram: params.totalOrderDram,
    itemsSummary: params.itemsSummary.length > 0 ? params.itemsSummary : ['Товары заказа «Система 2000»'],
    courier,
    warehouseOrigin: {
      nameHy: '1C Կենտրոնական Պահեստ (Արշակունյաց 34)',
      nameRu: 'Центральный склад 1С (пр. Аршакуняц 34)',
      x: 44,
      y: 78,
    },
    destinationCoords: {
      x: matchedDistrict.x,
      y: matchedDistrict.y,
    },
    createdAt: timeLabel,
    updatedAt: timeLabel,
    stageTimestamps: {
      accepted: timeLabel,
      packing: timeLabel,
      courier_assigned: timeLabel,
    },
    chatMessages: [
      {
        id: `sys_${Date.now()}`,
        sender: 'system',
        text: `Заказ ${params.orderNumber} передан в службу экспресс-доставки. Код получения: ${pin}.`,
        time: timeLabel,
      },
      {
        id: `cour_${Date.now() + 1}`,
        sender: 'courier',
        text: `Здравствуйте! Ваш курьер — ${courier.nameRu} (${courier.plateNumber}). Загружаю заказ в термобокс и выезжаю к вам!`,
        time: timeLabel,
      },
    ],
  };
}

/**
 * Фильтрация и поиск заказов доставки по номеру заказа, имени клиента, телефону или адресу.
 */
export function filterDeliveriesByQuery(
  deliveries: DeliveryOrder[],
  query: string,
  statusFilter: 'all' | 'active' | 'delivered' = 'all'
): DeliveryOrder[] {
  const q = query.trim().toLowerCase();

  return deliveries.filter((d) => {
    if (statusFilter === 'active' && (d.stage === 'delivered' || d.stage === 'cancelled')) {
      return false;
    }
    if (statusFilter === 'delivered' && d.stage !== 'delivered') {
      return false;
    }
    if (!q) return true;

    return (
      d.orderNumber.toLowerCase().includes(q) ||
      d.customerName.toLowerCase().includes(q) ||
      d.customerPhone.toLowerCase().includes(q) ||
      d.address.toLowerCase().includes(q) ||
      d.courier.nameRu.toLowerCase().includes(q) ||
      d.courier.nameHy.toLowerCase().includes(q) ||
      d.verificationPin.includes(q)
    );
  });
}

/**
 * Генерирует контекстный ответ курьера в онлайн-чате доставки.
 */
export function generateCourierAutoReply(
  customerMessage: string,
  lang: Language,
  order: DeliveryOrder
): string {
  const lower = customerMessage.toLowerCase();
  const isHy = lang === 'hy';

  if (lower.includes('двер') || lower.includes('остав') || lower.includes('դռան')) {
    return isHy
      ? `Հասկացա, պատվերը կթողնեմ դռան մոտ և կուղարկեմ լուսանկարը: Շնորհակալություն:`
      : `Принято! Оставлю заказ у двери (бесконтактная доставка) и пришлю фото-подтверждение.`;
  }

  if (lower.includes('позвон') || lower.includes('звон') || lower.includes('զանգ')) {
    return isHy
      ? `Անպայման կզանգահարեմ Ձեզ տեղ հասնելուց 5 րոպե առաջ (${order.customerPhone}):`
      : `Обязательно наберу вас за 5 минут до подъезда по номеру ${order.customerPhone}!`;
  }

  if (lower.includes('где') || lower.includes('скоро') || lower.includes('когда') || lower.includes('որտեղ')) {
    return isHy
      ? `Այժմ շարժվում եմ երթուղով (${order.progressPercent}%), մնացել է մոտ ${order.distanceKm} կմ (~${order.etaMinutes} րոպե):`
      : `Еду по маршруту (${order.progressPercent}% пути пройдено), осталось ${order.distanceKm} км — буду через ~${order.etaMinutes} мин!`;
  }

  return isHy
    ? `Շնորհակալություն հաղորդագրության համար, հաշվի կառնեմ առաքման պահին: Մոտենում եմ (~${order.etaMinutes} րոպե):`
    : `Спасибо за сообщение! Учту при подъезде к дому. Расчетное время прибытия: ~${order.etaMinutes} мин.`;
}
