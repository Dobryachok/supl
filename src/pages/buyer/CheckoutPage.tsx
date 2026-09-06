import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, ChevronLeft, CreditCard, MapPin, Truck } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button, LinkButton } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Field, Radio, Select, Textarea } from '@/components/ui/Field';
import { SupplierLogo } from '@/components/ui/ProductImage';
import { useToast } from '@/components/ui/Toast';
import { useChatActions } from '@/hooks/useChatActions';
import { orderNumber, uid } from '@/lib/ids';
import { dateFull, money, paymentLabels, relativeDay, weekday, withCount } from '@/lib/format';
import { useAppState, useDispatch } from '@/store/AppContext';
import { cartGroups, nextDeliveryDates } from '@/store/selectors';
import type { CartGroup } from '@/store/selectors';
import type { Order, PaymentMethod } from '@/types';

interface GroupForm {
  date: string;
  window: string;
  payment: PaymentMethod;
  comment: string;
}

export function CheckoutPage() {
  const [searchParams] = useSearchParams();
  const state = useAppState();
  const dispatch = useDispatch();
  const chat = useChatActions();
  const toast = useToast();
  const navigate = useNavigate();

  const requested = (searchParams.get('suppliers') ?? '').split(',').filter(Boolean);
  const allGroups = useMemo(() => cartGroups(state), [state]);
  const groups = useMemo(
    () =>
      allGroups.filter(
        (g) => requested.length === 0 || requested.includes(g.supplier.id),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allGroups, searchParams],
  );

  const [outletId, setOutletId] = useState(
    state.restaurant.outlets.find((o) => o.isDefault)?.id ?? state.restaurant.outlets[0]?.id ?? '',
  );
  const [forms, setForms] = useState<Record<string, GroupForm>>(() =>
    Object.fromEntries(
      groups.map((group) => [
        group.supplier.id,
        {
          date: nextDeliveryDates(group.supplier, 1)[0] ?? group.nearestDelivery,
          window: group.supplier.deliveryWindows[0],
          payment: group.supplier.paymentMethods[0],
          comment: '',
        } satisfies GroupForm,
      ]),
    ),
  );
  const [created, setCreated] = useState<Order[] | null>(null);

  const outlet = state.restaurant.outlets.find((o) => o.id === outletId);
  const goodsTotal = groups.reduce((sum, g) => sum + g.goodsTotal, 0);
  const deliveryTotal = groups.reduce((sum, g) => sum + g.deliveryFee, 0);

  const patchForm = (supplierId: string, part: Partial<GroupForm>) =>
    setForms((prev) => ({ ...prev, [supplierId]: { ...prev[supplierId], ...part } }));

  const buildOrder = (group: CartGroup): Order => {
    const form = forms[group.supplier.id];
    const now = new Date().toISOString();
    const id = uid('ord');
    return {
      id,
      number: orderNumber(),
      supplierId: group.supplier.id,
      supplierName: group.supplier.name,
      outletId,
      status: 'sent',
      createdAt: now,
      updatedAt: now,
      lines: group.lines.map((line, index) => ({
        id: `${id}-ln-${index}`,
        productId: line.product.id,
        name: line.product.name,
        article: line.product.article,
        unit: line.product.unit,
        packSize: line.product.packSize,
        price: line.product.price,
        qty: line.qty,
      })),
      deliveryDate: form.date,
      deliveryWindow: form.window,
      deliveryAddress: outlet?.address ?? '',
      paymentMethod: form.payment,
      comment: form.comment.trim() || undefined,
      deliveryFee: group.deliveryFee,
      timeline: [
        { id: uid('ev'), status: 'draft', at: now, actor: 'buyer' },
        { id: uid('ev'), status: 'sent', at: now, actor: 'buyer', comment: 'Заявка отправлена поставщику' },
      ],
    };
  };

  const submit = () => {
    const orders = groups.map(buildOrder);
    dispatch({ type: 'orders/create', orders });
    dispatch({
      type: 'cart/removeSupplier',
      productIds: groups.flatMap((g) => g.lines.map((l) => l.product.id)),
    });

    for (const order of orders) {
      const threadId = chat.ensureThread({
        supplierId: order.supplierId,
        orderId: order.id,
        subject: `Заявка ${order.number}`,
      });
      chat.system(
        threadId,
        `Заявка ${order.number} отправлена: ${order.lines.length} позиций, доставка ${dateFull(
          order.deliveryDate,
        )} в окно ${order.deliveryWindow}.`,
      );
      if (order.comment) chat.send(threadId, order.comment, 'buyer');
    }

    setCreated(orders);
    toast.success(
      orders.length > 1 ? `Создано ${orders.length} заявки` : 'Заявка отправлена',
      'Поставщики увидят её в своём кабинете',
    );
    window.scrollTo({ top: 0 });
  };

  if (created) {
    return (
      <div className="page pt-6">
        <div className="card mx-auto max-w-2xl p-6 text-center">
          <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-success-50 text-success-600">
            <CheckCircle2 className="size-7" />
          </span>
          <h1 className="mt-4 text-[24px]">
            {created.length > 1 ? `${created.length} заявки отправлены` : 'Заявка отправлена'}
          </h1>
          <p className="mt-1.5 text-sm text-ink-500">
            Поставщики подтвердят состав и назначат машину. Статусы отслеживайте в операционном
            контуре.
          </p>
          <ul className="mt-5 divide-y divide-ink-100 text-left">
            {created.map((order) => (
              <li key={order.id} className="flex flex-wrap items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <Link
                    to={`/orders/${order.id}`}
                    className="text-sm font-semibold text-brand-700 hover:underline"
                  >
                    {order.number}
                  </Link>
                  <p className="text-xs text-ink-500">
                    {order.supplierName} · доставка {dateFull(order.deliveryDate)},{' '}
                    {order.deliveryWindow}
                  </p>
                </div>
                <Badge tone="info">Отправлена</Badge>
                <span className="text-sm font-semibold text-ink-900">
                  {money(order.lines.reduce((s, l) => s + l.price * l.qty, 0) + order.deliveryFee)}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <LinkButton to="/orders">Открыть мои заказы</LinkButton>
            <LinkButton to="/catalog" variant="secondary">
              Продолжить закупку
            </LinkButton>
          </div>
        </div>
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="page pt-6">
        <EmptyState
          title="Нечего оформлять"
          text="Группы поставщиков не выбраны или корзина пуста."
          action={<LinkButton to="/cart">Вернуться в корзину</LinkButton>}
        />
      </div>
    );
  }

  return (
    <div className="page pt-5">
      <button
        type="button"
        onClick={() => navigate('/cart')}
        className="flex cursor-pointer items-center gap-1 text-[13px] text-ink-500 hover:text-brand-600"
      >
        <ChevronLeft className="size-4" />
        Вернуться в корзину
      </button>

      <h1 className="mt-2 text-[26px]">Оформление заявок</h1>
      <p className="mt-1 text-[13px] text-ink-500">
        {withCount(groups.length, 'заявка', 'заявки', 'заявок')} — по одной на каждого поставщика
      </p>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          <section className="card p-4">
            <h2 className="flex items-center gap-2 text-[15px]">
              <MapPin className="size-4 text-ink-400" />
              Точка доставки
            </h2>
            <div className="mt-3 space-y-2">
              {state.restaurant.outlets.map((item) => (
                <Radio
                  key={item.id}
                  name="outlet"
                  checked={outletId === item.id}
                  onChange={() => setOutletId(item.id)}
                  label={item.name}
                  description={`${item.address} · ${item.contactName}, ${item.phone}`}
                />
              ))}
            </div>
            <Link
              to="/profile"
              className="mt-2 inline-block text-[13px] font-medium text-brand-600 hover:underline"
            >
              Управлять точками и складами
            </Link>
          </section>

          {groups.map((group) => {
            const form = forms[group.supplier.id];
            const dates = nextDeliveryDates(group.supplier, 6);
            return (
              <section key={group.supplier.id} className="card p-4">
                <header className="flex flex-wrap items-center gap-3">
                  <SupplierLogo
                    name={group.supplier.name}
                    hue={group.supplier.hue}
                    className="size-10"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-ink-900">{group.supplier.name}</p>
                    <p className="text-xs text-ink-500">
                      {withCount(group.lines.length, 'позиция', 'позиции', 'позиций')} ·{' '}
                      {money(group.goodsTotal)}
                      {group.deliveryFee > 0
                        ? ` + доставка ${money(group.deliveryFee)}`
                        : ' · доставка бесплатно'}
                    </p>
                  </div>
                </header>

                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <Field label="Дата доставки" required>
                    <Select
                      value={form.date}
                      onChange={(e) => patchForm(group.supplier.id, { date: e.target.value })}
                    >
                      {dates.map((date) => (
                        <option key={date} value={date}>
                          {dateFull(date)} ({weekday(date)}, {relativeDay(date)})
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Окно доставки" required>
                    <Select
                      value={form.window}
                      onChange={(e) => patchForm(group.supplier.id, { window: e.target.value })}
                    >
                      {group.supplier.deliveryWindows.map((window) => (
                        <option key={window} value={window}>
                          {window}
                        </option>
                      ))}
                    </Select>
                  </Field>
                </div>

                <Field label="Способ оплаты" className="mt-3">
                  <div className="grid gap-2 sm:grid-cols-3">
                    {group.supplier.paymentMethods.map((method) => (
                      <Radio
                        key={method}
                        name={`payment-${group.supplier.id}`}
                        checked={form.payment === method}
                        onChange={() => patchForm(group.supplier.id, { payment: method })}
                        label={paymentLabels[method]}
                        description={
                          method === 'credit'
                            ? 'до 21 дня'
                            : method === 'invoice'
                              ? 'счёт-фактура'
                              : 'оплата при заказе'
                        }
                      />
                    ))}
                  </div>
                </Field>

                <Field label="Комментарий поставщику" className="mt-3">
                  <Textarea
                    rows={2}
                    value={form.comment}
                    onChange={(e) => patchForm(group.supplier.id, { comment: e.target.value })}
                    placeholder="Например: разгрузка через док 4, звонить кладовщику за час"
                  />
                </Field>

                <ul className="mt-3 divide-y divide-ink-100 border-t border-ink-100 pt-2">
                  {group.lines.map((line) => (
                    <li
                      key={line.product.id}
                      className="flex items-center justify-between gap-3 py-2 text-[13px]"
                    >
                      <span className="min-w-0 flex-1 truncate text-ink-700">
                        {line.product.name}
                      </span>
                      <span className="shrink-0 text-ink-500">
                        {line.qty} × {money(line.product.price)}
                      </span>
                      <span className="w-24 shrink-0 text-right font-semibold text-ink-900">
                        {money(line.total)}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="card p-4">
            <h2 className="text-[15px]">Итого</h2>
            <dl className="mt-3 space-y-2 text-[13px]">
              <div className="flex justify-between gap-2">
                <dt className="text-ink-500">Заявок</dt>
                <dd className="font-medium text-ink-900">{groups.length}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-ink-500">Товары</dt>
                <dd className="font-medium text-ink-900">{money(goodsTotal)}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-ink-500">Доставка</dt>
                <dd className="font-medium text-ink-900">
                  {deliveryTotal === 0 ? 'бесплатно' : money(deliveryTotal)}
                </dd>
              </div>
            </dl>
            <div className="mt-3 flex items-baseline justify-between border-t border-ink-100 pt-3">
              <span className="text-sm font-semibold text-ink-900">К оплате</span>
              <span className="text-[22px] font-bold text-ink-900">
                {money(goodsTotal + deliveryTotal)}
              </span>
            </div>
            <Button block size="lg" className="mt-3" onClick={submit}>
              Отправить {groups.length > 1 ? `${groups.length} заявки` : 'заявку'}
            </Button>
            <ul className="mt-3 space-y-1.5 text-xs text-ink-500">
              <li className="flex items-center gap-1.5">
                <Truck className="size-3.5" />
                Поставщик подтвердит состав и дату
              </li>
              <li className="flex items-center gap-1.5">
                <CreditCard className="size-3.5" />
                Счёт придёт в чат заявки
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
