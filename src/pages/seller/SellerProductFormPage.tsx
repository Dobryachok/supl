import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Field, Input, Select, Switch, Textarea } from '@/components/ui/Field';
import { FileDrop, readFileAsDataUrl } from '@/components/ui/FileDrop';
import { ProductImage } from '@/components/ui/ProductImage';
import { useToast } from '@/components/ui/Toast';
import { categories } from '@/data/categories';
import { tempModeLabel } from '@/data/products';
import { uid } from '@/lib/ids';
import { money, unitLabel } from '@/lib/format';
import { useAppState, useDispatch } from '@/store/AppContext';
import type { Product, TempMode, Unit } from '@/types';
import { NotFoundPage } from '../buyer/NotFoundPage';

const units: Unit[] = ['kg', 'pc', 'l', 'pack', 'box'];
const temps: TempMode[] = ['chilled', 'frozen', 'dry'];

interface FormState {
  name: string;
  article: string;
  categoryId: string;
  subcategoryId: string;
  brand: string;
  country: string;
  unit: Unit;
  packSize: string;
  price: string;
  oldPrice: string;
  stock: string;
  minQty: string;
  step: string;
  tempMode: TempMode;
  tags: string;
  description: string;
  isActive: boolean;
  photo?: string;
}

function toForm(product?: Product): FormState {
  const category = categories[0];
  return {
    name: product?.name ?? '',
    article: product?.article ?? '',
    categoryId: product?.categoryId ?? category.id,
    subcategoryId: product?.subcategoryId ?? category.subcategories[0].id,
    brand: product?.brand ?? '',
    country: product?.country ?? 'Россия',
    unit: product?.unit ?? 'kg',
    packSize: product?.packSize ?? '',
    price: product ? String(product.price) : '',
    oldPrice: product?.oldPrice ? String(product.oldPrice) : '',
    stock: product ? String(product.stock) : '',
    minQty: product ? String(product.minQty) : '1',
    step: product ? String(product.step) : '1',
    tempMode: product?.tempMode ?? 'chilled',
    tags: product?.tags.join(', ') ?? '',
    description: product?.description ?? '',
    isActive: product?.isActive ?? true,
    photo: product?.photo,
  };
}

