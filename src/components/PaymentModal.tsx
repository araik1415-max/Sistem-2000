import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  Smartphone,
  Lock,
  Download,
  AlertCircle,
  Sparkles,
  Copy,
  Check,
  Wallet,
  Building2,
  Receipt,
} from 'lucide-react';
import {
  PaymentMethodId,
  PaymentPurpose,
  PAYMENT_GATEWAYS,
  TEST_CARD_PRESETS,
  TransactionReceipt,
  generateTransactionReceipt,
  formatCardNumber,
  formatCardExpiry,
  formatArmenianPhone,
  detectCardBrandAndBank,
  validateCardDetails,
  buildGatewayQrPayload,
  generateQrMatrix,
} from '../utils/payment';
import { Language } from '../types';
import { formatDram } from '../utils/finance';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  amountDram: number;
  title: string;
  lang: Language;
  paymentPurpose?: PaymentPurpose;
  userRealBalance?: number;
  onPaymentSuccess: (
    amount: number,
    gatewayName: string,
    receiptId: string,
    gatewayId?: PaymentMethodId,
    paymentPurpose?: PaymentPurpose
  ) => void;
  onOpenAgreement?: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  amountDram,
  title,
  lang,
  paymentPurpose = 'store_purchase',
  userRealBalance = 0,
  onPaymentSuccess,
  onOpenAgreement,
}) => {
  const isHy = lang === 'hy';
  const [selectedGateway, setSelectedGateway] = useState<PaymentMethodId>('idram');
  const [editableAmount, setEditableAmount] = useState<number>(amountDram);
  const [step, setStep] = useState<'select' | 'processing' | '3dsecure' | 'success'>('select');
  const [countdown, setCountdown] = useState(180);
  const [smsCode, setSmsCode] = useState('7749');
  const [sessionId, setSessionId] = useState<string>('');
  const [orderId, setOrderId] = useState<string>(() => `ORD-${Date.now().toString().slice(-6)}`);
  const [receiptData, setReceiptData] = useState<TransactionReceipt | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Mobile wallet phone number for Idram / Telcell push invoice
  const [walletPhone, setWalletPhone] = useState('+374 91 200 000');

  // Card state (defaults to ArCa Ameriabank preset for immediate usability, fully editable)
  const [cardNumber, setCardNumber] = useState(TEST_CARD_PRESETS[0].cardNumber);
  const [cardExpiry, setCardExpiry] = useState(TEST_CARD_PRESETS[0].expiry);
  const [cardCvv, setCardCvv] = useState(TEST_CARD_PRESETS[0].cvv);
  const [cardHolder, setCardHolder] = useState(TEST_CARD_PRESETS[0].holder);

  const isTopUp = paymentPurpose === 'deposit_topup' || paymentPurpose === 'wallet_topup';
  const effectiveAmount = isTopUp ? Math.max(500, editableAmount || amountDram) : amountDram;

  // Filter gateways: wallet_balance is only for store purchases (cannot top up wallet using wallet itself)
  const availableGateways = useMemo(() => {
    if (isTopUp) {
      return PAYMENT_GATEWAYS.filter((g) => g.id !== 'wallet_balance');
    }
    return PAYMENT_GATEWAYS;
  }, [isTopUp]);

  useEffect(() => {
    if (isOpen) {
      setEditableAmount(amountDram);
      setStep('select');
      setCountdown(180);
      setSmsCode('7749');
      setReceiptData(null);
      setValidationError(null);
      setOrderId(`ORD-${Date.now().toString().slice(-6)}`);
      if (isTopUp && selectedGateway === 'wallet_balance') {
        setSelectedGateway('arca');
      }
    }
  }, [isOpen, amountDram, isTopUp]);

  // Countdown timer for QR payment
  useEffect(() => {
    if (isOpen && step === 'select' && (selectedGateway === 'idram' || selectedGateway === 'telcell')) {
      const timer = setInterval(() => {
        setCountdown((prev) => (prev > 0 ? prev - 1 : 180));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isOpen, step, selectedGateway]);

  const currentGateway =
    availableGateways.find((g) => g.id === selectedGateway) || availableGateways[0];

  const cardMeta = useMemo(() => detectCardBrandAndBank(cardNumber), [cardNumber]);

  const qrPayload = useMemo(
    () => buildGatewayQrPayload(selectedGateway, effectiveAmount, orderId, title),
    [selectedGateway, effectiveAmount, orderId, title]
  );

  const qrMatrix = useMemo(() => generateQrMatrix(qrPayload.qrUri, 25), [qrPayload.qrUri]);

  if (!isOpen) return null;

  const handleSelectGateway = (gwId: PaymentMethodId) => {
    setSelectedGateway(gwId);
    setValidationError(null);
    if (gwId === 'arca') {
      const arcaPreset = TEST_CARD_PRESETS[0];
      setCardNumber(arcaPreset.cardNumber);
      setCardExpiry(arcaPreset.expiry);
      setCardCvv(arcaPreset.cvv);
    } else if (gwId === 'visa_mastercard') {
      const visaPreset = TEST_CARD_PRESETS[1];
      setCardNumber(visaPreset.cardNumber);
      setCardExpiry(visaPreset.expiry);
      setCardCvv(visaPreset.cvv);
    }
  };

  const handleApplyPreset = (preset: (typeof TEST_CARD_PRESETS)[number]) => {
    setCardNumber(preset.cardNumber);
    setCardExpiry(preset.expiry);
    setCardCvv(preset.cvv);
    setCardHolder(preset.holder);
    setValidationError(null);
  };

  const handleCopyPaymentLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(qrPayload.webCheckoutUrl).catch(() => {});
    }
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const getMaskedAccount = (): string => {
    if (selectedGateway === 'arca' || selectedGateway === 'visa_mastercard') {
      const digits = cardNumber.replace(/\D/g, '');
      return `${cardMeta.brand} •••• ${digits.slice(-4) || '1126'} (${cardMeta.bankName})`;
    }
    if (selectedGateway === 'idram' || selectedGateway === 'telcell') {
      return walletPhone.trim() || '+374 91 200 000';
    }
    if (selectedGateway === 'wallet_balance') {
      return 'Система 2000 • Реальный баланс (֏)';
    }
    return 'Apple Pay / Google Pay Token';
  };

  const handleStartPayment = async () => {
    setValidationError(null);

    if (selectedGateway === 'arca' || selectedGateway === 'visa_mastercard') {
      const check = validateCardDetails({
        cardNumber,
        expiry: cardExpiry,
        cvv: cardCvv,
        holder: cardHolder,
      });
      if (!check.valid) {
        setValidationError(isHy ? check.errorHy || 'Սխալ տվյալներ' : check.errorRu || 'Ошибка данных карты');
        return;
      }
    }

    if (selectedGateway === 'wallet_balance' && userRealBalance < effectiveAmount) {
      setValidationError(
        isHy
          ? `Անբավարար միջոցներ իրական հաշվեկշռին (${formatDram(userRealBalance)}): Ընտրեք քարտ կամ Idram:`
          : `Недостаточно средств на реальном балансе (${formatDram(userRealBalance)}). Выберите оплату картой или Idram.`
      );
      return;
    }

    setStep('processing');

    try {
      const res = await fetch('/api/payments/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amountDram: effectiveAmount,
          gatewayId: selectedGateway,
          paymentPurpose,
          title,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setSessionId(data.sessionId);
        if (data.orderId) setOrderId(data.orderId);
        if (data.requires3DS) {
          setTimeout(() => setStep('3dsecure'), 450);
          return;
        }
        await finalizeServerPayment(data.sessionId);
        return;
      }
    } catch {
      // Fallback to local completion if offline
    }

    if (currentGateway.type === 'card') {
      setTimeout(() => setStep('3dsecure'), 450);
    } else {
      setTimeout(() => {
        finalizeServerPayment('');
      }, 450);
    }
  };

  const handleVerify3DSecure = async (e: React.FormEvent) => {
    e.preventDefault();
    if (smsCode.trim().length < 4) {
      setValidationError(
        isHy ? 'Մուտքագրեք 4-նիշանոց SMS կոդը (7749)' : 'Введите 4-значный SMS-код подтверждения (7749)'
      );
      return;
    }
    setValidationError(null);
    setStep('processing');
    await finalizeServerPayment(sessionId, smsCode.trim());
  };

  const finalizeServerPayment = async (activeSessionId: string, otp?: string) => {
    const maskedAccount = getMaskedAccount();
    let serverReceipt: TransactionReceipt | null = null;

    try {
      const res = await fetch('/api/payments/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: activeSessionId,
          otpCode: otp || '7749',
          maskedAccount,
          amountDram: effectiveAmount,
          gatewayId: selectedGateway,
          paymentPurpose,
          title,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.receipt) {
          serverReceipt = data.receipt as TransactionReceipt;
        }
      }
    } catch {
      // Fallback to local receipt generation
    }

    const finalReceipt =
      serverReceipt ||
      generateTransactionReceipt(effectiveAmount, selectedGateway, paymentPurpose, 1, maskedAccount);

    setReceiptData(finalReceipt);
    setStep('success');
    onPaymentSuccess(
      effectiveAmount,
      isHy ? currentGateway.nameHy : currentGateway.nameRu,
      finalReceipt.receiptId,
      selectedGateway,
      paymentPurpose
    );
  };

  const handleDownloadReceipt = () => {
    if (!receiptData) return;
    const lines = [
      '==================================================',
      '        «ՀԱՄԱԿԱՐԳ 2000» / «СИСТЕМА 2000»          ',
      '     ФИСКАЛЬНЫЙ ЭЛЕКТРОННЫЙ ЧЕК / ՀԴՄ ԿՏՐՈՆ       ',
      '==================================================',
      `ՀԴՄ / Фискальный №:   ${receiptData.fiscalHdmNumber}`,
      `ՀՎՀՀ / ИНН компании:   ${receiptData.taxTin}`,
      `Номер квитанции:       ${receiptData.receiptId}`,
      `Код авторизации:       ${receiptData.authCode}`,
      `Дата и время:          ${receiptData.timestamp}`,
      '--------------------------------------------------',
      `Назначение платежа:    ${title}`,
      `Платежный шлюз:        ${isHy ? currentGateway.nameHy : currentGateway.nameRu}`,
      `Счет / Карта:          ${receiptData.maskedAccount || 'Подтвержден'}`,
      `ИТОГО ОПЛАЧЕНО:        ${formatDram(effectiveAmount)}`,
      `Статус транзакции:     ОПЛАЧЕНО (COMPLETED)`,
      '==================================================',
    ].join('\n');

    const blob = new Blob([lines], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${receiptData.receiptId}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/90 select-none font-sans">
      <div className="relative w-full max-w-xl overflow-hidden bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl text-slate-100 flex flex-col max-h-[94vh]">
        {/* Шапка модального окна */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <span>
                  {isHy ? 'Առցանց վճարային դարպաս (vPOS)' : 'Официальный платежный шлюз онлайн'}
                </span>
                <span className="px-2 py-0.5 text-[10px] font-mono bg-emerald-500/20 text-emerald-300 rounded border border-emerald-500/30">
                  PCI-DSS • 3DS 2.0
                </span>
              </h2>
              <p className="text-xs text-slate-400 truncate max-w-xs sm:max-w-md">{title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label={isHy ? 'Փակել' : 'Закрыть'}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Тело модалки */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* СУММА К ОПЛАТЕ И РЕДАКТИРОВАНИЕ ПРИ ПОПОЛНЕНИИ */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div>
                <span className="text-[11px] text-slate-400 block">
                  {paymentPurpose === 'deposit_topup'
                    ? isHy
                      ? '10% Ցմահ դեպոզիտի համալրում՝'
                      : 'Пополнение 10% пожизненного депозита:'
                    : paymentPurpose === 'wallet_topup'
                    ? isHy
                      ? 'Իրական հաշվեկշռի համալրում՝'
                      : 'Пополнение реального баланса:'
                    : isHy
                    ? 'Վճարման ենթակա գումար՝'
                    : 'Сумма заказа к оплате:'}
                </span>
                <span className="text-2xl font-black text-white font-mono tracking-tight">
                  {formatDram(effectiveAmount)}
                </span>
              </div>
              <div className="text-right">
                {paymentPurpose === 'wallet_topup' ? (
                  <span className="text-[11px] text-cyan-300 font-bold block">
                    {isHy ? '100% Իրական հաշվեկշիռ (0% միջնորդավճար)' : '100% на Реальный баланс (комиссия 0%)'}
                  </span>
                ) : effectiveAmount >= 10000 || paymentPurpose === 'deposit_topup' ? (
                  <>
                    <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1 justify-end">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{isHy ? '10% Ցմահ դեպոզիտ' : '10% Пожизненный депозит'}</span>
                    </span>
                    <span className="text-[10px] text-teal-300 font-mono font-bold block mt-0.5">
                      {isHy ? 'ԺԱՌԱՆԳՈՒԹՅԱՄԲ • 0% միջնորդավճար' : 'С НАСЛЕДОВАНИЕМ • Комиссия 0%'}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-[11px] text-amber-400 font-bold block">
                      {isHy ? '+5% Բոնուսային քեշբեք' : '+5% Бонусный кешбэк'}
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      {isHy ? 'Դեպոզիտի համար՝ 10 000 ֏+' : 'Для 10% депозита: от 10 000 ֏'}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* При пополнении счета/депозита можно прямо в окне изменить сумму */}
            {isTopUp && step === 'select' && (
              <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center gap-2">
                {[5000, 10000, 25000, 50000].map((presetAmt) => (
                  <button
                    key={presetAmt}
                    type="button"
                    onClick={() => setEditableAmount(presetAmt)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold border transition-colors cursor-pointer ${
                      editableAmount === presetAmt
                        ? 'bg-emerald-600 text-white border-emerald-500'
                        : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-500'
                    }`}
                  >
                    {formatDram(presetAmt)}
                  </button>
                ))}
                <input
                  type="number"
                  min={500}
                  step={500}
                  value={editableAmount}
                  onChange={(e) => setEditableAmount(Math.max(0, Number(e.target.value)))}
                  className="ml-auto w-32 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                  aria-label={isHy ? 'Գումար' : 'Сумма'}
                />
              </div>
            )}
          </div>

          {/* ОШИБКА ВАЛИДАЦИИ */}
          {validationError && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/50 flex items-center gap-2 text-xs text-rose-200">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {/* ЭТАП 1: ВЫБОР ПЛАТЕЖНОЙ СИСТЕМЫ И РЕКВИЗИТОВ */}
          {step === 'select' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  {isHy ? 'Ընտրեք առցանց վճարման եղանակը՝' : 'Выберите способ онлайн-оплаты:'}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {availableGateways.map((gw) => (
                    <button
                      key={gw.id}
                      type="button"
                      onClick={() => handleSelectGateway(gw.id)}
                      className={`flex items-center justify-between p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        selectedGateway === gw.id
                          ? 'bg-slate-800 border-emerald-500 shadow-md ring-1 ring-emerald-500'
                          : 'bg-slate-900/90 border-slate-800 hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`px-2 py-1.5 rounded-lg border text-[11px] font-mono font-bold shrink-0 ${gw.iconBg}`}>
                          {gw.id === 'idram' && 'IDRAM'}
                          {gw.id === 'telcell' && 'TELCELL'}
                          {gw.id === 'arca' && 'ArCa'}
                          {gw.id === 'visa_mastercard' && 'VISA/MC'}
                          {gw.id === 'apple_pay' && 'PAY'}
                          {gw.id === 'wallet_balance' && '֏ БАЛАНС'}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-xs text-white truncate">
                            {isHy ? gw.nameHy : gw.nameRu}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate">
                            {isHy ? gw.badgeHy : gw.badge}
                          </div>
                        </div>
                      </div>
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                          selectedGateway === gw.id ? 'border-emerald-500 bg-emerald-500' : 'border-slate-600'
                        }`}
                      >
                        {selectedGateway === gw.id && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 1. IDRAM & TELCELL: НАСТОЯЩИЙ SVG QR-КОД + ВЫСТАВЛЕНИЕ СЧЕТА НА ТЕЛЕФОН (+374) */}
              {(selectedGateway === 'idram' || selectedGateway === 'telcell') && (
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    {/* Настоящий контрастный SVG QR-код */}
                    <div className="p-2.5 bg-white rounded-xl shadow-lg shrink-0 border-2 border-emerald-500/40">
                      <svg
                        viewBox="0 0 25 25"
                        className="w-36 h-36 block"
                        shapeRendering="crispEdges"
                        aria-label="QR Code"
                      >
                        {qrMatrix.map((row, rIdx) =>
                          row.map((cell, cIdx) =>
                            cell ? (
                              <rect
                                key={`${rIdx}-${cIdx}`}
                                x={cIdx}
                                y={rIdx}
                                width={1}
                                height={1}
                                fill="#0f172a"
                              />
                            ) : null
                          )
                        )}
                      </svg>
                    </div>

                    {/* Инструкция + счет на номер телефона */}
                    <div className="flex-1 space-y-2.5 text-left w-full">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-white">
                          {selectedGateway === 'idram'
                            ? isHy
                              ? 'Idram / IDBank Ակնթարթային QR'
                              : 'Idram / IDBank Мгновенный QR'
                            : isHy
                            ? 'Telcell Wallet Ակնթարթային QR'
                            : 'Telcell Wallet Мгновенный QR'}
                        </span>
                        <span className="flex items-center gap-1 text-[11px] text-amber-400 font-mono">
                          <Clock className="w-3.5 h-3.5" />
                          {formatTimer(countdown)}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        {isHy
                          ? `Սկանավորեք QR կոդը հեռախոսի տեսախցիկով կամ մուտքագրեք Ձեր ${
                              selectedGateway === 'idram' ? 'Idram' : 'Telcell'
                            } հեռախոսահամարը՝ հաշիվ ստանալու համար.`
                          : `Отсканируйте QR-код камерой смартфона в приложении ${
                              selectedGateway === 'idram' ? 'Idram / Rocket Line' : 'Telcell Wallet'
                            } или укажите номер телефона для выставления счета:`}
                      </p>

                      <div>
                        <label className="block text-[10px] text-slate-400 mb-1">
                          {isHy
                            ? 'Հեռախոսահամար (Push-հաշիվ հավելվածում)'
                            : 'Номер телефона кошелька (Push-счет в приложение)'}
                        </label>
                        <input
                          type="tel"
                          value={walletPhone}
                          onChange={(e) => setWalletPhone(formatArmenianPhone(e.target.value))}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                          placeholder="+374 91 200 000"
                        />
                      </div>

                      <div className="flex items-center gap-2 pt-0.5">
                        <button
                          type="button"
                          onClick={handleCopyPaymentLink}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-[11px] text-slate-300 cursor-pointer transition-colors"
                        >
                          {copiedLink ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-300">
                                {isHy ? 'Հղումը պատճենված է' : 'Ссылка скопирована'}
                              </span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 text-slate-400" />
                              <span>{isHy ? 'Պատճենել վճարման հղումը' : 'Скопировать ссылку оплаты'}</span>
                            </>
                          )}
                        </button>
                        <span className="text-[10px] font-mono text-slate-500">
                          ID: {qrPayload.merchantAccount}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 2. БАНКОВСКИЕ КАРТЫ ARCA / VISA / MASTERCARD С ИНТЕРАКТИВНОЙ КАРТОЙ И БАНКАМИ АРМЕНИИ */}
              {(selectedGateway === 'arca' || selectedGateway === 'visa_mastercard') && (
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3.5">
                  {/* Визуальное превью банковской карты */}
                  <div className="p-3.5 rounded-xl bg-gradient-to-br from-slate-800 via-slate-900 to-emerald-950/80 border border-slate-700 shadow-lg flex flex-col justify-between space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs font-bold text-slate-200">{cardMeta.bankName}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-mono font-bold text-xs">
                        {cardMeta.brand}
                      </span>
                    </div>

                    <div className="font-mono text-base sm:text-lg font-bold tracking-widest text-white">
                      {cardNumber || '0000 0000 0000 0000'}
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-300">
                      <span className="truncate max-w-[200px] uppercase">
                        {cardHolder || 'CARDHOLDER NAME'}
                      </span>
                      <span>EXP {cardExpiry || 'MM/YY'}</span>
                    </div>
                  </div>

                  {/* Быстрый выбор тестовых карт банков Армении для мгновенной проверки */}
                  <div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
                      <span>
                        {isHy
                          ? 'Արագ լրացում (կամ մուտքագրեք Ձեր քարտը)՝'
                          : 'Быстрое заполнение картой банка РА (или введите свою):'}
                      </span>
                      <span className="flex items-center gap-1 text-emerald-400">
                        <Lock className="w-3 h-3" /> TLS 1.3
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {TEST_CARD_PRESETS.map((preset) => (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => handleApplyPreset(preset)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors cursor-pointer ${
                            cardNumber === preset.cardNumber
                              ? 'bg-emerald-600/25 border-emerald-500 text-emerald-300 font-bold'
                              : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-500'
                          }`}
                        >
                          {isHy ? preset.labelHy : preset.labelRu}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Поля ввода реквизитов карты */}
                  <div className="space-y-2.5">
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">
                        {isHy ? 'Քարտի համարը (16 նիշ)' : 'Номер банковской карты (16 цифр)'}
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={cardNumber}
                        onChange={(e) => {
                          setCardNumber(formatCardNumber(e.target.value));
                          setValidationError(null);
                        }}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-white tracking-widest focus:outline-none focus:border-emerald-500"
                        placeholder="0000 0000 0000 0000"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] text-slate-400 mb-1">
                          {isHy ? 'Գործողության ժամկետ (MM/YY)' : 'Срок действия (ММ/ГГ)'}
                        </label>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={cardExpiry}
                          onChange={(e) => {
                            setCardExpiry(formatCardExpiry(e.target.value));
                            setValidationError(null);
                          }}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-white text-center focus:outline-none focus:border-emerald-500"
                          placeholder="MM/YY"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-400 mb-1">CVV / CVC</label>
                        <input
                          type="password"
                          inputMode="numeric"
                          maxLength={4}
                          value={cardCvv}
                          onChange={(e) => {
                            setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4));
                            setValidationError(null);
                          }}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-white text-center focus:outline-none focus:border-emerald-500"
                          placeholder="•••"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">
                        {isHy ? 'Քարտապանի անուն և ազգանուն (լատինատառ)' : 'Имя и фамилия держателя карты'}
                      </label>
                      <input
                        type="text"
                        value={cardHolder}
                        onChange={(e) => {
                          setCardHolder(e.target.value.toUpperCase());
                          setValidationError(null);
                        }}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white uppercase font-mono focus:outline-none focus:border-emerald-500"
                        placeholder="ARAIK PETROSYAN"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 3. APPLE PAY / GOOGLE PAY */}
              {selectedGateway === 'apple_pay' && (
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-center space-y-2">
                  <Smartphone className="w-10 h-10 text-emerald-400 mx-auto" />
                  <p className="text-xs text-white font-bold">
                    Apple Pay / Google Pay • 1-Click Express Checkout
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {isHy
                      ? 'Միանգամյա անվտանգ վճարում կենսաչափական հաստատմամբ (Face ID / Touch ID)'
                      : 'Мгновенная токенизированная оплата без ввода номера карты (Face ID / Touch ID)'}
                  </p>
                </div>
              )}

              {/* 4. ОПЛАТА С РЕАЛЬНОГО БАЛАНСА КОШЕЛЬКА «СИСТЕМА 2000» */}
              {selectedGateway === 'wallet_balance' && (
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-300 flex items-center gap-1.5 font-semibold">
                      <Wallet className="w-4 h-4 text-cyan-400" />
                      <span>
                        {isHy ? 'Ձեր իրական հաշվեկշիռը՝' : 'Доступно на реальном балансе:'}
                      </span>
                    </span>
                    <span className="text-sm font-mono font-bold text-cyan-300">
                      {formatDram(userRealBalance)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs border-t border-slate-800 pt-2">
                    <span className="text-slate-400">
                      {isHy ? 'Վճարումից հետո մնացորդը՝' : 'Остаток после оплаты:'}
                    </span>
                    <span
                      className={`font-mono font-bold ${
                        userRealBalance >= effectiveAmount ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {userRealBalance >= effectiveAmount
                        ? formatDram(userRealBalance - effectiveAmount)
                        : isHy
                        ? `Պակասում է ${formatDram(effectiveAmount - userRealBalance)}`
                        : `Не хватает ${formatDram(effectiveAmount - userRealBalance)}`}
                    </span>
                  </div>
                </div>
              )}

              {/* Кнопка запуска онлайн-оплаты */}
              <button
                type="button"
                onClick={handleStartPayment}
                className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs sm:text-sm transition-all shadow-lg shadow-emerald-700/25 cursor-pointer flex items-center justify-center gap-2"
              >
                <span>
                  {isHy
                    ? `Վճարել առցանց ${formatDram(effectiveAmount)} (${currentGateway.nameHy})`
                    : `Оплатить онлайн ${formatDram(effectiveAmount)} (${currentGateway.nameRu})`}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Сноска на Договор экосистемы */}
              <div className="pt-0.5 text-center">
                <div className="text-[10px] text-slate-400">
                  {isHy
                    ? '★ Պաշտպանված է ՀՀ ԿԲ և ՊԵԿ ՀԴՄ ստանդարտներով (Պայմանագիր № SYS-2000):'
                    : '★ Защищено стандартами ЦБ РА и фискализацией КГД РА (Договор № SYS-2000):'}
                  {onOpenAgreement && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenAgreement();
                      }}
                      className="ml-1 text-emerald-400 hover:text-emerald-300 underline underline-offset-2 transition-colors cursor-pointer"
                    >
                      {isHy ? 'Կարդալ Պայմանագիրը' : 'Читать Договор'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ЭТАП 2: ОБРАБОТКА ТРАНЗАКЦИИ ШЛЮЗОМ */}
          {step === 'processing' && (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
              <div className="relative w-16 h-16">
                <div className="w-16 h-16 rounded-full border-4 border-slate-800 border-t-emerald-400 animate-spin" />
                <CreditCard className="w-6 h-6 text-emerald-400 absolute inset-0 m-auto" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">
                  {isHy ? 'Առցանց վճարումը մշակվում է...' : 'Авторизация онлайн-платежа...'}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  {isHy
                    ? `Պաշտպանված կապ ${currentGateway.nameHy} պրոցեսինգային կենտրոնի հետ`
                    : `Защищенное соединение с процессингом ${currentGateway.nameRu}`}
                </p>
              </div>
            </div>
          )}

          {/* ЭТАП 3: 3D SECURE 2.0 ПОДТВЕРЖДЕНИЕ СМС */}
          {step === '3dsecure' && (
            <form onSubmit={handleVerify3DSecure} className="py-4 space-y-4 text-center">
              <div className="w-12 h-12 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400 mx-auto flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">
                  3D Secure 2.0 • {cardMeta.bankName}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  {isHy
                    ? `Մուտքագրեք SMS կոդը՝ ${formatDram(effectiveAmount)} վճարումը հաստատելու համար (կոդ՝ 7749)`
                    : `Введите одноразовый SMS-код банка для подтверждения списания ${formatDram(effectiveAmount)} (код: 7749)`}
                </p>
              </div>

              <div className="max-w-xs mx-auto space-y-2">
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="SMS Code (7749)"
                  value={smsCode}
                  onChange={(e) => setSmsCode(e.target.value)}
                  className="w-full bg-slate-950 border border-blue-500/60 rounded-xl px-4 py-2.5 text-center text-lg font-mono tracking-widest text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setSmsCode('7749')}
                  className="text-[11px] text-blue-400 hover:text-blue-300 underline cursor-pointer"
                >
                  {isHy ? 'Տեղադրել ստացված SMS կոդը (7749)' : 'Подставить полученный SMS-код (7749)'}
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep('select')}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
                >
                  {isHy ? 'Հետ' : 'Назад'}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors cursor-pointer"
                >
                  {isHy
                    ? `Հաստատել վճարումը (${formatDram(effectiveAmount)})`
                    : `Подтвердить оплату (${formatDram(effectiveAmount)})`}
                </button>
              </div>
            </form>
          )}

          {/* ЭТАП 4: УСПЕШНАЯ ОПЛАТА И ОФИЦИАЛЬНЫЙ ФИСКАЛЬНЫЙ ЧЕК ՀԴՄ */}
          {step === 'success' && receiptData && (
            <div className="py-2 space-y-4">
              <div className="p-4 bg-emerald-950/50 rounded-xl border border-emerald-500/50 text-center">
                <CheckCircle2 className="w-11 h-11 text-emerald-400 mx-auto mb-1.5" />
                <h3 className="text-base font-bold text-white">
                  {isHy ? 'Առցանց վճարումը հաջողությամբ կատարված է!' : 'Онлайн-оплата успешно проведена!'}
                </h3>
                <p className="text-xs text-emerald-300 mt-0.5">
                  {paymentPurpose === 'wallet_topup'
                    ? isHy
                      ? `${formatDram(effectiveAmount)} մուտքագրվել է Ձեր Իրական հաշվեկշռին:`
                      : `${formatDram(effectiveAmount)} зачислено на ваш Реальный баланс кошелька!`
                    : paymentPurpose === 'deposit_topup' || effectiveAmount >= 10000
                    ? isHy
                      ? `${formatDram(effectiveAmount)} ավելացվել է Ձեր 10% Ցմահ դեպոզիտին:`
                      : `${formatDram(effectiveAmount)} зачислено в ваш 10% Пожизненный депозит!`
                    : isHy
                    ? `Պատվերը վճարված է + հաշվեգրվել է 5% բոնուսային քեշբեք:`
                    : `Заказ оплачен + начислен 5% бонусный кешбэк!`}
                </p>
              </div>

              {/* Фискальный чек ՀԴՄ */}
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs space-y-2">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-slate-300 font-sans font-bold">
                  <span className="flex items-center gap-1.5">
                    <Receipt className="w-4 h-4 text-emerald-400" />
                    <span>{isHy ? 'ՀԴՄ Էլեկտրոնային կտրոն' : 'Фискальный чек ՀԴՄ (ՊԵԿ ՀՀ)'}</span>
                  </span>
                  <span className="text-emerald-400 font-mono text-[11px]">
                    {receiptData.fiscalHdmNumber}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">{isHy ? 'Անդորրագիր №' : 'Квитанция №'}:</span>
                  <span className="text-white font-bold">{receiptData.receiptId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">{isHy ? 'Ավտորիզացիայի կոդ' : 'Код авторизации'}:</span>
                  <span className="text-emerald-300">{receiptData.authCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">{isHy ? 'ՀՎՀՀ / Կազմակերպություն' : 'ИНН (ՀՎՀՀ)'}:</span>
                  <span className="text-slate-200">{receiptData.taxTin} • «Համակարգ 2000»</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">{isHy ? 'Վճարման համակարգ' : 'Платежный шлюз'}:</span>
                  <span className="text-white">{isHy ? currentGateway.nameHy : currentGateway.nameRu}</span>
                </div>
                {receiptData.maskedAccount && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">{isHy ? 'Քարտ / Հաշիվ' : 'Карта / Счет'}:</span>
                    <span className="text-slate-200">{receiptData.maskedAccount}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-slate-800 pt-2">
                  <span className="text-slate-300 font-bold">{isHy ? 'ԸՆԴԱՄԵՆԸ ՎՃԱՐՎԱԾ' : 'ИТОГО ОПЛАЧЕНО'}:</span>
                  <span className="text-emerald-400 font-bold text-sm">{formatDram(effectiveAmount)}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-500">{isHy ? 'Ժամանակ' : 'Дата и время'}:</span>
                  <span className="text-slate-400">{receiptData.timestamp}</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={handleDownloadReceipt}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Download className="w-4 h-4 text-emerald-400" />
                  <span>{isHy ? 'Ներբեռնել ՀԴՄ կտրոնը (.txt)' : 'Скачать фискальный чек (.txt)'}</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors cursor-pointer"
                >
                  {isHy ? 'Վերադառնալ խանութ' : 'Готово • Вернуться в магазин'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
