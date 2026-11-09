/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  CreditCard,
  QrCode,
  Banknote,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  Printer,
  Download,
  RotateCcw,
  Wifi,
  Sparkles,
  Smartphone,
  Percent,
  Check,
  Receipt,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  KeyRound,
} from 'lucide-react';
import { UserProfile, Language } from '../types';
import {
  isPosAuthorized,
  calculatePosTotals,
  generatePosFiscalReceipt,
  PosFiscalReceipt,
  PosCalculationResult,
} from '../utils/pos';
import { formatDram } from '../utils/finance';

export interface PosTerminalError {
  status: number;
  titleHy: string;
  titleRu: string;
  messageHy: string;
  messageRu: string;
  recommendationHy: string;
  recommendationRu: string;
  serverMessage?: string;
  code?: string;
  terminalId?: string;
  timestamp?: number;
}

interface PosTerminalModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  lang: Language;
  onPosTransactionSuccess: (receipt: PosFiscalReceipt) => void;
}

export const PosTerminalModal: React.FC<PosTerminalModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  lang,
  onPosTransactionSuccess,
}) => {
  const isHy = lang === 'hy';
  const isAuthorized = isPosAuthorized(currentUser);

  // Состояния терминала
  const [amountStr, setAmountStr] = useState<string>('5000');
  const [paymentMethod, setPaymentMethod] = useState<'nfc_card' | 'idram_qr' | 'telcell_qr' | 'cash'>('nfc_card');
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [tipPercent, setTipPercent] = useState<number>(0);
  const [customerPhone, setCustomerPhone] = useState<string>(currentUser.emailOrPhone || '+374 91 123456');
  const [creditToDeposit, setCreditToDeposit] = useState<boolean>(true);
  const [receivedCashStr, setReceivedCashStr] = useState<string>('5000');

  // Шаг процесса: input -> processing -> success_receipt -> error
  const [step, setStep] = useState<'input' | 'processing' | 'success_receipt' | 'error'>('input');
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const [completedReceipt, setCompletedReceipt] = useState<PosFiscalReceipt | null>(null);

  // Ключ терминала и обработка ошибок (HTTP 403 и 500)
  const [terminalKey, setTerminalKey] = useState<string>('SECRET_TERMINAL_KEY');
  const [testSimulationMode, setTestSimulationMode] = useState<'normal' | 'error_403' | 'error_500'>('normal');
  const [terminalError, setTerminalError] = useState<PosTerminalError | null>(null);

  // Сброс при открытии
  useEffect(() => {
    if (isOpen) {
      setStep('input');
      setCompletedReceipt(null);
      setTerminalError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Если пользователь не админ, показываем строгую блокировку доступа
  if (!isAuthorized) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-none animate-fadeIn">
        <div
          id="pos-terminal-modal"
          className="relative w-full max-w-md bg-slate-900 border-2 border-rose-500/60 rounded-2xl p-6 text-center shadow-2xl shadow-rose-950/40"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="mx-auto w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mb-4 text-rose-400">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <h3 className="text-lg font-bold text-white mb-2">
            {isHy ? 'Մուտքն արգելված է' : 'Доступ ограничен'}
          </h3>
          <p className="text-xs text-rose-300 font-mono mb-4 px-3 py-2 bg-rose-950/40 border border-rose-800/40 rounded-xl">
            {isHy
              ? 'POS տերմինալը հասանելի է բացառապես ադմինիստրատորին (Անձնակազմ / Գանձապահ):'
              : 'POS-терминал предназначен исключительно для администратора (Кассир / Персонал).'}
          </p>

          <p className="text-xs text-slate-400 mb-6">
            {isHy
              ? 'Խնդրում ենք մուտք գործել ադմինիստրատորի հաշվով՝ գործառնություններ կատարելու համար:'
              : 'Пожалуйста, авторизуйтесь под учетной записью администратора.'}
          </p>

          <button
            onClick={onClose}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            {isHy ? 'Փակել պատուհանը' : 'Закрыть окно'}
          </button>
        </div>
      </div>
    );
  }

  // Расчет сумм
  const rawBase = parseFloat(amountStr) || 0;
  const receivedCash = parseFloat(receivedCashStr) || rawBase;
  const totals: PosCalculationResult = calculatePosTotals(rawBase, discountPercent, tipPercent, receivedCash);

  // Нажатия на цифровую клавиатуру
  const handleKeypadPress = (val: string) => {
    if (val === 'C') {
      setAmountStr('0');
      return;
    }
    if (val === 'DEL') {
      setAmountStr((prev) => (prev.length > 1 ? prev.slice(0, -1) : '0'));
      return;
    }
    setAmountStr((prev) => {
      if (prev === '0' || prev === '') return val === '00' ? '0' : val;
      if (prev.length >= 8) return prev; // ограничение до 99,999,999 ֏
      return prev + val;
    });
  };

  const handleAddPreset = (sum: number) => {
    const current = parseFloat(amountStr) || 0;
    setAmountStr(String(current + sum));
  };

  // Звуковой сигнал бипа терминала через Web Audio API
  const playTerminalBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1050, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.18);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.18);
    } catch (e) {
      // ignore
    }
  };

  // Обработка проведения платежа через SoftPOS API с валидацией авторизации (HTTP 403 и 500)
  const handleProcessPayment = async () => {
    if (totals.finalTotal <= 0) return;

    playTerminalBeep();
    setStep('processing');
    setTerminalError(null);

    if (paymentMethod === 'nfc_card') {
      setProcessingStatus(isHy ? 'Հպեք քարտը կամ հեռախոսը NFC-ին...' : 'Приложите карту или телефон к NFC...');
    } else if (paymentMethod === 'idram_qr') {
      setProcessingStatus(isHy ? 'Սպասում Idram QR հաստատման...' : 'Ожидание подтверждения Idram QR...');
    } else if (paymentMethod === 'telcell_qr') {
      setProcessingStatus(isHy ? 'Սպասում Telcell Wallet QR հաստատման...' : 'Ожидание подтверждения Telcell QR...');
    } else {
      setProcessingStatus(isHy ? 'Գանձապահը ընդունում է կանխիկը...' : 'Приём наличных в кассу...');
    }

    try {
      // Имитируем шаг считывания чипа / NFC для реалистичного UX
      await new Promise((resolve) => setTimeout(resolve, 600));

      setProcessingStatus(isHy ? 'Կապ բանկի և ՊԵԿ սերվերի հետ...' : 'Связь с банком (ArCa) и сервером ՊԵԿ...');

      const effectiveTerminalKey =
        testSimulationMode === 'error_403' ? 'INVALID_TERMINAL_KEY_999' : terminalKey;

      // Блок try-catch для выполнения сетевого запроса к /api/terminal/charge
      let response: Response;
      try {
        response = await fetch('/api/terminal/charge', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Terminal-Auth': effectiveTerminalKey,
            ...(testSimulationMode === 'error_500' ? { 'X-Simulate-Error': '500' } : {}),
          },
          body: JSON.stringify({
            terminalId: 'ARM-YVN-POS-2000',
            encryptedCardData:
              paymentMethod === 'nfc_card' ? 'EMV_CHIP_ARCA_NFC_TOKEN' : `QR_TOKEN_${paymentMethod.toUpperCase()}`,
            amount: totals.finalTotal,
            userId: currentUser.id || 'usr_araik',
            clientPhone: customerPhone,
            creditToDeposit: creditToDeposit,
            simulateError: testSimulationMode === 'error_500' ? '500' : undefined,
          }),
        });
      } catch (networkFetchError: any) {
        // Перехват сетевых сбоев (Network Error / Offline / Connection Refused)
        throw new Error(networkFetchError?.message || 'Сбой сетевого подключения к серверу POS-терминала');
      }

      // Блок перехвата и обработки ошибок ответа API (особенно 403 Forbidden и 500 Internal Server Error)
      if (!response.ok) {
        let errJson: any = {};
        try {
          errJson = await response.json();
        } catch (parseError) {
          errJson = { error: response.statusText || `Ошибка HTTP ${response.status}` };
        }

        // 1. ПЕРЕХВАТ ОШИБКИ HTTP 403 FORBIDDEN: Авторизация терминала отклонена
        if (response.status === 403) {
          const authError: PosTerminalError = {
            status: 403,
            titleHy: 'POS Տերմինալի նույնականացման սխալ (HTTP 403 Forbidden)',
            titleRu: 'Ошибка авторизации POS-терминала (HTTP 403 Forbidden)',
            messageHy:
              'Մուտքն արգելված է: Տերմինալի գաղտնի բանալին (X-Terminal-Auth) անվավեր է կամ մերժված է սերվերի կողմից: Տրանզակցիան կասեցվել է անվտանգության նկատառումներով:',
            messageRu:
              'Доступ запрещен: ошибка авторизации POS-терминала. Устройство не прошло проверку подлинности, передан неверный или недействительный ключ терминала (X-Terminal-Auth). Списание отменено в целях безопасности.',
            recommendationHy:
              'Ստուգեք տերմինալի «SECRET_TERMINAL_KEY» բանալին կամ վերականգնեք աշխատանքային վիճակը կոճակի միջոցով:',
            recommendationRu:
              'Проверьте ключ аутентификации терминала SECRET_TERMINAL_KEY в настройках кассы или нажмите «Восстановить верный ключ» для продолжения работы.',
            serverMessage: errJson.error || 'Доступ запрещен: неверный ключ авторизации терминала (X-Terminal-Auth)',
            code: errJson.code || 'ERR_TERMINAL_AUTH_FAILED',
            terminalId: errJson.terminalId || 'ARM-YVN-POS-2000',
            timestamp: errJson.timestamp || Date.now(),
          };
          setTerminalError(authError);
          setStep('error');
          return;
        }

        // 2. ПЕРЕХВАТ ОШИБКИ HTTP 500 INTERNAL SERVER ERROR: Сбой сервера или банковского процессинга
        if (response.status === 500) {
          const serverError: PosTerminalError = {
            status: 500,
            titleHy: 'Պրոցեսինգի ներքին սխալ (HTTP 500 Internal Server Error)',
            titleRu: 'Внутренняя ошибка сервера терминала (HTTP 500 Internal Server Error)',
            messageHy:
              'Սերվերի կամ բանկային պրոցեսինգի խափանում: Չհաջողվեց կապ հաստատել ArCa / ՊԵԿ էլեկտրոնային ՀԴՄ շլյուզի հետ: Գումարը քարտից ՉԻ գանձվել:',
            messageRu:
              'Внутренняя ошибка процессинга терминала или сбой связи с процессингом банка (ArCa) и фискальным шлюзом e-HDM (ՊԵԿ). Денежные средства с карты НЕ списаны.',
            recommendationHy:
              'Կրկնեք գործարքը մի քանի վայրկյանից կամ ընտրեք վճարման այլ եղանակ (կանխիկ դրամարկղ, Idram QR):',
            recommendationRu:
              'Повторите попытку через пару секунд или выберите другой способ оплаты (наличные в кассу или QR-код Idram).',
            serverMessage: errJson.error || 'Внутренняя ошибка процессинга терминала или сбой связи с банком / фискальным шлюзом ՊԵԿ',
            code: errJson.code || 'ERR_TERMINAL_INTERNAL_ERROR',
            terminalId: errJson.terminalId || 'ARM-YVN-POS-2000',
            timestamp: errJson.timestamp || Date.now(),
          };
          setTerminalError(serverError);
          setStep('error');
          return;
        }

        // 3. Другие возможные HTTP ошибки ответа (400, 404, 502, 503)
        const responseError: PosTerminalError = {
          status: response.status,
          titleHy: `Գործարքի սխալ (HTTP ${response.status})`,
          titleRu: `Ошибка проведения платежа (HTTP ${response.status})`,
          messageHy: errJson.error || 'Չհաջողվեց կատարել գործարքը:',
          messageRu: errJson.error || 'Не удалось завершить транзакцию на сервере.',
          recommendationHy: 'Ստուգեք մուտքագրված գումարը և տվյալները:',
          recommendationRu: 'Проверьте введенную сумму и параметры платежа.',
          serverMessage: errJson.error,
          code: errJson.code || `ERR_HTTP_${response.status}`,
          terminalId: 'ARM-YVN-POS-2000',
          timestamp: Date.now(),
        };
        setTerminalError(responseError);
        setStep('error');
        return;
      }

      // 4. УСПЕШНЫЙ ОТВЕТ (HTTP 200 OK): Разбор фискальных данных и оформление чека
      let successData: any;
      try {
        successData = await response.json();
      } catch (jsonErr: any) {
        throw new Error('Ошибка декодирования фискальных данных ответа (Invalid JSON)');
      }

      completePaymentSuccess(successData.fiscalData);
    } catch (catchErr: any) {
      // Общий перехват исключений и критических сбоев
      console.error('[POS Terminal Exception Caught]:', catchErr);
      setTerminalError({
        status: 500,
        titleHy: 'Սերվերի / ցանցային խափանում (HTTP 500)',
        titleRu: 'Сбой соединения с сервером (HTTP 500 / Network Error)',
        messageHy: 'Անհնար է կապ հաստատել տերմինալի սերվերի հետ: Ստուգեք ինտերնետ կապը:',
        messageRu: 'Не удалось связаться с сервером терминала. Проверьте соединение или статус сервера.',
        recommendationHy: 'Համոզվեք, որ սերվերը ակտիվ է, և կրկնեք փորձը:',
        recommendationRu: 'Убедитесь, что сервер терминала запущен, и повторите попытку.',
        serverMessage: catchErr.message || 'Network connection failed or server offline',
        code: 'ERR_TERMINAL_INTERNAL_ERROR',
        terminalId: 'ARM-YVN-POS-2000',
        timestamp: Date.now(),
      });
      setStep('error');
    }
  };

  const completePaymentSuccess = (fiscalData?: any) => {
    playTerminalBeep();
    const receipt = generatePosFiscalReceipt(
      currentUser.name || 'Արայիկ (Ադմին)',
      totals,
      paymentMethod,
      customerPhone,
      creditToDeposit
    );

    if (fiscalData?.fiscalId) {
      receipt.fiscalNumber = fiscalData.fiscalId;
    }

    setCompletedReceipt(receipt);
    setStep('success_receipt');
    onPosTransactionSuccess(receipt);
  };

  // Печать чека
  const handlePrintReceipt = () => {
    window.print();
  };

  // Экспорт чека в JSON
  const handleDownloadReceipt = () => {
    if (!completedReceipt) return;
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(completedReceipt, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `receipt_${completedReceipt.receiptId}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleNewTransaction = () => {
    setAmountStr('5000');
    setStep('input');
    setCompletedReceipt(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-none overflow-y-auto">
      <div
        id="pos-terminal-modal"
        className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl text-slate-100 overflow-hidden my-auto"
      >
        {/* Верхняя рамка терминала: статус, кассир, тестовые режимы, закрыть */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full animate-pulse shadow-sm ${
              testSimulationMode === 'error_403'
                ? 'bg-amber-400 shadow-amber-400/50'
                : testSimulationMode === 'error_500'
                ? 'bg-rose-500 shadow-rose-500/50'
                : 'bg-emerald-400 shadow-emerald-400/50'
            }`} />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold tracking-wider text-emerald-400 uppercase">
                  POS TERMINAL 2000
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  ADMIN ONLY
                </span>
                {testSimulationMode !== 'normal' && (
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold animate-pulse border ${
                    testSimulationMode === 'error_403'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                      : 'bg-rose-500/20 text-rose-300 border-rose-500/50'
                  }`}>
                    {testSimulationMode === 'error_403' ? 'TEST 403 (KEY ERROR)' : 'TEST 500 (SERVER ERROR)'}
                  </span>
                )}
              </div>
              <div className="text-[11px] text-slate-400 flex items-center gap-2">
                <span>{isHy ? 'Գանձապահ' : 'Кассир'}: <strong className="text-slate-200">{currentUser.name}</strong></span>
                <span>•</span>
                <span className="flex items-center gap-1 text-slate-400">
                  <Wifi className="w-3 h-3 text-emerald-400" /> Online (ArCa / ՊԵԿ)
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Панель симуляции для тестирования 403 и 500 ошибок */}
            <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-xl text-[10px] font-mono">
              <span className="text-slate-500 px-1">{isHy ? 'Թեստ' : 'Тест'}:</span>
              <button
                type="button"
                onClick={() => {
                  setTestSimulationMode('normal');
                  setTerminalKey('SECRET_TERMINAL_KEY');
                }}
                className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                  testSimulationMode === 'normal'
                    ? 'bg-emerald-600 text-white font-bold shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Обычный режим с правильным ключом авторизации (200 OK)"
              >
                200 OK
              </button>
              <button
                type="button"
                onClick={() => {
                  setTestSimulationMode('error_403');
                  setTerminalKey('INVALID_TEST_KEY_403');
                }}
                className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                  testSimulationMode === 'error_403'
                    ? 'bg-amber-600 text-white font-bold shadow'
                    : 'text-slate-400 hover:text-amber-300'
                }`}
                title="Имитация ошибки авторизации терминала (HTTP 403 Forbidden)"
              >
                Тест 403
              </button>
              <button
                type="button"
                onClick={() => setTestSimulationMode('error_500')}
                className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                  testSimulationMode === 'error_500'
                    ? 'bg-rose-600 text-white font-bold shadow'
                    : 'text-slate-400 hover:text-rose-300'
                }`}
                title="Имитация сбоя сервера или связи с банком (HTTP 500 Server Error)"
              >
                Тест 500
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Предупреждение об ошибке авторизации или сервера терминала */}
        {terminalError && step === 'input' && (
          <div className="mx-4 sm:mx-6 mt-3 p-3 rounded-xl bg-amber-950/40 border border-amber-500/50 text-amber-200 text-xs flex items-center justify-between gap-3 animate-fadeIn">
            <div className="flex items-center gap-2.5">
              <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0" />
              <div>
                <strong className="font-bold block text-white">
                  {isHy ? terminalError.titleHy : terminalError.titleRu}
                </strong>
                <span className="text-[11px] text-amber-300/90">
                  {isHy ? terminalError.messageHy : terminalError.messageRu}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setTerminalError(null)}
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ШАГ 1: ВВОД СУММЫ И ОПЛАТА */}
        {step === 'input' && (
          <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-5">
            {/* Левая колонка: Экран кассы и цифровой ввод */}
            <div className="md:col-span-7 flex flex-col gap-3">
              {/* LCD Дисплей кассы */}
              <div className="bg-gradient-to-b from-slate-950 to-slate-900 border-2 border-slate-750 rounded-2xl p-4 shadow-inner">
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono mb-1">
                  <span>{isHy ? 'ԳՈՒՄԱՐ ՎՃԱՐՄԱՆ' : 'К ОПЛАТЕ'}</span>
                  <span>AMD (֏)</span>
                </div>
                <div className="text-right font-mono text-3xl sm:text-4xl font-extrabold text-emerald-400 tracking-tight py-1 break-all select-none">
                  {formatDram(totals.finalTotal)}
                </div>
                {totals.discountAmount > 0 && (
                  <div className="flex justify-between text-xs text-amber-400/90 font-mono pt-1 border-t border-slate-800">
                    <span>{isHy ? 'Զեղչ' : 'Скидка'} (-{totals.discountPercent}%):</span>
                    <span>-{formatDram(totals.discountAmount)}</span>
                  </div>
                )}
                {totals.tipAmount > 0 && (
                  <div className="flex justify-between text-xs text-sky-400/90 font-mono pt-1">
                    <span>{isHy ? 'Թեյավճար' : 'Чаевые'} (+{totals.tipPercent}%):</span>
                    <span>+{formatDram(totals.tipAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-[10px] text-slate-500 font-mono pt-1">
                  <span>{isHy ? 'ներառյալ ԱԱՀ 20%' : 'в т.ч. НДС 20%'}:</span>
                  <span>{formatDram(totals.taxVatAmount)}</span>
                </div>
              </div>

              {/* Быстрые пресеты сумм */}
              <div className="grid grid-cols-3 gap-1.5">
                {[1000, 2000, 5000, 10000, 20000, 50000].map((sum) => (
                  <button
                    key={sum}
                    type="button"
                    onClick={() => handleAddPreset(sum)}
                    className="py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 font-mono text-xs font-semibold transition-colors cursor-pointer"
                  >
                    +{formatDram(sum)}
                  </button>
                ))}
              </div>

              {/* Тактильная цифровая клавиатура (Numpad) */}
              <div className="grid grid-cols-3 gap-2 bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', 'DEL'].map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleKeypadPress(key)}
                    className={`h-11 sm:h-12 rounded-xl text-base font-bold font-mono transition-all cursor-pointer flex items-center justify-center select-none active:scale-95 ${
                      key === 'C'
                        ? 'bg-rose-950/50 hover:bg-rose-900/60 text-rose-300 border border-rose-800/40'
                        : key === 'DEL'
                        ? 'bg-amber-950/50 hover:bg-amber-900/60 text-amber-300 border border-amber-800/40'
                        : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 shadow-sm'
                    }`}
                  >
                    {key === 'DEL' ? '⌫' : key}
                  </button>
                ))}
              </div>
            </div>

            {/* Правая колонка: Методы оплаты, опции депозита и проведение */}
            <div className="md:col-span-5 flex flex-col justify-between gap-4">
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-300">
                  {isHy ? 'Վճարման եղանակ' : 'Способ оплаты'}
                </label>

                {/* Выбор метода: NFC Карта, Idram, Telcell, Наличные */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('nfc_card')}
                    className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                      paymentMethod === 'nfc_card'
                        ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300 shadow-md shadow-emerald-950/40'
                        : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <CreditCard className="w-4 h-4 text-emerald-400" />
                      {paymentMethod === 'nfc_card' && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                    </div>
                    <span className="text-xs font-bold text-white leading-tight">
                      {isHy ? 'NFC Քարտ' : 'NFC Карта'}
                    </span>
                    <span className="text-[10px] text-slate-400">ArCa / Visa / MC</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cash')}
                    className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                      paymentMethod === 'cash'
                        ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300 shadow-md shadow-emerald-950/40'
                        : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <Banknote className="w-4 h-4 text-amber-400" />
                      {paymentMethod === 'cash' && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                    </div>
                    <span className="text-xs font-bold text-white leading-tight">
                      {isHy ? 'Կանխիկ դրամ' : 'Наличные'}
                    </span>
                    <span className="text-[10px] text-slate-400">{isHy ? 'Դրամարկղ' : 'Касса'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('idram_qr')}
                    className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                      paymentMethod === 'idram_qr'
                        ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300 shadow-md shadow-emerald-950/40'
                        : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <QrCode className="w-4 h-4 text-orange-400" />
                      {paymentMethod === 'idram_qr' && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                    </div>
                    <span className="text-xs font-bold text-white leading-tight">Idram QR</span>
                    <span className="text-[10px] text-slate-400">Idram & IDBank</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('telcell_qr')}
                    className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                      paymentMethod === 'telcell_qr'
                        ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300 shadow-md shadow-emerald-950/40'
                        : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <QrCode className="w-4 h-4 text-amber-400" />
                      {paymentMethod === 'telcell_qr' && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                    </div>
                    <span className="text-xs font-bold text-white leading-tight">Telcell QR</span>
                    <span className="text-[10px] text-slate-400">Telcell Wallet</span>
                  </button>
                </div>

                {/* Ввод для наличных: сумма от клиента и сдача */}
                {paymentMethod === 'cash' && (
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-300">
                      <span>{isHy ? 'Ստացված կանխիկ' : 'Получено наличных'}:</span>
                      <input
                        type="number"
                        min={totals.finalTotal}
                        step="500"
                        value={receivedCashStr}
                        onChange={(e) => setReceivedCashStr(e.target.value)}
                        className="w-28 px-2 py-1 bg-slate-900 border border-slate-700 rounded text-right font-mono text-emerald-400 text-xs"
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-400">{isHy ? 'Մանրը' : 'Сдача'}:</span>
                      <span className="font-bold text-amber-300">{formatDram(totals.changeAmount)}</span>
                    </div>
                  </div>
                )}

                {/* Телефон клиента для привязки к 10% APY доходному депозиту */}
                <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                      <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{isHy ? 'Հաճախորդի հեռախոս' : 'Телефон клиента'}</span>
                    </label>
                  </div>
                  <input
                    type="text"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="+374 91 123456"
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                  />

                  {/* Опция зачисления в 10% APY депозит системы 2000 */}
                  <label className="flex items-start gap-2 pt-1 text-[11px] text-slate-300 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={creditToDeposit}
                      onChange={(e) => setCreditToDeposit(e.target.checked)}
                      className="mt-0.5 rounded border-slate-700 text-emerald-600 focus:ring-0 cursor-pointer"
                    />
                    <span>
                      {isHy
                        ? '100% փոխանցել հաճախորդի 10% APY դեպոզիտի հաշվին (Համակարգ 2000)'
                        : '100% начислить в 10% APY депозит покупателя (Система 2000)'}
                    </span>
                  </label>
                </div>
              </div>

              {/* Кнопка проведения оплаты */}
              <button
                type="button"
                onClick={handleProcessPayment}
                disabled={totals.finalTotal <= 0}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 disabled:opacity-50 text-white rounded-xl font-bold text-sm shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98"
              >
                <span>{isHy ? 'Հաստատել վճարումը' : 'Провести оплату'}</span>
                <span className="font-mono">({formatDram(totals.finalTotal)})</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ШАГ 2: СИМУЛЯЦИЯ СВЯЗИ И ПРОВЕДЕНИЯ (NFC / QR) */}
        {step === 'processing' && (
          <div className="p-8 sm:p-12 flex flex-col items-center justify-center text-center space-y-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-emerald-500/10 border-2 border-emerald-500 flex items-center justify-center text-emerald-400 animate-pulse">
                {paymentMethod === 'nfc_card' ? (
                  <CreditCard className="w-12 h-12" />
                ) : (
                  <QrCode className="w-12 h-12" />
                )}
              </div>
              <div className="absolute inset-0 rounded-full border-2 border-emerald-400 animate-ping opacity-25" />
            </div>

            <div>
              <h3 className="text-xl font-bold text-white mb-2">{processingStatus}</h3>
              <p className="text-sm font-mono text-emerald-400">
                {formatDram(totals.finalTotal)}
              </p>
            </div>

            <div className="text-xs text-slate-400 font-mono flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>TERMINAL ENCRYPTION: TLS 1.3 / EMV Level 2</span>
            </div>
          </div>
        )}

        {/* ШАГ 3: ФИСКАЛЬНЫЙ ЭЛЕКТРОННЫЙ ЧЕК (ՀԴՄ Կտրոն) */}
        {step === 'success_receipt' && completedReceipt && (
          <div className="p-4 sm:p-6 space-y-4">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm bg-emerald-950/40 border border-emerald-500/30 p-2.5 rounded-xl">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>{isHy ? 'Վճարումը հաջողությամբ կատարված է:' : 'Платеж успешно проведен!'}</span>
            </div>

            {/* Стилизованный термальный фискальный чек */}
            <div className="bg-slate-950 border border-slate-700/80 rounded-2xl p-4 sm:p-5 font-mono text-xs text-slate-300 shadow-2xl relative overflow-hidden">
              <div className="text-center pb-3 border-b border-dashed border-slate-700 space-y-1">
                <div className="text-base font-extrabold text-white tracking-wider">
                  «ՀԱՄԱԿԱՐԳ 2000» ԽԱՆՈՒԹ
                </div>
                <div className="text-[10px] text-slate-400">
                  ՀՀ, ք. Երևան, Կենտրոն • ՀՎՀՀ՝ 02589412
                </div>
                <div className="text-[10px] text-emerald-400 font-bold">
                  ԷԼԵԿՏՐՈՆԱՅԻՆ ՀԴՄ ՖԻՍԿԱԼ ԿՏՐՈՆ
                </div>
              </div>

              <div className="py-3 border-b border-dashed border-slate-700 space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-400">{isHy ? 'Կտրոնի №' : 'Номер чека'}:</span>
                  <span className="text-white font-bold">{completedReceipt.receiptId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">{isHy ? 'Ֆիսկալ համար' : 'Фискальный №'}:</span>
                  <span className="text-amber-400">{completedReceipt.fiscalNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">{isHy ? 'Տերմինալ' : 'Терминал'}:</span>
                  <span>{completedReceipt.terminalId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">{isHy ? 'Գանձապահ' : 'Кассир'}:</span>
                  <span className="text-white">{completedReceipt.cashierName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">{isHy ? 'Ամսաթիվ' : 'Дата'}:</span>
                  <span>{completedReceipt.dateStr}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">{isHy ? 'Եղանակ' : 'Способ'}:</span>
                  <span className="text-emerald-300">
                    {isHy ? completedReceipt.methodLabelHy : completedReceipt.methodLabelRu}
                  </span>
                </div>
                {completedReceipt.customerPhone && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">{isHy ? 'Հաճախորդ' : 'Покупатель'}:</span>
                    <span>{completedReceipt.customerPhone}</span>
                  </div>
                )}
              </div>

              {/* Расчет сумм в чеке */}
              <div className="py-3 border-b border-dashed border-slate-700 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">{isHy ? 'Ենթագումար' : 'Подытог'}:</span>
                  <span>{formatDram(completedReceipt.baseAmount)}</span>
                </div>
                {completedReceipt.discountAmount > 0 && (
                  <div className="flex justify-between text-amber-400">
                    <span>{isHy ? 'Զեղչ' : 'Скидка'}:</span>
                    <span>-{formatDram(completedReceipt.discountAmount)}</span>
                  </div>
                )}
                {completedReceipt.tipAmount > 0 && (
                  <div className="flex justify-between text-sky-400">
                    <span>{isHy ? 'Թեյավճար' : 'Чаевые'}:</span>
                    <span>+{formatDram(completedReceipt.tipAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-400 text-[10px]">
                  <span>{isHy ? 'ԱԱՀ 20% (ներառված)' : 'НДС 20% (включен)'}:</span>
                  <span>{formatDram(completedReceipt.vatAmount)}</span>
                </div>
                {completedReceipt.receivedCash && (
                  <div className="flex justify-between text-slate-400">
                    <span>{isHy ? 'Ստացված' : 'Принято'}:</span>
                    <span>{formatDram(completedReceipt.receivedCash)}</span>
                  </div>
                )}
                {completedReceipt.changeAmount && (
                  <div className="flex justify-between text-amber-300 font-bold">
                    <span>{isHy ? 'Մանրը' : 'Сдача'}:</span>
                    <span>{formatDram(completedReceipt.changeAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 text-sm font-extrabold text-emerald-400 border-t border-slate-800">
                  <span>{isHy ? 'ԸՆԴԱՄԵՆԸ' : 'ИТОГО К ОПЛАТЕ'}:</span>
                  <span>{formatDram(completedReceipt.finalTotal)}</span>
                </div>
              </div>

              {/* Индикатор начисления в 10% APY депозит */}
              {completedReceipt.depositCredited && (
                <div className="mt-3 p-2 bg-emerald-950/60 border border-emerald-500/40 rounded-xl flex items-center justify-between text-[11px] text-emerald-300">
                  <div className="flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{isHy ? '10% APY Դեպոզիտի համալրում' : 'Начислено в 10% APY депозит'}:</span>
                  </div>
                  <strong className="font-bold">+{formatDram(completedReceipt.finalTotal)}</strong>
                </div>
              )}
            </div>

            {/* Кнопки действий: Печать, Скачать, Новый платеж */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={handlePrintReceipt}
                className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4 text-slate-300" />
                <span>{isHy ? 'Տպել կտրոնը' : 'Печать чека'}</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadReceipt}
                className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                <span>{isHy ? 'Ներբեռնել JSON' : 'Скачать JSON'}</span>
              </button>

              <button
                type="button"
                onClick={handleNewTransaction}
                className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-emerald-950/40"
              >
                <RotateCcw className="w-4 h-4" />
                <span>{isHy ? 'Նոր վճարում' : 'Новый платеж'}</span>
              </button>
            </div>
          </div>
        )}

        {/* ШАГ 4: ЭКРАН ОБРАБОТКИ ОШИБОК ТЕРМИНАЛА (HTTP 403 и HTTP 500) */}
        {step === 'error' && terminalError && (
          <div className="p-5 sm:p-7 space-y-5 animate-fadeIn">
            {/* Карточка ошибки */}
            <div
              className={`p-5 rounded-2xl border-2 ${
                terminalError.status === 403
                  ? 'bg-amber-950/40 border-amber-500/70 text-amber-200'
                  : 'bg-rose-950/40 border-rose-500/70 text-rose-200'
              } shadow-2xl relative overflow-hidden`}
            >
              <div className="flex items-start gap-3.5">
                <div
                  className={`p-3 rounded-xl shrink-0 ${
                    terminalError.status === 403
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                      : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                  }`}
                >
                  {terminalError.status === 403 ? (
                    <ShieldAlert className="w-7 h-7" />
                  ) : (
                    <AlertTriangle className="w-7 h-7" />
                  )}
                </div>

                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold tracking-wide uppercase border ${
                        terminalError.status === 403
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                      }`}
                    >
                      {terminalError.status === 403 ? 'HTTP 403 • FORBIDDEN' : 'HTTP 500 • SERVER ERROR'}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      {new Date(terminalError.timestamp || Date.now()).toLocaleTimeString()}
                    </span>
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-white leading-snug">
                    {isHy ? terminalError.titleHy : terminalError.titleRu}
                  </h3>

                  <p className="text-xs text-slate-200 leading-relaxed">
                    {isHy ? terminalError.messageHy : terminalError.messageRu}
                  </p>
                </div>
              </div>

              {/* Блок рекомендаций по устранению */}
              <div className="mt-4 pt-3.5 border-t border-slate-700/60 flex items-start gap-2.5 text-xs">
                <div className="font-semibold text-slate-300 shrink-0">
                  {isHy ? 'Ի՞նչ անել:' : 'Решение:'}
                </div>
                <div className="text-slate-300">
                  {isHy ? terminalError.recommendationHy : terminalError.recommendationRu}
                </div>
              </div>
            </div>

            {/* Технический аудит ошибки */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 font-mono text-[11px] space-y-1.5 text-slate-400">
              <div className="flex justify-between">
                <span>{isHy ? 'Տերմինալի ID' : 'Терминал ID'}:</span>
                <span className="text-slate-200 font-bold">{terminalError.terminalId || 'ARM-YVN-POS-2000'}</span>
              </div>
              <div className="flex justify-between">
                <span>{isHy ? 'Սխալի կոդ' : 'Код события'}:</span>
                <span className={terminalError.status === 403 ? 'text-amber-400 font-bold' : 'text-rose-400 font-bold'}>
                  {terminalError.code || `ERR_${terminalError.status}`}
                </span>
              </div>
              <div className="flex justify-between">
                <span>{isHy ? 'Գումար' : 'Сумма к оплате'}:</span>
                <span className="text-emerald-400 font-bold">{formatDram(totals.finalTotal)}</span>
              </div>
              {terminalError.serverMessage && (
                <div className="pt-1.5 border-t border-slate-800/80 text-slate-300 flex flex-col gap-0.5">
                  <span className="text-slate-500">{isHy ? 'Սերվերի պատասխան' : 'Ответ сервера'}:</span>
                  <span className="bg-slate-900 px-2.5 py-1 rounded text-slate-300 break-all border border-slate-800">
                    {terminalError.serverMessage}
                  </span>
                </div>
              )}
            </div>

            {/* Действия восстановления */}
            <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
              <button
                type="button"
                onClick={handleProcessPayment}
                className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-950/40"
              >
                <RotateCcw className="w-4 h-4" />
                <span>{isHy ? 'Կրկնել փորձը' : 'Повторить попытку'}</span>
              </button>

              {terminalError.status === 403 && (
                <button
                  type="button"
                  onClick={() => {
                    setTerminalKey('SECRET_TERMINAL_KEY');
                    setTestSimulationMode('normal');
                    setTerminalError(null);
                    setStep('input');
                  }}
                  className="py-3 px-4 bg-amber-500 hover:bg-amber-400 active:scale-98 text-slate-950 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-amber-950/40"
                >
                  <ShieldCheck className="w-4 h-4 text-slate-950" />
                  <span>{isHy ? 'Վերականգնել ճիշտ բանալին' : 'Восстановить верный ключ'}</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setTerminalError(null);
                  setStep('input');
                }}
                className="py-3 px-4 bg-slate-800 hover:bg-slate-700 active:scale-98 text-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer border border-slate-700"
              >
                <span>{isHy ? 'Վերադառնալ մուտքագրման' : 'Назад к кассе'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
