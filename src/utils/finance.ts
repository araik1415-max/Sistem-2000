/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Ֆինանսական մաթեմատիկա և բիզնես-տրամաբանություն «Համակարգ 2000»
 * Financial math and business logic for System 2000 with Armenian Dram (֏)
 * 
 * ԿԱՆՈՆՆԵՐ:
 * 1. 10 000 ֏ և ավելի ցանկացած գնում դառնում է 10% տարեկան ՑՄԱՀ ԴԵՊՈԶԻՏ՝ ԺԱՌԱՆԳՈՒԹՅԱՆ ԻՐԱՎՈՒՆՔՈՎ:
 * 2. Ապրանքների գնումից հետո բոնուսային միավորները սկսում են հաշվեգրվել յուրաքանչյուր վայրկյան 15 ՕՐ ԱՆՑ,
 *    եթե այդ ընթացքում ապրանքների վերադարձ չի կատարվել:
 * 3. Ապրանքների վերադարձի 15-օրյա պաշտպանիչ ժամկետում դեպոզիտը գտնվում է պահուստային կարգավիճակում:
 * 4. 15 օրից հետո ակտիվացած ցմահ դեպոզիտը բերում է տարեկան 10% բոնուսային եկամուտ՝ վայրկյան առ վայրկյան:
 * 5. Բոնուսներով վճարումը չի հանդիսանում դեպոզիտ և չի փոփոխում դեպոզիտի մարմինը:
 */

export const ANNUAL_RATE = 0.10; // 10% տարեկան եկամտաբերություն
export const SECONDS_PER_YEAR = 365 * 24 * 3600; // 31,536,000 վայրկյան
export const MIN_PURCHASE_FOR_DEPOSIT = 10000; // 10 000 ֏ նվազագույն գնում ցմահ դեպոզիտի համար
export const RETURN_COOLDOWN_DAYS = 15; // 15 օր վերադարձի ժամկետ
export const RETURN_COOLDOWN_MS = 15 * 24 * 3600 * 1000; // 1,296,000,000 ms

export type DepositHoldingStatus = 'cooldown_15d' | 'active_lifelong' | 'refunded';

export interface LifelongDepositHolding {
  id: string;
  orderNumber: string;
  amount: number; // Գումարը դրամով (֏)
  purchaseDate: number; // ms
  cooldownEndsAt: number; // ms (+ 15 օր)
  status: DepositHoldingStatus;
  inheritedRight: boolean; // Ժառանգության իրավունք (միշտ true)
  beneficiaryName?: string; // Օրինական ժառանգորդ
  productNames: string[]; // Գնված ապրանքներ
}

export interface WalletState {
  realBalance: number; // Իրական դրամական հաշվեկշիռ (֏)
  deposit: number; // Ընդհանուր դեպոզիտ (ակտիվ + 15 օրվա մեջ գտնվող) (֏)
  activeDeposit: number; // Ակտիվ ցմահ դեպոզիտ (15 օրն անցած առանց վերադարձի, որը տալիս է վրկ. բոնուսներ)
  cooldownDeposit: number; // 15-օրյա վերադարձի երաշխիքի մեջ գտնվող դեպոզիտ (֏)
  bonusPoints: number; // Բոնուսային միավորներ
  lastTick: number; // Վերջին թարմացման ժամանակը (ms)
  totalEarnedPoints: number; // Ընդամենը վաստակած բոնուսներ
  totalSpentPoints: number; // Ընդամենը ծախսված բոնուսներ
  totalDepositedDram: number; // Ընդամենը դեպոզիտ մուտքագրված գումար (֏)
  totalPurchasedDram: number; // Ընդամենը ապրանքների գնում դրամով (֏)
  holdings: LifelongDepositHolding[]; // Ցմահ դեպոզիտների ցանկ ըստ գնումների
}

export interface YieldRates {
  perSecond: number;
  perMinute: number;
  perHour: number;
  perDay: number;
  perMonth: number;
  perYear: number;
}

