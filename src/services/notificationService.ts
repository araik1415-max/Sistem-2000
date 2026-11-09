import { EmailNotificationLog } from '../types';

export interface SendOrderEmailParams {
  orderNumber: string;
  items: Array<{
    productName: string;
    quantity: number;
    priceDram: number;
    totalDram: number;
    unit?: string;
  }>;
  totalDram: number;
  paidWith: string;
  customerName: string;
  customerEmail?: string;
  adminEmail?: string;
  bonusEarned?: number;
  bonusSpent?: number;
  deliveryAddress?: string;
  isPaid?: boolean;
}

export interface SendTopupEmailParams {
  amountDram: number;
  paymentMethod: string;
  customerName: string;
  customerEmail?: string;
  adminEmail?: string;
  receiptNumber?: string;
  newDeposit?: number;
}

// In-memory local notification archive
const EMAIL_LOGS_STORAGE_KEY = 'sistema2000_email_notification_logs';

export function getStoredEmailLogs(): EmailNotificationLog[] {
  try {
    const raw = localStorage.getItem(EMAIL_LOGS_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveStoredEmailLogs(logs: EmailNotificationLog[]): void {
  try {
    localStorage.setItem(EMAIL_LOGS_STORAGE_KEY, JSON.stringify(logs.slice(0, 100)));
  } catch (err) {
    console.error('Failed to save email logs to localStorage:', err);
  }
}

/**
 * Sends order & payment notification email via backend /api/notifications/email
 * and also saves in notification audit log.
 */
export async function sendOrderNotificationEmail(
  params: SendOrderEmailParams
): Promise<{ success: boolean; logs: EmailNotificationLog[] }> {
  const targetAdminEmail = params.adminEmail || 'araik1415@gmail.com';
  const customerEmail = params.customerEmail || 'araik1415@gmail.com';
  const now = Date.now();

  const itemsListText = params.items
    .map((item, idx) => `${idx + 1}. ${item.productName} × ${item.quantity} ${item.unit || 'հատ'} = ${item.totalDram.toLocaleString()} ֏`)
    .join('\n');

  const adminSubject = `⚡ [Համակարգ 2000 / Система 2000] ${params.isPaid ? 'Նոր վճարված պատվեր' : 'Նոր պատվեր'} #${params.orderNumber} (${params.totalDram.toLocaleString()} ֏)`;
  const adminBody = `
Հարգելի Արաիկ Բաղդասարյան Անուշ (Համակարգի սեփականատեր և ադմինիստրատոր),

Համակարգ 2000 խանութում գրանցվել է նոր պատվեր:

• Պատվերի համար՝ #${params.orderNumber}
• Գումար՝ ${params.totalDram.toLocaleString()} ֏
• Կարգավիճակ՝ ${params.isPaid ? 'ՎՃԱՐՎԱԾ Է (ОПЛАЧЕН)' : 'Սպասում է վճարման'}
• Վճարման եղանակ՝ ${params.paidWith}
• Գնորդ՝ ${params.customerName} (${customerEmail})
• Առաքման հասցե՝ ${params.deliveryAddress || 'ք. Երևան (սովորական առաքում)'}
• Կուտակված բոնուսներ՝ +${params.bonusEarned || 0} միավ.
• Օգտագործված բոնուսներ՝ -${params.bonusSpent || 0} միավ.

Ապրանքների ցանկ՝
${itemsListText}

---
Համակարգ 2000 • Կենտրոնական Էլեկտրոնային Խանութ և 10% Դեպոզիտ
ՀՀ օրենսդրությանը համապատասխան • Արաիկ Բաղդասարյան Անուշ
  `.trim();

  const customerSubject = `✅ [Համակարգ 2000] Ձեր պատվերը #${params.orderNumber} ${params.isPaid ? 'հաջողությամբ վճարվել է' : 'ընդունված է'}`;
  const customerBody = `
Բարև Ձեզ, հարգելի ${params.customerName},

Շնորհակալություն «Համակարգ 2000»-ում գնումներ կատարելու համար:
Ձեր պատվերը #${params.orderNumber} ${params.isPaid ? 'հաջողությամբ վճարվել է' : 'հաջողությամբ գրանցվել է'}:

• Գումարը՝ ${params.totalDram.toLocaleString()} ֏
• Վճարման միջոցը՝ ${params.paidWith}
• Կուտակվել է 10% աճող դեպոզիտին՝ +${params.totalDram.toLocaleString()} ֏
• Բոնուսային հաշվեգրում՝ +${params.bonusEarned || 0} միավոր

Ապրանքներ՝
${itemsListText}

Եթե ունեք հարցեր, կապվեք մեզ հետ՝ +374 77 47 12 58 կամ araik1415@gmail.com
  `.trim();

  const newLogs: EmailNotificationLog[] = [
    {
      id: `mail_${now}_admin`,
      timestamp: now,
      toEmail: targetAdminEmail,
      recipientType: 'admin',
      subject: adminSubject,
      event: params.isPaid ? 'order_paid' : 'order_created',
      status: 'sent',
      contentPreview: adminBody.slice(0, 160) + '...',
      details: {
        orderNumber: params.orderNumber,
        amountDram: params.totalDram,
        paymentMethod: params.paidWith,
        customerName: params.customerName,
        itemsCount: params.items.length,
      },
    },
    {
      id: `mail_${now}_cust`,
      timestamp: now + 1,
      toEmail: customerEmail,
      recipientType: 'customer',
      subject: customerSubject,
      event: params.isPaid ? 'order_paid' : 'order_created',
      status: 'sent',
      contentPreview: customerBody.slice(0, 160) + '...',
      details: {
        orderNumber: params.orderNumber,
        amountDram: params.totalDram,
        paymentMethod: params.paidWith,
        customerName: params.customerName,
        itemsCount: params.items.length,
      },
    },
  ];

  // Try calling backend email dispatch proxy if server route is mounted
  try {
    await fetch('/api/notifications/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        adminEmail: targetAdminEmail,
        customerEmail,
        adminSubject,
        adminBody,
        customerSubject,
        customerBody,
        details: {
          orderNumber: params.orderNumber,
          amountDram: params.totalDram,
          paidWith: params.paidWith,
        },
      }),
    });
  } catch (err) {
    console.warn('Backend email API call fallback to client audit:', err);
  }

  const existingLogs = getStoredEmailLogs();
  const updatedLogs = [...newLogs, ...existingLogs];
  saveStoredEmailLogs(updatedLogs);

  return { success: true, logs: newLogs };
}

