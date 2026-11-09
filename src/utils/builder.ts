import { SiteConfig, SiteSectionConfig, SectionId, ThemeId } from '../types';

export interface ThemeStyle {
  id: ThemeId;
  nameHy: string;
  nameRu: string;
  primaryColor: string;
  badgeBg: string;
  badgeText: string;
  borderAccent: string;
  bgGradient: string;
  buttonClass: string;
  activeTabClass: string;
  glowClass: string;
}

export const THEMES: Record<ThemeId, ThemeStyle> = {
  emerald: {
    id: 'emerald',
    nameHy: 'Զմրուխտ Ֆինանս (Էմերալդ)',
    nameRu: 'Изумрудный Финанс (Emerald)',
    primaryColor: '#10b981',
    badgeBg: 'bg-emerald-500/15',
    badgeText: 'text-emerald-400',
    borderAccent: 'border-emerald-500/30',
    bgGradient: 'from-emerald-950/40 via-slate-900 to-slate-950',
    buttonClass: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-700/25',
    activeTabClass: 'bg-emerald-600 text-white',
    glowClass: 'shadow-emerald-500/20',
  },
  sapphire: {
    id: 'sapphire',
    nameHy: 'Երևանյան Շափյուղա (Կապույտ)',
    nameRu: 'Ереванский Сапфир (Синий)',
    primaryColor: '#0ea5e9',
    badgeBg: 'bg-sky-500/15',
    badgeText: 'text-sky-400',
    borderAccent: 'border-sky-500/30',
    bgGradient: 'from-sky-950/40 via-slate-900 to-slate-950',
    buttonClass: 'bg-sky-600 hover:bg-sky-500 text-white shadow-sky-700/25',
    activeTabClass: 'bg-sky-600 text-white',
    glowClass: 'shadow-sky-500/20',
  },
  amber: {
    id: 'amber',
    nameHy: 'Արարատ Ոսկի (Սաթագույն)',
    nameRu: 'Арарат Золото (Янтарный)',
    primaryColor: '#f59e0b',
    badgeBg: 'bg-amber-500/15',
    badgeText: 'text-amber-400',
    borderAccent: 'border-amber-500/30',
    bgGradient: 'from-amber-950/40 via-slate-900 to-slate-950',
    buttonClass: 'bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold shadow-amber-700/25',
    activeTabClass: 'bg-amber-600 text-slate-950 font-bold',
    glowClass: 'shadow-amber-500/20',
  },
  amethyst: {
    id: 'amethyst',
    nameHy: 'Թագավորական Ամեթիստ (Մանուշակագույն)',
    nameRu: 'Королевский Аметист (Фиолетовый)',
    primaryColor: '#a855f7',
    badgeBg: 'bg-purple-500/15',
    badgeText: 'text-purple-400',
    borderAccent: 'border-purple-500/30',
    bgGradient: 'from-purple-950/40 via-slate-900 to-slate-950',
    buttonClass: 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-700/25',
    activeTabClass: 'bg-purple-600 text-white',
    glowClass: 'shadow-purple-500/20',
  },
  crimson: {
    id: 'crimson',
    nameHy: 'Կարմիր Նուռ (Ռուբին)',
    nameRu: 'Красный Гранат (Рубин)',
    primaryColor: '#f43f5e',
    badgeBg: 'bg-rose-500/15',
    badgeText: 'text-rose-400',
    borderAccent: 'border-rose-500/30',
    bgGradient: 'from-rose-950/40 via-slate-900 to-slate-950',
    buttonClass: 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-700/25',
    activeTabClass: 'bg-rose-600 text-white',
    glowClass: 'shadow-rose-500/20',
  },
  cyber: {
    id: 'cyber',
    nameHy: 'Կիբեռ Անանուխ (Cyber Mint)',
    nameRu: 'Кибер Мята (Cyber Mint)',
    primaryColor: '#14b8a6',
    badgeBg: 'bg-teal-500/15',
    badgeText: 'text-teal-400',
    borderAccent: 'border-teal-500/30',
    bgGradient: 'from-teal-950/40 via-slate-900 to-slate-950',
    buttonClass: 'bg-teal-600 hover:bg-teal-500 text-white shadow-teal-700/25',
    activeTabClass: 'bg-teal-600 text-white',
    glowClass: 'shadow-teal-500/20',
  },
};

