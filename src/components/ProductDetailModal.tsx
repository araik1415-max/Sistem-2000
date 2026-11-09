import React, { useState } from 'react';
import {
  X,
  ShoppingBag,
  ShoppingCart,
  CreditCard,
  Coins,
  Calendar,
  Building2,
  Globe,
  Thermometer,
  ShieldCheck,
  Check,
  Star,
  Plus,
  Minus,
  Package,
  Sparkles,
  Zap,
} from 'lucide-react';
import { ProductItem, Language } from '../types';
import { formatDram } from '../utils/finance';
import { generateBarcodeSvg } from '../utils/barcodeUtils';


interface ProductDetailModalProps {
  product: ProductItem | null;
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  stockQty?: number;
  inCartQty?: number;
  userPoints: number;
  onAddToCart: (product: ProductItem, quantity?: number) => void;
  onQuickBuyGateway: (product: ProductItem) => void;
  onBuyWithPoints: (product: ProductItem) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  isOpen,
  onClose,
  lang,
  stockQty = 45,
  inCartQty = 0,
  userPoints,
  onAddToCart,
  onQuickBuyGateway,
  onBuyWithPoints,
}) => {
  const [quantity, setQuantity] = useState<number>(1);
  const [isJustAdded, setIsJustAdded] = useState<boolean>(false);

  if (!isOpen || !product) return null;

  const isHy = lang === 'hy';
  const name = isHy ? product.nameHy : product.nameRu;
  const desc = isHy ? product.descriptionHy : product.descriptionRu;
  const category = isHy ? product.categoryHy : product.categoryRu;
  const unit = isHy ? product.unitHy : product.unitRu;
  const manufacturer = isHy
    ? product.manufacturerHy || '«Ապարան Կաթ» ՓԲԸ, Հայաստան'
    : product.manufacturerRu || 'ЗАО «Апаран Кат», Армения';
  const shelfLife = isHy
    ? product.shelfLifeHy || '14 օր (պահպանել +2°C..+6°C-ում)'
    : product.shelfLifeRu || '14 дней (хранить при +2°C..+6°C)';
  const originCountry = isHy
    ? product.originCountryHy || 'Հայաստան'
    : product.originCountryRu || 'Армения';
  const storageConditions = isHy
    ? product.storageConditionsHy || 'Սառնարանում +2°C..+6°C-ում'
    : product.storageConditionsRu || 'В холодильнике при +2°C..+6°C';
  const sku = product.sku || `ARM-SKU-${product.id.toString().padStart(4, '0')}`;

  const canAffordPoints = userPoints >= product.pointsCost * quantity;

  const handleAdd = () => {
    onAddToCart(product, quantity);
    setIsJustAdded(true);
    setTimeout(() => {
      setIsJustAdded(false);
      onClose();
    }, 900);
  };

  return (
    <div
      id="product-detail-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm overflow-y-auto"
    >
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-750 rounded-2xl shadow-2xl text-slate-100 overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* КНОПКА ЗАКРЫТИЯ */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-xl bg-slate-950/80 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors border border-slate-700 cursor-pointer shadow-lg"
          aria-label={isHy ? 'Փակել' : 'Закрыть'}
        >
          <X className="w-5 h-5" />
        </button>

        {/* ШАПКА ВИТРИНЫ */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/90 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>{isHy ? 'Ապրանքի Վիտրինա' : 'Витрина товара'}</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {category}
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                {isHy ? 'Ամբողջական տեղեկատվություն արտադրողի և պահպանման ժամկետների մասին' : 'Полная карточка со сроками годности и производителем'}
              </p>
            </div>
          </div>
        </div>

        {/* ТЕЛО МОДАЛКИ (ОБЗОР ТОВАРА) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 items-start">
            {/* ИЗОБРАЖЕНИЕ ТОВАРА ВИТРИНЫ */}
            <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 h-64 sm:h-72 shadow-xl group">
              <img
                src={product.imageUrl}
                alt={name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-black/75 backdrop-blur-md text-amber-300 text-xs font-extrabold flex items-center gap-1 shadow">
                <Star className="w-3.5 h-3.5 fill-amber-300" />
                <span>4.9 / 5.0</span>
              </div>
              <div className="absolute bottom-3 left-3 right-3 p-2.5 rounded-xl bg-slate-950/85 backdrop-blur-md border border-slate-800 text-[11px] flex items-center justify-between text-slate-300">
                <span className="font-mono">{sku}</span>
                <span className="font-bold text-emerald-400">{isHy ? `Պահեստում՝ ${stockQty} հատ` : `На складе: ${stockQty} шт`}</span>
              </div>
            </div>

            {/* ОСНОВНЫЕ ХАРАКТЕРИСТИКИ ТОВАРА */}
            <div className="space-y-4">
              <div>
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                  {unit}
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-white mt-1.5 leading-snug">
                  {name}
                </h2>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  {desc}
                </p>
              </div>

              {/* ЦЕНЫ И БОНУСЫ */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block">{isHy ? 'Գինը դրամով (֏)' : 'Цена за единицу:'}</span>
                  <span className="text-xl font-black text-white font-mono">{formatDram(product.priceDram)}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-emerald-400 block font-semibold">{isHy ? 'Բոնուսներով' : 'Цена в баллах:'}</span>
                  <span className="text-sm font-extrabold text-teal-300 font-mono flex items-center gap-1 justify-end">
                    <Coins className="w-3.5 h-3.5 text-teal-400" />
                    {product.pointsCost} {isHy ? 'բ.' : 'б.'}
                  </span>
                </div>
              </div>

              {/* ХАРАКТЕРИСТИКИ: СРОК ГОДНОСТИ, ПРОИЗВОДИТЕЛЬ, СТРАНА */}
              <div className="space-y-2.5 text-xs">
                {/* 1. СРОК ГОДНОСТИ */}
                <div className="p-2.5 rounded-xl bg-slate-850 border border-amber-500/30 flex items-start gap-2.5">
                  <Calendar className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-amber-400 font-bold block text-[11px] uppercase tracking-wider">
                      {isHy ? 'Պահպանման ժամկետ / Срок годности:' : 'Срок годности / Expiration:'}
                    </span>
                    <span className="text-white font-medium">{shelfLife}</span>
                  </div>
                </div>

                {/* 2. ПРОИЗВОДИТЕЛЬ */}
                <div className="p-2.5 rounded-xl bg-slate-850 border border-slate-750 flex items-start gap-2.5">
                  <Building2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-slate-400 font-semibold block text-[11px]">
                      {isHy ? 'Արտադրող ընկերություն:' : 'Производитель / Brand:'}
                    </span>
                    <span className="text-white font-bold">{manufacturer}</span>
                  </div>
                </div>

                {/* 3. СТРАНА И УСЛОВИЯ ХРАНЕНИЯ */}
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 rounded-xl bg-slate-850 border border-slate-750 flex items-center gap-2">
                    <Globe className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                    <div>
                      <span className="text-slate-400 block text-[10px]">{isHy ? 'Երկիր:' : 'Страна:'}</span>
                      <span className="text-white font-semibold">{originCountry}</span>
                    </div>
                  </div>

                  <div className="p-2 rounded-xl bg-slate-850 border border-slate-750 flex items-center gap-2">
                    <Thermometer className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    <div>
                      <span className="text-slate-400 block text-[10px]">{isHy ? 'Պայմաններ:' : 'Хранение:'}</span>
                      <span className="text-white font-semibold truncate">{storageConditions}</span>
                    </div>
                  </div>
                </div>

                {/* 4. ДОПУСТИМАЯ НАГРУЗКА (ДЛЯ СТРОИТЕЛЬСТВА) */}
                {(product.loadCapacityRu || product.loadCapacityHy) && (
                  <div className="p-2.5 rounded-xl bg-teal-950/60 border border-teal-500/40 flex items-start gap-2.5">
                    <Zap className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-teal-400 font-bold block text-[11px] uppercase tracking-wider">
                        {isHy ? 'Ծանրաբեռնվածության աստիճան:' : 'Допустимая нагрузка:'}
                      </span>
                      <span className="text-white font-semibold">
                        {isHy ? product.loadCapacityHy : product.loadCapacityRu}
                      </span>
                    </div>
                  </div>
                )}

                {/* 5. ИНСТРУКЦИЯ ПО ПРИМЕНЕНИЮ */}
                {(product.usageInstructionsRu || product.usageInstructionsHy) && (
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-750 text-xs">
                    <span className="text-emerald-400 font-bold block text-[11px] mb-1 uppercase tracking-wider">
                      📋 {isHy ? 'Օգտագործման հրահանգ:' : 'Инструкция по применению:'}
                    </span>
                    <div className="text-slate-200 whitespace-pre-line leading-relaxed">
                      {isHy ? product.usageInstructionsHy : product.usageInstructionsRu}
                    </div>
                  </div>
                )}

                {/* 6. ШТРИХКОД ЕАН-13 И QR-КОД ТОВАРА */}
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-750 text-xs space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-300">
                    <span>{isHy ? 'Շտրիխ կոդ և QR կոդ (1C Պահեստ)' : 'Маркировка 1С (Штрихкод EAN-13 & QR)'}</span>
                    <span className="font-mono text-emerald-400">{product.barcode || `48500012300${product.id}`}</span>
                  </div>
                  <div className="p-2 bg-white rounded-lg flex items-center justify-center overflow-hidden">
                    <div className="w-full" dangerouslySetInnerHTML={{ __html: generateBarcodeSvg(product.barcode || `48500012300${product.id}`) }} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ВЫБОР КОЛИЧЕСТВА И УВЕДОМЛЕНИЕ О 10% ДЕПОЗИТЕ */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-950 to-slate-900 border border-emerald-500/30 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs">
              <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-emerald-300">
                {isHy
                  ? `Գնումը 100%-ով կմուտքագրվի Ձեր 10% APY դեպոզիտին (+${formatDram(product.priceDram * quantity)})`
                  : `100% стоимости зачислится в ваш 10% депозит (+${formatDram(product.priceDram * quantity)})`}
              </span>
            </div>

            {/* Выбор количества */}
            <div className="flex items-center gap-2 bg-slate-900 p-1.5 rounded-xl border border-slate-700">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="font-mono text-sm font-extrabold px-3 text-white">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity((q) => Math.min(stockQty, q + 1))}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* КНОПКИ ДЕЙСТВИЙ В ПОДВАЛЕ ВИТРИНЫ */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex flex-col sm:flex-row items-center gap-2 shrink-0">
          {/* Главная кнопка добавления в корзину */}
          <button
            onClick={handleAdd}
            className={`w-full sm:flex-1 py-3 px-4 rounded-xl font-bold text-xs transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer ${
              isJustAdded
                ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/40 scale-95'
                : 'bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white shadow-emerald-700/30'
            }`}
          >
            {isJustAdded ? (
              <>
                <Check className="w-4 h-4" />
                <span>{isHy ? 'Ավելացված է զամբյուղում!' : 'Добавлено в корзину!'}</span>
              </>
            ) : (
              <>
                <ShoppingCart className="w-4 h-4" />
                <span>
                  {isHy
                    ? `Ավելացնել զամբյուղ (${formatDram(product.priceDram * quantity)})`
                    : `Добавить в корзину (${formatDram(product.priceDram * quantity)})`}
                </span>
              </>
            )}
          </button>

          {/* Быстрая покупка через Idram / ArCa */}
          <button
            onClick={() => {
              onQuickBuyGateway(product);
              onClose();
            }}
            className="w-full sm:w-auto py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-750 text-emerald-300 border border-emerald-500/40 font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <CreditCard className="w-4 h-4" />
            <span>{isHy ? 'Արագ վճարում' : 'Быстрая оплата'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
