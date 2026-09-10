import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  BadgeCheck,
  Eye,
  Package,
  Plus,
  Save,
  ShoppingBag,
  Star,
  Trash2,
  Truck,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button, LinkButton } from '@/components/ui/Button';
import { Checkbox, Field, Input, Select, Textarea } from '@/components/ui/Field';
import { SupplierLogo } from '@/components/ui/ProductImage';
import { Rating } from '@/components/ui/Rating';
import { Tabs } from '@/components/ui/Tabs';
import { useToast } from '@/components/ui/Toast';
import { categories } from '@/data/categories';
import { money } from '@/lib/format';
import { useAppState, useDispatch } from '@/store/AppContext';
import { productsOfSupplier, sellerOrders, supplierRatingSummary } from '@/store/selectors';
import type { Supplier } from '@/types';

const weekDays = [
  { value: 1, label: 'Пн' },
  { value: 2, label: 'Вт' },
  { value: 3, label: 'Ср' },
  { value: 4, label: 'Чт' },
  { value: 5, label: 'Пт' },
  { value: 6, label: 'Сб' },
  { value: 7, label: 'Вс' },
];

export function SellerProfilePage() {
  const state = useAppState();
  const dispatch = useDispatch();
  const toast = useToast();
  const [tab, setTab] = useState('storefront');

  const supplier = state.suppliers.find((s) => s.id === state.session.sellerSupplierId)!;
  const [draft, setDraft] = useState<Supplier>(supplier);
  const [newWindow, setNewWindow] = useState('');
  const [newZone, setNewZone] = useState('');
  useEffect(() => {
    setDraft(supplier);
  }, [supplier]);

  const products = useMemo(
    () => productsOfSupplier(state, supplier.id),
    [state, supplier.id],
  );
  const orders = sellerOrders(state);
  const summary = supplierRatingSummary(state, supplier.id);
  const revenue = orders
    .filter((o) => ['accepted', 'partially_accepted'].includes(o.status))
    .reduce((sum, o) => sum + o.lines.reduce((s, l) => s + l.price * (l.factQty ?? l.qty), 0), 0);

  const patch = (part: Partial<Supplier>) => setDraft((prev) => ({ ...prev, ...part }));
  const dirty = JSON.stringify(draft) !== JSON.stringify(supplier);

  const save = () => {
    dispatch({ type: 'suppliers/update', supplierId: supplier.id, patch: draft });
    toast.success('Профиль обновлён', 'Рестораны увидят изменения на витрине');
  };

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold tracking-wider text-ink-400 uppercase">
            Профиль компании
          </p>
          <h1 className="text-[26px]">{supplier.name}</h1>
          <p className="mt-1 text-[13px] text-ink-500">
            Так вашу карточку и условия работы видят рестораны в каталоге
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <LinkButton
            to={`/suppliers/${supplier.id}`}
            variant="secondary"
            icon={<Eye className="size-4" />}
          >
            Открыть витрину
          </LinkButton>
          <Button icon={<Save className="size-4" />} onClick={save} disabled={!dirty}>
            {dirty ? 'Сохранить изменения' : 'Всё сохранено'}
          </Button>
        </div>
      </div>

      <div className="card mt-4 flex flex-wrap items-center gap-5 p-5">
        <SupplierLogo name={supplier.name} hue={supplier.hue} className="size-16 text-lg" />
        <div className="min-w-[220px] flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[17px] font-bold text-ink-900">{supplier.legalName}</p>
            {supplier.verified && (
              <Badge tone="info" icon={<BadgeCheck className="size-3.5" />}>
                Проверенный
              </Badge>
            )}
            {supplier.isManufacturer && <Badge tone="success">Производитель</Badge>}
          </div>
          <p className="mt-1 text-[13px] text-ink-500">
            {supplier.city} · на SUPL с {supplier.since} года
          </p>
          <Rating value={summary.rating || supplier.rating} count={summary.count} className="mt-1.5" />
        </div>
        <dl className="grid flex-1 grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat
            icon={<Package className="size-4" />}
            label="Товаров"
            value={String(products.filter((p) => p.isActive).length)}
            hint={`из ${products.length} в каталоге`}
          />
          <Stat
            icon={<ShoppingBag className="size-4" />}
            label="Заявок"
            value={String(orders.length)}
            hint="за всё время"
          />
          <Stat
            icon={<Truck className="size-4" />}
            label="Выручка"
            value={money(revenue)}
            hint="по принятым поставкам"
          />
          <Stat
            icon={<Star className="size-4" />}
            label="Отзывы"
            value={String(summary.count)}
            hint={summary.rating ? `рейтинг ${summary.rating}` : 'пока нет оценок'}
          />
        </dl>
      </div>

      <Tabs
        className="mt-5"
        value={tab}
        onChange={setTab}
        items={[
          { id: 'storefront', label: 'Витрина' },
          { id: 'delivery', label: 'Доставка' },
          { id: 'legal', label: 'Реквизиты и контакты' },
        ]}
      />

      <div className="mt-4 space-y-4">
        {tab === 'storefront' && (
          <section className="card p-4">
            <h2 className="text-[15px]">Как компания выглядит в каталоге</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Field label="Название для витрины" required>
                <Input value={draft.name} onChange={(e) => patch({ name: e.target.value })} />
              </Field>
              <Field label="Город" required>
                <Input value={draft.city} onChange={(e) => patch({ city: e.target.value })} />
              </Field>
              <Field label="Описание" className="sm:col-span-2" hint="1–3 предложения о продукте и производстве">
                <Textarea
                  rows={4}
                  value={draft.description}
                  onChange={(e) => patch({ description: e.target.value })}
                />
              </Field>
            </div>

            <p className="mt-4 text-[13px] font-semibold text-ink-900">Категории поставок</p>
            <p className="text-xs text-ink-500">
              По ним ресторан находит вас в разделах каталога
            </p>
            <div className="mt-2 grid gap-x-4 sm:grid-cols-2 lg:grid-cols-3">
              {categories.map((category) => (
                <Checkbox
                  key={category.id}
                  label={category.name}
                  checked={draft.categoryIds.includes(category.id)}
                  count={products.filter((p) => p.categoryId === category.id).length}
                  onChange={(e) =>
                    patch({
                      categoryIds: e.target.checked
                        ? [...draft.categoryIds, category.id]
                        : draft.categoryIds.filter((id) => id !== category.id),
                    })
                  }
                />
              ))}
            </div>
          </section>
        )}

        {tab === 'delivery' && (
          <>
            <section className="card p-4">
              <h2 className="text-[15px]">Условия заказа</h2>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <Field label="Стоимость доставки, ₽">
                  <Input
                    inputMode="numeric"
                    value={String(draft.deliveryFee)}
                    onChange={(e) =>
                      patch({ deliveryFee: Number(e.target.value.replace(/\D/g, '')) || 0 })
                    }
                  />
                </Field>
                <Field label="Бесплатно от, ₽">
                  <Input
                    inputMode="numeric"
                    value={String(draft.freeDeliveryFrom)}
                    onChange={(e) =>
                      patch({ freeDeliveryFrom: Number(e.target.value.replace(/\D/g, '')) || 0 })
                    }
                  />
                </Field>
                <Field label="Срок сборки заявки, дней" hint="0 — отгружаем в день заказа">
                  <Select
                    value={String(draft.leadTimeDays)}
                    onChange={(e) => patch({ leadTimeDays: Number(e.target.value) })}
                  >
                    {[0, 1, 2, 3, 4, 5].map((days) => (
                      <option key={days} value={days}>
                        {days} дн.
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>

              <p className="mt-4 text-[13px] font-semibold text-ink-900">Дни отгрузки</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {weekDays.map((day) => {
                  const active = draft.deliveryDays.includes(day.value);
                  return (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() =>
                        patch({
                          deliveryDays: active
                            ? draft.deliveryDays.filter((d) => d !== day.value)
                            : [...draft.deliveryDays, day.value].sort((a, b) => a - b),
                        })
                      }
                      className={
                        active
                          ? 'cursor-pointer rounded-lg bg-brand-600 px-3.5 py-2 text-[13px] font-semibold text-white'
                          : 'cursor-pointer rounded-lg bg-white px-3.5 py-2 text-[13px] text-ink-600 ring-1 ring-ink-200 ring-inset hover:text-ink-900'
                      }
                    >
                      {day.label}
                    </button>
                  );
                })}
              </div>
            </section>

            <div className="grid gap-4 lg:grid-cols-2">
              <ListEditor
                title="Окна доставки"
                hint="Их ресторан выбирает при оформлении заявки"
                items={draft.deliveryWindows}
                value={newWindow}
                onValueChange={setNewWindow}
                placeholder="08:00 – 12:00"
                onAdd={(value) => patch({ deliveryWindows: [...draft.deliveryWindows, value] })}
                onRemove={(index) =>
                  patch({
                    deliveryWindows: draft.deliveryWindows.filter((_, i) => i !== index),
                  })
                }
              />
              <ListEditor
                title="Зоны доставки"
                hint="Районы и города, куда возите сами"
                items={draft.deliveryZones}
                value={newZone}
                onValueChange={setNewZone}
                placeholder="Красноярск, центр и правый берег"
                onAdd={(value) => patch({ deliveryZones: [...draft.deliveryZones, value] })}
                onRemove={(index) =>
                  patch({ deliveryZones: draft.deliveryZones.filter((_, i) => i !== index) })
                }
              />
            </div>
          </>
        )}

        {tab === 'legal' && (
          <div className="grid gap-4 lg:grid-cols-2">
            <section className="card p-4">
              <h2 className="text-[15px]">Реквизиты</h2>
              <div className="mt-3 space-y-3">
                <Field label="Юридическое лицо">
                  <Input
                    value={draft.legalName}
                    onChange={(e) => patch({ legalName: e.target.value })}
                  />
                </Field>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="ИНН">
                    <Input
                      value={draft.inn}
                      inputMode="numeric"
                      onChange={(e) => patch({ inn: e.target.value.replace(/\D/g, '') })}
                    />
                  </Field>
                  <Field label="КПП">
                    <Input
                      value={draft.kpp}
                      inputMode="numeric"
                      onChange={(e) => patch({ kpp: e.target.value.replace(/\D/g, '') })}
                    />
                  </Field>
                </div>
                <Field label="Юридический адрес">
                  <Input value={draft.address} onChange={(e) => patch({ address: e.target.value })} />
                </Field>
              </div>
            </section>

            <section className="card p-4">
              <h2 className="text-[15px]">Контакты для ресторанов</h2>
              <div className="mt-3 space-y-3">
                <Field label="Менеджер по работе с ресторанами">
                  <Input
                    value={draft.contacts.manager}
                    onChange={(e) =>
                      patch({ contacts: { ...draft.contacts, manager: e.target.value } })
                    }
                  />
                </Field>
                <Field label="Телефон">
                  <Input
                    value={draft.contacts.phone}
                    onChange={(e) =>
                      patch({ contacts: { ...draft.contacts, phone: e.target.value } })
                    }
                  />
                </Field>
                <Field label="E-mail">
                  <Input
                    type="email"
                    value={draft.contacts.email}
                    onChange={(e) =>
                      patch({ contacts: { ...draft.contacts, email: e.target.value } })
                    }
                  />
                </Field>
                <Field label="Сайт">
                  <Input
                    value={draft.contacts.site}
                    onChange={(e) =>
                      patch({ contacts: { ...draft.contacts, site: e.target.value } })
                    }
                  />
                </Field>
              </div>
            </section>
          </div>
        )}

      </div>
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  hint,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-lg bg-ink-50 p-3">
      <dt className="flex items-center gap-1.5 text-[11px] tracking-wide text-ink-500 uppercase">
        {icon}
        {label}
      </dt>
      <dd className="mt-1 text-[15px] font-bold text-ink-900">{value}</dd>
      <dd className="text-xs text-ink-500">{hint}</dd>
    </div>
  );
}

function ListEditor({
  title,
  hint,
  items,
  value,
  onValueChange,
  placeholder,
  onAdd,
  onRemove,
}: {
  title: string;
  hint: string;
  items: string[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder: string;
  onAdd: (value: string) => void;
  onRemove: (index: number) => void;
}) {
  const add = () => {
    if (!value.trim()) return;
    onAdd(value.trim());
    onValueChange('');
  };

  return (
    <section className="card p-4">
      <h2 className="text-[15px]">{title}</h2>
      <p className="text-xs text-ink-500">{hint}</p>
      <ul className="mt-3 space-y-1.5">
        {items.map((item, index) => (
          <li
            key={`${item}-${index}`}
            className="flex items-center gap-2 rounded-lg bg-ink-50 px-3 py-2 text-[13px] text-ink-800"
          >
            <span className="flex-1">{item}</span>
            <button
              type="button"
              onClick={() => onRemove(index)}
              className="cursor-pointer text-ink-400 hover:text-danger-600"
              aria-label={`Удалить «${item}»`}
            >
              <Trash2 className="size-3.5" />
            </button>
          </li>
        ))}
        {items.length === 0 && <li className="text-[13px] text-ink-500">Пока ничего не добавлено</li>}
      </ul>
      <div className="mt-3 flex gap-2">
        <Input
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add();
            }
          }}
          placeholder={placeholder}
        />
        <Button variant="secondary" icon={<Plus className="size-4" />} onClick={add}>
          Добавить
        </Button>
      </div>
    </section>
  );
}
