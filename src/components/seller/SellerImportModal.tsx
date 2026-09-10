import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Download, FileSpreadsheet, RotateCcw } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Select } from '@/components/ui/Field';
import { FileDrop, readFileAsText } from '@/components/ui/FileDrop';
import { Modal } from '@/components/ui/Modal';
import { TD, TH, THead, TR, Table } from '@/components/ui/Table';
import { useToast } from '@/components/ui/Toast';
import { categories } from '@/data/categories';
import { tempModeLabel } from '@/data/products';
import {
  buildCsvTemplate,
  csvFieldLabels,
  downloadCsv,
  guessMapping,
  parseCsv,
} from '@/lib/csv';
import type { CsvField, ParsedCsv } from '@/lib/csv';
import { uid } from '@/lib/ids';
import { money, withCount } from '@/lib/format';
import { useAppState, useDispatch } from '@/store/AppContext';
import { productsOfSupplier } from '@/store/selectors';
import type { Product, TempMode, Unit } from '@/types';

interface RowResult {
  index: number;
  product?: Product;
  errors: string[];
  action: 'create' | 'update' | 'skip';
}

const unitAliases: Record<string, Unit> = {
  кг: 'kg',
  kg: 'kg',
  шт: 'pc',
  штука: 'pc',
  pc: 'pc',
  л: 'l',
  литр: 'l',
  'упак.': 'pack',
  упак: 'pack',
  упаковка: 'pack',
  pack: 'pack',
  кор: 'box',
  'кор.': 'box',
  короб: 'box',
  box: 'box',
};

const tempAliases: [RegExp, TempMode][] = [
  [/заморо|frozen|-18/i, 'frozen'],
  [/охлажд|chilled|\+4/i, 'chilled'],
  [/сух|dry|склад/i, 'dry'],
];

function num(value: string): number {
  return Number(value.replace(/\s/g, '').replace(',', '.'));
}

