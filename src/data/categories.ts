import { ProductCategory } from '../types';

export const INITIAL_CATEGORIES: ProductCategory[] = [
  // groceries
  {
    id: 'cat_bakery',
    nameHy: 'Հացաբուլկեղեն',
    nameRu: 'Бакалея',
    department: 'groceries',
    iconName: 'Bread',
    descriptionHy: 'Թարմ հաց, բուլկեղեն և հացաբուլկեղենի արտադրանք',
    descriptionRu: 'Свежий хлеб, выпечка и хлебобулочные изделия',
    isCustom: false,
  },
  {
    id: 'cat_dairy',
    nameHy: 'Կաթնամթերք',
    nameRu: 'Молочные продукты',
    department: 'groceries',
    iconName: 'Milk',
    descriptionHy: 'Կաթ, կարագ, պանիր, թթվասեր և կաթնամթերք',
    descriptionRu: 'Молоко, масло, сыры, сметана и молочная продукция',
    isCustom: false,
  },
  {
    id: 'cat_grains',
    nameHy: 'Մթերք և ձավարեղեն',
    nameRu: 'Крупы и бакалея',
    department: 'groceries',
    iconName: 'Wheat',
    descriptionHy: 'Ձավարեղեն, ալյուր, մակարոնեղեն և չոր մթերքներ',
    descriptionRu: 'Крупы, мука, макароны и сухие бакалейные товары',
    isCustom: false,
  },
  {
    id: 'cat_produce',
    nameHy: 'Բանջարեղեն և մրգեր',
    nameRu: 'Овощи и фрукты',
    department: 'groceries',
    iconName: 'Apple',
    descriptionHy: 'Թարմ բանջարեղեն, մրգեր և հատապտուղներ',
    descriptionRu: 'Свежие овощи, фрукты и ягоды',
    isCustom: false,
  },
  {
    id: 'cat_beverages',
    nameHy: 'Ըմպելիքներ',
    nameRu: 'Напитки',
    department: 'groceries',
    iconName: 'Coffee',
    descriptionHy: 'Հյութեր, զովացուցիչ ըմպելիքներ, թեյ և սուրճ',
    descriptionRu: 'Соки, безалкогольные напитки, чай и кофе',
    isCustom: false,
  },
  {
    id: 'cat_sweets',
    nameHy: 'Քաղցրավենիք',
    nameRu: 'Сладости',
    department: 'groceries',
    iconName: 'Cookie',
    descriptionHy: 'Շոկոլադ, կոնֆետներ, թխվածքաբլիթներ',
    descriptionRu: 'Шоколад, конфеты, печенье и сладости',
    isCustom: false,
  },

  // construction
  {
    id: 'cat_const_materials',
    nameHy: 'Շինանյութեր',
    nameRu: 'Строительные материалы',
    department: 'construction',
    iconName: 'Building',
    descriptionHy: 'Հիմնական շինարարական նյութեր և խառնուրդներ',
    descriptionRu: 'Основные строительные материалы и смеси',
    isCustom: false,
  },
  {
    id: 'cat_tools',
    nameHy: 'Գործիքներ',
    nameRu: 'Инструменты',
    department: 'construction',
    iconName: 'Wrench',
    descriptionHy: 'Էլեկտրական և ձեռքի գործիքներ',
    descriptionRu: 'Электроинструменты и ручной инструмент',
    isCustom: false,
  },
  {
    id: 'cat_adhesives',
    nameHy: 'Սոսինձներ և հերմետիկներ',
    nameRu: 'Клеи и герметики',
    department: 'construction',
    iconName: 'Droplet',
    descriptionHy: 'Շինարարական սոսինձներ, մոնտաժային փրփուր և հերմետիկներ',
    descriptionRu: 'Строительные клеи, монтажная пена и герметики',
    isCustom: false,
  },
  {
    id: 'cat_finishing',
    nameHy: 'Հարդարման նյութեր',
    nameRu: 'Шпаклёвки и смеси',
    department: 'construction',
    iconName: 'Layers',
    descriptionHy: 'Մածիկներ, ծեփամածիկներ, ներկեր',
    descriptionRu: 'Шпатлевки, штукатурки и отделочные смеси',
    isCustom: false,
  },
  {
    id: 'cat_fasteners',
    nameHy: 'Ամրակման նյութեր',
    nameRu: 'Крепёж и метизы',
    department: 'construction',
    iconName: 'Hammer',
    descriptionHy: 'Ինքնապտուտակներ, դյուբելներ, ամրակներ',
    descriptionRu: 'Саморезы, дюбели, шурупы и крепежные изделия',
    isCustom: false,
  },
];

export const CATEGORIES_STORAGE_KEY = 'sistema2000_categories_v1';

export function loadStoredCategories(): ProductCategory[] {
  try {
    const raw = localStorage.getItem(CATEGORIES_STORAGE_KEY);
    if (!raw) return INITIAL_CATEGORIES;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch (err) {
    console.error('Error loading stored categories:', err);
  }
  return INITIAL_CATEGORIES;
}

export function saveStoredCategories(categories: ProductCategory[]) {
  try {
    localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(categories));
  } catch (err) {
    console.error('Error saving categories:', err);
  }
}
