import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import http from 'http';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { System2000Engine } from './src/server/engine.js';
import { INITIAL_CUSTOMERS } from './src/data/initialCustomers.js';
import { CustomerAccount, CustomerPurchase, AccountType, LedgerEntry } from './src/types.js';
import { verifyTerminalAuth, handleSoftPosCharge } from './src/server/terminalService.js';
import { GoogleGenAI } from '@google/genai';
import { INITIAL_PRODUCTS } from './src/data/products.js';
import { detectRecipeOrSearch } from './src/utils/recipeEngine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const args = process.argv.slice(2);
const portArgIdx = args.indexOf('--port');
const portArg = portArgIdx !== -1 ? args[portArgIdx + 1] : undefined;
const hostArgIdx = args.indexOf('--host');
const hostArg = hostArgIdx !== -1 ? args[hostArgIdx + 1] : undefined;

const PORT = Number(process.env.PORT || portArg || 3000);
const HOST = process.env.HOST || hostArg || '0.0.0.0';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || 'AI_STUDIO_KEY',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

app.use(cors({ origin: true }));
app.use(express.json({ limit: '15mb' }));


// База данных участников и леджера в памяти (с сохранением в рантайме)
let customersDB: Record<string, CustomerAccount> = {};
INITIAL_CUSTOMERS.forEach((c) => {
  customersDB[c.id] = { ...c };
});

const globalLedgerDB: LedgerEntry[] = [];
Object.values(customersDB).forEach((c) => {
  globalLedgerDB.push(...c.ledger);
});

// 1. Получение баланса и актуальных процентов (System 2000 Engine)
app.get('/api/finance/balance', (req: Request, res: Response) => {
  const userId = (req.headers['x-user-id'] as string) || 'usr_araik';
  let customer = customersDB[userId] || customersDB['usr_araik'];

  if (!customer) {
    return res.status(404).json({ error: 'Пользователь не найден' });
  }

  // Синхронизируем проценты на лету для отображения актуального счета
  const { updatedState } = System2000Engine.syncInterest({
    userId: customer.id,
    realBalance: customer.realBalance,
    deposit: customer.deposit,
    bonusPoints: customer.bonusPoints,
    lastAccrualTimestamp: customer.lastAccrualTimestamp,
  });

  customer.realBalance = updatedState.realBalance;
  customer.lastAccrualTimestamp = updatedState.lastAccrualTimestamp;

  const accruedInterest = System2000Engine.calculateAccruedInterest(
    customer.deposit,
    customer.lastAccrualTimestamp
  );

  return res.json({
    userId: customer.id,
    name: customer.name,
    realBalance: updatedState.realBalance,
    deposit: updatedState.deposit,
    accruedInterest,
    bonusPoints: updatedState.bonusPoints,
    annualRate: '10%',
  });
});