export function createInitialWalletState(
  initialRealBalance = 25000,
  initialDeposit = 10000,
  initialPoints = 0
): WalletState {
  const initialHolding: LifelongDepositHolding = {
    id: 'holding_init_sample',
    orderNumber: 'ORD-INIT-2026',
    amount: initialDeposit,
    purchaseDate: Date.now() - 16 * 24 * 3600 * 1000, // արդեն 16 օր առաջ գնված (ակտիվացած)
    cooldownEndsAt: Date.now() - 1 * 24 * 3600 * 1000,
    status: 'active_lifelong',
    inheritedRight: true,
    beneficiaryName: 'Օրինական ժառանգորդներ',
    productNames: ['Մեկնարկային ապրանքային փաթեթ'],
  };

  return {
    realBalance: initialRealBalance,
    deposit: initialDeposit,
    activeDeposit: initialDeposit,
    cooldownDeposit: 0,
    bonusPoints: initialPoints,
    lastTick: Date.now(),
    totalEarnedPoints: initialPoints,
    totalSpentPoints: 0,
    totalDepositedDram: initialDeposit,
    totalPurchasedDram: initialDeposit,
    holdings: initialDeposit > 0 ? [initialHolding] : [],
  };
}

/**
 * Հաշվարկում է բոնուսների աճը տրված ժամանակահատվածում
 */
export function calculateIncrement(deposit: number, deltaSeconds: number, annualRate = ANNUAL_RATE): number {
  if (deposit <= 0 || deltaSeconds <= 0) return 0;
  return deposit * annualRate * (deltaSeconds / SECONDS_PER_YEAR);
}

/**
 * Հաշվարկում է եկամտաբերության արագությունները
 */
export function calculateYieldRates(deposit: number, annualRate = ANNUAL_RATE): YieldRates {
  if (deposit <= 0) {
    return { perSecond: 0, perMinute: 0, perHour: 0, perDay: 0, perMonth: 0, perYear: 0 };
  }
  const perYear = deposit * annualRate;
  const perSecond = perYear / SECONDS_PER_YEAR;
  return {
    perSecond,
    perMinute: perSecond * 60,
    perHour: perSecond * 3600,
    perDay: perSecond * 86400,
    perMonth: perYear / 12,
    perYear,
  };
}

/**
 * Թարմացնում է դեպոզիտների կարգավիճակը և հաշվարկում վայրկյան առ վայրկյան բոնուսները:
 * ԿԱՆՈՆ: Բոնուսային միավորները հաշվեգրվում են յուրաքանչյուր վայրկյան՝ 15 ՕՐ ԱՆՑ, եթե ապրանքի վերադարձ չի եղել:
 */
export function applyTick(
  state: WalletState,
  now: number,
  annualRate = ANNUAL_RATE
): { nextState: WalletState; accruedPoints: number } {
  const deltaSeconds = Math.max(0, (now - state.lastTick) / 1000);

  // Ստուգում ենք բոլոր հոլդինգները՝ արդյոք լրացել է 15 օրը
  let holdingsUpdated = false;
  let nextActive = 0;
  let nextCooldown = 0;

  const currentHoldings = state.holdings || [];
  const updatedHoldings = currentHoldings.map((h) => {
    if (h.status === 'cooldown_15d' && now >= h.cooldownEndsAt) {
      holdingsUpdated = true;
      return { ...h, status: 'active_lifelong' as const };
    }
    return h;
  });

  for (const h of updatedHoldings) {
    if (h.status === 'active_lifelong') {
      nextActive += h.amount;
    } else if (h.status === 'cooldown_15d') {
      nextCooldown += h.amount;
    }
  }

  // Եթե կան նաև ուղիղ դեպոզիտային միջոցներ, որոնք ավելացվել են հաշվին
  const totalHoldingsDeposit = nextActive + nextCooldown;
  if (state.deposit > totalHoldingsDeposit) {
    nextActive += (state.deposit - totalHoldingsDeposit);
  }

  // ՀԱՇՎԱՐԿ: Բոնուսային միավորները հաշվեգրվում են ամեն վայրկյան 15 օրն անցած ԱԿՏԻՎ ՑՄԱՀ ԴԵՊՈԶԻՏԻՑ!
  const accruedPoints = calculateIncrement(nextActive, deltaSeconds, annualRate);
  const nextPoints = state.bonusPoints + accruedPoints;

  const nextState: WalletState = {
    ...state,
    lastTick: now,
    deposit: Number((nextActive + nextCooldown).toFixed(2)),
    activeDeposit: Number(nextActive.toFixed(2)),
    cooldownDeposit: Number(nextCooldown.toFixed(2)),
    bonusPoints: Number(nextPoints.toFixed(4)),
    totalEarnedPoints: Number((state.totalEarnedPoints + accruedPoints).toFixed(4)),
    holdings: holdingsUpdated ? updatedHoldings : currentHoldings,
  };

  return { nextState, accruedPoints };
}