export function SellerImportModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const state = useAppState();
  const dispatch = useDispatch();
  const toast = useToast();
  const [parsed, setParsed] = useState<ParsedCsv | null>(null);
  const [mapping, setMapping] = useState<CsvField[]>([]);
  const [fileName, setFileName] = useState('');
  const [imported, setImported] = useState<{ created: number; updated: number; skipped: number } | null>(
    null,
  );

  const existing = productsOfSupplier(state, state.session.sellerSupplierId);

  useEffect(() => {
    if (!open) {
      setParsed(null);
      setMapping([]);
      setFileName('');
      setImported(null);
    }
  }, [open]);

  const results = useMemo<RowResult[]>(() => {
    if (!parsed) return [];
    const index = (field: CsvField) => mapping.indexOf(field);
    const get = (row: string[], field: CsvField) => {
      const i = index(field);
      return i >= 0 ? (row[i] ?? '').trim() : '';
    };

    return parsed.rows.map((row, rowIndex) => {
      const errors: string[] = [];
      const name = get(row, 'name');
      const price = num(get(row, 'price'));
      const stock = get(row, 'stock') ? num(get(row, 'stock')) : 0;

      if (!name) errors.push('Не заполнено название');
      if (!Number.isFinite(price) || price <= 0) errors.push('Некорректная цена');
      if (!Number.isFinite(stock) || stock < 0) errors.push('Некорректный остаток');

      const categoryName = get(row, 'category').toLowerCase();
      const category =
        categories.find((c) => c.name.toLowerCase() === categoryName) ??
        categories.find((c) => categoryName && c.name.toLowerCase().includes(categoryName)) ??
        categories[0];
      const subName = get(row, 'subcategory').toLowerCase();
      const subcategory =
        category.subcategories.find((s) => s.name.toLowerCase() === subName) ??
        category.subcategories[0];

      const unitRaw = get(row, 'unit').toLowerCase();
      const unit = unitAliases[unitRaw] ?? 'pc';
      const tempRaw = get(row, 'tempMode');
      const tempMode = tempAliases.find(([pattern]) => pattern.test(tempRaw))?.[1] ?? 'dry';

      const article = get(row, 'article') || `IMP-${1000 + rowIndex}`;
      const match = existing.find((p) => p.article === article);

      if (errors.length) {
        return { index: rowIndex, errors, action: 'skip' as const };
      }

      const oldPrice = get(row, 'oldPrice') ? num(get(row, 'oldPrice')) : undefined;
      const minQty = get(row, 'minQty') ? num(get(row, 'minQty')) : 1;
      const step = get(row, 'step') ? num(get(row, 'step')) : 1;

      const product: Product = {
        id: match?.id ?? uid('p'),
        supplierId: state.session.sellerSupplierId,
        categoryId: category.id,
        subcategoryId: subcategory.id,
        name,
        article,
        brand: get(row, 'brand') || 'Без бренда',
        country: get(row, 'country') || 'Россия',
        unit,
        packSize: get(row, 'packSize') || '—',
        price,
        oldPrice: oldPrice && oldPrice > price ? oldPrice : undefined,
        stock,
        minQty: minQty > 0 ? minQty : 1,
        step: step > 0 ? step : 1,
        tempMode,
        tags: match?.tags ?? [],
        description: get(row, 'description') || match?.description || '',
        specs: [
          { label: 'Фасовка', value: get(row, 'packSize') || '—' },
          { label: 'Бренд', value: get(row, 'brand') || 'Без бренда' },
          { label: 'Температурный режим', value: tempModeLabel(tempMode) },
        ],
        photo: match?.photo,
        isActive: true,
        createdAt: match?.createdAt ?? new Date().toISOString(),
        popularity: match?.popularity ?? 40,
        isNew: !match,
      };

      return { index: rowIndex, product, errors, action: match ? 'update' : 'create' };
    });
  }, [parsed, mapping, existing, state.session.sellerSupplierId]);

  const stats = {
    create: results.filter((r) => r.action === 'create').length,
    update: results.filter((r) => r.action === 'update').length,
    skip: results.filter((r) => r.action === 'skip').length,
  };

  const resetFile = () => {
    setParsed(null);
    setImported(null);
  };

  const handleFile = async (file: File) => {
    const text = await readFileAsText(file);
    const next = parseCsv(text);
    if (!next.headers.length) {
      toast.error('Не удалось разобрать файл', 'Проверьте, что это CSV с заголовками');
      return;
    }
    setParsed(next);
    setMapping(guessMapping(next.headers));
    setFileName(file.name);
    setImported(null);
    toast.success('Файл загружен', `${next.rows.length} строк, разделитель «${next.delimiter}»`);
  };

  const runImport = () => {
    const products = results
      .filter((r) => r.product && r.action !== 'skip')
      .map((r) => r.product!);
    dispatch({ type: 'products/import', products });
    setImported({ created: stats.create, updated: stats.update, skipped: stats.skip });
    toast.success(
      'Импорт завершён',
      `Добавлено ${stats.create}, обновлено ${stats.update}, пропущено ${stats.skip}`,
    );
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="xl"
      title="Импорт каталога из CSV"
      description="Загрузите прайс, сопоставьте колонки и проверьте предпросмотр перед импортом"
      footer={
        imported ? (
          <Button onClick={onClose}>Готово</Button>
        ) : parsed ? (
          <>
            <Button variant="ghost" icon={<RotateCcw className="size-4" />} onClick={resetFile}>
              Другой файл
            </Button>
            <Button variant="secondary" onClick={onClose}>
              Отмена
            </Button>
            <Button onClick={runImport} disabled={stats.create + stats.update === 0}>
              Импортировать {stats.create + stats.update}
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="secondary"
              icon={<Download className="size-4" />}
              onClick={() => downloadCsv('supl-template.csv', buildCsvTemplate())}
            >
              Скачать шаблон
            </Button>
            <Button variant="secondary" onClick={onClose}>
              Отмена
            </Button>
          </>
        )
      }
    >
      {imported ? (
        <div className="flex items-start gap-3 rounded-xl border border-success-100 bg-success-50 p-4">
          <CheckCircle2 className="size-5 shrink-0 text-success-600" />
          <p className="text-[13px] text-success-700">
            Импорт завершён: добавлено {imported.created}, обновлено {imported.updated}, пропущено{' '}
            {imported.skipped}.
          </p>
        </div>
      ) : !parsed ? (
        <>
          <FileDrop
            accept=".csv,text/csv"
            label="Перетащите CSV-файл с прайсом"
            hint="Разделитель «;» или «,», кодировка UTF-8. Обновление идёт по артикулу."
            onFiles={(files) => handleFile(files[0])}
          />
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            {[
              ['Загрузка', 'Файл читается в браузере'],
              ['Сопоставление', 'Колонки определяются автоматически'],
              ['Импорт', 'Совпадения по артикулу обновляются'],
            ].map(([title, text]) => (
              <div key={title} className="rounded-lg bg-ink-50 p-3">
                <p className="text-[13px] font-semibold text-ink-900">{title}</p>
                <p className="mt-0.5 text-xs text-ink-500">{text}</p>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-ink-200 bg-ink-50 p-3">
            <FileSpreadsheet className="size-5 text-brand-600" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-ink-900">{fileName}</p>
              <p className="text-xs text-ink-500">
                {withCount(parsed.rows.length, 'строка', 'строки', 'строк')} ·{' '}
                {parsed.headers.length} колонок
              </p>
            </div>
          </div>

          <section>
            <h4 className="text-[13px] font-semibold text-ink-900">Сопоставление колонок</h4>
            <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {parsed.headers.map((header, i) => (
                <div key={`${header}-${i}`} className="rounded-lg border border-ink-200 p-2.5">
                  <p className="truncate text-[13px] font-semibold text-ink-900">{header}</p>
                  <p className="mt-0.5 mb-1.5 truncate text-xs text-ink-500">
                    пример: {parsed.rows[0]?.[i] || '—'}
                  </p>
                  <Select
                    value={mapping[i] ?? 'skip'}
                    onChange={(e) =>
                      setMapping((prev) =>
                        prev.map((field, index) =>
                          index === i ? (e.target.value as CsvField) : field,
                        ),
                      )
                    }
                    className="h-9 text-[13px]"
                  >
                    {(Object.keys(csvFieldLabels) as CsvField[]).map((field) => (
                      <option key={field} value={field}>
                        {csvFieldLabels[field]}
                      </option>
                    ))}
                  </Select>
                </div>
              ))}
            </div>
          </section>

          <div className="grid gap-2 sm:grid-cols-3">
            <div className="rounded-lg bg-ink-50 p-3">
              <p className="text-[11px] tracking-wide text-ink-500 uppercase">Будет добавлено</p>
              <p className="mt-0.5 text-xl font-bold text-success-600">{stats.create}</p>
            </div>
            <div className="rounded-lg bg-ink-50 p-3">
              <p className="text-[11px] tracking-wide text-ink-500 uppercase">Будет обновлено</p>
              <p className="mt-0.5 text-xl font-bold text-brand-600">{stats.update}</p>
            </div>
            <div className="rounded-lg bg-ink-50 p-3">
              <p className="text-[11px] tracking-wide text-ink-500 uppercase">С ошибками</p>
              <p className="mt-0.5 text-xl font-bold text-danger-600">{stats.skip}</p>
            </div>
          </div>

          <section>
            <h4 className="text-[13px] font-semibold text-ink-900">Предпросмотр</h4>
            {results.length === 0 ? (
              <EmptyState title="В файле нет строк" compact className="mt-2 border-0" />
            ) : (
              <div className="mt-2 overflow-hidden rounded-xl border border-ink-200">
                <Table>
                  <THead>
                    <TR>
                      <TH width="5%">№</TH>
                      <TH>Товар</TH>
                      <TH width="14%">Категория</TH>
                      <TH width="10%" align="right">
                        Цена
                      </TH>
                      <TH width="10%" align="right">
                        Остаток
                      </TH>
                      <TH width="22%">Результат</TH>
                    </TR>
                  </THead>
                  <tbody>
                    {results.slice(0, 20).map((result) => (
                      <TR key={result.index}>
                        <TD className="text-xs text-ink-500">{result.index + 2}</TD>
                        <TD>
                          <p className="text-[13px] text-ink-900">
                            {result.product?.name ?? parsed.rows[result.index]?.[0] ?? '—'}
                          </p>
                          <p className="text-xs text-ink-500">
                            арт. {result.product?.article ?? '—'}
                          </p>
                        </TD>
                        <TD className="text-[13px] text-ink-600">
                          {categories.find((c) => c.id === result.product?.categoryId)?.name ?? '—'}
                        </TD>
                        <TD align="right" className="text-[13px]">
                          {result.product ? money(result.product.price) : '—'}
                        </TD>
                        <TD align="right" className="text-[13px]">
                          {result.product?.stock ?? '—'}
                        </TD>
                        <TD>
                          {result.action === 'skip' ? (
                            <span className="flex items-start gap-1.5 text-xs text-danger-600">
                              <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
                              {result.errors.join(', ')}
                            </span>
                          ) : (
                            <Badge tone={result.action === 'create' ? 'success' : 'info'}>
                              {result.action === 'create' ? 'Новая позиция' : 'Обновление по артикулу'}
                            </Badge>
                          )}
                        </TD>
                      </TR>
                    ))}
                  </tbody>
                </Table>
                {results.length > 20 && (
                  <p className="border-t border-ink-100 p-2 text-center text-xs text-ink-500">
                    Показаны первые 20 строк из {results.length}
                  </p>
                )}
              </div>
            )}
          </section>
        </div>
      )}
    </Modal>
  );
}