export function SellerProductFormPage() {
  const { id } = useParams();
  const state = useAppState();
  const dispatch = useDispatch();
  const toast = useToast();
  const navigate = useNavigate();

  const existing = id ? state.products.find((p) => p.id === id) : undefined;
  const [form, setForm] = useState<FormState>(() => toForm(existing));
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  if (id && !existing) return <NotFoundPage />;

  const category = categories.find((c) => c.id === form.categoryId) ?? categories[0];
  const patch = (part: Partial<FormState>) => setForm((prev) => ({ ...prev, ...part }));

  const validate = () => {
    const next: Partial<Record<keyof FormState, string>> = {};
    if (!form.name.trim()) next.name = 'Укажите название товара';
    if (!form.packSize.trim()) next.packSize = 'Укажите фасовку, например «короб 5 кг»';
    if (!form.price || Number(form.price) <= 0) next.price = 'Цена должна быть больше нуля';
    if (form.oldPrice && Number(form.oldPrice) <= Number(form.price))
      next.oldPrice = 'Старая цена должна быть выше текущей';
    if (form.stock === '' || Number(form.stock) < 0) next.stock = 'Укажите остаток';
    if (!form.minQty || Number(form.minQty) <= 0) next.minQty = 'Минимум должен быть больше нуля';
    if (!form.step || Number(form.step) <= 0) next.step = 'Кратность должна быть больше нуля';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = () => {
    if (!validate()) {
      toast.error('Проверьте форму', 'Некоторые поля заполнены некорректно');
      return;
    }
    const product: Product = {
      id: existing?.id ?? uid('p'),
      supplierId: state.session.sellerSupplierId,
      categoryId: form.categoryId,
      subcategoryId: form.subcategoryId,
      name: form.name.trim(),
      article: form.article.trim() || `NEW-${Math.floor(Math.random() * 9000) + 1000}`,
      brand: form.brand.trim() || 'Без бренда',
      country: form.country.trim() || 'Россия',
      unit: form.unit,
      packSize: form.packSize.trim(),
      price: Number(form.price),
      oldPrice: form.oldPrice ? Number(form.oldPrice) : undefined,
      stock: Number(form.stock),
      minQty: Number(form.minQty),
      step: Number(form.step),
      tempMode: form.tempMode,
      tags: form.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      description: form.description.trim(),
      specs: existing?.specs ?? [
        { label: 'Фасовка', value: form.packSize.trim() },
        { label: 'Бренд', value: form.brand.trim() || 'Без бренда' },
        { label: 'Температурный режим', value: tempModeLabel(form.tempMode) },
      ],
      photo: form.photo,
      isActive: form.isActive,
      createdAt: existing?.createdAt ?? new Date().toISOString(),
      popularity: existing?.popularity ?? 40,
      isNew: existing ? existing.isNew : true,
    };

    dispatch({ type: 'products/upsert', product });
    toast.success(existing ? 'Товар обновлён' : 'Товар добавлен', product.name);
    navigate('/seller/products');
  };

  return (
    <div>
      <button
        type="button"
        onClick={() => navigate('/seller/products')}
        className="flex cursor-pointer items-center gap-1 text-[13px] text-ink-500 hover:text-brand-600"
      >
        <ChevronLeft className="size-4" />
        Каталог товаров
      </button>

      <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[26px]">{existing ? 'Редактирование товара' : 'Новый товар'}</h1>
          <p className="mt-1 text-[13px] text-ink-500">
            Заполните карточку — она сразу появится в каталоге ресторанов
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => navigate('/seller/products')}>
            Отмена
          </Button>
          <Button onClick={submit}>{existing ? 'Сохранить' : 'Опубликовать'}</Button>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <section className="card p-4">
            <h2 className="text-[15px]">Основное</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Field label="Название" required error={errors.name} className="sm:col-span-2">
                <Input
                  value={form.name}
                  invalid={Boolean(errors.name)}
                  onChange={(e) => patch({ name: e.target.value })}
                  placeholder="Например: Филе куриное охлаждённое"
                />
              </Field>
              <Field label="Артикул" hint="Если пусто — сгенерируем автоматически">
                <Input
                  value={form.article}
                  onChange={(e) => patch({ article: e.target.value })}
                  placeholder="MEA-1024"
                />
              </Field>
              <Field label="Бренд">
                <Input value={form.brand} onChange={(e) => patch({ brand: e.target.value })} />
              </Field>
              <Field label="Категория" required>
                <Select
                  value={form.categoryId}
                  onChange={(e) => {
                    const next = categories.find((c) => c.id === e.target.value)!;
                    patch({ categoryId: next.id, subcategoryId: next.subcategories[0].id });
                  }}
                >
                  {categories.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Подкатегория" required>
                <Select
                  value={form.subcategoryId}
                  onChange={(e) => patch({ subcategoryId: e.target.value })}
                >
                  {category.subcategories.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Страна происхождения">
                <Input value={form.country} onChange={(e) => patch({ country: e.target.value })} />
              </Field>
              <Field label="Температурный режим">
                <Select
                  value={form.tempMode}
                  onChange={(e) => patch({ tempMode: e.target.value as TempMode })}
                >
                  {temps.map((temp) => (
                    <option key={temp} value={temp}>
                      {tempModeLabel(temp)}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
          </section>

          <section className="card p-4">
            <h2 className="text-[15px]">Цена, фасовка и остаток</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <Field label="Цена, ₽" required error={errors.price}>
                <Input
                  value={form.price}
                  invalid={Boolean(errors.price)}
                  inputMode="decimal"
                  onChange={(e) => patch({ price: e.target.value.replace(/[^\d.,]/g, '') })}
                />
              </Field>
              <Field label="Старая цена, ₽" hint="Для показа скидки" error={errors.oldPrice}>
                <Input
                  value={form.oldPrice}
                  invalid={Boolean(errors.oldPrice)}
                  inputMode="decimal"
                  onChange={(e) => patch({ oldPrice: e.target.value.replace(/[^\d.,]/g, '') })}
                />
              </Field>
              <Field label="Единица">
                <Select
                  value={form.unit}
                  onChange={(e) => patch({ unit: e.target.value as Unit })}
                >
                  {units.map((unit) => (
                    <option key={unit} value={unit}>
                      {unitLabel(unit)}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Фасовка" required error={errors.packSize} className="sm:col-span-2">
                <Input
                  value={form.packSize}
                  invalid={Boolean(errors.packSize)}
                  onChange={(e) => patch({ packSize: e.target.value })}
                  placeholder="короб 4 × 2,5 кг"
                />
              </Field>
              <Field label="Остаток «сколько есть»" required error={errors.stock}>
                <Input
                  value={form.stock}
                  invalid={Boolean(errors.stock)}
                  inputMode="decimal"
                  onChange={(e) => patch({ stock: e.target.value.replace(/[^\d.,]/g, '') })}
                />
              </Field>
              <Field label="Минимальный заказ" required error={errors.minQty}>
                <Input
                  value={form.minQty}
                  invalid={Boolean(errors.minQty)}
                  inputMode="decimal"
                  onChange={(e) => patch({ minQty: e.target.value.replace(/[^\d.,]/g, '') })}
                />
              </Field>
              <Field label="Кратность отгрузки" required error={errors.step}>
                <Input
                  value={form.step}
                  invalid={Boolean(errors.step)}
                  inputMode="decimal"
                  onChange={(e) => patch({ step: e.target.value.replace(/[^\d.,]/g, '') })}
                />
              </Field>
            </div>
          </section>

          <section className="card p-4">
            <h2 className="text-[15px]">Описание и теги</h2>
            <Field label="Описание" className="mt-3">
              <Textarea
                rows={4}
                value={form.description}
                onChange={(e) => patch({ description: e.target.value })}
                placeholder="Условия хранения, особенности продукта, рекомендации по применению"
              />
            </Field>
            <Field label="Теги" hint="Через запятую: Хит, Новинка, Для пиццерии" className="mt-3">
              <Input value={form.tags} onChange={(e) => patch({ tags: e.target.value })} />
            </Field>
          </section>
        </div>

        <aside className="space-y-4">
          <section className="card p-4">
            <h2 className="text-[15px]">Фото</h2>
            <div className="mt-3">
              {form.photo ? (
                <div className="relative">
                  <img
                    src={form.photo}
                    alt="Фото товара"
                    className="aspect-square w-full rounded-lg border border-ink-200 object-cover"
                  />
                  <Button
                    size="sm"
                    variant="secondary"
                    className="mt-2"
                    icon={<Trash2 className="size-3.5" />}
                    onClick={() => patch({ photo: undefined })}
                  >
                    Удалить фото
                  </Button>
                </div>
              ) : (
                <>
                  <ProductImage
                    product={{
                      categoryId: form.categoryId,
                      name: form.name || 'Новый товар',
                      brand: form.brand || 'Бренд',
                    }}
                    className="aspect-square w-full"
                  />
                  <FileDrop
                    className="mt-2 py-5"
                    accept="image/*"
                    label="Перетащите фото"
                    hint="JPG или PNG до 2 МБ"
                    onFiles={async (files) => {
                      const url = await readFileAsDataUrl(files[0]);
                      patch({ photo: url });
                      toast.success('Фото загружено');
                    }}
                  />
                </>
              )}
            </div>
          </section>

          <section className="card p-4">
            <h2 className="text-[15px]">Публикация</h2>
            <Switch
              className="mt-3"
              checked={form.isActive}
              onChange={(e) => patch({ isActive: e.target.checked })}
              label={form.isActive ? 'Товар в продаже' : 'Скрыт из каталога'}
            />
            <div className="mt-3 rounded-lg bg-ink-50 p-3 text-[13px]">
              <p className="text-ink-500">Предпросмотр цены</p>
              <p className="mt-1 text-[19px] font-bold text-ink-900">
                {form.price ? money(Number(form.price)) : '—'}
                <span className="ml-1 text-xs font-normal text-ink-500">
                  за {unitLabel(form.unit)}
                </span>
              </p>
              {form.oldPrice && Number(form.oldPrice) > Number(form.price) && (
                <Badge tone="danger" className="mt-1.5">
                  −
                  {Math.round(
                    ((Number(form.oldPrice) - Number(form.price)) / Number(form.oldPrice)) * 100,
                  )}
                  %
                </Badge>
              )}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
