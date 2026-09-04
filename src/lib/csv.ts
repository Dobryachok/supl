export interface ParsedCsv {
  headers: string[];
  rows: string[][];
  delimiter: string;
}

/** Разбирает CSV с автоопределением разделителя и поддержкой кавычек. */
export function parseCsv(text: string): ParsedCsv {
  const clean = text.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
  const firstLine = clean.split('\n')[0] ?? '';
  const delimiter = [';', ',', '\t'].reduce((best, candidate) => {
    const count = firstLine.split(candidate).length;
    return count > firstLine.split(best).length ? candidate : best;
  }, ';');

  const rows: string[][] = [];
  let row: string[] = [];
  let value = '';
  let inQuotes = false;

  for (let i = 0; i < clean.length; i += 1) {
    const char = clean[i];
    if (inQuotes) {
      if (char === '"') {
        if (clean[i + 1] === '"') {
          value += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        value += char;
      }
      continue;
    }
    if (char === '"') {
      inQuotes = true;
    } else if (char === delimiter) {
      row.push(value.trim());
      value = '';
    } else if (char === '\n') {
      row.push(value.trim());
      if (row.some((cell) => cell !== '')) rows.push(row);
      row = [];
      value = '';
    } else {
      value += char;
    }
  }
  row.push(value.trim());
  if (row.some((cell) => cell !== '')) rows.push(row);

  const [headers = [], ...rest] = rows;
  return { headers, rows: rest, delimiter };
}

export const csvTemplateColumns = [
  'Название',
  'Артикул',
  'Категория',
  'Подкатегория',
  'Бренд',
  'Страна',
  'Единица',
  'Фасовка',
  'Цена',
  'Старая цена',
  'Остаток',
  'Минимум',
  'Кратность',
  'Температурный режим',
  'Описание',
] as const;

export type CsvField =
  | 'name'
  | 'article'
  | 'category'
  | 'subcategory'
  | 'brand'
  | 'country'
  | 'unit'
  | 'packSize'
  | 'price'
  | 'oldPrice'
  | 'stock'
  | 'minQty'
  | 'step'
  | 'tempMode'
  | 'description'
  | 'skip';

export const csvFieldLabels: Record<CsvField, string> = {
  name: 'Название',
  article: 'Артикул',
  category: 'Категория',
  subcategory: 'Подкатегория',
  brand: 'Бренд',
  country: 'Страна',
  unit: 'Единица',
  packSize: 'Фасовка',
  price: 'Цена',
  oldPrice: 'Старая цена',
  stock: 'Остаток',
  minQty: 'Минимум',
  step: 'Кратность',
  tempMode: 'Температурный режим',
  description: 'Описание',
  skip: 'Не импортировать',
};

const autoMap: [RegExp, CsvField][] = [
  [/назв|наимен|name|товар/i, 'name'],
  [/артик|sku|код/i, 'article'],
  [/подкатег/i, 'subcategory'],
  [/катег/i, 'category'],
  [/бренд|производ|brand/i, 'brand'],
  [/стран|country/i, 'country'],
  [/ед\.|едини|unit/i, 'unit'],
  [/фасов|упак|pack/i, 'packSize'],
  [/стар.*цен|old/i, 'oldPrice'],
  [/цен|price|стоим/i, 'price'],
  [/остат|склад|stock|налич/i, 'stock'],
  [/миним|min/i, 'minQty'],
  [/кратн|шаг|step/i, 'step'],
  [/темпер|режим|хранен/i, 'tempMode'],
  [/опис|descr/i, 'description'],
];

export function guessMapping(headers: string[]): CsvField[] {
  const used = new Set<CsvField>();
  return headers.map((header) => {
    for (const [pattern, field] of autoMap) {
      if (pattern.test(header) && !used.has(field)) {
        used.add(field);
        return field;
      }
    }
    return 'skip' as CsvField;
  });
}

export function buildCsvTemplate(): string {
  const example = [
    'Стейк Рибай зернового откорма',
    'MEA-1000',
    'Мясо и птица',
    'Говядина',
    'Мясной Двор Prime',
    'Россия',
    'кг',
    'вакуум 2-3 кг',
    '2890',
    '3190',
    '145',
    '2',
    '1',
    'охлаждённый',
    'Отруб из толстого края, влажное созревание 21 день',
  ];
  return `\uFEFF${csvTemplateColumns.join(';')}\n${example.join(';')}`;
}

export function downloadCsv(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