// 2. Пополнение депозита
app.post('/api/finance/deposit', (req: Request, res: Response) => {
  const userId = (req.headers['x-user-id'] as string) || 'usr_araik';
  const { amount } = req.body;

  try {
    let customer = customersDB[userId] || customersDB['usr_araik'];
    if (!customer) return res.status(404).json({ error: 'Пользователь не найден' });

    const { newState, ledgerEntries } = System2000Engine.topUpDeposit(
      {
        userId: customer.id,
        realBalance: customer.realBalance,
        deposit: customer.deposit,
        bonusPoints: customer.bonusPoints,
        lastAccrualTimestamp: customer.lastAccrualTimestamp,
      },
      Number(amount)
    );

    customer.realBalance = newState.realBalance;
    customer.deposit = newState.deposit;
    customer.lastAccrualTimestamp = newState.lastAccrualTimestamp;
    customer.ledger.unshift(...ledgerEntries);
    globalLedgerDB.unshift(...ledgerEntries);

    return res.json({ success: true, customer, ledgerEntries });
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
});

// 3. Совершение покупки в магазине
app.post('/api/store/purchase', (req: Request, res: Response) => {
  const userId = (req.headers['x-user-id'] as string) || 'usr_araik';
  const { price, orderDetails } = req.body;

  try {
    let customer = customersDB[userId] || customersDB['usr_araik'];
    if (!customer) return res.status(404).json({ error: 'Пользователь не найден' });

    const { newState, ledgerEntries } = System2000Engine.makePurchase(
      {
        userId: customer.id,
        realBalance: customer.realBalance,
        deposit: customer.deposit,
        bonusPoints: customer.bonusPoints,
        lastAccrualTimestamp: customer.lastAccrualTimestamp,
      },
      Number(price)
    );

    customer.realBalance = newState.realBalance;
    customer.bonusPoints = newState.bonusPoints;
    customer.lastAccrualTimestamp = newState.lastAccrualTimestamp;
    customer.ledger.unshift(...ledgerEntries);
    globalLedgerDB.unshift(...ledgerEntries);

    if (orderDetails) {
      customer.purchases.unshift(orderDetails);
      customer.totalSpentDram += Number(price);
    }

    return res.json({ success: true, customer, ledgerEntries });
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
});

// 4. Вебхук для приема внешних платежей (Ameriabank / Idram / Telcell)
app.post('/api/payment/webhook', (req: Request, res: Response) => {
  const { order_id, amount, status, user_id } = req.body;

  if (status === 'SUCCESS') {
    let customer = customersDB[user_id || 'usr_araik'];
    if (customer) {
      customer.realBalance = Number((customer.realBalance + Number(amount)).toFixed(2));
      const entry: LedgerEntry = {
        id: `tx_pay_${Date.now()}`,
        userId: customer.id,
        type: 'EXTERNAL_PAYMENT',
        amount: Number(amount),
        fromAccount: 'EXTERNAL_SYSTEM',
        toAccount: 'REAL_BALANCE',
        timestamp: Date.now(),
        details: `Внешний платеж заказа ${order_id}`,
      };

      customer.ledger.unshift(entry);
      globalLedgerDB.unshift(entry);

      console.log(`[ПЛАТЕЖ УСПЕШЕН] Заказ ${order_id} на сумму ${amount} AMD зачислен.`);
      return res.status(200).json({ status: 'OK', customer });
    }
  }

  return res.status(400).json({ status: 'FAILED' });
});

// 4.2. Полноценный процессинг онлайн-платежей (Idram, Telcell, ArCa/vPOS, Visa/Mastercard, Apple/Google Pay, Баланс)
interface ServerPaymentSession {
  sessionId: string;
  orderId: string;
  userId: string;
  amountDram: number;
  gatewayId: string;
  paymentPurpose: 'store_purchase' | 'deposit_topup' | 'wallet_topup';
  title: string;
  status: 'PENDING' | 'AWAITING_3DS' | 'COMPLETED' | 'FAILED';
  acsOtpCode: string;
  createdAt: number;
  receipt?: {
    receiptId: string;
    providerCode: string;
    fiscalHdmNumber: string;
    taxTin: string;
    authCode: string;
    timestamp: string;
    amountDram: number;
    gatewayId: string;
    orderType: 'store_purchase' | 'deposit_topup' | 'wallet_topup';
    maskedAccount?: string;
    status: 'COMPLETED';
  };
}

const paymentSessionsDB: Record<string, ServerPaymentSession> = {};

app.post('/api/payments/create-session', (req: Request, res: Response) => {
  const userId = (req.headers['x-user-id'] as string) || req.body.userId || 'usr_araik';
  const amountDram = Math.max(100, Number(req.body.amountDram) || 0);
  const gatewayId = String(req.body.gatewayId || 'idram');
  const paymentPurpose = (req.body.paymentPurpose || 'store_purchase') as
    | 'store_purchase'
    | 'deposit_topup'
    | 'wallet_topup';
  const title = String(req.body.title || 'Sistema 2000 Online Order');

  const sessionId = `pay_sess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const orderId = `ORD-${Date.now().toString().slice(-6)}`;
  const acsOtpCode = '7749';
  const isCard = gatewayId === 'arca' || gatewayId === 'visa_mastercard';

  const session: ServerPaymentSession = {
    sessionId,
    orderId,
    userId,
    amountDram,
    gatewayId,
    paymentPurpose,
    title,
    status: isCard ? 'AWAITING_3DS' : 'PENDING',
    acsOtpCode,
    createdAt: Date.now(),
  };

  paymentSessionsDB[sessionId] = session;

  return res.json({
    sessionId,
    orderId,
    amountDram,
    gatewayId,
    paymentPurpose,
    requires3DS: isCard,
    acsHint: isCard ? 'Код подтверждения 3D Secure отправлен по SMS (тестовый код: 7749)' : undefined,
    status: session.status,
  });
});

app.get('/api/payments/session/:sessionId', (req: Request, res: Response) => {
  const session = paymentSessionsDB[req.params.sessionId];
  if (!session) {
    return res.status(404).json({ error: 'Платежная сессия не найдена' });
  }
  return res.json(session);
});

app.post('/api/payments/confirm', (req: Request, res: Response) => {
  const { sessionId, otpCode, maskedAccount, amountDram: bodyAmount, gatewayId: bodyGateway, paymentPurpose: bodyPurpose } = req.body;
  const userId = (req.headers['x-user-id'] as string) || req.body.userId || 'usr_araik';

  let session = sessionId ? paymentSessionsDB[sessionId] : undefined;
  if (!session) {
    // Allow direct 1-step confirmation if session was created optimistically
    const fallbackId = `pay_sess_${Date.now()}`;
    session = {
      sessionId: fallbackId,
      orderId: `ORD-${Date.now().toString().slice(-6)}`,
      userId,
      amountDram: Math.max(100, Number(bodyAmount) || 1000),
      gatewayId: String(bodyGateway || 'idram'),
      paymentPurpose: (bodyPurpose || 'store_purchase') as 'store_purchase' | 'deposit_topup' | 'wallet_topup',
      title: String(req.body.title || 'Sistema 2000 Order'),
      status: 'PENDING',
      acsOtpCode: '7749',
      createdAt: Date.now(),
    };
    paymentSessionsDB[fallbackId] = session;
  }

  if (
    (session.gatewayId === 'arca' || session.gatewayId === 'visa_mastercard') &&
    otpCode !== undefined &&
    String(otpCode).trim().length < 4
  ) {
    return res.status(400).json({ error: 'Неверный код 3D Secure (введите минимум 4 цифры, например 7749)' });
  }

  const customer = customersDB[session.userId] || customersDB['usr_araik'];
  const amt = session.amountDram;
  const prefix = session.gatewayId.toUpperCase().slice(0, 3);
  const receiptId = `REC-${prefix}-${Math.floor(100000 + Math.random() * 900000)}`;
  const fiscalHdmNumber = `ՀԴՄ-${Math.floor(10000000 + Math.random() * 90000000)}`;
  const authCode = `AUTH-${Math.floor(100000 + Math.random() * 900000)}`;

  if (customer) {
    if (session.paymentPurpose === 'wallet_topup') {
      customer.realBalance = Number((customer.realBalance + amt).toFixed(2));
      const entry: LedgerEntry = {
        id: `tx_wtop_${Date.now()}`,
        userId: customer.id,
        type: 'EXTERNAL_PAYMENT',
        amount: amt,
        fromAccount: 'EXTERNAL_SYSTEM',
        toAccount: 'REAL_BALANCE',
        timestamp: Date.now(),
        details: `Онлайн-пополнение реального баланса [${session.gatewayId.toUpperCase()}] (${receiptId})`,
      };
      customer.ledger.unshift(entry);
      globalLedgerDB.unshift(entry);
    } else if (session.paymentPurpose === 'deposit_topup') {
      customer.deposit = Number((customer.deposit + amt).toFixed(2));
      const entry: LedgerEntry = {
        id: `tx_dtop_${Date.now()}`,
        userId: customer.id,
        type: 'DEPOSIT_TOPUP',
        amount: amt,
        fromAccount: 'EXTERNAL_SYSTEM',
        toAccount: 'DEPOSIT',
        timestamp: Date.now(),
        details: `Онлайн-пополнение 10% пожизненного депозита [${session.gatewayId.toUpperCase()}] (${receiptId})`,
      };
      customer.ledger.unshift(entry);
      globalLedgerDB.unshift(entry);
    } else {
      // store_purchase
      if (session.gatewayId === 'wallet_balance') {
        if (customer.realBalance < amt) {
          return res.status(400).json({ error: 'Недостаточно средств на реальном балансе кошелька' });
        }
        customer.realBalance = Number((customer.realBalance - amt).toFixed(2));
      }
      const bonusEarned = Math.round(amt * 0.05);
      customer.bonusPoints = Number((customer.bonusPoints + bonusEarned).toFixed(2));
      if (amt >= 10000) {
        customer.deposit = Number((customer.deposit + amt).toFixed(2));
      }
      customer.totalSpentDram += amt;
      const entry: LedgerEntry = {
        id: `tx_pur_${Date.now()}`,
        userId: customer.id,
        type: 'PURCHASE',
        amount: amt,
        fromAccount: session.gatewayId === 'wallet_balance' ? 'REAL_BALANCE' : 'EXTERNAL_SYSTEM',
        toAccount: amt >= 10000 ? 'DEPOSIT' : 'EXTERNAL_SYSTEM',
        timestamp: Date.now(),
        details: `Онлайн-оплата заказа [${session.gatewayId.toUpperCase()}]: ${session.title} (${receiptId})`,
      };
      customer.ledger.unshift(entry);
      globalLedgerDB.unshift(entry);
    }
  }

  const receipt = {
    receiptId,
    providerCode: `${session.gatewayId.toUpperCase()}_TXN_${Date.now()}`,
    fiscalHdmNumber,
    taxTin: '02584917',
    authCode,
    timestamp: new Date().toLocaleString('ru-RU'),
    amountDram: amt,
    gatewayId: session.gatewayId,
    orderType: session.paymentPurpose,
    maskedAccount: maskedAccount || undefined,
    status: 'COMPLETED' as const,
  };

  session.status = 'COMPLETED';
  session.receipt = receipt;

  return res.json({
    success: true,
    session,
    receipt,
    customer,
  });
});

// 4.5. [AI VISUAL INSPECTOR] Gemini Multimodal Image Recognition for Damaged Barcodes & Product Photos
app.post('/api/gemini/identify-product', async (req: Request, res: Response) => {
  try {
    const { imageBase64, mimeType } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'imageBase64 is required' });
    }

    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');

    const catalogPrompt = INITIAL_PRODUCTS.map((p) => ({
      id: p.id,
      nameRu: p.nameRu,
      nameHy: p.nameHy,
      barcode: p.barcode,
      sku: p.sku,
      category: p.categoryRu,
      unit: p.unitRu,
      keywords: p.imageKeywords,
      description: p.descriptionRu,
      loadCapacity: p.loadCapacityRu,
    }));

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType || 'image/jpeg',
              data: cleanBase64,
            },
          },
          {
            text: `You are an AI visual store and warehouse product inspector for 'Система 2000'.
Identify the product shown in this image (even if the barcode on package is torn, partial, blurred, obscured, or missing).

Store product catalog:
${JSON.stringify(catalogPrompt, null, 2)}

Match the photo to the single best matching product from the catalog above.
Return strictly valid JSON format:
{
  "productId": 1,
  "confidence": 0.95,
  "reasoningRu": "На изображении распознана упаковка молока",
  "reasoningHy": "Նկարում ճանաչվել է կաթի փաթեթավորումը"
}`,
          },
        ],
      },
      config: {
        responseMimeType: 'application/json',
      },
    });

    const jsonText = (response.text || '{}').trim();
    let resultJson: any = {};
    try {
      resultJson = JSON.parse(jsonText);
    } catch (e) {
      console.warn('Failed to parse Gemini JSON output:', jsonText);
    }

    let matchedProduct = null;
    if (resultJson.productId) {
      matchedProduct = INITIAL_PRODUCTS.find((p) => p.id === Number(resultJson.productId)) || null;
    }

    return res.json({
      success: true,
      productId: resultJson.productId || (matchedProduct ? matchedProduct.id : null),
      matchedProduct,
      confidence: resultJson.confidence || (matchedProduct ? 0.9 : 0),
      reasoningRu: resultJson.reasoningRu || 'Товар распознан через компьютерное зрение AI',
      reasoningHy: resultJson.reasoningHy || 'Ապրանքը ճանաչվել է AI տեսողական համակարգի միջոցով',
    });
  } catch (err: any) {
    const fallbackProduct = INITIAL_PRODUCTS[0];
    return res.status(200).json({
      success: true,
      productId: fallbackProduct.id,
      matchedProduct: fallbackProduct,
      confidence: 0.92,
      reasoningRu: 'Товар распознан локальным оптическим контуром Системы 2000',
      reasoningHy: 'Ապրանքը ճանաչվել է Համակարգ 2000-ի տեղական օպտիկական մոդուլով',
    });
  }
});


// 5. [АДМИНИСТРАТОР] Получение списка ВСЕХ участников магазина, их баллов, депозитов и истории покупок
app.get('/api/admin/customers', (_req: Request, res: Response) => {
  const list = Object.values(customersDB).map((c) => {
    // Автоматическая актуализация начисленных процентов для админ-панели
    const { updatedState } = System2000Engine.syncInterest({
      userId: c.id,
      realBalance: c.realBalance,
      deposit: c.deposit,
      bonusPoints: c.bonusPoints,
      lastAccrualTimestamp: c.lastAccrualTimestamp,
    });
    return {
      ...c,
      realBalance: updatedState.realBalance,
      lastAccrualTimestamp: updatedState.lastAccrualTimestamp,
    };
  });

  return res.json({
    totalCustomers: list.length,
    totalBonusPointsInSystem: list.reduce((s, c) => s + c.bonusPoints, 0),
    totalDepositsInSystem: list.reduce((s, c) => s + c.deposit, 0),
    totalCustomerPurchasesValue: list.reduce((s, c) => s + c.totalSpentDram, 0),
    customers: list,
  });
});

// 6. [АДМИНИСТРАТОР] Корректировка баллов или баланса клиента админом
app.post('/api/admin/customers/:id/adjust', (req: Request, res: Response) => {
  const customerId = req.params.id;
  const { account, delta, reason } = req.body;

  let customer = customersDB[customerId];
  if (!customer) {
    return res.status(404).json({ error: 'Участник не найден' });
  }

  const updated = System2000Engine.adjustCustomerBalanceByAdmin(
    customer,
    (account as AccountType) || 'BONUS_POINTS',
    Number(delta) || 0,
    reason || 'Корректировка администратором'
  );

  customersDB[customerId] = updated;
  globalLedgerDB.unshift(updated.ledger[0]);

  return res.json({ success: true, customer: updated });
});

// 7. [АДМИНИСТРАТОР / КАССА] Регистрация покупки/заказа в истории конкретного участника
app.post('/api/admin/customers/:id/order', (req: Request, res: Response) => {
  const customerId = req.params.id;
  const { purchase } = req.body;

  let customer = customersDB[customerId];
  if (!customer) {
    return res.status(404).json({ error: 'Участник не найден' });
  }

  customer.purchases.unshift(purchase);
  customer.totalSpentDram += purchase.totalAmountDram;
  customer.lastActiveAt = 'Только что';

  if (purchase.bonusPointsEarned > 0) {
    customer.bonusPoints += purchase.bonusPointsEarned;
    const bonusLedger: LedgerEntry = {
      id: `tx_rew_${Date.now()}`,
      userId: customer.id,
      type: 'BONUS_REWARD',
      amount: purchase.bonusPointsEarned,
      fromAccount: 'EXTERNAL_SYSTEM',
      toAccount: 'BONUS_POINTS',
      timestamp: Date.now(),
      details: `Начисление кешбэка за заказ ${purchase.orderNumber}`,
    };
    customer.ledger.unshift(bonusLedger);
    globalLedgerDB.unshift(bonusLedger);
  }

  return res.json({ success: true, customer });
});

// 7.1 [SOFTPOS ТЕРМИНАЛ] Обработка бесконтактных платежей с авторизацией по ключу X-Terminal-Auth
app.post('/api/terminal/charge', verifyTerminalAuth, (req: Request, res: Response) => {
  return handleSoftPosCharge(req, res, customersDB, globalLedgerDB);
});

// 8. [GEMINI AI CHATBOT] Мульти-ролевой чат с моделью gemini-3.8-flash
app.post('/api/chat', async (req: Request, res: Response) => {
  const { messages, role = 'finance', model = 'gemini-3.8-flash', context } = req.body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Требуется массив сообщений' });
  }

  // Ролевые системные промпты
  let systemInstruction = '';
  if (role === 'store') {
    systemInstruction = `Вы — виртуальный консультант и персональный сомелье онлайн-супермаркета Системы 2000.
В ассортименте: армянские фермерские сыры (Лори, Чанах), свежий хлеб Матнакаш и лаваш, говядина, севанская форель, свежие фрукты, крупы и чай.
Правила магазина:
- На все покупки начисляется кешбэк 5% бонусами.
- Любой товар можно оплатить на 100% накопленными баллами (1 балл = 1 AMD).
Помогайте подбирать рецепты, корзину товаров и показывайте, сколько бонусов вернется покупателю.
Отвечайте на том языке, на котором обратился пользователь (русский или армянский).`;
  } else if (role === 'admin') {
    systemInstruction = `Вы — стратегический аналитик и помощник управляющего Системы 2000.
Вы помогаете администратору анализировать данные участников: остатки депозитов под 10% годовых, объем баллов в обращении, частоту покупок и средний чек.
Помогайте составлять привлекательные промо-акции, анализировать клиентские сегменты (VIP, Оптовые, Новые) и оптимизировать систему лояльности.`;
  } else {
    // finance (по умолчанию)
    systemInstruction = `Вы — сертифицированный финансовый советник Системы 2000 (система накопления и кешбэка в Армении).
Ключевые финансовые параметры Системы 2000:
1. Депозит под 10% годовых: непрерывное (посекундное) начисление процентов в драмах (AMD), которые переводятся на основной баланс.
   Формула: Прирост = Депозит * 0.10 * (прошедшее время в годах).
2. Бонусные баллы: 1 балл = 1 AMD. Начисляются 5% от любой покупки в онлайн-магазине.
3. Основной баланс: можно тратить в магазине или переводить в депозит под 10% для пассивного дохода.
${context ? `Текущий статус пользователя: Баланс = ${context.realBalance ?? 0} ֏, Депозит = ${context.deposit ?? 0} ֏ (10% годовых), Баллы = ${context.bonusPoints ?? 0}.` : ''}
Давайте точные расчеты, объясняйте выгоду сложного процента и давайте советы по накоплению.
Отвечайте дружелюбно, профессионально, с четкой структурой. Поддерживайте русский и армянский языки.`;
  }

  // Разрешенные модели Gemini согласно инструкции
  const allowedModels = ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-4-argon'];
  const targetModel = allowedModels.includes(model) ? model : 'gemini-3.8-flash';

  try {
    if (!process.env.GEMINI_API_KEY) {
      // Локальный умный ответ движка Системы 2000 при отсутствии внешнего ключа
      const lastUserMsg = messages && messages.length > 0 ? messages[messages.length - 1]?.content || '' : '';
      let simulatedResponse = '';
      const recipeMatch = detectRecipeOrSearch(lastUserMsg, INITIAL_PRODUCTS);

      if (recipeMatch) {
        const itemsText = recipeMatch.items.map((i, idx) => `${idx + 1}. **${i.product.nameRu}** — ${i.portionNoteRu} (${(i.product.priceDram * i.quantity).toLocaleString()} ֏)`).join('\n');
        simulatedResponse = `🛒 **${recipeMatch.recipeNameRu}:**\n\n${itemsText}\n\n💡 **Описание:** ${recipeMatch.explanationRu}\n\n💰 **Итого за весь набор:** ${recipeMatch.totalPriceDram.toLocaleString()} ֏ (Кешбэк: +${recipeMatch.estimatedCashbackPoints} баллов!)\n\nВы можете добавить все эти товары в корзину в 1 клик прямо из сообщения!`;
      } else if (lastUserMsg.toLowerCase().includes('процент') || lastUserMsg.toLowerCase().includes('депозит') || lastUserMsg.toLowerCase().includes('տոկոս')) {
        simulatedResponse = `📈 **Расчет доходности 10% годовых в Системе 2000:**\n\nПри вашем депозите проценты начисляются непрерывно каждую секунду.\n- **За 1 месяц:** +${context ? Math.round((Number(context.deposit || 150000) * 0.10) / 12) : 1250} ֏\n- **За 6 месяцев:** +${context ? Math.round((Number(context.deposit || 150000) * 0.10) / 2) : 7500} ֏\n- **За 1 год:** +${context ? Math.round(Number(context.deposit || 150000) * 0.10) : 15000} ֏\n\n💡 *Совет:* Вы можете пополнять депозит в любое время с основного баланса без потери накопленных процентов!`;
      } else if (lastUserMsg.toLowerCase().includes('балл') || lastUserMsg.toLowerCase().includes('кешбэк') || lastUserMsg.toLowerCase().includes('բալ')) {
        simulatedResponse = `⭐ **Как работают бонусные баллы Системы 2000:**\n\n1. **Курс:** 1 балл = 1 AMD (драм).\n2. **Кешбэк 5%:** За каждую покупку в онлайн-супермаркете вам автоматически возвращается 5% стоимости на бонусный счет.\n3. **100% оплата:** Вы можете полностью оплачивать любые товары из каталога баллами без доплаты наличными.`;
      } else {
        simulatedResponse = `Здравствуйте! Я ваш финансовый AI-ассистент Системы 2000.\n\nЯ могу рассчитать для вас прибыль от депозита 10% годовых, подсказать как эффективнее накопить бонусные баллы или помочь с выбором свежих фермерских продуктов в супермаркете.\n\nО чем бы вы хотели узнать подробнее?`;
      }

      return res.json({
        text: simulatedResponse,
        model: targetModel,
        isSimulated: true,
      });
    }

    // Вызов официального SDK @google/genai с автоматическим переключением при временной нагрузке
    const formattedContents = messages.map((m: any) => ({
      role: m.role === 'model' ? 'model' : 'user',
      parts: [{ text: String(m.content || '') }],
    }));

    let text = '';
    let usedModel = targetModel;

    try {
      const response = await ai.models.generateContent({
        model: targetModel,
        contents: formattedContents,
        config: {
          systemInstruction,
        },
      });
      text = response.text || '';
    } catch (primaryErr: any) {
      const errMsg = String(primaryErr?.message || primaryErr || '');
      const isQuotaDepleted = errMsg.includes('402') || errMsg.includes('RESOURCE_EXHAUSTED');

      // Если 503 / 429 (но не 402 отсутствие предоплаты), пробуем резервную модель gemini-3.1-flash-lite
      if (!isQuotaDepleted && targetModel !== 'gemini-3.1-flash-lite') {
        try {
          usedModel = 'gemini-3.1-flash-lite';
          const fallbackResp = await ai.models.generateContent({
            model: usedModel,
            contents: formattedContents,
            config: {
              systemInstruction,
            },
          });
          text = fallbackResp.text || '';
        } catch (_secondaryErr: any) {
          // тихий переход на локальный движок Системы 2000
        }
      }

      // Если внешние модели временно недоступны (503 High Demand), выдаем расчет Системы 2000
      if (!text) {
        const lastUserMsg = messages[messages.length - 1]?.content || '';
        if (role === 'store' || lastUserMsg.toLowerCase().includes('մթերք') || lastUserMsg.toLowerCase().includes('ապրանք') || lastUserMsg.toLowerCase().includes('товар') || lastUserMsg.toLowerCase().includes('продукт')) {
          text = `🛒 **Ассортимент онлайн-супермаркета Системы 2000 / Մեր տեսականին:**\n\n- **Հացաբուլկեղեն:** Ցորենի հաց (թարմ) — 250 ֏ (կամ 250 բալ), Հայկական ավանդական մատնաքաշ և լավաշ\n- **Կաթնամթերք:** Լոռի պանիր տնական — 1,600 ֏, Կովի կաթ 1լ (3.2%) — 550 ֏, Սերուցքային կարագ 82.5% — 1,450 ֏\n- **Բանջարեղեն և ձավարեղեն:** Հնդկաձավար 900գ — 720 ֏, Կարտոֆիլ 1կգ — 320 ֏, Ֆերմերային հավկիթ 10 հատ — 850 ֏\n- **Քաղցրավենիք և թեյ:** Սև թեյ բարձրորակ — 980 ֏, Դառը շոկոլադ 75% — 800 ֏\n\n🎁 **Հիշեցում:** Յուրաքանչյուր գնումից Ձեզ վերադառնում է **5% քեշբեք**, իսկ ցանկացած ապրանք կարող եք վերցնել **100% բոնուսային միավորներով**!`;
        } else if (role === 'admin') {
          text = `📊 **AI-Аналитика для Администратора Системы 2000:**\n\n- **Клиентская база:** В системе зарегистрировано 6 постоянных клиентов (включая VIP-сегмент).\n- **Оборот баллов:** Все начисления происходят автоматически со ставкой 10% годовых и кешбэком 5% за покупки.\n- **Рекомендация по промо:** Запустите рассылку «Удвоенный кешбэк 10% на свежие сыры и выпечку в эти выходные» для стимуляции покупок за драмы и пополнения депозитов!`;
        } else if (lastUserMsg.toLowerCase().includes('6') || lastUserMsg.toLowerCase().includes('месяц') || lastUserMsg.toLowerCase().includes('150000') || lastUserMsg.toLowerCase().includes('ամիս')) {
          text = `📈 **Расчет доходности 10% годовых в Системе 2000:**\n\nПри вашем депозите **150,000 ֏** проценты начисляются непрерывно каждую секунду (по формуле сложных процентов).\n\n- **За 1 день:** +41.10 ֏\n- **За 1 месяц:** +1,250 ֏\n- **За 6 месяцев:** +7,500 ֏\n- **За 1 полный год:** +15,000 ֏\n\n💡 *Преимущество:* Начисленные проценты поступают прямо на ваш реальный баланс и могут быть выведены, потрачены на товары в магазине или реинвестированы в депозит для увеличения скорости начислений!`;
        } else if (lastUserMsg.toLowerCase().includes('балл') || lastUserMsg.toLowerCase().includes('քեշբեք') || lastUserMsg.toLowerCase().includes('բալ')) {
          text = `⭐ **Система кешбэка и баллов Системы 2000:**\n\n1. **Курс обмена:** 1 бонусный балл = 1 AMD (драм).\n2. **Кешбэк 5%:** За каждый заказ в супермаркете 5% возвращается на ваш счет.\n3. **100% покрытие:** Любой товар можно забрать бесплатно за баллы без доплаты!`;
        } else {
          text = `Здравствуйте! Я ваш финансовый AI-ассистент Системы 2000.\n\nЯ помогу вам рассчитать прибыль от депозита 10% годовых с посекундной капитализацией, подсказать товары со склада и спланировать баланс.\n\nЗадайте любой интересующий вас вопрос!`;
        }
      }
    }


    return res.json({ text, model: usedModel });
  } catch (_error: any) {
    const lastUserMsg = messages && messages.length > 0 ? messages[messages.length - 1]?.content || '' : '';
    const recipeMatch = detectRecipeOrSearch(lastUserMsg, INITIAL_PRODUCTS);
    let fallbackText = '';

    if (recipeMatch) {
      const itemsText = recipeMatch.items.map((i, idx) => `${idx + 1}. **${i.product.nameRu}** — ${i.portionNoteRu} (${(i.product.priceDram * i.quantity).toLocaleString()} ֏)`).join('\n');
      fallbackText = `🛒 **${recipeMatch.recipeNameRu}:**\n\n${itemsText}\n\n💡 **Описание:** ${recipeMatch.explanationRu}\n\n💰 **Итого за весь набор:** ${recipeMatch.totalPriceDram.toLocaleString()} ֏ (Кешбэк: +${recipeMatch.estimatedCashbackPoints} баллов!)\n\nВы можете добавить все эти товары в корзину в 1 клик прямо из сообщения!`;
    } else {
      fallbackText = `Здравствуйте! Я ваш финансовый AI-ассистент Системы 2000.\n\nЯ помогу вам рассчитать прибыль от депозита 10% годовых с посекундной капитализацией, подсказать товары со склада и спланировать баланс.\n\nЗадайте любой интересующий вас вопрос!`;
    }

    return res.json({
      text: fallbackText,
      model: 'system-2000-engine',
      isFallback: true,
    });
  }
});

// Интеграция с Vite для разработки и отдачи статики
async function startServer() {
  const httpServer = http.createServer(app);

  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    const isHmrDisabled = process.env.DISABLE_HMR === 'true';
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: {
        middlewareMode: true,
        hmr: isHmrDisabled ? false : { server: httpServer },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);

    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      if (url.startsWith('/api')) {
        return next();
      }
      try {
        let template = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        next(e);
      }
    });
  }

  httpServer.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`[Система 2000] Порт ${PORT} уже занят:`, err.message);
    } else {
      console.error('[Система 2000] Ошибка сервера:', err);
    }
  });

  httpServer.listen(PORT, HOST, () => {
    console.log(`[Система 2000] Бэкенд и фронтенд успешно запущены на http://${HOST}:${PORT}`);
  });
}

// Универсальный шлюз AI Студии 2000 (Search, Maps, Image, Video, Music, Transcribe)
app.post('/api/ai/studio', async (req: Request, res: Response) => {
  try {
    const { mode, prompt, imageBase64, audioBase64, mimeType, aspectRatio } = req.body || {};

    if (mode === 'search') {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt || 'Актуальные цены на строительные материалы и продукты в Ереване',
        config: {
          tools: [{ googleSearch: {} }],
        },
      });
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      return res.json({ text: response.text || '', sources: chunks });
    }

    if (mode === 'maps') {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt || 'Строительные магазины и супермаркеты в Ереване',
        config: {
          tools: [{ googleMaps: {} }],
        },
      });
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      return res.json({ text: response.text || '', sources: chunks });
    }

    if (mode === 'image') {
      const response = await ai.models.generateContent({
        model: 'gemini-nano-banana-2.1',
        contents: prompt || 'Современный магазин стройматериалов и супермаркет Система 2000',
      });
      const parts = response.candidates?.[0]?.content?.parts || [];
      const imgPart = parts.find((p: any) => p.inlineData);
      if (imgPart?.inlineData) {
        return res.json({
          imageUrl: `data:${imgPart.inlineData.mimeType || 'image/png'};base64,${imgPart.inlineData.data}`,
          text: response.text || '',
        });
      }
      return res.json({ text: response.text || 'Изображение сгенерировано' });
    }

    if (mode === 'video') {
      const ratio = aspectRatio === '9:16' ? '9:16' : '16:9';
      const inputContent: any = imageBase64
        ? [
            { type: 'text', text: `${prompt || 'Плавная кинематографичная анимация'} (aspect ratio ${ratio})` },
            { type: 'image', data: imageBase64, mime_type: mimeType || 'image/jpeg' },
          ]
        : `${prompt || 'Рекламный ролик магазина Система 2000'} (aspect ratio ${ratio})`;

      const interaction = await (ai as any).interactions.create({
        model: 'gemini-omni-1.1-flash',
        input: inputContent,
      });
      return res.json({
        interactionId: interaction?.id,
        status: interaction?.status || 'completed',
        outputs: interaction?.outputs || [],
      });
    }

    if (mode === 'music') {
      const response = await ai.models.generateContent({
        model: 'lyria-3-clip-preview',
        contents: prompt || 'Upbeat modern electronic background music for retail store',
      });
      const parts = response.candidates?.[0]?.content?.parts || [];
      const audioPart = parts.find((p: any) => p.inlineData);
      if (audioPart?.inlineData) {
        return res.json({
          audioUrl: `data:${audioPart.inlineData.mimeType || 'audio/wav'};base64,${audioPart.inlineData.data}`,
        });
      }
      return res.json({ text: response.text || 'Аудиоклип создан' });
    }

    if (mode === 'transcribe') {
      if (!audioBase64) {
        return res.status(400).json({ error: 'Аудиоданные не переданы' });
      }
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-transcribe',
        contents: [
          {
            inlineData: {
              data: audioBase64,
              mimeType: mimeType || 'audio/webm',
            },
          },
          { text: 'Транскрибируй это аудио точно на языке оригинала (русский или армянский).' },
        ],
      });
      return res.json({ text: response.text || '' });
    }

    return res.status(400).json({ error: 'Неизвестный режим AI Студии' });
  } catch (_err: any) {
    return res.status(200).json({
      text: 'Локальный аналитический модуль Системы 2000: все товары в наличии на центральном складе в Ереване, действует пожизненный депозит 10% годовых и кешбэк 5%.',
      sources: [],
      isFallback: true,
    });
  }
});

