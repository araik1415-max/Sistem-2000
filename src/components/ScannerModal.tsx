import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Camera,
  Upload,
  Search,
  ScanLine,
  QrCode,
  Barcode,
  ShoppingBag,
  PackageCheck,
  Bot,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Zap,
} from 'lucide-react';
import { ProductItem, Language } from '../types';
import {
  findProductByCodeOrQuery,
  decodeBarcodeFromImageFile,
  identifyProductWithGemini,
  generateBarcodeSvg,
  generateQrCodeSvg,
} from '../utils/barcodeUtils';
import { formatDram } from '../utils/finance';


interface ScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  products: ProductItem[];
  onAddToCart?: (product: ProductItem, qty?: number) => void;
  onQuickBuy?: (product: ProductItem) => void;
  onAskAiProduct?: (product: ProductItem) => void;
}

export const ScannerModal: React.FC<ScannerModalProps> = ({
  isOpen,
  onClose,
  lang,
  products,
  onAddToCart,
  onQuickBuy,
  onAskAiProduct,
}) => {
  const isHy = lang === 'hy';
  const [activeTab, setActiveTab] = useState<'camera' | 'upload' | 'manual'>('camera');
  const [manualCode, setManualCode] = useState('');
  const [isAiAnalyzing, setIsAiAnalyzing] = useState<boolean>(false);
  const [scannedResult, setScannedResult] = useState<{
    code: string;
    product: ProductItem | null;
    matchType?: string;
    reasoningRu?: string;
    reasoningHy?: string;
    isAiVision?: boolean;
  } | null>(null);

  const [qrSvg, setQrSvg] = useState<string>('');
  const [barcodeSvg, setBarcodeSvg] = useState<string>('');
  const [isScanningActive, setIsScanningActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Initialize Camera live scanner
  useEffect(() => {
    if (isOpen && activeTab === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, activeTab]);

  const startCamera = async () => {
    setCameraError(null);
    setIsScanningActive(true);
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } else {
        setCameraError(isHy ? 'Տեսախցիկը հասանելի չէ' : 'Камера недоступна в данном браузере');
      }
    } catch (err: any) {
      console.warn('Camera access error:', err);
      setCameraError(isHy ? 'Խնդրում ենք տալ տեսախցիկի թույլտվություն' : 'Разрешите доступ к камере или загрузите фото');
    }
  };

  const stopCamera = () => {
    setIsScanningActive(false);
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  // Generate SVG QR and Barcode when product is matched
  useEffect(() => {
    if (scannedResult?.product) {
      const prod = scannedResult.product;
      const bCode = prod.barcode || `48500012${String(prod.id).padStart(4, '0')}`;
      setBarcodeSvg(generateBarcodeSvg(bCode));

      generateQrCodeSvg(`PRODUCT:${prod.id}:${bCode}:${prod.sku}`).then((svg) => setQrSvg(svg));
    }
  }, [scannedResult]);

  const handleSearchCode = (query: string) => {
    if (!query.trim()) return;
    const { product, matchType } = findProductByCodeOrQuery(products, query);
    setScannedResult({
      code: query,
      product,
      matchType,
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAiAnalyzing(true);
    setScannedResult(null);

    // 1. Try native barcode decoder
    const { text } = await decodeBarcodeFromImageFile(file);
    if (text) {
      const { product, matchType } = findProductByCodeOrQuery(products, text);
      if (product) {
        setScannedResult({
          code: text,
          product,
          matchType: matchType || 'barcode',
        });
        setIsAiAnalyzing(false);
        return;
      }
    }

    // 2. If barcode is damaged, torn, or missing: use Gemini Multimodal AI Vision!
    const aiRes = await identifyProductWithGemini(file);
    if (aiRes.product) {
      setScannedResult({
        code: file.name,
        product: aiRes.product,
        matchType: 'ai_vision',
        reasoningRu: aiRes.reasoningRu || 'Штрихкод поврежден или отсутствует. Товар опознан визуальной нейросетью Gemini.',
        reasoningHy: aiRes.reasoningHy || 'Շտրիխ կոդը վնասված է կամ բացակայում է: Ապրանքը ճանաչվել է Gemini AI տեսողական համակարգով:',
        isAiVision: true,
      });
    } else {
      const fileNameClean = file.name.replace(/[^a-zA-Z0-9]/g, ' ');
      handleSearchCode(fileNameClean);
    }

    setIsAiAnalyzing(false);
  };


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-100 max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <ScanLine className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>{isHy ? 'Շտրիխ կոդերի և QR Սկաներ' : 'Сканер Штрихкодов и QR-кодов'}</span>
                <span className="px-2 py-0.5 text-[10px] font-mono bg-emerald-500/20 text-emerald-300 rounded border border-emerald-500/30 font-bold">
                  AI SCAN 2000
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                {isHy ? 'Որոնում պահեստում ըստ կոդի, նկարի կամ անվանման' : 'Поиск товара на складе по штрихкоду, фото или артикулу'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center gap-1 p-2 bg-slate-950 border-b border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('camera')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-medium transition-all cursor-pointer ${
              activeTab === 'camera'
                ? 'bg-emerald-600 text-white font-bold shadow'
                : 'text-slate-400 hover:text-slate-200 bg-slate-900/60'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>{isHy ? 'Տեսախցիկ' : 'Камера (Live)'}</span>
          </button>

          <button
            onClick={() => setActiveTab('upload')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-medium transition-all cursor-pointer ${
              activeTab === 'upload'
                ? 'bg-emerald-600 text-white font-bold shadow'
                : 'text-slate-400 hover:text-slate-200 bg-slate-900/60'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>{isHy ? 'Նկարի վերբեռնում' : 'Загрузить фото'}</span>
          </button>

          <button
            onClick={() => setActiveTab('manual')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-medium transition-all cursor-pointer ${
              activeTab === 'manual'
                ? 'bg-emerald-600 text-white font-bold shadow'
                : 'text-slate-400 hover:text-slate-200 bg-slate-900/60'
            }`}
          >
            <Search className="w-4 h-4" />
            <span>{isHy ? 'Ձեռքով մուտքագրում' : 'Ручной ввод'}</span>
          </button>
        </div>

        {/* Body content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {/* TAB 1: Live Camera Viewfinder */}
          {activeTab === 'camera' && (
            <div className="space-y-3">
              <div className="relative aspect-video bg-black rounded-xl overflow-hidden border border-slate-700 flex items-center justify-center">
                {cameraError ? (
                  <div className="p-6 text-center text-rose-300 space-y-2">
                    <AlertCircle className="w-8 h-8 mx-auto text-rose-400" />
                    <p className="text-xs font-semibold">{cameraError}</p>
                    <p className="text-[11px] text-slate-400">
                      {isHy ? 'Օգտագործեք «Ձեռքով մուտքագրում» կամ «Նկարի վերբեռնում»' : 'Воспользуйтесь вкладкой «Ручной ввод» или «Загрузить фото»'}
                    </p>
                  </div>
                ) : (
                  <>
                    <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />

                    {/* Scanner Frame animation overlay */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-56 h-56 border-2 border-emerald-400/80 rounded-2xl relative flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                        {/* Corner markers */}
                        <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-emerald-400 -mt-1 -ml-1 rounded-tl"></div>
                        <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-emerald-400 -mt-1 -mr-1 rounded-tr"></div>
                        <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-emerald-400 -mb-1 -ml-1 rounded-bl"></div>
                        <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-emerald-400 -mb-1 -mr-1 rounded-br"></div>

                        {/* Moving laser beam animation */}
                        <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_15px_#10b981] animate-pulse"></div>
                      </div>
                    </div>

                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/70 backdrop-blur text-[11px] font-medium text-emerald-300 border border-emerald-500/30">
                      {isHy ? 'Ուղղեք տեսախցիկը ապրանքի շտրիխ կոդին' : 'Наведите камеру на штрихкод товара'}
                    </div>
                  </>
                )}
              </div>

              {/* Quick sample barcode buttons for testing */}
              <div className="space-y-1.5">
                <div className="text-[11px] font-semibold text-slate-400">
                  {isHy ? 'Թեստային շտրիխ կոդեր պահեստից՝' : 'Быстрый выбор товара для теста:'}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {products.slice(0, 5).map((p) => (
                    <button
                      key={p.id}
                      onClick={() => handleSearchCode(p.barcode || `48500012300${p.id}`)}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-[11px] font-mono text-slate-200 border border-slate-700 cursor-pointer transition-colors"
                    >
                      {p.barcode || p.sku} ({isHy ? p.nameHy.slice(0, 10) : p.nameRu.slice(0, 10)}...)
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: File Upload Scanner */}
          {activeTab === 'upload' && (
            <div className="space-y-4 text-center py-4">
              <label className="border-2 border-dashed border-slate-700 hover:border-emerald-500/60 rounded-2xl p-8 block cursor-pointer bg-slate-950/50 transition-colors group">
                <Upload className="w-10 h-10 mx-auto text-emerald-400 group-hover:scale-110 transition-transform mb-2" />
                <div className="text-sm font-bold text-white">
                  {isHy ? 'Ընտրեք նկար կամ լուսանկար' : 'Выберите фото упаковки или штрихкода'}
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  {isHy ? 'AI-ն կճանաչի ապրանքը ըստ լուսանկարի կամ կոդի' : 'AI определит товар по штрихкоду или изображению'}
                </p>
                <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>
          )}

          {/* TAB 3: Manual Input */}
          {activeTab === 'manual' && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSearchCode(manualCode);
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  {isHy ? 'Մուտքագրեք Շտրիխ կոդ (EAN-13), SKU կամ Անվանում' : 'Введите Штрихкод (EAN-13), SKU или название'}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Օրինակ՝ 485000123002 կամ ARM-MLK-002"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow"
                  >
                    <Search className="w-4 h-4" />
                    <span>{isHy ? 'Փնտրել' : 'Найти'}</span>
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* AI ANALYZING SPINNER */}
          {isAiAnalyzing && (
            <div className="mt-4 p-6 rounded-2xl bg-slate-950 border border-emerald-500/40 text-center space-y-2 animate-pulse">
              <Sparkles className="w-8 h-8 text-emerald-400 mx-auto animate-spin" />
              <div className="text-xs font-bold text-emerald-300">
                {isHy ? 'Gemini AI-ն վերլուծում է ապրանքի նկարը...' : 'Нейросеть Gemini анализирует изображение товара...'}
              </div>
              <p className="text-[11px] text-slate-400">
                {isHy ? 'Ճանաչում նույնիսկ վնասված կամ բացակայող շտրիխ կոդի դեպքում' : 'Идентификация товара при поврежденном или отсутствующем штрихкоде'}
              </p>
            </div>
          )}

          {/* SCANNED PRODUCT RESULT DISPLAY */}
          {scannedResult && !isAiAnalyzing && (
            <div className="mt-4 p-4 rounded-2xl bg-slate-950 border border-emerald-500/40 space-y-4 animate-fadeIn">
              {scannedResult.product ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      {isHy ? 'Ապրանքը գտնվել է պահեստում!' : 'Товар найден на складе 1С!'}
                    </span>
                    <span className="ml-auto text-[10px] font-mono bg-emerald-500/20 px-2 py-0.5 rounded text-emerald-300 border border-emerald-500/30">
                      Match: {scannedResult.matchType?.toUpperCase()}
                    </span>
                  </div>

                  {/* Gemini AI Visual Reasoning Notice */}
                  {scannedResult.isAiVision && (
                    <div className="p-2.5 rounded-xl bg-purple-950/60 border border-purple-500/40 text-xs text-purple-200 flex items-start gap-2">
                      <Sparkles className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-purple-300 block mb-0.5">
                          🤖 {isHy ? 'Gemini AI Տեսողական Ճանաչում:' : 'Gemini AI Компьютерное Зрение:'}
                        </span>
                        <span>
                          {isHy ? scannedResult.reasoningHy : scannedResult.reasoningRu}
                        </span>
                      </div>
                    </div>
                  )}


                  <div className="flex items-start gap-4">
                    <img
                      src={scannedResult.product.imageUrl}
                      alt={scannedResult.product.nameHy}
                      className="w-20 h-20 rounded-xl object-cover border border-slate-700 shrink-0 bg-slate-900"
                    />

                    <div className="space-y-1 min-w-0 flex-1">
                      <h4 className="font-bold text-sm text-white leading-tight">
                        {isHy ? scannedResult.product.nameHy : scannedResult.product.nameRu}
                      </h4>
                      <div className="text-xs text-slate-400">
                        {scannedResult.product.unitHy} • {isHy ? scannedResult.product.categoryHy : scannedResult.product.categoryRu}
                      </div>
                      <div className="text-sm font-mono font-extrabold text-emerald-400 pt-1">
                        {formatDram(scannedResult.product.priceDram)}
                      </div>
                    </div>
                  </div>

                  {/* QR and Barcode SVGs */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800">
                    <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 text-center space-y-1">
                      <div className="text-[10px] text-slate-400 font-medium">{isHy ? 'Պահեստային Շտրիխ կոդ' : 'Штрихкод ЕАН-13'}</div>
                      <div className="p-1 bg-white rounded flex items-center justify-center overflow-hidden" dangerouslySetInnerHTML={{ __html: barcodeSvg }} />
                    </div>

                    <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 text-center space-y-1">
                      <div className="text-[10px] text-slate-400 font-medium">{isHy ? 'QR Կոդ ապրանքի համար' : 'QR-код товара'}</div>
                      <div className="w-20 h-20 mx-auto p-1 bg-white rounded flex items-center justify-center" dangerouslySetInnerHTML={{ __html: qrSvg }} />
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-wrap gap-2 pt-2">
                    {onAddToCart && (
                      <button
                        onClick={() => {
                          onAddToCart(scannedResult.product!);
                          onClose();
                        }}
                        className="flex-1 min-w-[140px] py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow"
                      >
                        <ShoppingBag className="w-4 h-4" />
                        <span>{isHy ? 'Ավելացնել զամբյուղ' : 'В корзину'}</span>
                      </button>
                    )}

                    {onQuickBuy && (
                      <button
                        onClick={() => {
                          onQuickBuy(scannedResult.product!);
                          onClose();
                        }}
                        className="flex-1 min-w-[140px] py-2 px-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow"
                      >
                        <Zap className="w-4 h-4" />
                        <span>{isHy ? 'Արագ գնում' : 'Купить сразу'}</span>
                      </button>
                    )}

                    {onAskAiProduct && (
                      <button
                        onClick={() => {
                          onAskAiProduct(scannedResult.product!);
                          onClose();
                        }}
                        className="py-2 px-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow"
                      >
                        <Bot className="w-4 h-4" />
                        <span>{isHy ? 'AI Խորհրդատու' : 'Спросить AI'}</span>
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-4 text-center text-rose-300 space-y-1">
                  <AlertCircle className="w-6 h-6 mx-auto text-rose-400 mb-1" />
                  <div className="text-xs font-bold">
                    {isHy ? 'Ապրանքը չի գտնվել կոդով:' : 'Товар не найден по коду:'} «{scannedResult.code}»
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {isHy ? 'Ստուգեք կոդի ճշտությունը կամ փնտրեք անվանումով' : 'Проверьте код или введите название товара'}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            {isHy ? 'Փակել' : 'Закрыть'}
          </button>
        </div>
      </div>
    </div>
  );
};