export const DEFAULT_SECTIONS: SiteSectionConfig[] = [
  { id: 'hero_banner', nameHy: 'Գլխավոր պրոմո-բաններ', nameRu: 'Главный промо-баннер', enabled: true },
  { id: 'balance_card', nameHy: 'Իրական հաշվեկշիռ և 10% Դեպոզիտ', nameRu: 'Баланс и 10% Депозит', enabled: true },
  { id: 'deposit_panel', nameHy: 'Հաշվի արագ համալրում', nameRu: 'Панель пополнения', enabled: true },
  { id: 'featured_deals', nameHy: 'Թեժ առաջարկներ և ակցիաներ', nameRu: 'Горячие предложения', enabled: true },
  { id: 'catalog', nameHy: 'Ապրանքների կատալոգ (խանութ)', nameRu: 'Каталог интернет-магазина', enabled: true },
  { id: 'trust_badges', nameHy: 'Երաշխիքներ և վճարային առավելություններ', nameRu: 'Преимущества и гарантии', enabled: true },
  { id: 'reviews', nameHy: 'Հաճախորդների կարծիքներ (4.9★)', nameRu: 'Отзывы покупателей (4.9★)', enabled: true },
  { id: 'faq', nameHy: 'Հաճախ տրվող հարցեր (FAQ)', nameRu: 'Частые вопросы (FAQ)', enabled: true },
  { id: 'history_log', nameHy: 'Գործարքների պատմություն', nameRu: 'История транзакций', enabled: true },
  { id: 'store_footer', nameHy: 'Կապ, առաքում և ռեկվիզիտներ', nameRu: 'Контакты и реквизиты', enabled: true },
];