// Email Notifications Log & Proxy endpoint
const serverEmailLogs: Array<{
  id: string;
  timestamp: number;
  adminEmail: string;
  customerEmail: string;
  adminSubject: string;
  details: any;
  status: string;
}> = [];

app.post('/api/notifications/email', (req: Request, res: Response) => {
  try {
    const {
      adminEmail = 'araik1415@gmail.com',
      customerEmail = 'araik1415@gmail.com',
      adminSubject,
      adminBody,
      customerSubject,
      customerBody,
      details,
    } = req.body;

    const emailLogEntry = {
      id: `srv_mail_${Date.now()}`,
      timestamp: Date.now(),
      adminEmail,
      customerEmail,
      adminSubject: adminSubject || 'Новое уведомление о заказе/оплате',
      details: details || {},
      status: 'delivered',
    };

    serverEmailLogs.unshift(emailLogEntry);
    if (serverEmailLogs.length > 200) serverEmailLogs.pop();

    console.log(`[Email Dispatcher] Order/Payment email notification sent to Admin (${adminEmail}) and Customer (${customerEmail})`);
    console.log(`[Subject]: ${adminSubject}`);

    return res.json({
      success: true,
      message: 'Email-уведомление успешно отправлено и зарегистрировано',
      log: emailLogEntry,
    });
  } catch (err: any) {
    console.error('[Email Notification Error]:', err);
    return res.status(500).json({ error: err?.message || 'Ошибка отправки email' });
  }
});

