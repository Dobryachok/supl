import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  BadgeCheck,
  ChevronRight,
  Clock,
  Heart,
  MapPin,
  MessageSquare,
  Truck,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { StatusBadge } from '@/components/orders/StatusBadge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Field, Textarea } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import { SupplierLogo } from '@/components/ui/ProductImage';
import { Rating, RatingInput } from '@/components/ui/Rating';
import { Tabs } from '@/components/ui/Tabs';
import { useToast } from '@/components/ui/Toast';
import { ProductGrid } from '@/components/catalog/ProductGrid';
import { SortBar } from '@/components/catalog/SortBar';
import { deliveryDaysLabel } from '@/components/catalog/SupplierCard';
import { categoryById } from '@/data/categories';
import { useChatActions } from '@/hooks/useChatActions';
import { cn } from '@/lib/cn';
import { uid } from '@/lib/ids';
import {
  dateFull,
  money,
  paymentLabels,
  relativeDay,
  withCount,
} from '@/lib/format';
import { useAppState, useDispatch } from '@/store/AppContext';
import {
  nextDeliveryDates,
  filterProducts,
  supplierRatingSummary,
} from '@/store/selectors';
import type { CatalogSort } from '@/store/selectors';
import { NotFoundPage } from './NotFoundPage';

export function SupplierPage() {
  const { id = '' } = useParams();
  const state = useAppState();
  const dispatch = useDispatch();
  const chat = useChatActions();
  const toast = useToast();
  const navigate = useNavigate();
  const [tab, setTab] = useState('products');
  const [searchQuery, setSearchQuery] = useState('');
  const [sort, setSort] = useState<CatalogSort>('popular');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');

  const supplier = state.suppliers.find((s) => s.id === id);
  const products = useMemo(
    () =>
      supplier
        ? filterProducts(
            state,
            { supplierIds: [supplier.id], query: searchQuery || undefined },
            sort,
          )
        : [],
    [state, supplier, sort, searchQuery],
  );

  if (!supplier) return <NotFoundPage />;

  const reviews = state.reviews.filter((r) => r.supplierId === supplier.id);
  const summary = supplierRatingSummary(state, supplier.id);
  const orders = state.orders.filter((o) => o.supplierId === supplier.id);
  const isFavorite = state.favoriteSuppliers.includes(supplier.id);
  const deliveryDates = nextDeliveryDates(supplier, 4);

  const submitReview = () => {
    dispatch({
      type: 'reviews/add',
      review: {
        id: uid('rev'),
        supplierId: supplier.id,
        author: state.session.buyerName,
        outlet: state.restaurant.outlets.find((o) => o.isDefault)?.name ?? state.restaurant.name,
        rating: reviewRating,
        text: reviewText.trim() || 'Без комментария',
        at: new Date().toISOString(),
      },
    });
    setReviewOpen(false);
    setReviewText('');
    toast.success('Отзыв опубликован', supplier.name);
  };

  return (
    <div className="page pt-5">
      <nav className="flex flex-wrap items-center gap-1.5 text-[13px] text-ink-500">
        <Link to="/" className="hover:text-brand-600">
          Главная
        </Link>
        <ChevronRight className="size-3.5" />
        <Link to="/suppliers" className="hover:text-brand-600">
          Поставщики
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="text-ink-700">{supplier.name}</span>
      </nav>

      <div className="card mt-3 p-5">
        <div className="flex flex-wrap gap-5">
          <SupplierLogo name={supplier.name} hue={supplier.hue} className="size-20 text-xl" />
          <div className="min-w-0 flex-1">
            <h1 className="flex flex-wrap items-center gap-2 text-[24px]">
              {supplier.legalName}
              {supplier.verified && (
                <Badge tone="info" icon={<BadgeCheck className="size-3.5" />}>
                  Проверенный поставщик
                </Badge>
              )}
              {supplier.isManufacturer && <Badge tone="success">Производитель</Badge>}
            </h1>
            <p className="mt-1 flex flex-wrap items-center gap-3 text-[13px] text-ink-500">
              <span className="flex items-center gap-1">
                <MapPin className="size-3.5" />
                {supplier.city}
              </span>
              <span>На SUPL с {supplier.since} года</span>
              <span>{withCount(supplier.ordersCount, 'заказ', 'заказа', 'заказов')} выполнено</span>
            </p>
            <p className="mt-2.5 max-w-3xl text-sm text-ink-700">{supplier.description}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {supplier.categoryIds.map((categoryId) => {
                const category = categoryById.get(categoryId);
                if (!category) return null;
                return (
                  <Link key={categoryId} to={`/catalog/${category.slug}`}>
                    <Badge tone="neutral">{category.name}</Badge>
                  </Link>
                );
              })}
            </div>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-64">
            <Rating value={summary.rating || supplier.rating} count={summary.count} size="md" />
            <Button
              icon={<MessageSquare className="size-4" />}
              onClick={() => {
                const threadId = chat.ensureThread({
                  supplierId: supplier.id,
                  subject: `Диалог с ${supplier.name}`,
                });
                navigate(`/chats?thread=${threadId}`);
              }}
            >
              Написать в чат
            </Button>
            <Button
              variant="secondary"
              icon={<Heart className={cn('size-4', isFavorite && 'fill-danger-500 text-danger-500')} />}
              onClick={() => dispatch({ type: 'favorites/toggleSupplier', supplierId: supplier.id })}
            >
              {isFavorite ? 'В избранном' : 'В избранное'}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setReviewOpen(true)}>
              Оставить отзыв
            </Button>
          </div>
        </div>

        <dl className="mt-5 grid gap-3 border-t border-ink-100 pt-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg bg-ink-50 p-3">
            <dt className="text-[11px] tracking-wide text-ink-500 uppercase">Доставка</dt>
            <dd className="mt-1 text-[15px] font-bold text-ink-900">
              {money(supplier.deliveryFee)}
            </dd>
            <dd className="text-xs text-ink-500">бесплатно от {money(supplier.freeDeliveryFrom)}</dd>
          </div>
          <div className="rounded-lg bg-ink-50 p-3">
            <dt className="text-[11px] tracking-wide text-ink-500 uppercase">Дни доставки</dt>
            <dd className="mt-1 text-[15px] font-bold text-ink-900">
              {deliveryDaysLabel(supplier)}
            </dd>
            <dd className="text-xs text-ink-500">
              ближайшая — {deliveryDates[0] ? relativeDay(deliveryDates[0]) : '—'}
            </dd>
          </div>
          <div className="rounded-lg bg-ink-50 p-3">
            <dt className="text-[11px] tracking-wide text-ink-500 uppercase">Оплата</dt>
            <dd className="mt-1 text-[13px] font-semibold text-ink-900">
              {supplier.paymentMethods.map((m) => paymentLabels[m]).join(', ')}
            </dd>
          </div>
        </dl>
      </div>

      <Tabs
        className="mt-5"
        value={tab}
        onChange={setTab}
        items={[
          { id: 'products', label: 'Товары', count: products.length },
          { id: 'conditions', label: 'Условия и зоны доставки' },
          { id: 'contacts', label: 'Реквизиты и контакты' },
          { id: 'reviews', label: 'Отзывы', count: reviews.length },
          { id: 'history', label: 'История заявок', count: orders.length },
        ]}
      />

      <div className="mt-4">
        {tab === 'products' && (
          <>
            <SortBar
              sort={sort}
              onSortChange={setSort}
              view={view}
              onViewChange={setView}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              searchPlaceholder="Поиск в каталоге поставщика"
              columns={5}
              className="mb-3"
            />
            {products.length === 0 ? (
              <EmptyState
                title={searchQuery ? 'Товары не найдены' : 'Поставщик пока не выложил товары'}
                compact
              />
            ) : (
              <ProductGrid products={products} view={view} columns={5} />
            )}
          </>
        )}

        {tab === 'conditions' && (
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="card p-4">
              <h2 className="text-[15px]">График и окна доставки</h2>
              <p className="mt-1 text-[13px] text-ink-600">
                Дни отгрузки: {deliveryDaysLabel(supplier)}. Сборка заявки —{' '}
                {supplier.leadTimeDays} дн.
              </p>
              <ul className="mt-3 space-y-1.5">
                {supplier.deliveryWindows.map((window) => (
                  <li key={window} className="flex items-center gap-2 text-[13px] text-ink-700">
                    <Clock className="size-3.5 text-ink-400" />
                    {window}
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-[13px] font-semibold text-ink-900">Ближайшие даты</p>
              <ul className="mt-1.5 space-y-1">
                {deliveryDates.map((date) => (
                  <li key={date} className="text-[13px] text-ink-600">
                    {dateFull(date)} — {relativeDay(date)}
                  </li>
                ))}
              </ul>
            </div>
            <div className="card p-4">
              <h2 className="text-[15px]">Зоны доставки</h2>
              <ul className="mt-2 space-y-1.5">
                {supplier.deliveryZones.map((zone) => (
                  <li key={zone} className="flex items-center gap-2 text-[13px] text-ink-700">
                    <Truck className="size-3.5 text-ink-400" />
                    {zone}
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-[13px] text-ink-600">
                Доставка {money(supplier.deliveryFee)}, бесплатно от {money(supplier.freeDeliveryFrom)}.
              </p>
            </div>
          </div>
        )}

        {tab === 'contacts' && (
          <div className="grid gap-4 lg:grid-cols-2" id="contacts">
            <div className="card p-4">
              <h2 className="text-[15px]">Реквизиты</h2>
              <dl className="mt-2 divide-y divide-ink-100 text-[13px]">
                {[
                  ['Юридическое лицо', supplier.legalName],
                  ['ИНН', supplier.inn],
                  ['КПП', supplier.kpp],
                  ['Юридический адрес', supplier.address],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between gap-4 py-2">
                    <dt className="text-ink-500">{label}</dt>
                    <dd className="text-right font-medium text-ink-800">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div className="card p-4">
              <h2 className="text-[15px]">Контакты</h2>
              <dl className="mt-2 divide-y divide-ink-100 text-[13px]">
                {[
                  { key: 'manager', label: 'Менеджер', value: supplier.contacts.manager },
                  {
                    key: 'phone',
                    label: 'Телефон',
                    value: (
                      <a
                        href={`tel:${supplier.contacts.phone}`}
                        className="font-medium text-ink-800 hover:text-brand-600"
                      >
                        {supplier.contacts.phone}
                      </a>
                    ),
                  },
                  {
                    key: 'email',
                    label: 'Email',
                    value: (
                      <a
                        href={`mailto:${supplier.contacts.email}`}
                        className="font-medium text-ink-800 hover:text-brand-600"
                      >
                        {supplier.contacts.email}
                      </a>
                    ),
                  },
                  { key: 'site', label: 'Сайт', value: supplier.contacts.site },
                ].map((row) => (
                  <div key={row.key} className="flex justify-between gap-4 py-2">
                    <dt className="text-ink-500">{row.label}</dt>
                    <dd className="text-right font-medium text-ink-800">{row.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        )}

        {tab === 'reviews' && (
          <div className="space-y-3">
            {reviews.length === 0 ? (
              <EmptyState
                title="Отзывов пока нет"
                text="Станьте первым — оцените поставщика после приёмки поставки."
                action={<Button onClick={() => setReviewOpen(true)}>Оставить отзыв</Button>}
                compact
              />
            ) : (
              reviews.map((review) => (
                <div key={review.id} className="card p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-ink-900">{review.author}</p>
                      <p className="text-xs text-ink-500">{review.outlet}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Rating value={review.rating} showValue={false} />
                      <span className="text-xs text-ink-400">{dateFull(review.at)}</span>
                    </div>
                  </div>
                  <p className="mt-2 text-[13px] text-ink-700">{review.text}</p>
                </div>
              ))
            )}
          </div>
        )}

        {tab === 'history' && (
          <div className="card divide-y divide-ink-100">
            {orders.length === 0 ? (
              <EmptyState title="Заявок этому поставщику ещё не было" compact className="border-0" />
            ) : (
              orders.map((order) => (
                <Link
                  key={order.id}
                  to={`/orders/${order.id}`}
                  className="flex flex-wrap items-center gap-3 p-4 hover:bg-brand-50/40"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-brand-700">{order.number}</p>
                    <p className="text-xs text-ink-500">
                      от {dateFull(order.createdAt)} · {order.lines.length} позиций
                    </p>
                  </div>
                  <StatusBadge status={order.status} size="sm" />
                  <span className="text-sm font-semibold text-ink-900">
                    {money(order.lines.reduce((s, l) => s + l.price * l.qty, 0))}
                  </span>
                </Link>
              ))
            )}
          </div>
        )}
      </div>

      <Modal
        open={reviewOpen}
        onClose={() => setReviewOpen(false)}
        title="Отзыв о поставщике"
        description={supplier.name}
        footer={
          <>
            <Button variant="secondary" onClick={() => setReviewOpen(false)}>
              Отмена
            </Button>
            <Button onClick={submitReview}>Опубликовать</Button>
          </>
        }
      >
        <Field label="Оценка">
          <RatingInput value={reviewRating} onChange={setReviewRating} />
        </Field>
        <Field label="Комментарий" className="mt-3">
          <Textarea
            rows={4}
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            placeholder="Соблюдение окон доставки, качество, работа с расхождениями"
          />
        </Field>
      </Modal>
    </div>
  );
}
