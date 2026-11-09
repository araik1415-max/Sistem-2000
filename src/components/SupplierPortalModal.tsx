import React, { useState } from 'react';
import { X, PackagePlus, FileCheck2, Scale, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { Language, UserProfile, PendingSupplierProduct, ReturnDispute, ProductItem } from '../types';

interface SupplierPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  currentUser: UserProfile;
  onRequestB2BContract: () => void;
  pendingProducts: PendingSupplierProduct[];
  onSubmitProduct: (product: Omit<ProductItem, 'id'>) => void;
  disputes: ReturnDispute[];
  onSubmitDispute: (orderOrDocNumber: string, productName: string, reason: string, raLawArticle: string) => void;
}

export const SupplierPortalModal: React.FC<SupplierPortalModalProps> = ({
  isOpen,
  onClose,
  lang,
  currentUser,
  onRequestB2BContract,
  pendingProducts,
  onSubmitProduct,
  disputes,
  onSubmitDispute,
}) => {
  const [activeTab, setActiveTab] = useState<'add_product' | 'contract' | 'disputes'>('add_product');
  const [nameHy, setNameHy] = useState('');
  const [nameRu, setNameRu] = useState('');
  const [priceDram, setPriceDram] = useState(1500);
  const [department, setDepartment] = useState<'groceries' | 'construction'>('construction');
  const [categoryHy, setCategoryHy] = useState('Շինանյութեր');
  const [unitHy, setUnitHy] = useState('1 հատ');

  const [docNumber, setDocNumber] = useState('');
  const [disputeProduct, setDisputeProduct] = useState('');
  const [disputeReason, setDisputeReason] = useState('');
  const [raLawArticle, setRaLawArticle] = useState('ՀՀ Քաղաքացիական օրենսգիրք, հոդված 491 (Ապրանքի որակի ստուգում)');

  const isHy = lang === 'hy';
  if (!isOpen) return null;

  const myProducts = pendingProducts.filter((p) => p.supplierId === currentUser.id);
  const myDisputes = disputes.filter((d) => d.supplierId === currentUser.id);

  const handleProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameHy.trim()) return;
    onSubmitProduct({
      nameHy: nameHy.trim(),
      nameRu: nameRu.trim() || nameHy.trim(),
      department,
      category: categoryHy,
      categoryHy,
      categoryRu: categoryHy,
      priceDram,
      pointsCost: priceDram,
      descriptionHy: 'Մատակարարի կողմից ներկայացված ապրանք',
      descriptionRu: 'Товар, представленный поставщиком',
      unitHy,
      unitRu: unitHy,
      imageUrl: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=450&auto=format&fit=crop&q=80',
      iconName: 'Package',
      isAvailable: true,
    });
    setNameHy('');
    setNameRu('');
  };

  const handleDisputeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docNumber.trim() || !disputeProduct.trim() || !disputeReason.trim()) return;
    onSubmitDispute(docNumber.trim(), disputeProduct.trim(), disputeReason.trim(), raLawArticle);
    setDocNumber('');
    setDisputeProduct('');
    setDisputeReason('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white">
              {isHy ? 'Մատակարարի գրասենյակ (B2B)' : 'Кабинет Поставщика (B2B)'}
            </h2>
            <p className="text-[11px] text-slate-400">{currentUser.name}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 py-2.5 border-b border-slate-800 flex flex-wrap gap-2 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('add_product')}
            className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'add_product'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <PackagePlus className="w-3.5 h-3.5" />
            <span>{isHy ? 'Ավելացնել ապրանք' : 'Добавить товар'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('contract')}
            className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'contract'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <FileCheck2 className="w-3.5 h-3.5" />
            <span>{isHy ? 'B2B Պայմանագիր (ՀՀ օրենք)' : 'B2B Договор (Закон РА)'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('disputes')}
            className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'disputes'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            <span>{isHy ? 'Վերադարձի վիճարկում' : 'Оспорить возврат'}</span>
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {activeTab === 'add_product' && (
            <div className="space-y-4">
              <form onSubmit={handleProductSubmit} className="p-4 bg-slate-850 rounded-xl border border-slate-750 space-y-3">
                <h3 className="text-xs font-bold text-emerald-400">
                  {isHy
                    ? 'Նոր ապրանքի հայտ (հրապարակվում է ադմինի ստուգումից հետո)'
                    : 'Заявка на добавление товара (публикуется после проверки администратора)'}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    required
                    placeholder={isHy ? 'Անվանում (հայ.) *' : 'Название (арм.) *'}
                    value={nameHy}
                    onChange={(e) => setNameHy(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                  />
                  <input
                    type="text"
                    placeholder={isHy ? 'Անվանում (ռուս.)' : 'Название (рус.)'}
                    value={nameRu}
                    onChange={(e) => setNameRu(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <input
                    type="number"
                    min="50"
                    value={priceDram}
                    onChange={(e) => setPriceDram(Number(e.target.value))}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono"
                  />
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value as 'groceries' | 'construction')}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                  >
                    <option value="construction">{isHy ? '🛠️ Շինանյութ' : '🛠️ Стройматериалы'}</option>
                    <option value="groceries">{isHy ? '🍏 Սուպերմարկետ' : '🍏 Супермаркет'}</option>
                  </select>
                  <input
                    type="text"
                    value={unitHy}
                    onChange={(e) => setUnitHy(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer"
                >
                  {isHy ? 'Ուղարկել ստուգման' : 'Отправить на проверку'}
                </button>
              </form>

              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-300">
                  {isHy ? 'Իմ հայտերը՝' : 'Мои заявки:'} ({myProducts.length})
                </h4>
                {myProducts.map((item) => (
                  <div key={item.id} className="p-2.5 rounded-lg bg-slate-850 border border-slate-750 flex items-center justify-between text-xs">
                    <span className="text-white font-semibold">{isHy ? item.product.nameHy : item.product.nameRu}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        item.status === 'approved'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : item.status === 'rejected'
                          ? 'bg-rose-500/20 text-rose-300'
                          : 'bg-amber-500/20 text-amber-300'
                      }`}
                    >
                      {item.status === 'approved'
                        ? (isHy ? 'Հաստատված է' : 'Одобрено')
                        : item.status === 'rejected'
                        ? (isHy ? 'Մերժված է' : 'Отклонено')
                        : (isHy ? 'Սպասում է ստուգման' : 'На проверке')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'contract' && (
            <div className="p-4 bg-slate-850 rounded-xl border border-slate-750 space-y-3">
              <h3 className="text-sm font-bold text-white">
                {isHy ? 'B2B Մատակարարման պայմանագիր (ՀՀ օրենսդրությամբ)' : 'B2B Договор поставки (по законодательству РА)'}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                {isHy
                  ? 'Կարգավորվում է ՀՀ Քաղաքացիական օրենսգրքի 30-րդ գլխով (Մատակարարման պայմանագիր): Մատակարարը իրավունք ունի ավելացնել ապրանքներ, ստանալ վճարումներ և վիճարկել վերադարձները:'
                  : 'Регулируется Главой 30 Гражданского кодекса РА (Договор поставки). Поставщик имеет право размещать товары, получать выплаты и оспаривать возвраты.'}
              </p>
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-slate-400">
                  {isHy ? 'Կարգավիճակ՝' : 'Статус:'}{' '}
                  <strong className="text-amber-300">
                    {currentUser.b2bContractStatus === 'approved'
                      ? (isHy ? 'Կնքված է ✓' : 'Заключён ✓')
                      : currentUser.b2bContractStatus === 'pending'
                      ? (isHy ? 'Ուղարկված է հաստատման' : 'На одобрении')
                      : (isHy ? 'Չկնքված' : 'Не заключён')}
                  </strong>
                </span>
                {currentUser.b2bContractStatus !== 'approved' && (
                  <button
                    type="button"
                    onClick={onRequestB2BContract}
                    className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold cursor-pointer"
                  >
                    {isHy ? 'Կնքել B2B պայմանագիր' : 'Заключить B2B договор'}
                  </button>
                )}
              </div>
            </div>
          )}

          {activeTab === 'disputes' && (
            <div className="space-y-4">
              <form onSubmit={handleDisputeSubmit} className="p-4 bg-slate-850 rounded-xl border border-slate-750 space-y-3">
                <h3 className="text-xs font-bold text-rose-300">
                  {isHy ? 'Վերադարձի վիճարկում (ՀՀ օրենքով)' : 'Оспаривание возврата товара (по Закону РА)'}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    required
                    placeholder={isHy ? 'Փաստաթղթի / Պատվերի №' : '№ документа / заказа'}
                    value={docNumber}
                    onChange={(e) => setDocNumber(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                  />
                  <input
                    type="text"
                    required
                    placeholder={isHy ? 'Ապրանքի անվանումը' : 'Наименование товара'}
                    value={disputeProduct}
                    onChange={(e) => setDisputeProduct(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                  />
                </div>
                <input
                  type="text"
                  value={raLawArticle}
                  onChange={(e) => setRaLawArticle(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-300"
                />
                <textarea
                  rows={2}
                  required
                  placeholder={isHy ? 'Վիճարկման հիմնավորումը...' : 'Обоснование спора...'}
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold cursor-pointer"
                >
                  {isHy ? 'Ներկայացնել վիճարկում' : 'Подать спор'}
                </button>
              </form>

              <div className="space-y-2">
                {myDisputes.map((d) => (
                  <div key={d.id} className="p-3 rounded-lg bg-slate-850 border border-slate-750 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">#{d.orderOrDocNumber} — {d.productName}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
                        {d.status === 'open' ? (isHy ? 'Քննարկվում է' : 'На рассмотрении') : (isHy ? 'Լուծված է' : 'Решён')}
                      </span>
                    </div>
                    <p className="text-slate-400 text-[11px]">{d.reason}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
