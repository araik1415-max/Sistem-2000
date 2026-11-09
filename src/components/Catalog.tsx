import React, { useState } from 'react';
import {
  Search,
  ShoppingBag,
  Coins,
  Star,
  Check,
  ShoppingCart,
  CreditCard,
  Calendar,
  Building2,
  Eye,
  Info,
  Plus,
} from 'lucide-react';
import { ProductItem, Language, ProductCategory } from '../types';
import { formatDram } from '../utils/finance';
import { CartItem } from '../utils/payment';
import { ProductDetailModal } from './ProductDetailModal';

import { ScanLine } from 'lucide-react';

interface CatalogProps {
  products: ProductItem[];
  userPoints: number;
  realBalance: number;
  cart: CartItem[];
  stockMap?: Record<number, number>;
  categoriesList?: ProductCategory[];
  onAddToCart: (product: ProductItem, quantity?: number) => void;
  onQuickBuyGateway: (product: ProductItem) => void;
  onBuyWithPoints: (product: ProductItem) => void;
  lang: Language;
  onOpenScanner?: () => void;
}

export const Catalog: React.FC<CatalogProps> = React.memo(({
  products,
  userPoints,
  realBalance,
  cart,
  stockMap,
  categoriesList,
  onAddToCart,
  onQuickBuyGateway,
  onBuyWithPoints,
  lang,
  onOpenScanner,
}) => {

  const isHy = lang === 'hy';
  const [search, setSearch] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<'all' | 'groceries' | 'construction'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'default' | 'price_asc' | 'price_desc'>('default');
  const [addedAnimationId, setAddedAnimationId] = useState<number | null>(null);
  const [detailProduct, setDetailProduct] = useState<ProductItem | null>(null);

  const defaultGroceryCategories = isHy
    ? [
        { id: 'all', label: 'Բոլորը' },
        { id: 'Հացաբուլկեղեն', label: 'Հացաբուլկեղեն' },
        { id: 'Կաթնամթերք', label: 'Կաթնամթերք' },
        { id: 'Մթերք և ձավարեղեն', label: 'Ձավարեղեն' },
        { id: 'Բանջարեղեն և մրգեր', label: 'Բանջարեղեն' },
        { id: 'Ըմպելիքներ', label: 'Ըմպելիքներ' },
        { id: 'Քաղցրավենիք', label: 'Քաղցրավենիք' },
      ]
    : [
        { id: 'all', label: 'Все' },
        { id: 'Бакалея', label: 'Бакалея' },
        { id: 'Молочные продукты', label: 'Молочные продукты' },
        { id: 'Овощи и фрукты', label: 'Овощи и фрукты' },
        { id: 'Напитки', label: 'Напитки' },
        { id: 'Сладости', label: 'Сладости' },
      ];

  const defaultConstructionCategories = isHy
    ? [
        { id: 'all', label: 'Բոլորը' },
        { id: 'Строительные материалы', label: 'Շինանյութեր' },
        { id: 'Инструменты', label: 'Գործիքներ' },
        { id: 'Սոսինձներ և հերմետիկներ', label: 'Սոսինձներ' },
        { id: 'Հարդարման նյութեր', label: 'Մածիկներ' },
        { id: 'Ամրակման նյութեր', label: 'Ամրակներ' },
      ]
    : [
        { id: 'all', label: 'Все' },
        { id: 'Строительные материалы', label: 'Строительные материалы' },
        { id: 'Инструменты', label: 'Инструменты' },
        { id: 'Клеи и строительная химия', label: 'Клеи и герметики' },
        { id: 'Отделочные материалы', label: 'Шпатлевки' },
        { id: 'Крепеж и метизы', label: 'Крепеж' },
      ];

  const groceryCategories = categoriesList
    ? [
        { id: 'all', label: isHy ? 'Բոլորը' : 'Все' },
        ...categoriesList
          .filter((c) => c.department === 'groceries')
          .map((c) => ({
            id: isHy ? c.nameHy : c.nameRu,
            label: isHy ? c.nameHy : c.nameRu,
          })),
      ]
    : defaultGroceryCategories;

  const constructionCategories = categoriesList
    ? [
        { id: 'all', label: isHy ? 'Բոլորը' : 'Все' },
        ...categoriesList
          .filter((c) => c.department === 'construction')
          .map((c) => ({
            id: isHy ? c.nameHy : c.nameRu,
            label: isHy ? c.nameHy : c.nameRu,
          })),
      ]
    : defaultConstructionCategories;

  const categories =
    selectedDepartment === 'construction'
      ? constructionCategories
      : selectedDepartment === 'groceries'
      ? groceryCategories
      : [...groceryCategories, ...constructionCategories.filter((c) => c.id !== 'all')];

  const handleAddWithFeedback = (product: ProductItem, qty: number = 1) => {
    onAddToCart(product, qty);
    setAddedAnimationId(product.id);
    setTimeout(() => setAddedAnimationId(null), 1200);
  };

  const filteredProducts = products
    .filter((p) => {
      const name = isHy ? p.nameHy : p.nameRu;
      const desc = isHy ? p.descriptionHy : p.descriptionRu;
      const cat = isHy ? p.categoryHy : p.categoryRu;
      const mfr = isHy ? p.manufacturerHy || '' : p.manufacturerRu || '';
      const dept = p.department || 'groceries';

      const matchesDepartment = selectedDepartment === 'all' || dept === selectedDepartment;
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        name.toLowerCase().includes(q) ||
        desc.toLowerCase().includes(q) ||
        mfr.toLowerCase().includes(q) ||
        (p.barcode && p.barcode.includes(q)) ||
        (p.sku && p.sku.toLowerCase().includes(q)) ||
        (p.imageKeywords && p.imageKeywords.some((kw) => kw.toLowerCase().includes(q)));

      const matchesCategory =
        selectedCategory === 'all' ||
        cat === selectedCategory ||
        p.category === selectedCategory ||
        p.categoryRu === selectedCategory ||
        p.categoryHy === selectedCategory;
      return matchesDepartment && matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (sortBy === 'price_asc') return a.priceDram - b.priceDram;
      if (sortBy === 'price_desc') return b.priceDram - a.priceDram;
      return 0;
    });

  const getCartQuantity = (productId: number) => {
    return cart.find((c) => c.product.id === productId)?.quantity || 0;
  };

  return (
    <div className="rounded-2xl bg-slate-850/80 border border-slate-750 p-4 sm:p-5 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-emerald-400" />
            <span>{isHy ? 'Առցանց սուպերմարկետ և Շինանյութ • Իրական Վիտրինա' : 'Интерактивная Витрина (Продукты и Строительство)'}</span>
          </h2>
          <p className="text-xs text-slate-400">
            {isHy
              ? 'Սեղմեք նկարին զամբյուղ ավելացնելու համար կամ օգտագործեք Շտրիխ կոդերի սկաները'
              : 'Выберите отдел или сканируйте штрихкод товара для моментального поиска на складе'}
          </p>
        </div>

        {/* Որոնում և սորտավորում */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-56 flex items-center gap-1">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder={isHy ? 'Փնտրել ապրանք, կոդ...' : 'Поиск товара, штрихкода...'}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {onOpenScanner && (
              <button
                onClick={onOpenScanner}
                className="p-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs transition-all cursor-pointer shrink-0"
                title={isHy ? 'Սկանավորել Շտրիխ կոդ' : 'Сканировать Штрихкод'}
              >
                <ScanLine className="w-4 h-4" />
              </button>
            )}
          </div>

          <select
            value={sortBy}
            onChange={(e: any) => setSortBy(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
          >
            <option value="default">{isHy ? 'Լռելյայն' : 'По умолчанию'}</option>
            <option value="price_asc">{isHy ? 'Էժանից թանկ' : 'Сначала дешевле'}</option>
            <option value="price_desc">{isHy ? 'Թանկից էժան' : 'Сначала дороже'}</option>
          </select>
        </div>
      </div>

      {/* ԲԱԺԻՆՆԵՐԻ ԸՆՏՐՈՒԹՅՈՒՆ (ОТДЕЛЫ: ПРОДУКТЫ / СТРОИТЕЛЬСТВО / ВСЕ) */}
      <div className="flex items-center gap-2 mb-3 bg-slate-900/90 p-1.5 rounded-xl border border-slate-750">
        <button
          onClick={() => {
            setSelectedDepartment('all');
            setSelectedCategory('all');
          }}
          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            selectedDepartment === 'all'
              ? 'bg-emerald-500 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          ✨ {isHy ? 'Բոլոր բաժինները' : 'Все отделы'}
        </button>
        <button
          onClick={() => {
            setSelectedDepartment('groceries');
            setSelectedCategory('all');
          }}
          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            selectedDepartment === 'groceries'
              ? 'bg-emerald-500 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          🍏 {isHy ? 'Սուպերմարկետ' : 'Продукты'}
        </button>
        <button
          onClick={() => {
            setSelectedDepartment('construction');
            setSelectedCategory('all');
          }}
          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            selectedDepartment === 'construction'
              ? 'bg-emerald-500 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          🛠️ {isHy ? 'Շինանյութ' : 'Строительство'}
        </button>
      </div>

      {/* Կատեգորիաներ */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-4 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
              selectedCategory === cat.id
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 border border-slate-700/60'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Ցուցակ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {filteredProducts.length === 0 ? (
          <div className="col-span-2 py-8 text-center text-slate-400 text-xs">
            {isHy ? 'Ապրանքներ չեն գտնվել:' : 'Товары не найдены.'}
          </div>
        ) : (
          filteredProducts.map((product) => {
            const inCartQty = getCartQuantity(product.id);
            const isJustAdded = addedAnimationId === product.id;
            const canAffordPoints = userPoints >= product.pointsCost;

            const manufacturer = isHy
              ? product.manufacturerHy || '«Ապարան Կաթ» ՓԲԸ'
              : product.manufacturerRu || 'ЗАО «Апаран Кат»';

            const shelfLife = isHy
              ? product.shelfLifeHy || '14 օր'
              : product.shelfLifeRu || '14 дней';

            return (
              <div
                key={product.id}
                className="flex flex-col justify-between p-3.5 rounded-xl bg-slate-900/95 border border-slate-800 hover:border-emerald-500/40 transition-all shadow-sm group"
              >
                <div>
                  <div className="flex items-start gap-3">
                    {/* КЛИКАБЕЛЬНЫЙ РИСУНОК ПРОДУКТА (НАЖАТИЕ = ДОБАВЛЕНИЕ В КОРЗИНУ) */}
                    <div
                      onClick={() => handleAddWithFeedback(product)}
                      className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden shrink-0 border border-slate-750 bg-slate-800 group-hover:border-emerald-500 transition-all cursor-pointer shadow-md active:scale-95"
                      title={
                        isHy
                          ? 'Սեղմեք նկարին՝ ապրանքն անմիջապես զամբյուղ ավելացնելու համար'
                          : 'Нажмите на картинку, чтобы сразу добавить товар в корзину!'
                      }
                    >
                      <img
                        src={product.imageUrl}
                        alt={isHy ? product.nameHy : product.nameRu}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      {/* Оверлей подсказка при наведении */}
                      <div className="absolute inset-0 bg-emerald-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-[10px] font-bold text-center p-1">
                        <Plus className="w-5 h-5 text-emerald-300 drop-shadow" />
                      </div>

                      {inCartQty > 0 && (
                        <div className="absolute top-1 right-1 px-1.5 py-0.5 rounded-md bg-emerald-600 text-white font-mono font-bold text-[10px] shadow-lg">
                          x{inCartQty}
                        </div>
                      )}
                    </div>

                    {/* Ինֆո */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 flex-wrap">
                        <span className="text-[10px] text-slate-300 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
                          {isHy ? product.unitHy : product.unitRu}
                        </span>
                        <div className="flex items-center gap-0.5 text-[10px] text-amber-400 font-semibold">
                          <Star className="w-3 h-3 fill-amber-400" />
                          <span>4.9</span>
                        </div>
                      </div>

                      <h3 className="text-xs sm:text-sm font-bold text-white tracking-tight truncate mt-1">
                        {isHy ? product.nameHy : product.nameRu}
                      </h3>

                      {/* НАЗВАНИЕ ПРОИЗВОДИТЕЛЯ И СРОК ГОДНОСТИ */}
                      <div className="space-y-0.5 my-1 text-[10px]">
                        <div className="flex items-center gap-1 text-slate-300 truncate">
                          <Building2 className="w-3 h-3 text-emerald-400 shrink-0" />
                          <span className="truncate">{manufacturer}</span>
                        </div>
                        <div className="flex items-center gap-1 text-amber-400 font-medium truncate">
                          <Calendar className="w-3 h-3 text-amber-400 shrink-0" />
                          <span className="truncate">{shelfLife}</span>
                        </div>
                      </div>

                      {/* НАГРУЗКА (ДЛЯ СТРОИТЕЛЬНЫХ ТОВАРОВ) */}
                      {(product.loadCapacityRu || product.loadCapacityHy) && (
                        <div className="mt-1 flex items-center gap-1 text-[10px] text-teal-300 font-medium bg-teal-950/70 px-1.5 py-0.5 rounded border border-teal-500/30 truncate">
                          <span className="shrink-0">💪</span>
                          <span className="truncate">{isHy ? product.loadCapacityHy : product.loadCapacityRu}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-2 mt-1 font-mono">
                        <span className="text-sm font-black text-white">
                          {formatDram(product.priceDram)}
                        </span>
                        <span className="text-slate-500 text-xs">/</span>
                        <span className="text-xs text-emerald-400 font-semibold flex items-center gap-0.5">
                          <Coins className="w-3 h-3 text-emerald-400" />
                          {product.pointsCost} {isHy ? 'բ.' : 'б.'}
                        </span>
                      </div>

                      {/* 1C Պահեստի մնացորդի ցուցիչ */}
                      {stockMap && (
                        <div className="mt-1 flex items-center gap-1.5 text-[10px]">
                          <span
                            className={`px-1.5 py-0.5 rounded font-mono font-bold ${
                              (stockMap[product.id] ?? 0) <= 10
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            }`}
                          >
                            {isHy
                              ? `Պահեստում՝ ${stockMap[product.id] ?? 0} հատ`
                              : `На складе: ${stockMap[product.id] ?? 0} шт`}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Գործողություններ */}
                <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between gap-1.5">
                  {/* КНОПКА «ВИ ТРИНА» / 👁️ ОПИСАНИЕ И ХАРАКТЕРИСТИКИ */}
                  <button
                    onClick={() => setDetailProduct(product)}
                    className="px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 flex items-center gap-1 transition-colors cursor-pointer"
                    title={isHy ? 'Դիտել ապրանքի վիտրինան' : 'Открыть подробную витрину товара'}
                  >
                    <Eye className="w-3.5 h-3.5 text-teal-400" />
                    <span className="text-[11px]">{isHy ? 'Վիտրինա' : 'Инфо'}</span>
                  </button>

                  {/* Ավելացնել զամբյուղ */}
                  <button
                    onClick={() => handleAddWithFeedback(product)}
                    className={`flex-1 inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      isJustAdded
                        ? 'bg-emerald-500 text-slate-950 shadow'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-700/20'
                    }`}
                  >
                    {isJustAdded ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>{isHy ? 'Ավելացված է!' : 'В корзине!'}</span>
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-3.5 h-3.5" />
                        <span>{isHy ? '+ Զամբյուղ' : '+ В корзину'}</span>
                      </>
                    )}
                  </button>

                  {/* Արագ գնում վճարային համակարգով */}
                  <button
                    onClick={() => onQuickBuyGateway(product)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-emerald-300 border border-emerald-500/40 text-xs font-semibold transition-all cursor-pointer"
                    title={isHy ? 'Արագ վճարում Idram / ArCa-ով (+դեպոզիտ)' : 'Быстрая оплата Idram / ArCa'}
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>{isHy ? 'Վճարել' : 'Купить'}</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* МОДАЛЬНОЕ ОКНО ПОДРОБНОЙ ВИТРИНЫ ТОВАРА */}
      <ProductDetailModal
        product={detailProduct}
        isOpen={Boolean(detailProduct)}
        onClose={() => setDetailProduct(null)}
        lang={lang}
        stockQty={detailProduct ? (stockMap ? stockMap[detailProduct.id] : 45) : 45}
        inCartQty={detailProduct ? getCartQuantity(detailProduct.id) : 0}
        userPoints={userPoints}
        onAddToCart={onAddToCart}
        onQuickBuyGateway={onQuickBuyGateway}
        onBuyWithPoints={onBuyWithPoints}
      />
    </div>
  );
});
