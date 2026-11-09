import React from 'react';
import { X, Printer, Download, CheckCircle, FileText } from 'lucide-react';
import { ErpDocument, Warehouse, Counterparty } from '../types/erp';
import { formatDram } from '../utils/finance';
import { Language } from '../types';

interface PrintFormsModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: ErpDocument | null;
  warehouses: Warehouse[];
  counterparties: Counterparty[];
  lang: Language;
}

export const PrintFormsModal: React.FC<PrintFormsModalProps> = ({
  isOpen,
  onClose,
  document,
  warehouses,
  counterparties,
  lang,
}) => {
  if (!isOpen || !document) return null;

  const isHy = lang === 'hy';
  const warehouse = warehouses.find((w) => w.id === document.warehouseId);
  const targetWarehouse = warehouses.find((w) => w.id === document.targetWarehouseId);
  const counterparty = counterparties.find((c) => c.id === document.counterpartyId);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-none animate-fadeIn">
      <div className="relative w-full max-w-4xl bg-white text-slate-900 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Верхняя панель управления печатью (не выводится на печать) */}
        <div className="print:hidden flex items-center justify-between px-5 py-3.5 bg-slate-900 text-white border-b border-slate-800">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-bold tracking-tight">
              1С:Печатная форма — {document.docNumber} ({document.type.toUpperCase()})
            </h3>
            <span
              className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                document.status === 'posted'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}
            >
              {document.status === 'posted' ? 'ПРОВЕДЕН' : 'ЧЕРНОВИК'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Печать (Ctrl+P)</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Тело бланка 1С (стилизовано под официальный документ 1С Предприятие) */}
        <div className="p-8 overflow-y-auto font-sans text-xs bg-white text-slate-900 print:p-0 print:m-0">
          {/* ФОРМА ТОРГ-12 / ПРИХОДНАЯ НАКЛАДНАЯ */}
          {document.type === 'receipt' && (
            <div>
              <div className="text-right text-[10px] text-slate-500 mb-2">
                Типовая межотраслевая форма № ТОРГ-12<br />
                Утверждена постановлением Госкомстата
              </div>

              <div className="border-b-2 border-slate-900 pb-3 mb-4">
                <h2 className="text-base font-extrabold uppercase tracking-tight">
                  Товарная накладная № {document.docNumber} от {document.date}
                </h2>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4 text-xs">
                <div>
                  <span className="font-bold text-slate-600">Грузоотправитель (Поставщик):</span>
                  <p className="font-semibold text-slate-900">
                    {counterparty?.name || 'ООО "Арарат Дистрибьюшн"'}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    ИНН/ՀՎՀՀ: {counterparty?.taxId || '02568912'}, Тел: {counterparty?.phone || '+374 10 442211'}
                  </p>
                </div>
                <div>
                  <span className="font-bold text-slate-600">Грузополучатель (Склад):</span>
                  <p className="font-semibold text-slate-900">
                    «Համակարգ 2000» Խանութ — {warehouse?.nameRu || 'Центральный склад'}
                  </p>
                  <p className="text-[11px] text-slate-500">Адрес: {warehouse?.address || 'ք. Երևան, Աբովյան 12'}</p>
                </div>
              </div>

              {/* Таблица товаров */}
              <table className="w-full border-collapse border border-slate-400 mb-6 text-[11px]">
                <thead>
                  <tr className="bg-slate-100 border border-slate-400 font-bold text-center">
                    <th className="border border-slate-400 p-1.5 w-8">№</th>
                    <th className="border border-slate-400 p-1.5 text-left">Наименование товара, характеристика</th>
                    <th className="border border-slate-400 p-1.5 w-16">Ед. изм.</th>
                    <th className="border border-slate-400 p-1.5 w-20">Кол-во</th>
                    <th className="border border-slate-400 p-1.5 w-24">Цена закупки (֏)</th>
                    <th className="border border-slate-400 p-1.5 w-28 text-right">Сумма (֏)</th>
                  </tr>
                </thead>
                <tbody>
                  {document.items.map((it, idx) => (
                    <tr key={idx} className="border border-slate-300">
                      <td className="border border-slate-300 p-1.5 text-center">{idx + 1}</td>
                      <td className="border border-slate-300 p-1.5 font-medium">{it.productName}</td>
                      <td className="border border-slate-300 p-1.5 text-center">{it.unit}</td>
                      <td className="border border-slate-300 p-1.5 text-center font-bold">{it.quantity}</td>
                      <td className="border border-slate-300 p-1.5 text-center">{formatDram(it.priceDram)}</td>
                      <td className="border border-slate-300 p-1.5 text-right font-bold">{formatDram(it.totalDram)}</td>
                    </tr>
                  ))}
                  <tr className="bg-slate-50 font-bold border-t-2 border-slate-800">
                    <td colSpan={3} className="border border-slate-400 p-2 text-right">Итого к оплате:</td>
                    <td className="border border-slate-400 p-2 text-center">
                      {document.items.reduce((s, it) => s + it.quantity, 0)} шт
                    </td>
                    <td className="border border-slate-400 p-2"></td>
                    <td className="border border-slate-400 p-2 text-right text-emerald-800 font-extrabold text-sm">
                      {formatDram(document.amountDram)}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Подписи */}
              <div className="grid grid-cols-2 gap-8 pt-4 border-t border-slate-300 text-xs mt-8">
                <div>
                  <p className="font-bold text-slate-700 mb-8">Отпустил (Поставщик):</p>
                  <div className="border-b border-slate-500 w-48 mb-1"></div>
                  <p className="text-[10px] text-slate-500">подпись / расшифровка</p>
                </div>
                <div>
                  <p className="font-bold text-slate-700 mb-8">Принял материально ответственный (Склад):</p>
                  <div className="border-b border-slate-500 w-48 mb-1"></div>
                  <p className="text-[10px] text-slate-500">{warehouse?.responsiblePerson || 'Արայիկ Պետրոսյան'} (подпись)</p>
                </div>
              </div>
            </div>
          )}

          {/* ФОРМА ПКО (Приходный кассовый ордер КО-1) */}
          {document.type === 'pko' && (
            <div>
              <div className="border border-slate-800 p-6 rounded-lg max-w-2xl mx-auto">
                <div className="text-right text-[10px] text-slate-500 mb-2">Унифицированная форма № КО-1</div>
                <h2 className="text-center font-extrabold text-base mb-1 uppercase">
                  Приходный кассовый ордер № {document.docNumber}
                </h2>
                <p className="text-center text-xs text-slate-600 mb-4">от {document.date} г.</p>

                <div className="space-y-3 mb-6">
                  <div className="flex border-b border-slate-300 py-1">
                    <span className="w-36 font-semibold text-slate-600">Организация:</span>
                    <span className="font-bold">«Համակարգ 2000» Ինտերնետ Խանութ & Սուպերմարկետ</span>
                  </div>
                  <div className="flex border-b border-slate-300 py-1">
                    <span className="w-36 font-semibold text-slate-600">Принято от:</span>
                    <span className="font-bold">{counterparty?.name || 'Розничный покупатель (Выручка ККМ)'}</span>
                  </div>
                  <div className="flex border-b border-slate-300 py-1">
                    <span className="w-36 font-semibold text-slate-600">Основание:</span>
                    <span>{document.comment || 'Оприходование торговой выручки'}</span>
                  </div>
                  <div className="flex border-b border-slate-300 py-1">
                    <span className="w-36 font-semibold text-slate-600">Сумма цифрами:</span>
                    <span className="font-extrabold text-base text-emerald-800">{formatDram(document.amountDram)}</span>
                  </div>
                </div>

                <div className="flex justify-between pt-6 border-t border-slate-400 text-xs">
                  <div>
                    <span className="font-bold">Главный бухгалтер:</span> _______________
                  </div>
                  <div>
                    <span className="font-bold">Кассир:</span> _______________ ({document.author})
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ФОРМА РКО (Расходный кассовый ордер КО-2) */}
          {document.type === 'rko' && (
            <div>
              <div className="border border-slate-800 p-6 rounded-lg max-w-2xl mx-auto">
                <div className="text-right text-[10px] text-slate-500 mb-2">Унифицированная форма № КО-2</div>
                <h2 className="text-center font-extrabold text-base mb-1 uppercase">
                  Расходный кассовый ордер № {document.docNumber}
                </h2>
                <p className="text-center text-xs text-slate-600 mb-4">от {document.date} г.</p>

                <div className="space-y-3 mb-6">
                  <div className="flex border-b border-slate-300 py-1">
                    <span className="w-36 font-semibold text-slate-600">Организация:</span>
                    <span className="font-bold">«Համակարգ 2000» Ինտերնետ Խանութ & Սուպերմարկետ</span>
                  </div>
                  <div className="flex border-b border-slate-300 py-1">
                    <span className="w-36 font-semibold text-slate-600">Выдать:</span>
                    <span className="font-bold">{counterparty?.name || 'Инкассация в банк / Оплата'}</span>
                  </div>
                  <div className="flex border-b border-slate-300 py-1">
                    <span className="w-36 font-semibold text-slate-600">Основание:</span>
                    <span>{document.comment || 'Выплата денежных средств'}</span>
                  </div>
                  <div className="flex border-b border-slate-300 py-1">
                    <span className="w-36 font-semibold text-slate-600">Сумма расхода:</span>
                    <span className="font-extrabold text-base text-rose-800">{formatDram(document.amountDram)}</span>
                  </div>
                </div>

                <div className="flex justify-between pt-6 border-t border-slate-400 text-xs">
                  <div>
                    <span className="font-bold">Руководитель:</span> _______________
                  </div>
                  <div>
                    <span className="font-bold">Получил:</span> _______________
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ФОРМА ИНВЕНТАРИЗАЦИИ (ИНВ-19 Сличительная ведомость) */}
          {document.type === 'inventory' && (
            <div>
              <div className="text-right text-[10px] text-slate-500 mb-2">
                Унифицированная форма № ИНВ-19<br />
                Сличительная ведомость результатов инвентаризации
              </div>
              <h2 className="text-base font-extrabold uppercase mb-1">
                Инвентаризационная опись № {document.docNumber} от {document.date}
              </h2>
              <p className="text-xs text-slate-600 mb-4">
                Склад: <span className="font-bold text-slate-900">{warehouse?.nameRu}</span> (Ответственный: {warehouse?.responsiblePerson})
              </p>

              <table className="w-full border-collapse border border-slate-400 mb-6 text-[11px]">
                <thead>
                  <tr className="bg-slate-100 border border-slate-400 text-center font-bold">
                    <th className="border border-slate-400 p-1.5 w-8">№</th>
                    <th className="border border-slate-400 p-1.5 text-left">Товар</th>
                    <th className="border border-slate-400 p-1.5 w-16">Ед.</th>
                    <th className="border border-slate-400 p-1.5 w-20">Учет (шт)</th>
                    <th className="border border-slate-400 p-1.5 w-20">Факт (шт)</th>
                    <th className="border border-slate-400 p-1.5 w-24">Отклонение</th>
                    <th className="border border-slate-400 p-1.5 w-28 text-right">Сумма расхождения</th>
                  </tr>
                </thead>
                <tbody>
                  {document.items.map((it, idx) => {
                    const variance = (it.actualQuantity ?? it.quantity) - it.quantity;
                    const diffSum = variance * it.priceDram;
                    return (
                      <tr key={idx} className="border border-slate-300">
                        <td className="border border-slate-300 p-1.5 text-center">{idx + 1}</td>
                        <td className="border border-slate-300 p-1.5 font-medium">{it.productName}</td>
                        <td className="border border-slate-300 p-1.5 text-center">{it.unit}</td>
                        <td className="border border-slate-300 p-1.5 text-center font-bold">{it.quantity}</td>
                        <td className="border border-slate-300 p-1.5 text-center font-bold text-blue-700">
                          {it.actualQuantity ?? it.quantity}
                        </td>
                        <td
                          className={`border border-slate-300 p-1.5 text-center font-bold ${
                            variance < 0 ? 'text-rose-600' : variance > 0 ? 'text-emerald-600' : 'text-slate-500'
                          }`}
                        >
                          {variance > 0 ? `+${variance}` : variance}
                        </td>
                        <td
                          className={`border border-slate-300 p-1.5 text-right font-bold ${
                            variance < 0 ? 'text-rose-600' : variance > 0 ? 'text-emerald-600' : 'text-slate-500'
                          }`}
                        >
                          {formatDram(diffSum)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div className="grid grid-cols-2 gap-8 pt-4 border-t border-slate-300 text-xs">
                <div>
                  <p className="font-bold text-slate-700 mb-8">Председатель комиссии:</p>
                  <div className="border-b border-slate-500 w-48 mb-1"></div>
                  <p className="text-[10px] text-slate-500">Директор магазина</p>
                </div>
                <div>
                  <p className="font-bold text-slate-700 mb-8">Материально ответственное лицо:</p>
                  <div className="border-b border-slate-500 w-48 mb-1"></div>
                  <p className="text-[10px] text-slate-500">{warehouse?.responsiblePerson} (подпись)</p>
                </div>
              </div>
            </div>
          )}

          {/* ПЕРЕМЕЩЕНИЕ ИЛИ СПИСАНИЕ */}
          {(document.type === 'transfer' || document.type === 'write_off' || document.type === 'surplus' || document.type === 'pos_sale') && (
            <div>
              <div className="border-b-2 border-slate-900 pb-3 mb-4">
                <h2 className="text-base font-extrabold uppercase tracking-tight">
                  {document.type === 'transfer'
                    ? `Накладная на внутреннее перемещение № ${document.docNumber}`
                    : document.type === 'write_off'
                    ? `Акт списания товаров № ${document.docNumber}`
                    : `Чек/Документ продажи № ${document.docNumber}`}
                </h2>
                <p className="text-xs text-slate-500">Дата составления: {document.date}</p>
              </div>

              <div className="mb-4 text-xs space-y-1">
                {document.type === 'transfer' ? (
                  <>
                    <p><span className="font-bold">Со склада (отправитель):</span> {warehouse?.nameRu}</p>
                    <p><span className="font-bold">На склад (получатель):</span> {targetWarehouse?.nameRu || 'Торговый зал'}</p>
                  </>
                ) : (
                  <p><span className="font-bold">Склад операции:</span> {warehouse?.nameRu || 'Торговый зал'}</p>
                )}
                <p><span className="font-bold">Ответственный:</span> {document.author}</p>
                <p><span className="font-bold">Примечание:</span> {document.comment}</p>
              </div>

              <table className="w-full border-collapse border border-slate-400 mb-6 text-[11px]">
                <thead>
                  <tr className="bg-slate-100 border border-slate-400 font-bold text-center">
                    <th className="border border-slate-400 p-1.5 w-8">№</th>
                    <th className="border border-slate-400 p-1.5 text-left">Товар</th>
                    <th className="border border-slate-400 p-1.5 w-20">Количество</th>
                    <th className="border border-slate-400 p-1.5 w-28">Цена (֏)</th>
                    <th className="border border-slate-400 p-1.5 w-28 text-right">Сумма (֏)</th>
                  </tr>
                </thead>
                <tbody>
                  {document.items.map((it, idx) => (
                    <tr key={idx} className="border border-slate-300">
                      <td className="border border-slate-300 p-1.5 text-center">{idx + 1}</td>
                      <td className="border border-slate-300 p-1.5 font-medium">{it.productName}</td>
                      <td className="border border-slate-300 p-1.5 text-center font-bold">{it.quantity}</td>
                      <td className="border border-slate-300 p-1.5 text-center">{formatDram(it.priceDram)}</td>
                      <td className="border border-slate-300 p-1.5 text-right font-bold">{formatDram(it.totalDram)}</td>
                    </tr>
                  ))}
                  <tr className="bg-slate-50 font-bold border-t-2 border-slate-800">
                    <td colSpan={2} className="border border-slate-400 p-2 text-right">Всего по документу:</td>
                    <td className="border border-slate-400 p-2 text-center">
                      {document.items.reduce((s, it) => s + it.quantity, 0)} шт
                    </td>
                    <td className="border border-slate-400 p-2"></td>
                    <td className="border border-slate-400 p-2 text-right font-extrabold text-sm">
                      {formatDram(document.amountDram)}
                    </td>
                  </tr>
                </tbody>
              </table>

              <div className="grid grid-cols-2 gap-8 pt-4 border-t border-slate-300 text-xs mt-8">
                <div>
                  <p className="font-bold text-slate-700 mb-8">Сдал:</p>
                  <div className="border-b border-slate-500 w-48 mb-1"></div>
                  <p className="text-[10px] text-slate-500">{document.author} (подпись)</p>
                </div>
                <div>
                  <p className="font-bold text-slate-700 mb-8">Принял:</p>
                  <div className="border-b border-slate-500 w-48 mb-1"></div>
                  <p className="text-[10px] text-slate-500">{warehouse?.responsiblePerson || 'Заведующий складом'} (подпись)</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