export const DEFAULT_SITE_CONFIG: SiteConfig = {
  version: 1,
  themeId: 'emerald',
  cardRadius: 'rounded-2xl',
  containerWidth: 'max-w-2xl',
  storeTitleHy: 'Համակարգ 2000',
  storeTitleRu: 'Система 2000',
  storeTaglineHy: 'Ինտերնետ-խանութ և կենտրոնական բոնուսային դրամապանակ՝ 10% անընդհատ աճով',
  storeTaglineRu: 'Интернет-магазин и центральный кошелек с 10% непрерывным начислением',
  badgeTextHy: '10% LIVE ՏԱՐԵԿԱՆ',
  badgeTextRu: '10% ГОДОВЫХ LIVE',
  promoBar: {
    enabled: true,
    textHy: '🔥 Հատուկ ակցիա. 10 000 ֏-ից ցանկացած գնում դառնում է 10% ՑՄԱՀ ԴԵՊՈԶԻՏ ժառանգության իրավունքով: Բոնուսներն ամեն վրկ. 15 օր անց առանց վերադարձի:',
    textRu: '🔥 Покупка от 10 000 ֏ станет пожизненным депозитом 10% годовых с правом наследования! Бонусы начисляются ежесекундно спустя 15 дней без возврата.',
    bgColor: 'bg-emerald-600',
    actionTextHy: 'Իմանալ ավելին',
    actionTextRu: 'Подробнее',
  },
  sections: DEFAULT_SECTIONS,
  heroSlides: [
    {
      id: 'slide_1',
      titleHy: 'Գնումներ 10 000 ֏-ից ➔ 10% Ցմահ դեպոզիտ ժառանգությամբ',
      titleRu: 'Покупки от 10 000 ֏ ➔ 10% Пожизненный депозит с правом наследования',
      subtitleHy: '«Համակարգ 2000»-ը Ձեր բոլոր ծախսերը վերածում է ցմահ ավանդի: Բոնուսները գեներացվում են ամեն վայրկյան 15 օր անց առանց վերադարձի:',
      subtitleRu: 'Система 2000 даёт возможность все ваши затраты превратить в пожизненный депозит. Бонусы начисляются ежесекундно спустя 15 дней без возврата товаров.',
      badgeHy: '⚡ 10% Ցմահ • Ժառանգություն',
      badgeRu: '⚡ 10% Пожизненно • Наследование',
      ctaTextHy: 'Անցնել կատալոգին',
      ctaTextRu: 'В каталог товаров',
      ctaAction: 'catalog',
      imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80',
      bgGradient: 'from-emerald-900/60 to-slate-900',
    },
    {
      id: 'slide_2',
      titleHy: 'Ակնթարթային վճարումներ Idram, Telcell և ArCa-ով',
      titleRu: 'Мгновенная оплата через Idram, Telcell и ArCa',
      subtitleHy: 'Վճարեք QR կոդով կամ բանկային քարտով՝ անմիջապես ստանալով պաշտոնական էլեկտրոնային անդորրագիր:',
      subtitleRu: 'Оплачивайте по QR-коду или банковской карте с мгновенным чеком.',
      badgeHy: '💳 100% Անվտանգություն',
      badgeRu: '💳 100% Безопасность',
      ctaTextHy: 'Լիցքավորել հաշիվը',
      ctaTextRu: 'Пополнить баланс',
      ctaAction: 'deposit',
      imageUrl: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=800&q=80',
      bgGradient: 'from-sky-900/60 to-slate-900',
    },
  ],
  reviews: [
    {
      id: 'rev_1',
      author: 'Արամ Սարգսյան',
      rating: 5,
      textHy: 'Հիանալի համակարգ է: Գնումներ կատարեցի Idram-ով, գումարը դարձավ դեպոզիտ, և բոնուսները վայրկյան առ վայրկյան աճում են:',
      textRu: 'Отличная система! Оплатил через Idram, сумма сразу пополнила депозит, и бонусы растут прямо на глазах.',
      date: '28.10.2026',
      verified: true,
    },
    {
      id: 'rev_2',
      author: 'Անահիտ Ղազարյան',
      rating: 5,
      textHy: 'Առաքումը Երևանում շատ արագ էր՝ 40 րոպեում: Բոնուսներով կարողացա գնել սուրճ և շոկոլադ առանց կանխիկ վճարի:',
      textRu: 'Доставка по Еревану заняла 40 минут! Накопленными бонусами бесплатно взяла кофе и шоколад.',
      date: '25.10.2026',
      verified: true,
    },
    {
      id: 'rev_3',
      author: 'Տիգրան Հակոբյան',
      rating: 5,
      textHy: 'Շատ հարմար է Idram և Telcell QR-ով վճարումը: Էլեկտրոնային չեկը միանգամից հասանելի է:',
      textRu: 'Очень удобно платить по Idram и Telcell QR. Чек формируется мгновенно.',
      date: '20.10.2026',
      verified: true,
    },
  ],
  faqs: [
    {
      id: 'faq_1',
      questionHy: 'Ինչպե՞ս է աշխատում 10% տարեկան բոնուսային հաշվիչը:',
      questionRu: 'Как работает счетчик 10% годовых?',
      answerHy: 'Ձեր դեպոզիտի հիման վրա համակարգը յուրաքանչյուր վայրկյան հաշվարկում է բոնուսներ 10% տարեկան տոկոսադրույքով (բարդ տոկոսով): Որքան մեծ է դեպոզիտը, այնքան արագ են կուտակվում բոնուսները:',
      answerRu: 'На сумму вашего депозита каждую секунду начисляются бонусные баллы по ставке 10% годовых. Чем выше депозит, тем быстрее генерируются баллы.',
    },
    {
      id: 'faq_2',
      questionHy: 'Ինչպե՞ս են ապրանքների գնումները դառնում 10% ցմահ դեպոզիտ:',
      questionRu: 'Как покупки превращаются в 10% пожизненный депозит с правом наследования?',
      answerHy: '10,000 ՀՀ դրամ և ավելի ցանկացած գնման 100%-ը վերածվում է Ձեր ցմահ ավանդի՝ ժառանգության իրավունքով: Բոնուսային միավորները սկսում են հաշվեգրվել վայրկյան առ վայրկյան 15 օր անց, եթե այդ ընթացքում ապրանքի վերադարձ չի կատարվել:',
      answerRu: 'Любая покупка от 10 000 ֏ на 100% зачисляется в пожизненный депозит 10% годовых с правом наследования. Бонусные баллы начинают начисляться ежесекундно спустя 15 дней при условии отсутствия возврата товаров.',
    },
    {
      id: 'faq_3',
      questionHy: 'Ինչպե՞ս կարող եմ օգտագործել կուտակված բոնուսները:',
      questionRu: 'Как тратить накопленные бонусные баллы?',
      answerHy: 'Կատալոգում յուրաքանչյուր ապրանք ունի նաև գին բոնուսներով: Կարող եք ընտրել «Գնել բոնուսներով» կոճակը և ստանալ ապրանքը անվճար:',
      answerRu: 'В каталоге у каждого товара есть цена в баллах. Нажмите «Купить за баллы», и покупка спишет бонусы без уменьшения депозита.',
    },
  ],
  contact: {
    phone: '+374 (10) 20-00-00',
    email: 'support@sistema2000.am',
    telegram: '@sistema2000_armenia',
    whatsapp: '+374 91 200000',
    deliveryCity: 'Երևան և ամբողջ ՀՀ / Ереван и вся Армения',
    freeDeliveryMinAmount: 10000,
  },
};

