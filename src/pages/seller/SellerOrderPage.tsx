import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  CheckCircle2,
  ChevronLeft,
  ClipboardCheck,
  MapPin,
  PackageCheck,
  Truck,
  XCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Field, Select, Textarea } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import { QtyStepper } from '@/components/ui/QtyStepper';
import { TD, TH, THead, TR, Table } from '@/components/ui/Table';
import { Tabs } from '@/components/ui/Tabs';
import { useToast } from '@/components/ui/Toast';
import { ChatPanel } from '@/components/chat/ChatPanel';
import { DeliveryTracker } from '@/components/orders/DeliveryTracker';
import { StatusBadge } from '@/components/orders/StatusBadge';
import { useChatActions } from '@/hooks/useChatActions';
import {
  dateFull,
  dateTime,
  discrepancyLabels,
  money,
  qty as formatQty,
  relativeDay,
  verdictLabels,
} from '@/lib/format';
import { useAppState, useDispatch } from '@/store/AppContext';
import { nextDeliveryDates, orderTotals } from '@/store/selectors';
import type { OrderStatus } from '@/types';
import { NotFoundPage } from '../buyer/NotFoundPage';

export function SellerOrderPage() {
  const { id = '' } = useParams();
  const state = useAppState();
  const dispatch = useDispatch();
  const chat = useChatActions();
  const toast = useToast();
  const navigate = useNavigate();
  const [tab, setTab] = useState('composition');
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [editOpen, setEditOpen] = useState(false);

  const order = state.orders.find((o) => o.id === id);
  const [draftQty, setDraftQty] = useState<Record<string, number>>(() =>
    Object.fromEntries((order?.lines ?? []).map((line) => [line.id, line.qty])),
  );
  const [draftDate, setDraftDate] = useState(order?.deliveryDate ?? '');
  const [draftWindow, setDraftWindow] = useState(order?.deliveryWindow ?? '');

  if (!order) return <NotFoundPage />;

  const supplier = state.suppliers.find((s) => s.id === order.supplierId)!;
  const outlet = state.restaurant.outlets.find((o) => o.id === order.outletId);
  const totals = orderTotals(order);
  const act = state.acts.find((a) => a.id === order.actId);
  const thread = state.threads.find((t) => t.orderId === order.id);

  const advance = (status: OrderStatus, comment: string) => {
    dispatch({ type: 'orders/advance', orderId: order.id, status, actor: 'seller', comment });
    const threadId = chat.ensureThread({
      supplierId: order.supplierId,
      orderId: order.id,
      subject: `Заявка ${order.number}`,
    });
    chat.system(threadId, comment);
    toast.success('Статус обновлён', comment);
  };

  const applyChanges = () => {
    dispatch({
      type: 'orders/patch',
      orderId: order.id,
      patch: {
        deliveryDate: draftDate,
        deliveryWindow: draftWindow,
        lines: order.lines.map((line) => ({ ...line, qty: draftQty[line.id] ?? line.qty })),
      },
    });
    const threadId = chat.ensureThread({
      supplierId: order.supplierId,
      orderId: order.id,
      subject: `Заявка ${order.number}`,
    });
    chat.system(
      threadId,
      `Поставщик скорректировал заявку: доставка ${dateFull(draftDate)}, окно ${draftWindow}.`,
    );
    setEditOpen(false);
    toast.success('Заявка скорректирована', 'Ресторан увидит изменения в своей заявке');
  };

  return (
    <div>
      <button
        type="button"
        onClick={() => navigate('/seller/orders')}
        className="flex cursor-pointer items-center gap-1 text-[13px] text-ink-500 hover:text-brand-600"
      >
        <ChevronLeft className="size-4" />
        Все заявки
      </button>

      <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-[24px]">Заявка {order.number}</h1>
            <StatusBadge status={order.status} />
          </div>
          <p className="mt-1 text-[13px] text-ink-500">
            {state.restaurant.name} · создана {dateTime(order.createdAt)}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {order.status === 'sent' && (
            <>
              <Button
                icon={<CheckCircle2 className="size-4" />}
                onClick={() => advance('confirmed', 'Заявка подтверждена, машина назначена')}
              >
                Подтвердить заявку
              </Button>
              <Button variant="secondary" onClick={() => setEditOpen(true)}>
                Скорректировать
              </Button>
              <Button
                variant="ghost"
                className="text-danger-600"
                icon={<XCircle className="size-4" />}
                onClick={() => setRejectOpen(true)}
              >
                Отклонить
              </Button>
            </>
          )}
          {order.status === 'confirmed' && (
            <>
              <Button
                icon={<Truck className="size-4" />}
                onClick={() => advance('shipped', 'Машина вышла в рейс')}
              >
                Отметить «В пути»
              </Button>
              <Button variant="secondary" onClick={() => setEditOpen(true)}>
                Изменить дату
              </Button>
            </>
          )}
          {order.status === 'shipped' && (
            <Button
              variant="success"
              icon={<PackageCheck className="size-4" />}
              onClick={() => advance('delivered', 'Доставлено на склад ресторана')}
            >
              Отметить «Доставлено»
            </Button>
          )}
          {order.status === 'delivered' && (
            <Badge tone="progress">Ждём приёмку на складе ресторана</Badge>
          )}
        </div>
      </div>

      {act && (
        <div className="mt-4 rounded-xl border border-warn-100 bg-warn-50 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <ClipboardCheck className="size-5 text-warn-600" />
            <p className="text-sm font-bold text-warn-600">
              Акт {act.number} — {verdictLabels[act.verdict]}
            </p>
            <span className="text-[13px] text-ink-600">
              принимал {act.acceptedBy}, {dateFull(act.createdAt)}
            </span>
            <span className="ml-auto text-sm font-bold text-warn-600">
              −{money(act.discrepancyAmount)}
            </span>
          </div>
          <ul className="mt-2 space-y-1 text-[13px] text-ink-700">
            {act.lines
              .filter((line) => line.acceptedQty !== line.plannedQty || line.reason)
              .map((line) => (
                <li key={line.lineId}>
                  {line.productName}: план {formatQty(line.plannedQty, line.unit)} → принято{' '}
                  {formatQty(line.acceptedQty, line.unit)}
                  {line.reason ? ` · ${discrepancyLabels[line.reason]}` : ''}
                  {line.comment ? ` — ${line.comment}` : ''}
                </li>
              ))}
          </ul>
          {act.comment && <p className="mt-2 text-[13px] text-ink-600">{act.comment}</p>}
        </div>
      )}

      <DeliveryTracker order={order} className="mt-4" />

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_320px]">
        <div>
          <Tabs
            value={tab}
            onChange={(next) => {
              if (next === 'chat') {
                chat.ensureThread({
                  supplierId: order.supplierId,
                  orderId: order.id,
                  subject: `Заявка ${order.number}`,
                });
              }
              setTab(next);
            }}
            items={[
              { id: 'composition', label: 'Состав', count: order.lines.length },
              { id: 'chat', label: 'Чат с рестораном', count: thread?.messages.length ?? 0 },
            ]}
          />
          <div className="mt-4">
            {tab === 'composition' && (
              <div className="card overflow-hidden">
                <Table>
                  <THead>
                    <TR>
                      <TH>Позиция</TH>
                      <TH width="14%" align="right">
                        Цена
                      </TH>
                      <TH width="14%" align="right">
                        Заказано
                      </TH>
                      <TH width="14%" align="right">
                        Принято
                      </TH>
                      <TH width="14%" align="right">
                        Сумма
                      </TH>
                    </TR>
                  </THead>
                  <tbody>
                    {order.lines.map((line) => {
                      const product = state.products.find((p) => p.id === line.productId);
                      return (
                        <TR key={line.id}>
                          <TD>
                            <p className="text-[13px] font-medium text-ink-900">{line.name}</p>
                            <p className="text-xs text-ink-500">
                              арт. {line.article} · остаток{' '}
                              {product ? formatQty(product.stock, product.unit) : '—'}
                            </p>
                          </TD>
                          <TD align="right" className="text-[13px]">
                            {money(line.price)}
                          </TD>
                          <TD align="right" className="text-[13px] font-medium">
                            {formatQty(line.qty, line.unit)}
                          </TD>
                          <TD align="right" className="text-[13px]">
                            {line.factQty === undefined ? '—' : formatQty(line.factQty, line.unit)}
                          </TD>
                          <TD align="right" className="text-[13px] font-semibold">
                            {money(line.price * (line.factQty ?? line.qty))}
                          </TD>
                        </TR>
                      );
                    })}
                  </tbody>
                </Table>
                <div className="border-t border-ink-100 bg-ink-50 p-4 text-right">
                  <p className="text-[13px] text-ink-500">
                    Товары {money(totals.goods)} · доставка{' '}
                    {order.deliveryFee === 0 ? 'бесплатно' : money(order.deliveryFee)}
                  </p>
                  <p className="text-[19px] font-bold text-ink-900">{money(totals.factTotal)}</p>
                </div>
              </div>
            )}

            {tab === 'chat' && (
              <div className="card p-4">
                <ChatPanel threadId={thread?.id} role="seller" />
              </div>
            )}
          </div>
        </div>

        <aside className="space-y-3">
          <div className="card p-4">
            <h2 className="flex items-center gap-2 text-[15px]">
              <MapPin className="size-4 text-ink-400" />
              Доставка
            </h2>
            <dl className="mt-3 space-y-2 text-[13px]">
              <div>
                <dd className="font-medium text-ink-900">
                  {dateFull(order.deliveryDate)}, {order.deliveryWindow}
                </dd>
                <dd className="text-xs text-ink-500">{relativeDay(order.deliveryDate)}</dd>
              </div>
              <div>
                <dd className="flex items-center gap-1 font-medium text-ink-900">
                  <MapPin className="size-3.5 shrink-0 text-ink-400" />
                  {outlet?.name}
                </dd>
                <dd className="text-xs text-ink-500">{order.deliveryAddress}</dd>
              </div>
              <div>
                <dt className="text-ink-500">Контакт</dt>
                <dd className="text-ink-700">
                  {outlet?.contactName}, {outlet?.phone}
                </dd>
              </div>
              {order.comment && (
                <div>
                  <dt className="text-ink-500">Комментарий заказчика</dt>
                  <dd className="text-ink-700">{order.comment}</dd>
                </div>
              )}
            </dl>
          </div>

          <div className="card p-4">
            <h2 className="text-[15px]">Заказчик</h2>
            <p className="mt-2 text-[13px] font-medium text-ink-900">{state.restaurant.legalName}</p>
            <p className="text-xs text-ink-500">
              ИНН {state.restaurant.inn} · {state.restaurant.phone}
            </p>
            <Link
              to="/seller/chats"
              className="mt-2 inline-block text-[13px] font-medium text-brand-600 hover:underline"
            >
              Все переписки с рестораном
            </Link>
          </div>
        </aside>
      </div>

      <Modal
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        title="Отклонить заявку"
        description={`${order.number} · ${state.restaurant.name}`}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setRejectOpen(false)}>
              Отмена
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                advance(
                  'rejected',
                  rejectReason.trim() || 'Заявка отклонена поставщиком',
                );
                setRejectOpen(false);
              }}
            >
              Отклонить
            </Button>
          </>
        }
      >
        <Field label="Причина отказа" hint="Ресторан увидит её в заявке и чате">
          <Textarea
            rows={3}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Например: позиция распродана, ближайшая партия через 4 дня"
          />
        </Field>
      </Modal>

      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Корректировка заявки"
        description="Изменения увидит ресторан в своей заявке и чате"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditOpen(false)}>
              Отмена
            </Button>
            <Button onClick={applyChanges}>Сохранить изменения</Button>
          </>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Дата доставки">
            <Select value={draftDate} onChange={(e) => setDraftDate(e.target.value)}>
              {[order.deliveryDate, ...nextDeliveryDates(supplier, 6)]
                .filter((v, i, arr) => arr.indexOf(v) === i)
                .map((date) => (
                  <option key={date} value={date}>
                    {dateFull(date)} ({relativeDay(date)})
                  </option>
                ))}
            </Select>
          </Field>
          <Field label="Окно доставки">
            <Select value={draftWindow} onChange={(e) => setDraftWindow(e.target.value)}>
              {supplier.deliveryWindows.map((window) => (
                <option key={window} value={window}>
                  {window}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <p className="mt-4 mb-2 text-[13px] font-semibold text-ink-900">Количество по позициям</p>
        <ul className="divide-y divide-ink-100">
          {order.lines.map((line) => {
            const product = state.products.find((p) => p.id === line.productId);
            return (
              <li key={line.id} className="flex flex-wrap items-center gap-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] text-ink-800">{line.name}</p>
                  <p className="text-xs text-ink-500">
                    остаток {product ? formatQty(product.stock, product.unit) : '—'}
                  </p>
                </div>
                <QtyStepper
                  value={draftQty[line.id] ?? line.qty}
                  onChange={(next) => setDraftQty((prev) => ({ ...prev, [line.id]: next }))}
                  unit={line.unit}
                  min={0}
                  size="sm"
                />
              </li>
            );
          })}
        </ul>
      </Modal>
    </div>
  );
}