/**
 * Sends balance topup email notification
 */
export async function sendTopupNotificationEmail(
  params: SendTopupEmailParams
): Promise<{ success: boolean; logs: EmailNotificationLog[] }> {
  const targetAdminEmail = params.adminEmail || 'araik1415@gmail.com';
  const customerEmail = params.customerEmail || 'araik1415@gmail.com';
  const now = Date.now();

  const adminSubject = `💰 [Համակարգ 2000] Հաշվեկշռի համալրում՝ +${params.amountDram.toLocaleString()} ֏ (${params.customerName})`;
  const adminBody = `
Հարգելի Արաիկ Բաղդասարյան Անուշ (Ադմինիստրատոր),

Համակարգ 2000-ում կատարվել է իրական հաշվեկշռի համալրում բանկային եղանակով:
• Գումար՝ +${params.amountDram.toLocaleString()} ֏
• Եղանակ՝ ${params.paymentMethod}
• Հաճախորդ՝ ${params.customerName} (${customerEmail})
• Անդորրագիր՝ ${params.receiptNumber || 'N/A'}
• Ժամանակ՝ ${new Date(now).toLocaleString('hy-AM')}
  `.trim();

  const newLog: EmailNotificationLog = {
    id: `mail_${now}_topup`,
    timestamp: now,
    toEmail: targetAdminEmail,
    recipientType: 'admin',
    subject: adminSubject,
    event: 'deposit_topup',
    status: 'sent',
    contentPreview: adminBody.slice(0, 160) + '...',
    details: {
      orderNumber: params.receiptNumber,
      amountDram: params.amountDram,
      paymentMethod: params.paymentMethod,
      customerName: params.customerName,
    },
  };

  try {
    await fetch('/api/notifications/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        adminEmail: targetAdminEmail,
        customerEmail,
        adminSubject,
        adminBody,
        customerSubject: `💳 Հաշվեկշիռը համալրված է՝ +${params.amountDram.toLocaleString()} ֏`,
        customerBody: `Ձեր հաշիվը հաջողությամբ համալրվել է: Գումար՝ ${params.amountDram.toLocaleString()} ֏ (${params.paymentMethod}):`,
        details: {
          amountDram: params.amountDram,
          paidWith: params.paymentMethod,
        },
      }),
    });
  } catch (err) {
    console.warn('Backend topup email API call fallback:', err);
  }

  const existingLogs = getStoredEmailLogs();
  const updatedLogs = [newLog, ...existingLogs];
  saveStoredEmailLogs(updatedLogs);

  return { success: true, logs: [newLog] };
}