/**
 * Իրական հաշվեկշռի համալրում (քարտից, Idram-ից, ArCa-ից)
 */
export function processRealBalanceTopup(state: WalletState, amount: number): { nextState: WalletState; logEntry: string } {
  if (amount <= 0) {
    throw new Error('Գումարը պետք է մեծ լինի 0-ից');
  }

  const nextReal = state.realBalance + amount;
  const nextState: WalletState = {
    ...state,
    realBalance: nextReal,
  };

  const logEntry = `Իրական հաշվի համալրում՝ +${formatDram(amount)} ➔ Մնացորդ՝ ${formatDram(nextReal)}`;
  return { nextState, logEntry };
}

/**
 * Դեպոզիտի համալրում (իրական հաշվից փոխանցում կամ ուղիղ դեպոզիտ)
 */
export function processDeposit(state: WalletState, amount: number, fromRealBalance = false): { nextState: WalletState; logEntry: string } {
  if (amount <= 0) {
    throw new Error('Դեպոզիտի գումարը պետք է մեծ լինի 0-ից');
  }

  let nextReal = state.realBalance;
  if (fromRealBalance) {
    if (state.realBalance < amount) {
      throw new Error(`Իրական հաշվեկշռում չկա բավարար գումար: Առկա է ${formatDram(state.realBalance)}`);
    }
    nextReal -= amount;
  }

  const newHolding: LifelongDepositHolding = {
    id: `holding_dep_${Date.now()}`,
    orderNumber: `DEP-${Date.now().toString().slice(-6)}`,
    amount: amount,
    purchaseDate: Date.now(),
    cooldownEndsAt: Date.now() + RETURN_COOLDOWN_MS,
    status: 'cooldown_15d',
    inheritedRight: true,
    beneficiaryName: 'Օրինական ժառանգորդներ',
    productNames: ['Հաշվի ուղիղ համալրում դեպոզիտին'],
  };

  const nextDeposit = state.deposit + amount;
  const nextCooldown = (state.cooldownDeposit || 0) + amount;
  const nextHoldings = [...(state.holdings || []), newHolding];

  const nextState: WalletState = {
    ...state,
    realBalance: nextReal,
    deposit: nextDeposit,
    cooldownDeposit: nextCooldown,
    totalDepositedDram: state.totalDepositedDram + amount,
    holdings: nextHoldings,
  };

  const logEntry = `Դեպոզիտի համալրում՝ +${formatDram(amount)} (15 օր վերադարձի ստուգում ➔ 10% ցմահ ավանդ ժառանգությամբ)`;
  return { nextState, logEntry };
}

/**
 * Գնում իրական դրամով
 * ԿԱՆՈՆ: 10 000 ֏ և ավելի ցանկացած գնում դառնում է 10% տարեկան ՑՄԱՀ ԴԵՊՈԶԻՏ՝ ԺԱՌԱՆԳՈՒԹՅԱՆ ԻՐԱՎՈՒՆՔՈՎ:
 * Բոնուսային միավորները սկսում են հաշվեգրվել յուրաքանչյուր վայրկյան 15 ՕՐ ԱՆՑ, եթե ապրանքի վերադարձ չի եղել:
 * Նաև շնորհվում է 5% անմիջական բոնուսային քեշբեք:
 */