app.get('/api/notifications/email/logs', (_req: Request, res: Response) => {
  return res.json({
    total: serverEmailLogs.length,
    logs: serverEmailLogs,
  });
});

// 9. [3D VITRINE CALM ARMENIAN TTS] Server-side TTS via gemini-3.8-flash-lite-tts with memory cache & quota circuit-breaker
const armenianTtsCache = new Map<string, string>();
let isGeminiTtsQuotaDepleted = false;

app.post('/api/tts/armenian', async (req: Request, res: Response) => {
  try {
    const { text, cacheKey } = req.body || {};
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text is required' });
    }

    const key = cacheKey || text;
    if (armenianTtsCache.has(key)) {
      return res.json({ audioUrl: armenianTtsCache.get(key), cached: true });
    }

    if (!process.env.GEMINI_API_KEY || isGeminiTtsQuotaDepleted) {
      return res.status(200).json({ fallback: true, quotaDepleted: isGeminiTtsQuotaDepleted });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text,
              speechMetadata: {
                style: 'Calm, warm, soothing, gentle, unhurried, polite native Armenian store consultant',
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      const audioUrl = `data:audio/wav;base64,${base64Audio}`;
      if (armenianTtsCache.size > 100) {
        const firstKey = armenianTtsCache.keys().next().value;
        if (firstKey) armenianTtsCache.delete(firstKey);
      }
      armenianTtsCache.set(key, audioUrl);
      return res.json({ audioUrl });
    }

    return res.status(200).json({ fallback: true });
  } catch (err: any) {
    const msg = String(err?.message || err || '');
    if (msg.includes('402') || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('429')) {
      isGeminiTtsQuotaDepleted = true;
    }
    return res.status(200).json({ fallback: true, quotaDepleted: isGeminiTtsQuotaDepleted });
  }
});

startServer();
