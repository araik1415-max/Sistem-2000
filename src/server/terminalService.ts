import { Request, Response, NextFunction } from 'express';
import { CustomerAccount, LedgerEntry } from '../types';

export interface SoftPosTransactionRequest {
  terminalId: string;
  encryptedCardData?: string;
  amount: number;
  userId?: string;
  orderId?: string;
  clientPhone?: string;
  creditToDeposit?: boolean;
  simulateError?: string;
}

/**
 * Middleware для проверки ключа авторизации терминала (SoftPOS)
 * Возвращает HTTP 403 Forbidden, если передан неверный или пустой ключ
 */
export const verifyTerminalAuth = (req: Request, res: Response, next: NextFunction) => {
  const terminalAuthHeader = req.headers['x-terminal-auth'];
  const secureKey = process.env.TERMINAL_SECRET_KEY || 'SECRET_TERMINAL_KEY';

  if (!terminalAuthHeader || terminalAuthHeader !== secureKey) {
    console.warn(`[SoftPOS Auth] Доступ запрещен (HTTP 403): неверный ключ терминала '${terminalAuthHeader}' (ожидается '${secureKey}')`);
    return res.status(403).json({
      error: 'Доступ запрещен: неверный ключ авторизации терминала (X-Terminal-Auth)',
      code: 'ERR_TERMINAL_AUTH_FAILED',
      terminalId: req.body?.terminalId || (req.headers['x-terminal-id'] as string) || 'ARM-YVN-POS-2000',
      timestamp: Date.now(),
    });
  }

  next();
};

/**
 * Обработчик списания через SoftPOS с фискализацией в ՊԵԿ (e-HDM)
 * Корректно возвращает HTTP 400 при неверных данных, HTTP 500 при сбое сервера/банка
 */
export const handleSoftPosCharge = (
  req: Request,
  res: Response,
  customersDB: Record<string, CustomerAccount>,
  globalLedgerDB: LedgerEntry[]
) => {
  try {
    const { terminalId, amount, userId, creditToDeposit, simulateError } = req.body as SoftPosTransactionRequest;

    // Имитация внутренней ошибки сервера / шлюза банка (HTTP 500) для тестирования устойчивости
    if (simulateError === '500' || req.headers['x-simulate-error'] === '500') {
      console.error(`[SoftPOS Terminal ${terminalId}] Сбой связи с банковским процессингом / ՊԵԿ (HTTP 500)`);
      return res.status(500).json({
        error: 'Внутренняя ошибка процессинга терминала или сбой связи с банком / фискальным шлюзом ՊԵԿ',
        code: 'ERR_TERMINAL_INTERNAL_ERROR',
        terminalId: terminalId || 'ARM-YVN-POS-2000',
        timestamp: Date.now(),
      });
    }

    if (!terminalId || amount === undefined || Number(amount) <= 0) {
      return res.status(400).json({
        error: 'Неверные данные терминала или суммы',
        code: 'ERR_INVALID_PAYLOAD',
      });
    }

    console.log(`[SoftPOS Терминал ${terminalId}] Успешная авторизация, списание ${amount} AMD для клиента ${userId || 'usr_araik'}`);

    const targetUserId = userId || 'usr_araik';
    let customer = customersDB[targetUserId] || customersDB['usr_araik'];
    const numAmount = Number(amount);

    if (customer) {
      if (creditToDeposit) {
        customer.deposit = Number((customer.deposit + numAmount).toFixed(2));
      } else {
        customer.realBalance = Number((customer.realBalance + numAmount).toFixed(2));
      }

      const ledgerEntry: LedgerEntry = {
        id: `tx_pos_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        userId: customer.id,
        type: creditToDeposit ? 'DEPOSIT_TOPUP' : 'EXTERNAL_PAYMENT',
        amount: numAmount,
        fromAccount: 'EXTERNAL_SYSTEM',
        toAccount: creditToDeposit ? 'DEPOSIT' : 'REAL_BALANCE',
        timestamp: Date.now(),
        details: `SoftPOS оплата через терминал ${terminalId} (${creditToDeposit ? 'в депозит 10% APY' : 'на основной баланс'})`,
      };

      customer.ledger.unshift(ledgerEntry);
      globalLedgerDB.unshift(ledgerEntry);
    }

    const fiscalId = `ARM-FISC-${Math.floor(10000000 + Math.random() * 90000000)}`;
    const qrCodeUrl = `https://vcr.tax.am/receipts/${fiscalId}`;

    return res.json({
      success: true,
      message: 'Бесконтактный платеж успешно обработан',
      terminalId,
      amount: numAmount,
      newBalance: customer?.realBalance ?? 0,
      newDeposit: customer?.deposit ?? 0,
      timestamp: Date.now(),
      fiscalData: {
        fiscalId,
        qrCodeUrl,
        receiptPdf: `/api/terminal/receipt/${fiscalId}.pdf`,
      },
    });
  } catch (error: any) {
    console.error('Ошибка обработки SoftPOS платежа (HTTP 500):', error.message);
    return res.status(500).json({
      error: 'Внутренняя ошибка терминала при обработке транзакции',
      code: 'ERR_TERMINAL_INTERNAL_ERROR',
      details: error.message,
    });
  }
};