/**
 * Reorder sections up or down
 */
export function moveSection(
  sections: SiteSectionConfig[],
  index: number,
  direction: 'up' | 'down'
): SiteSectionConfig[] {
  if (
    (direction === 'up' && index === 0) ||
    (direction === 'down' && index === sections.length - 1)
  ) {
    return sections;
  }

  const targetIndex = direction === 'up' ? index - 1 : index + 1;
  const result = [...sections];
  const [removed] = result.splice(index, 1);
  result.splice(targetIndex, 0, removed);
  return result;
}

/**
 * Toggle visibility of a section
 */
export function toggleSection(
  sections: SiteSectionConfig[],
  id: SectionId
): SiteSectionConfig[] {
  return sections.map((sec) =>
    sec.id === id ? { ...sec, enabled: !sec.enabled } : sec
  );
}

/**
 * Export site configuration as formatted JSON
 */
export function exportSiteConfig(config: SiteConfig): string {
  return JSON.stringify(config, null, 2);
}

/**
 * Import and validate site configuration
 */
export function importSiteConfig(jsonString: string): {
  success: boolean;
  config?: SiteConfig;
  error?: string;
} {
  try {
    const parsed = JSON.parse(jsonString);
    if (!parsed || typeof parsed !== 'object') {
      return { success: false, error: 'Անվավեր ֆայլի ձևաչափ (Invalid JSON)' };
    }
    if (!Array.isArray(parsed.sections)) {
      return { success: false, error: 'Բացակայում է սեկցիաների ցանկը (Missing sections)' };
    }

    // Merge with default values to ensure all properties exist
    const sanitized: SiteConfig = {
      ...DEFAULT_SITE_CONFIG,
      ...parsed,
      promoBar: { ...DEFAULT_SITE_CONFIG.promoBar, ...(parsed.promoBar || {}) },
      contact: { ...DEFAULT_SITE_CONFIG.contact, ...(parsed.contact || {}) },
      sections: parsed.sections.map((sec: any) => ({
        id: sec.id,
        nameHy: sec.nameHy || sec.id,
        nameRu: sec.nameRu || sec.id,
        enabled: typeof sec.enabled === 'boolean' ? sec.enabled : true,
      })),
    };

    return { success: true, config: sanitized };
  } catch (err: any) {
    return { success: false, error: err?.message || 'JSON կարդալու սխալ' };
  }
}