export function processDramPurchase(
  state: WalletState,
  amount: number,
  itemName: string,
  cashbackPercent = 0.05,
  timestamp = Date.now()
): {
  success: boolean;
  nextState: WalletState;
  error?: string;
  logEntry: string;
  bonusEarned: number;
  becameLifelongDeposit: boolean;
  holdingCreated?: LifelongDepositHolding;
} {
  if (amount <= 0) {
    throw new Error('Ապրանքի գինը պետք է մեծ լինի 0-ից');
  }

  // Ակնթարթային 5% բոնուսային քեշբեք գնման պահին
  const bonusEarned = Math.round(amount * cashbackPercent);

  // Ստուգում ենք՝ արդյոք գնումը 10 000 ֏ և ավելի է (10% ցմահ դեպոզիտի համար)
  const isQualifyingDeposit = amount >= MIN_PURCHASE_FOR_DEPOSIT;

  let holdingCreated: LifelongDepositHolding | undefined;
  let nextDeposit = state.deposit;
  let nextCooldown = state.cooldownDeposit || 0;
  let nextHoldings = [...(state.holdings || [])];

  if (isQualifyingDeposit) {
    holdingCreated = {
      id: `holding_${timestamp}_${Math.random().toString(36).substring(2, 6)}`,
      orderNumber: `ORD-${timestamp.toString().slice(-6)}`,
      amount: amount,
      purchaseDate: timestamp,
      cooldownEndsAt: timestamp + RETURN_COOLDOWN_MS,
      status: 'cooldown_15d',
      inheritedRight: true,
      beneficiaryName: 'Օրինական ժառանգորդներ',
      productNames: [itemName],
    };
    nextDeposit += amount;
    nextCooldown += amount;
    nextHoldings.push(holdingCreated);
  }

  let nextReal = state.realBalance;
  if (state.realBalance >= amount) {
    nextReal -= amount;
  }

  const nextPoints = state.bonusPoints + bonusEarned;

  const nextState: WalletState = {
    ...state,
    realBalance: nextReal,
    deposit: nextDeposit,
    cooldownDeposit: nextCooldown,
    bonusPoints: nextPoints,
    totalEarnedPoints: state.totalEarnedPoints + bonusEarned,
    totalPurchasedDram: state.totalPurchasedDram + amount,
    holdings: nextHoldings,
  };

  const depositText = isQualifyingDeposit
    ? `➔ 10% Ցմահ դեպոզիտ ժառանգության իրավունքով (+${formatDram(amount)}, 15 օր վերադարձի ստուգումից հետո՝ վրկ. բոնուսներ)`
    : `(10 000 ֏-ից ցածր՝ ստանդարտ գնում)`;

  const logEntry = `Գնում՝ «${itemName}» (${formatDram(amount)}) ➔ Քեշբեք (+${bonusEarned} բ.) ${depositText}`;

  return {
    success: true,
    nextState,
    logEntry,
    bonusEarned,
    becameLifelongDeposit: isQualifyingDeposit,
    holdingCreated,
  };
}

/**
 * Վճարում բոնուսային միավորներով (նվազեցնում է բոնուսները, դեպոզիտը ՄՆՈՒՄ Է ԱՆՓՈՓՈԽ)
 */
