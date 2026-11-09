import React, { useState } from 'react';
import { X, Printer, Tag, CheckSquare, Square, Barcode } from 'lucide-react';
import { ProductItem, Language } from '../types';
import { formatDram } from '../utils/finance';

interface PriceTagsPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: ProductItem[];
  lang: Language;
}

export const PriceTagsPrintModal: React.FC<PriceTagsPrintModalProps> = ({
  isOpen,
  onClose,
  products,
  lang,
}) => {
  const [selectedIds, setSelectedIds] = useState<number[]>(() => products.map((p) => p.id));
  const [tagSize, setTagSize] = useState<'standard' | 'compact'>('standard');
  const isHy = lang === 'hy';

  if (!isOpen) return null;

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    setSelectedIds(products.map((p) => p.id));
  };

  const deselectAll = () => {
    setSelectedIds([]);
  };

  const selectedProducts = products.filter((p) => selectedIds.includes(p.id));

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-none animate-fadeIn">
      <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-800 text-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                1С:Печать ценников и этикеток со штрих-кодами
              </h3>
              <p className="text-xs text-slate-400">
                {isHy
                  ? 'Ապրանքների գնապիտակներ շտրիխ-կոդով խանութի ցուցափեղկերի համար'
                  : 'Печать полочных ценников для торгового зала со штрихкодом EAN-13'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => window.print()}
              disabled={selectedProducts.length === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs shadow-lg transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Печать ({selectedProducts.length} шт)</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toolbar & Filter */}
        <div className="px-6 py-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between flex-wrap gap-3 text-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={selectAll}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
            >
              Выбрать все
            </button>
            <button
              onClick={deselectAll}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
            >
              Снять выбор
            </button>
            <span className="text-slate-400">
              Выбрано: <strong className="text-amber-400">{selectedProducts.length}</strong> из {products.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400">Формат:</span>
            <button
              onClick={() => setTagSize('standard')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                tagSize === 'standard' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300'
              }`}
            >
              Стандарт 60x40 мм
            </button>
            <button
              onClick={() => setTagSize('compact')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                tagSize === 'compact' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300'
              }`}
            >
              Компакт 40x30 мм
            </button>
          </div>
        </div>

        {/* Print Preview Canvas */}
        <div className="p-6 overflow-y-auto bg-slate-950/60 flex-1">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 print:grid-cols-3 print:gap-2">
            {selectedProducts.map((p) => {
              const eanBarcode = `48500${String(p.id).padStart(7, '0')}7`;
              return (
                <div
                  key={p.id}
                  onClick={() => toggleSelect(p.id)}
                  className={`relative p-3.5 bg-white text-slate-900 rounded-lg border-2 shadow-md cursor-pointer transition-all ${
                    selectedIds.includes(p.id) ? 'border-amber-500' : 'opacity-40 border-slate-300'
                  }`}
                >
                  <div className="text-[10px] font-bold text-slate-500 tracking-wider uppercase border-b border-slate-200 pb-1 mb-1.5 flex justify-between items-center">
                    <span>«Համակարգ 2000» Մարկետ</span>
                    <span>{new Date().toLocaleDateString('ru-RU')}</span>
                  </div>

                  <div className="font-extrabold text-xs line-clamp-2 leading-tight text-slate-950 mb-1 min-h-[32px]">
                    {p.nameRu} ({p.nameHy})
                  </div>

                  <div className="text-[10px] text-slate-600 mb-2">
                    Фасовка: <strong className="text-slate-800">{p.unitRu}</strong> • Категория: {p.categoryRu}
                  </div>

                  {/* Большой блок цены */}
                  <div className="bg-amber-100/70 border border-amber-300 rounded p-1.5 text-center my-1.5">
                    <div className="text-[9px] uppercase font-bold text-slate-700">Цена розничная:</div>
                    <div className="text-xl font-black text-slate-950 tracking-tight">
                      {formatDram(p.priceDram)}
                    </div>
                  </div>

                  {/* Штрих-код 1С */}
                  <div className="mt-2 pt-2 border-t border-dashed border-slate-300 text-center">
                    <div className="font-mono text-center tracking-[4px] text-[11px] font-bold text-slate-800 py-0.5">
                      ||| | || |||| | | |||
                    </div>
                    <div className="font-mono text-[9px] text-slate-500 tracking-wider">
                      {eanBarcode}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