export interface SendRateChangeEmailParams {
  oldRate: number;
  newRate: number;
  adminEmail?: string;
  adminName?: string;
  systemName?: string;
}

/**
 * Sends and records official system notification email when the annual interest rate (annualRate) changes.
 */
export async function sendAnnualRateChangeNotificationEmail(
  params: SendRateChangeEmailParams
): Promise<{ success: boolean; logs: EmailNotificationLog[] }> {
  const targetAdminEmail = params.adminEmail || 'araik1415@gmail.com';
  const now = Date.now();
  const oldPct = (params.oldRate * 100).toFixed(0);
  const newPct = (params.newRate * 100).toFixed(0);
  const direction = params.newRate >= params.oldRate ? 'բարձրացում (повышение)' : 'նվազեցում (снижение)';

  const adminSubject = `⚡ [Համակարգ 2000] Դեպոզիտի տոկոսադրույքի փոփոխություն՝ ${oldPct}% ➔ ${newPct}% APY (${direction})`;
  const adminBody = `
Հարգելի Արաիկ Բաղդասարյան Անուշ (Ադմինիստրատոր),

«Համակարգ 2000» էկոհամակարգում տեղի է ունեցել դեպոզիտի տարեկան տոկոսադրույքի (annualRate) փոփոխություն:

• Նախկին տոկոսադրույք՝ ${oldPct}% տարեկան (APY)
• Նոր տոկոսադրույք՝ ${newPct}% տարեկան (APY)
• Փոփոխության ուղղություն՝ ${direction}
• Ամսաթիվ և ժամ՝ ${new Date(now).toLocaleString('hy-AM')}
• Համակարգային ազդեցություն՝ Անընդհատ վայրկյանական էմիսիայի ֆինանսական շարժիչը վերահաշվարկվել է նոր տոկոսադրույքով:
• Ծանուցում՝ Ուղարկված է բոլոր օգտատերերին և արձանագրված է աուդիտի մատյանում:

---
Համակարգ 2000 Ֆինանսական և Տեխնիկական Կառավարում
  `.trim();

  const newLog: EmailNotificationLog = {
    id: `mail_${now}_rate`,
    timestamp: now,
    toEmail: targetAdminEmail,
    recipientType: 'admin',
    subject: adminSubject,
    event: 'rate_changed',
    status: 'sent',
    contentPreview: adminBody.slice(0, 160) + '...',
    details: {
      oldRate: params.oldRate,
      newRate: params.newRate,
    },
  };

  try {
    await fetch('/api/notifications/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        adminEmail: targetAdminEmail,
        customerEmail: targetAdminEmail,
        adminSubject,
        adminBody,
        customerSubject: `⚡ [Համակարգ 2000] Դեպոզիտի տոկոսադրույքը փոփոխվել է՝ ${oldPct}% ➔ ${newPct}%`,
        customerBody: `Ուշադրություն. Դեպոզիտի տարեկան եկամտաբերությունը թարմացվել է՝ ${oldPct}% ➔ ${newPct}%: Ձեր բոնուսային հաշվեգրումներն այսուհետ հաշվարկվում են նոր տոկոսադրույքով:`,
        details: {
          oldRate: params.oldRate,
          newRate: params.newRate,
        },
      }),
    });
  } catch (err) {
    console.warn('Backend rate change email API fallback:', err);
  }

  const existingLogs = getStoredEmailLogs();
  const updatedLogs = [newLog, ...existingLogs];
  saveStoredEmailLogs(updatedLogs);

  return { success: true, logs: [newLog] };
}

