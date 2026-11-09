import React, { useState } from 'react';
import {
  Tag,
  Plus,
  Search,
  FolderPlus,
  Trash2,
  Edit2,
  Check,
  X,
  Package,
  Layers,
  Sparkles,
  UtensilsCrossed,
  Milk,
  Wheat,
  Apple,
  Coffee,
  Cookie,
  Building,
  Wrench,
  Droplet,
  Hammer,
  Shield,
  Zap,
  Box,
  ShoppingBag,
} from 'lucide-react';
import { ProductCategory, ProductItem, Language } from '../types';

interface AdminCategoriesTabProps {
  lang: Language;
  categories: ProductCategory[];
  products: ProductItem[];
  onAddCategory: (category: Omit<ProductCategory, 'id'>) => void;
  onUpdateCategory: (id: string, updated: Partial<ProductCategory>) => void;
  onDeleteCategory: (id: string) => void;
}

const AVAILABLE_ICONS = [
  { name: 'Tag', label: 'Тег / Տեգ', icon: Tag },
  { name: 'Layers', label: 'Слои / Շերտեր', icon: Layers },
  { name: 'UtensilsCrossed', label: 'Хлеб / Հաց', icon: UtensilsCrossed },
  { name: 'Milk', label: 'Молоко / Կաթ', icon: Milk },
  { name: 'Wheat', label: 'Зерно / Ձավարեղեն', icon: Wheat },
  { name: 'Apple', label: 'Яблоко / Խնձոր', icon: Apple },
  { name: 'Coffee', label: 'Кофе / Սուրճ', icon: Coffee },
  { name: 'Cookie', label: 'Печенье / Քաղցրավենիք', icon: Cookie },
  { name: 'Building', label: 'Стройка / Շինանյութ', icon: Building },
  { name: 'Wrench', label: 'Инструмент / Գործիք', icon: Wrench },
  { name: 'Droplet', label: 'Клей / Սոսինձ', icon: Droplet },
  { name: 'Hammer', label: 'Молоток / Մուրճ', icon: Hammer },
  { name: 'Shield', label: 'Защита / Պաշտպանություն', icon: Shield },
  { name: 'Zap', label: 'Энергия / Էներգիա', icon: Zap },
  { name: 'Box', label: 'Коробка / Տուփ', icon: Box },
  { name: 'ShoppingBag', label: 'Пакет / Զամբյուղ', icon: ShoppingBag },
  { name: 'Sparkles', label: 'Спец / Հատուկ', icon: Sparkles },
];

