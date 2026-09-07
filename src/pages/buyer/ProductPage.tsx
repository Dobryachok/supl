import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  BadgeCheck,
  ChevronRight,
  Clock,
  Heart,
  MessageSquare,
  Minus,
  Package,
  ShoppingCart,
  Snowflake,
  Truck,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button, LinkButton } from '@/components/ui/Button';
import { Field, Textarea } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import { ProductImage, SupplierLogo } from '@/components/ui/ProductImage';
import { QtyStepper } from '@/components/ui/QtyStepper';
import { Rating } from '@/components/ui/Rating';
import { Tabs } from '@/components/ui/Tabs';
import { ProductShelf } from '@/components/catalog/ProductGrid';
import { StockLabel } from '@/components/catalog/ProductCard';
import { deliveryDaysLabel } from '@/components/catalog/SupplierCard';
import { useToast } from '@/components/ui/Toast';
import { categoryById } from '@/data/categories';
import { tempModeLabel } from '@/data/products';
import { useCartActions } from '@/hooks/useCartActions';
import { useChatActions } from '@/hooks/useChatActions';
import { cn } from '@/lib/cn';
import { uid } from '@/lib/ids';
import {
  dateFull,
  money,
  paymentLabels,
  qty as formatQty,
  relativeDay,
  unitLabel,
} from '@/lib/format';
import { useAppState, useDispatch } from '@/store/AppContext';
import {
  alternativeOffers,
  discountPct,
  nextDeliveryDates,
  sortProducts,
} from '@/store/selectors';
import { NotFoundPage } from './NotFoundPage';