export function processPointsPurchase(
  state: WalletState,
  cost: number,
  itemName: string
): { success: boolean; nextState: WalletState; error?: string; logEntry: string } {
  if (cost <= 0) {
    throw new Error('Բոնուսների արժեքը պետք է մեծ լինի 0-ից');
  }

  if (state.bonusPoints < cost) {
    const errorMsg = `Անբավարար բոնուսներ: Պահանջվում է ${cost} բալ, հասանելի է ${state.bonusPoints.toFixed(2)}`;
    const logEntry = `Սխալ՝ մերժում «${itemName}» գնման մեջ (${cost} բոնուս)։ Հաշվեկշիռ՝ ${state.bonusPoints.toFixed(2)}`;
    return { success: false, nextState: state, error: errorMsg, logEntry };
  }

  const nextPoints = state.bonusPoints - cost;
  const nextState: WalletState = {
    ...state,
    bonusPoints: nextPoints,
    totalSpentPoints: state.totalSpentPoints + cost,
  };

  const logEntry = `Գնում բոնուսներով՝ «${itemName}» (-${cost} բոնուս)։ Դեպոզիտն անփոփոխ է (${formatDram(state.deposit)})`;
  return { success: true, nextState, logEntry };
}

/**
 * 15 օրվա ժամկետի հաստատում առանց վերադարձի (ակտիվացնում է ցմահ դեպոզիտը և վրկ. բոնուսները)
 */
export function confirmCooldownPassed(state: WalletState, holdingId: string): { nextState: WalletState; logEntry: string } {
  let found = false;
  let activatedAmount = 0;

  const nextHoldings = (state.holdings || []).map((h) => {
    if (h.id === holdingId && h.status === 'cooldown_15d') {
      found = true;
      activatedAmount = h.amount;
      return { ...h, status: 'active_lifelong' as const };
    }
    return h;
  });

  if (!found) {
    return { nextState: state, logEntry: 'Հոլդինգը չի գտնվել կամ արդեն ակտիվ է' };
  }

  const nextActive = (state.activeDeposit || 0) + activatedAmount;
  const nextCooldown = Math.max(0, (state.cooldownDeposit || 0) - activatedAmount);

  const nextState: WalletState = {
    ...state,
    activeDeposit: nextActive,
    cooldownDeposit: nextCooldown,
    holdings: nextHoldings,
  };

  const logEntry = `15 օրվա երաշխիքը հաջողությամբ լրացավ (առանց վերադարձի)՝ ${formatDram(activatedAmount)} դարձավ ակտիվ 10% ցմահ ավանդ (վրկ. բոնուսներով):`;
  return { nextState, logEntry };
}

/**
 * Ապրանքների վերադարձ 15 օրվա ընթացքում (չեղարկում է դեպոզիտը և վերադարձնում գումարը)
 */
export function processReturnRefund(
  state: WalletState,
  holdingId: string
): { success: boolean; nextState: WalletState; refundAmount: number; logEntry: string } {
  const holding = (state.holdings || []).find((h) => h.id === holdingId);
  if (!holding || holding.status !== 'cooldown_15d') {
    return {
      success: false,
      nextState: state,
      refundAmount: 0,
      logEntry: 'Վերադարձը հնարավոր չէ՝ 15 օրն անցել է կամ ապրանքն արդեն վերադարձված է:',
    };
  }

  const refundAmount = holding.amount;
  const nextHoldings = state.holdings.map((h) => (h.id === holdingId ? { ...h, status: 'refunded' as const } : h));

  const nextDeposit = Math.max(0, state.deposit - refundAmount);
  const nextCooldown = Math.max(0, (state.cooldownDeposit || 0) - refundAmount);
  const nextReal = state.realBalance + refundAmount;

  const nextState: WalletState = {
    ...state,
    realBalance: nextReal,
    deposit: nextDeposit,
    cooldownDeposit: nextCooldown,
    holdings: nextHoldings,
  };

  const logEntry = `Ապրանքների վերադարձ 15 օրում՝ վերադարձվել է ${formatDram(refundAmount)} հաշվեկշռին, ցմահ դեպոզիտը չեղարկվել է:`;
  return { success: true, nextState, refundAmount, logEntry };
}

/**
 * Դրամի ֆորմատավորում (֏)
 */
export function formatDram(val: number): string {
  const formatted = new Intl.NumberFormat('hy-AM', {
    maximumFractionDigits: 0,
  }).format(Math.round(val));
  return `${formatted} ֏`;
}

export function formatPoints(points: number, decimals = 2): string {
  return points.toFixed(decimals);
}
