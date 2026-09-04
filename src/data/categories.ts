import type { Category } from '@/types';

const sub = (parent: string, list: [string, string][]) =>
  list.map(([slug, name]) => ({ id: `${parent}-${slug}`, slug, name }));

export const categories: Category[] = [
  {
    id: 'meat',
    slug: 'myaso-i-ptica',
    name: 'Мясо и птица',
    tagline: 'мясо оптом · птица охлаждённая',
    icon: 'beef',
    hue: 8,
    subcategories: sub('meat', [
      ['govyadina', 'Говядина'],
      ['svinina', 'Свинина'],
      ['ptica', 'Птица'],
      ['baranina', 'Баранина'],
      ['subprodukty', 'Субпродукты'],
    ]),
  },
  {
    id: 'fish',
    slug: 'ryba-i-moreprodukty',
    name: 'Рыба и морепродукты',
    tagline: 'рыба оптом · креветка · икра',
    icon: 'fish',
    hue: 199,
    subcategories: sub('fish', [
      ['belaya-ryba', 'Белая рыба'],
      ['krasnaya-ryba', 'Красная рыба'],
      ['krevetki', 'Креветки и моллюски'],
      ['ikra', 'Икра и деликатесы'],
      ['polufabrikaty', 'Рыбные полуфабрикаты'],
    ]),
  },
  {
    id: 'dairy',
    slug: 'molochnaya-produkciya',
    name: 'Молочная продукция',
    tagline: 'молоко · сыры · масло',
    icon: 'milk',
    hue: 45,
    subcategories: sub('dairy', [
      ['moloko', 'Молоко и сливки'],
      ['syry', 'Сыры'],
      ['maslo', 'Масло и спреды'],
      ['tvorog', 'Творог и сметана'],
      ['deserty', 'Йогурты и десерты'],
    ]),
  },
  {
    id: 'vegetables',
    slug: 'frukty-i-ovoshchi',
    name: 'Фрукты и овощи',
    tagline: 'овощи оптом · зелень · фрукты',
    icon: 'carrot',
    hue: 120,
    subcategories: sub('vegetables', [
      ['ovoshchi', 'Овощи'],
      ['frukty', 'Фрукты'],
      ['zelen', 'Зелень и салаты'],
      ['ekzotika', 'Экзотика'],
      ['gribi', 'Грибы'],
    ]),
  },
  {
    id: 'grocery',
    slug: 'bakaleya',
    name: 'Бакалея',
    tagline: 'крупы · масла · специи',
    icon: 'wheat',
    hue: 30,
    subcategories: sub('grocery', [
      ['krupy', 'Крупы и мука'],
      ['masla', 'Масла и соусы'],
      ['specii', 'Специи и приправы'],
      ['konservaciya', 'Консервация'],
      ['sahar-sol', 'Сахар и соль'],
    ]),
  },
  {
    id: 'frozen',
    slug: 'zamorozhennye-produkty',
    name: 'Замороженные продукты',
    tagline: 'заморозка оптом · фри · тесто',
    icon: 'snowflake',
    hue: 205,
    subcategories: sub('frozen', [
      ['polufabrikaty', 'Полуфабрикаты'],
      ['kartofel', 'Картофель и снеки'],
      ['testo', 'Тесто и заготовки'],
      ['yagody', 'Ягоды и овощи'],
      ['deserty', 'Замороженные десерты'],
    ]),
  },
  {
    id: 'bakery',
    slug: 'hleb-i-konditerka',
    name: 'Булочные и кондитерские изделия',
    tagline: 'хлеб оптом · кондитерка',
    icon: 'croissant',
    hue: 25,
    subcategories: sub('bakery', [
      ['hleb', 'Хлеб и булочки'],
      ['burger-buns', 'Булочки для бургеров'],
      ['konditerka', 'Кондитерские изделия'],
      ['zagotovki', 'Тесто и заготовки'],
      ['nachinki', 'Начинки и топпинги'],
    ]),
  },
  {
    id: 'drinks',
    slug: 'napitki-i-bar',
    name: 'Напитки и барная продукция',
    tagline: 'вода · кофе · сиропы',
    icon: 'cup-soda',
    hue: 265,
    subcategories: sub('drinks', [
      ['voda', 'Вода'],
      ['soki', 'Соки и сиропы'],
      ['kofe-chay', 'Кофе и чай'],
      ['gazirovka', 'Газированные напитки'],
      ['bar', 'Барные ингредиенты'],
    ]),
  },
  {
    id: 'asia',
    slug: 'panaziya',
    name: 'Паназия и мировая кухня',
    tagline: 'соусы · рис · лапша',
    icon: 'soup',
    hue: 340,
    subcategories: sub('asia', [
      ['sousy', 'Соусы и маринады'],
      ['ris-lapsha', 'Рис и лапша'],
      ['vodorosli', 'Водоросли и нори'],
      ['specii', 'Специи Азии'],
      ['konservy', 'Консервы и паста'],
    ]),
  },
  {
    id: 'packaging',
    slug: 'posuda-i-upakovka',
    name: 'Посуда, упаковка, расходники',
    tagline: 'упаковка оптом · посуда',
    icon: 'package',
    hue: 220,
    subcategories: sub('packaging', [
      ['posuda', 'Одноразовая посуда'],
      ['dostavka', 'Упаковка для доставки'],
      ['salfetki', 'Салфетки и бумага'],
      ['pakety', 'Пакеты и плёнка'],
      ['brending', 'Упаковка с логотипом'],
    ]),
  },
  {
    id: 'chemistry',
    slug: 'himiya-i-gigiena',
    name: 'Химия и гигиена',
    tagline: 'бытовая химия оптом',
    icon: 'spray-can',
    hue: 175,
    subcategories: sub('chemistry', [
      ['moyushchie', 'Моющие средства'],
      ['dezinfekciya', 'Дезинфекция'],
      ['inventar', 'Инвентарь для уборки'],
      ['perchatki', 'Перчатки и защита'],
      ['gigiena', 'Гигиена персонала'],
    ]),
  },
];

export const categoryById = new Map(categories.map((c) => [c.id, c]));
export const categoryBySlug = new Map(categories.map((c) => [c.slug, c]));

export const subcategoryById = new Map(
  categories.flatMap((c) => c.subcategories.map((s) => [s.id, s] as const)),
);

export function categoryOfSubcategory(subcategoryId: string): Category | undefined {
  return categories.find((c) => c.subcategories.some((s) => s.id === subcategoryId));
}
