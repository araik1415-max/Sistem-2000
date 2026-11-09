import test from 'node:test';
import assert from 'node:assert';
import { verifyTerminalAuth, handleSoftPosCharge } from './terminalService.js';
import { CustomerAccount, LedgerEntry } from '../types.js';

test('SoftPOS Terminal Auth & Error Contracts', async (t) => {
  await t.test('verifyTerminalAuth rejects request without X-Terminal-Auth with HTTP 403', () => {
    let statusCode = 0;
    let jsonResponse: any = null;

    const mockReq: any = {
      headers: {},
      body: { terminalId: 'ARM-YVN-POS-2000' }
    };

    const mockRes: any = {
      status(code: number) {
        statusCode = code;
        return {
          json(data: any) {
            jsonResponse = data;
            return data;
          }
        };
      }
    };

    let nextCalled = false;
    verifyTerminalAuth(mockReq, mockRes, () => {
      nextCalled = true;
    });

    assert.strictEqual(nextCalled, false);
    assert.strictEqual(statusCode, 403);
    assert.strictEqual(jsonResponse.code, 'ERR_TERMINAL_AUTH_FAILED');
    assert.ok(jsonResponse.error.includes('Доступ запрещен'));
  });

  await t.test('verifyTerminalAuth rejects request with invalid key with HTTP 403', () => {
    let statusCode = 0;
    let jsonResponse: any = null;

    const mockReq: any = {
      headers: { 'x-terminal-auth': 'WRONG_UNAUTHORIZED_KEY' },
      body: { terminalId: 'ARM-YVN-POS-2000' }
    };

    const mockRes: any = {
      status(code: number) {
        statusCode = code;
        return {
          json(data: any) {
            jsonResponse = data;
            return data;
          }
        };
      }
    };

    let nextCalled = false;
    verifyTerminalAuth(mockReq, mockRes, () => {
      nextCalled = true;
    });

    assert.strictEqual(nextCalled, false);
    assert.strictEqual(statusCode, 403);
    assert.strictEqual(jsonResponse.code, 'ERR_TERMINAL_AUTH_FAILED');
  });

  await t.test('verifyTerminalAuth passes when valid SECRET_TERMINAL_KEY is provided', () => {
    const mockReq: any = {
      headers: { 'x-terminal-auth': 'SECRET_TERMINAL_KEY' },
      body: { terminalId: 'ARM-YVN-POS-2000' }
    };

    const mockRes: any = {
      status: () => mockRes,
      json: (data: any) => data
    };

    let nextCalled = false;
    verifyTerminalAuth(mockReq, mockRes, () => {
      nextCalled = true;
    });

    assert.strictEqual(nextCalled, true);
  });

  await t.test('handleSoftPosCharge returns HTTP 500 on server / processing error', () => {
    let statusCode = 0;
    let jsonResponse: any = null;

    const mockReq: any = {
      headers: { 'x-terminal-auth': 'SECRET_TERMINAL_KEY' },
      body: {
        terminalId: 'ARM-YVN-POS-2000',
        amount: 5000,
        simulateError: '500'
      }
    };

    const mockRes: any = {
      status(code: number) {
        statusCode = code;
        return {
          json(data: any) {
            jsonResponse = data;
            return data;
          }
        };
      }
    };

    const mockCustomers: Record<string, CustomerAccount> = {};
    const mockLedger: LedgerEntry[] = [];

    handleSoftPosCharge(mockReq, mockRes, mockCustomers, mockLedger);

    assert.strictEqual(statusCode, 500);
    assert.strictEqual(jsonResponse.code, 'ERR_TERMINAL_INTERNAL_ERROR');
    assert.ok(jsonResponse.error.includes('Внутренняя ошибка'));
  });

  await t.test('handleSoftPosCharge successfully processes payment and credits 10% deposit', () => {
    let statusCode = 200;
    let jsonResponse: any = null;

    const mockCustomers: Record<string, CustomerAccount> = {
      'usr_araik': {
        id: 'usr_araik',
        name: 'Араик',
        phone: '+374 91 123456',
        email: 'araik@example.com',
        city: 'Ереван',
        status: 'vip',
        realBalance: 35000,
        deposit: 15000,
        bonusPoints: 50,
        lastAccrualTimestamp: Date.now(),
        purchases: [],
        ledger: [],
        totalSpentDram: 0,
        registeredAt: '01.01.2026',
        lastActiveAt: 'Только что'
      }
    };
    const mockLedger: LedgerEntry[] = [];

    const mockReq: any = {
      headers: { 'x-terminal-auth': 'SECRET_TERMINAL_KEY' },
      body: {
        terminalId: 'ARM-YVN-POS-2000',
        amount: 5000,
        userId: 'usr_araik',
        creditToDeposit: true
      }
    };

    const mockRes: any = {
      status(code: number) {
        statusCode = code;
        return this;
      },
      json(data: any) {
        jsonResponse = data;
        return data;
      }
    };

    handleSoftPosCharge(mockReq, mockRes, mockCustomers, mockLedger);

    assert.strictEqual(statusCode, 200);
    assert.strictEqual(jsonResponse.success, true);
    assert.strictEqual(jsonResponse.amount, 5000);
    assert.strictEqual(mockCustomers['usr_araik'].deposit, 20000);
    assert.ok(jsonResponse.fiscalData.fiscalId.startsWith('ARM-FISC-'));
    assert.strictEqual(mockLedger.length, 1);
  });
});