export function ProductPage() {
  const { id = '' } = useParams();
  const state = useAppState();
  const dispatch = useDispatch();
  const cart = useCartActions();
  const chat = useChatActions();
  const toast = useToast();
  const navigate = useNavigate();
  const [tab, setTab] = useState('description');
  const [askOpen, setAskOpen] = useState(false);
  const [question, setQuestion] = useState('');

  const product = state.products.find((p) => p.id === id);
  const [amount, setAmount] = useState(product?.minQty ?? 1);

  const alternatives = useMemo(
    () => (product ? alternativeOffers(state, product) : []),
    [state, product],
  );
  const similar = useMemo(() => {
    if (!product) return [];
    return sortProducts(
      state.products.filter(
        (p) => p.isActive && p.subcategoryId === product.subcategoryId && p.id !== product.id,
      ),
      'popular',
    ).slice(0, 5);
  }, [state, product]);

  if (!product) return <NotFoundPage />;

  const supplier = state.suppliers.find((s) => s.id === product.supplierId)!;
  const category = categoryById.get(product.categoryId);
  const subcategory = category?.subcategories.find((s) => s.id === product.subcategoryId);
  const isFavorite = state.favoriteProducts.includes(product.id);
  const discount = discountPct(product);
  const questions = state.questions.filter((q) => q.productId === product.id);
  const deliveryDates = nextDeliveryDates(supplier, 3);
  const inCart = state.cart.find((i) => i.productId === product.id);

  const submitQuestion = () => {
    if (!question.trim()) return;
    dispatch({
      type: 'questions/ask',
      question: {
        id: uid('q'),
        productId: product.id,
        author: state.session.buyerName,
        text: question.trim(),
        at: new Date().toISOString(),
      },
    });
    const threadId = chat.ensureThread({
      supplierId: supplier.id,
      productId: product.id,
      subject: `Вопрос по товару: ${product.name}`,
    });
    chat.send(threadId, question.trim(), 'buyer');
    setQuestion('');
    setAskOpen(false);
    toast.success('Вопрос отправлен', `${supplier.name} ответит в чате`);
  };

  return (
    <div className="page pt-5">
      <nav className="flex flex-wrap items-center gap-1.5 text-[13px] text-ink-500">
        <Link to="/" className="hover:text-brand-600">
          Главная
        </Link>
        <ChevronRight className="size-3.5" />
        <Link to="/catalog" className="hover:text-brand-600">
          Каталог
        </Link>
        {category && (
          <>
            <ChevronRight className="size-3.5" />
            <Link to={`/catalog/${category.slug}`} className="hover:text-brand-600">
              {category.name}
            </Link>
          </>
        )}
        {subcategory && category && (
          <>
            <ChevronRight className="size-3.5" />
            <Link
              to={`/catalog/${category.slug}?sub=${subcategory.slug}`}
              className="hover:text-brand-600"
            >
              {subcategory.name}
            </Link>
          </>
        )}
      </nav>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="max-w-3xl text-[26px] leading-tight">{product.name}</h1>
          <p className="mt-1.5 text-[13px] text-ink-500">
            Артикул {product.article} · {product.brand} · {product.country}
          </p>
        </div>
        <Button
          variant="secondary"
          icon={<Heart className={cn('size-4', isFavorite && 'fill-danger-500 text-danger-500')} />}
          onClick={() => cart.toggleFavorite(product, isFavorite)}
        >
          {isFavorite ? 'В избранном' : 'В избранное'}
        </Button>
      </div>

      <div className="mt-4 grid gap-5 lg:grid-cols-[minmax(0,420px)_1fr_300px]">
        <div>
          <div className="card p-3">
            <ProductImage product={product} className="aspect-square w-full" />
          </div>
          <div className="mt-2 flex gap-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="card size-20 p-1.5">
                <ProductImage product={product} className="size-full" />
              </div>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {discount > 0 && <Badge tone="danger">Скидка {discount}%</Badge>}
            {product.isNew && <Badge tone="success">Новинка</Badge>}
            <Badge tone={product.tempMode === 'frozen' ? 'progress' : 'neutral'} icon={<Snowflake className="size-3" />}>
              {tempModeLabel(product.tempMode)}
            </Badge>
            {product.tags.map((tag) => (
              <Badge key={tag} tone="info">
                {tag}
              </Badge>
            ))}
          </div>
        </div>

        <div className="min-w-0">
          <div className="card p-4">
            <div className="flex flex-wrap items-end gap-3">
              <span className="text-[30px] leading-none font-bold text-ink-900">
                {money(product.price)}
              </span>
              <span className="text-sm text-ink-500">за {unitLabel(product.unit)}</span>
              {product.oldPrice && (
                <span className="text-sm text-ink-400 line-through">{money(product.oldPrice)}</span>
              )}
              {discount > 0 && <Badge tone="danger">−{discount}%</Badge>}
            </div>

            <dl className="mt-4 grid gap-2 text-[13px] sm:grid-cols-2">
              <div className="flex items-center gap-2 text-ink-600">
                <Package className="size-4 text-ink-400" />
                Фасовка: {product.packSize}
              </div>
              <div className="flex items-center gap-2 text-ink-600">
                <Minus className="size-4 text-ink-400" />
                Кратность: {formatQty(product.step, product.unit)}
              </div>
              <div className="flex items-center gap-2 text-ink-600">
                <ShoppingCart className="size-4 text-ink-400" />
                Минимум: {formatQty(product.minQty, product.unit)}
              </div>
              <div className="flex items-center gap-2">
                <StockLabel product={product} />
              </div>
            </dl>

            <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-ink-100 pt-4">
              <QtyStepper
                value={amount}
                onChange={setAmount}
                unit={product.unit}
                min={product.minQty}
                step={product.step}
                max={product.stock || undefined}
              />
              <Button
                size="lg"
                disabled={product.stock <= 0}
                icon={<ShoppingCart className="size-4" />}
                onClick={() => cart.add(product, amount)}
              >
                {inCart ? 'Добавить ещё' : 'В корзину'}
              </Button>
              <div className="text-[13px] text-ink-500">
                Итого: <span className="font-semibold text-ink-900">{money(product.price * amount)}</span>
              </div>
              {inCart && (
                <Button variant="link" onClick={() => navigate('/cart')}>
                  В корзине {formatQty(inCart.qty, product.unit)} — перейти
                </Button>
              )}
            </div>
          </div>

          <div className="card mt-3 p-4">
            <Tabs
              value={tab}
              onChange={setTab}
              items={[
                { id: 'description', label: 'Описание' },
                { id: 'specs', label: 'Характеристики', count: product.specs.length },
                { id: 'delivery', label: 'Доставка и оплата' },
                { id: 'questions', label: 'Вопросы', count: questions.length },
              ]}
            />

            <div className="pt-4">
              {tab === 'description' && (
                <div className="space-y-3 text-sm text-ink-700">
                  <p>{product.description}</p>
                  <p className="text-[13px] text-ink-500">
                    Товар поставляется от {supplier.legalName}. Условия хранения:{' '}
                    {tempModeLabel(product.tempMode).toLowerCase()}. При заказе учитывайте
                    кратность отгрузки — поставщик собирает партии целыми упаковками.
                  </p>
                </div>
              )}

              {tab === 'specs' && (
                <dl className="divide-y divide-ink-100">
                  {product.specs.map((spec) => (
                    <div key={spec.label} className="flex justify-between gap-4 py-2 text-[13px]">
                      <dt className="text-ink-500">{spec.label}</dt>
                      <dd className="text-right font-medium text-ink-800">{spec.value}</dd>
                    </div>
                  ))}
                </dl>
              )}

              {tab === 'delivery' && (
                <div className="space-y-3 text-[13px] text-ink-700">
                  <p className="flex items-center gap-2">
                    <Truck className="size-4 text-ink-400" />
                    Доставка {deliveryDaysLabel(supplier)}, окна:{' '}
                    {supplier.deliveryWindows.join(', ')}
                  </p>
                  <p className="flex items-center gap-2">
                    <Clock className="size-4 text-ink-400" />
                    Сборка заявки — {supplier.leadTimeDays} дн. Ближайшие даты:{' '}
                    {deliveryDates.map((d) => dateFull(d)).join(', ')}
                  </p>
                  <p>
                    Доставка {money(supplier.deliveryFee)} и бесплатно от {money(supplier.freeDeliveryFrom)}.
                  </p>
                  <p>Способы оплаты: {supplier.paymentMethods.map((m) => paymentLabels[m]).join(', ')}.</p>
                  <p className="text-ink-500">Зоны доставки: {supplier.deliveryZones.join(' · ')}</p>
                </div>
              )}

              {tab === 'questions' && (
                <div className="space-y-3">
                  <Button variant="secondary" size="sm" onClick={() => setAskOpen(true)}>
                    Задать вопрос поставщику
                  </Button>
                  {questions.length === 0 ? (
                    <p className="text-[13px] text-ink-500">
                      Вопросов пока нет — спросите про сроки годности, нарезку или замену.
                    </p>
                  ) : (
                    questions.map((q) => (
                      <div key={q.id} className="rounded-lg bg-ink-50 p-3">
                        <p className="text-[13px] font-semibold text-ink-900">{q.author}</p>
                        <p className="mt-0.5 text-[13px] text-ink-700">{q.text}</p>
                        {q.answer ? (
                          <div className="mt-2 rounded-md border-l-2 border-brand-500 bg-white p-2.5">
                            <p className="text-[12px] font-semibold text-brand-700">
                              {supplier.name}
                            </p>
                            <p className="mt-0.5 text-[13px] text-ink-700">{q.answer}</p>
                          </div>
                        ) : (
                          <p className="mt-1.5 text-xs text-warn-600">Ожидает ответа поставщика</p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {alternatives.length > 0 && (
            <div className="card mt-3 p-4">
              <h2 className="text-[15px]">Другие предложения этого товара</h2>
              <p className="mt-0.5 text-[13px] text-ink-500">
                Сравните цену и условия у других поставщиков
              </p>
              <div className="mt-3 divide-y divide-ink-100">
                {alternatives.map((offer) => {
                  const offerSupplier = state.suppliers.find((s) => s.id === offer.supplierId)!;
                  const cheaper = offer.price < product.price;
                  return (
                    <div key={offer.id} className="flex flex-wrap items-center gap-3 py-3">
                      <SupplierLogo
                        name={offerSupplier.name}
                        hue={offerSupplier.hue}
                        className="size-10"
                      />
                      <div className="min-w-0 flex-1">
                        <Link
                          to={`/suppliers/${offerSupplier.id}`}
                          className="text-[13px] font-semibold text-ink-900 hover:text-brand-700"
                        >
                          {offerSupplier.name}
                        </Link>
                        <p className="text-xs text-ink-500">
                          {offer.packSize} · {offer.country}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[15px] font-bold text-ink-900">{money(offer.price)}</p>
                        <p
                          className={cn(
                            'text-xs',
                            cheaper ? 'text-success-600' : 'text-ink-400',
                          )}
                        >
                          {cheaper
                            ? `дешевле на ${money(product.price - offer.price)}`
                            : `дороже на ${money(offer.price - product.price)}`}
                        </p>
                      </div>
                      <LinkButton to={`/product/${offer.id}`} size="sm" variant="secondary">
                        Открыть
                      </LinkButton>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <aside className="lg:sticky-below-header">
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <SupplierLogo name={supplier.name} hue={supplier.hue} className="size-12" />
              <div className="min-w-0">
                <Link
                  to={`/suppliers/${supplier.id}`}
                  className="flex items-center gap-1 text-sm font-bold text-ink-900 hover:text-brand-700"
                >
                  <span className="truncate">{supplier.name}</span>
                  {supplier.verified && <BadgeCheck className="size-4 shrink-0 text-brand-600" />}
                </Link>
                <p className="text-xs text-ink-500">{supplier.city}</p>
              </div>
            </div>
            <Rating value={supplier.rating} count={supplier.reviewsCount} className="mt-2.5" />

            <dl className="mt-3 space-y-1.5 border-t border-ink-100 pt-3 text-[13px]">
              <div className="flex justify-between gap-2">
                <dt className="text-ink-500">Доставка</dt>
                <dd className="font-medium text-ink-800">{money(supplier.deliveryFee)}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-ink-500">Ближайшая дата</dt>
                <dd className="font-medium text-ink-800">
                  {deliveryDates[0] ? relativeDay(deliveryDates[0]) : '—'}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-ink-500">Оплата</dt>
                <dd className="text-right font-medium text-ink-800">
                  {supplier.paymentMethods.map((m) => paymentLabels[m]).join(', ')}
                </dd>
              </div>
            </dl>

            <div className="mt-3 flex flex-col gap-2">
              <Button
                variant="secondary"
                block
                icon={<MessageSquare className="size-4" />}
                onClick={() => {
                  const threadId = chat.ensureThread({
                    supplierId: supplier.id,
                    productId: product.id,
                    subject: `Вопрос по товару: ${product.name}`,
                  });
                  navigate(`/chats?thread=${threadId}`);
                }}
              >
                Написать поставщику
              </Button>
              <LinkButton to={`/suppliers/${supplier.id}`} variant="ghost" block>
                Все товары поставщика
              </LinkButton>
            </div>
          </div>
        </aside>
      </div>

      <ProductShelf title="Похожие товары" products={similar} />

      <Modal
        open={askOpen}
        onClose={() => setAskOpen(false)}
        title="Вопрос поставщику"
        description={`${supplier.name} · ${product.name}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setAskOpen(false)}>
              Отмена
            </Button>
            <Button onClick={submitQuestion} disabled={!question.trim()}>
              Отправить вопрос
            </Button>
          </>
        }
      >
        <Field label="Текст вопроса" hint="Ответ придёт в чат и появится в карточке товара">
          <Textarea
            rows={4}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Например: какой остаточный срок годности на момент поставки?"
          />
        </Field>
      </Modal>
    </div>
  );
}