export const AdminCategoriesTab: React.FC<AdminCategoriesTabProps> = ({
  lang,
  categories,
  products,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
}) => {
  const isHy = lang === 'hy';
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<'all' | 'groceries' | 'construction'>('all');

  // Modal / Form state for new category
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCatId, setEditingCatId] = useState<string | null>(null);

  const [nameHy, setNameHy] = useState('');
  const [nameRu, setNameRu] = useState('');
  const [department, setDepartment] = useState<'groceries' | 'construction'>('groceries');
  const [iconName, setIconName] = useState('Tag');
  const [descriptionHy, setDescriptionHy] = useState('');
  const [descriptionRu, setDescriptionRu] = useState('');

  const openCreateModal = () => {
    setEditingCatId(null);
    setNameHy('');
    setNameRu('');
    setDepartment('groceries');
    setIconName('Tag');
    setDescriptionHy('');
    setDescriptionRu('');
    setIsModalOpen(true);
  };

  const openEditModal = (cat: ProductCategory) => {
    setEditingCatId(cat.id);
    setNameHy(cat.nameHy);
    setNameRu(cat.nameRu);
    setDepartment(cat.department);
    setIconName(cat.iconName || 'Tag');
    setDescriptionHy(cat.descriptionHy || '');
    setDescriptionRu(cat.descriptionRu || '');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameHy.trim() || !nameRu.trim()) return;

    if (editingCatId) {
      onUpdateCategory(editingCatId, {
        nameHy: nameHy.trim(),
        nameRu: nameRu.trim(),
        department,
        iconName,
        descriptionHy: descriptionHy.trim(),
        descriptionRu: descriptionRu.trim(),
      });
    } else {
      onAddCategory({
        nameHy: nameHy.trim(),
        nameRu: nameRu.trim(),
        department,
        iconName,
        descriptionHy: descriptionHy.trim(),
        descriptionRu: descriptionRu.trim(),
        isCustom: true,
      });
    }

    setIsModalOpen(false);
  };

  // Compute products count per category
  const getProductCount = (cat: ProductCategory) => {
    return products.filter((p) => {
      return (
        p.categoryHy === cat.nameHy ||
        p.categoryRu === cat.nameRu ||
        p.category === cat.nameRu ||
        p.category === cat.nameHy
      );
    }).length;
  };

  const filteredCategories = categories.filter((c) => {
    const matchesDept = departmentFilter === 'all' || c.department === departmentFilter;
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      c.nameHy.toLowerCase().includes(q) ||
      c.nameRu.toLowerCase().includes(q) ||
      (c.descriptionHy && c.descriptionHy.toLowerCase().includes(q)) ||
      (c.descriptionRu && c.descriptionRu.toLowerCase().includes(q));
    return matchesDept && matchesSearch;
  });

  const totalGroceries = categories.filter((c) => c.department === 'groceries').length;
  const totalConstruction = categories.filter((c) => c.department === 'construction').length;
  const totalCustom = categories.filter((c) => c.isCustom).length;

  return (
    <div className="space-y-4">
      {/* Статистика и кнопка добавления */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="bg-slate-850 p-4 rounded-xl border border-slate-750 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400">{isHy ? 'Ընդամենը կատեգորիաներ' : 'Всего категорий'}</p>
            <p className="text-xl font-bold text-white font-mono">{categories.length}</p>
          </div>
          <div className="p-2 bg-amber-500/20 text-amber-400 rounded-lg">
            <Tag className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-850 p-4 rounded-xl border border-slate-750 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400">{isHy ? '🍏 Սուպերմարկետ' : '🍏 Продукты питания'}</p>
            <p className="text-xl font-bold text-emerald-400 font-mono">{totalGroceries}</p>
          </div>
          <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg">
            <Apple className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-850 p-4 rounded-xl border border-slate-750 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400">{isHy ? '🛠️ Շինանյութեր' : '🛠️ Строительство'}</p>
            <p className="text-xl font-bold text-cyan-400 font-mono">{totalConstruction}</p>
          </div>
          <div className="p-2 bg-cyan-500/20 text-cyan-400 rounded-lg">
            <Building className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-850 p-4 rounded-xl border border-slate-750 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400">{isHy ? 'Օգտատիրոջ (Custom)' : 'Добавленные вручную'}</p>
            <p className="text-xl font-bold text-purple-400 font-mono">{totalCustom}</p>
          </div>
          <button
            onClick={openCreateModal}
            className="p-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg transition-all flex items-center gap-1 text-xs shadow-md cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{isHy ? 'Ավելացնել' : 'Добавить'}</span>
          </button>
        </div>
      </div>

      {/* Фильтр и Поиск */}
      <div className="bg-slate-850 p-4 rounded-xl border border-slate-750 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={isHy ? 'Փնտրել կատեգորիա...' : 'Поиск категории...'}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          <button
            onClick={() => setDepartmentFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              departmentFilter === 'all'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-750'
            }`}
          >
            {isHy ? 'Բոլորը' : 'Все отделы'}
          </button>
          <button
            onClick={() => setDepartmentFilter('groceries')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              departmentFilter === 'groceries'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-750'
            }`}
          >
            🍏 {isHy ? 'Սուպերմարկետ' : 'Продукты'}
          </button>
          <button
            onClick={() => setDepartmentFilter('construction')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              departmentFilter === 'construction'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-750'
            }`}
          >
            🛠️ {isHy ? 'Շինանյութեր' : 'Строительство'}
          </button>
        </div>
      </div>

      {/* Список категорий */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredCategories.map((cat) => {
          const count = getProductCount(cat);
          const iconObj = AVAILABLE_ICONS.find((i) => i.name === cat.iconName) || AVAILABLE_ICONS[0];
          const IconComp = iconObj.icon;

          return (
            <div
              key={cat.id}
              className="bg-slate-850 p-4 rounded-xl border border-slate-750 hover:border-slate-600 transition-all flex flex-col justify-between group shadow-sm"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-slate-800 text-amber-400 border border-slate-700">
                      <IconComp className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                        <span>{cat.nameRu}</span>
                        {cat.isCustom && (
                          <span className="px-1.5 py-0.5 bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[10px] rounded font-mono">
                            Custom
                          </span>
                        )}
                      </h3>
                      <p className="text-xs text-amber-400/90 font-medium">{cat.nameHy}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(cat)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-amber-300 hover:bg-slate-800 transition-colors cursor-pointer"
                      title={isHy ? 'Խմբագրել' : 'Редактировать'}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {cat.isCustom && (
                      <button
                        onClick={() => onDeleteCategory(cat.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
                        title={isHy ? 'Հեռացնել' : 'Удалить'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-xs text-slate-400 line-clamp-2 my-2">
                  {isHy ? cat.descriptionHy || cat.descriptionRu : cat.descriptionRu || cat.descriptionHy || '—'}
                </p>
              </div>

              <div className="pt-3 mt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  {cat.department === 'groceries' ? (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[11px]">
                      🍏 {isHy ? 'Սուպերմարկետ' : 'Продукты'}
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-[11px]">
                      🛠️ {isHy ? 'Շինանյութեր' : 'Строительство'}
                    </span>
                  )}
                </span>

                <span className="font-mono text-slate-300 flex items-center gap-1">
                  <Package className="w-3.5 h-3.5 text-slate-400" />
                  <strong>{count}</strong> {isHy ? 'ապրանք' : 'товаров'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {filteredCategories.length === 0 && (
        <div className="p-8 text-center bg-slate-850 rounded-xl border border-slate-750">
          <FolderPlus className="w-10 h-10 text-slate-500 mx-auto mb-2" />
          <p className="text-sm font-bold text-white mb-1">
            {isHy ? 'Կատեգորիաներ չեն գտնվել' : 'Категории не найдены'}
          </p>
          <p className="text-xs text-slate-400 mb-4">
            {isHy
              ? 'Փոխեք որոնման պայմանները կամ ավելացրեք նոր կատեգորիա'
              : 'Измените параметры поиска или добавьте новую категорию'}
          </p>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg transition-all text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>{isHy ? 'Ավելացնել նոր կատեգորիա' : 'Добавить новую категорию'}</span>
          </button>
        </div>
      )}

      {/* Модальное окно создания/редактирования категории */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-750 rounded-2xl max-w-lg w-full p-5 shadow-2xl relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-white flex items-center gap-2 mb-4">
              <FolderPlus className="w-5 h-5 text-amber-400" />
              <span>
                {editingCatId
                  ? isHy
                    ? 'Խմբագրել կատեգորիան'
                    : 'Редактировать категорию'
                  : isHy
                  ? 'Ավելացնել նոր ապրանքի կատեգորիա'
                  : 'Добавить новую категорию продукции'}
              </span>
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    {isHy ? 'Անվանումը հայերեն *' : 'Название на армянском *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={nameHy}
                    onChange={(e) => setNameHy(e.target.value)}
                    placeholder="օրինակ՝ Էլեկտրատեխնիկա"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    {isHy ? 'Անվանումը ռուսերեն *' : 'Название на русском *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={nameRu}
                    onChange={(e) => setNameRu(e.target.value)}
                    placeholder="напр. Электротехника"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    {isHy ? 'Բաժին (Отдел) *' : 'Отдел магазина *'}
                  </label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value as 'groceries' | 'construction')}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="groceries">🍏 {isHy ? 'Սուպերմարկետ' : 'Продукты питания'}</option>
                    <option value="construction">🛠️ {isHy ? 'Շինանյութեր' : 'Строительные материалы'}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    {isHy ? 'Իկոնկա' : 'Иконка категории'}
                  </label>
                  <select
                    value={iconName}
                    onChange={(e) => setIconName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    {AVAILABLE_ICONS.map((i) => (
                      <option key={i.name} value={i.name}>
                        {i.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  {isHy ? 'Նկարագրություն հայերեն' : 'Описание на армянском'}
                </label>
                <textarea
                  rows={2}
                  value={descriptionHy}
                  onChange={(e) => setDescriptionHy(e.target.value)}
                  placeholder="Համառոտ նկարագրություն..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  {isHy ? 'Նկարագրություն ռուսերեն' : 'Описание на русском'}
                </label>
                <textarea
                  rows={2}
                  value={descriptionRu}
                  onChange={(e) => setDescriptionRu(e.target.value)}
                  placeholder="Краткое описание категории..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-lg text-xs transition-colors cursor-pointer"
                >
                  {isHy ? 'Չեղարկել' : 'Отмена'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition-all shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingCatId ? (isHy ? 'Պահպանել' : 'Сохранить') : isHy ? 'Ստեղծել' : 'Создать'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
