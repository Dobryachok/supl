import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  BookmarkPlus,
  ChevronLeft,
  ClipboardCheck,
  Download,
  FileText,
  MapPin,
  MessageSquare,
  PackageCheck,
  RotateCcw,
  Truck,
  XCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button, LinkButton } from '@/components/ui/Button';
import { Field, Input, Select, Textarea } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import { SupplierLogo } from '@/components/ui/ProductImage';
import { TD, TH, THead, TR, Table } from '@/components/ui/Table';
import { Tabs } from '@/components/ui/Tabs';
import { useToast } from '@/components/ui/Toast';
import { ChatPanel } from '@/components/chat/ChatPanel';
import { DeliveryTracker } from '@/components/orders/DeliveryTracker';
import { StatusBadge } from '@/components/orders/StatusBadge';
import { useCartActions } from '@/hooks/useCartActions';
import { useChatActions } from '@/hooks/useChatActions';
import { MarkDeliveredButton } from '@/components/orders/MarkDeliveredButton';
import { uid } from '@/lib/ids';
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
import { isOverdue, nextDeliveryDates, orderTotals } from '@/store/selectors';
import { NotFoundPage } from './NotFoundPage';

export function OrderPage() {
  const { id = '' } = useParams();
  const state = useAppState();
  const dispatch = useDispatch();
  const cart = useCartActions();
  const chat = useChatActions();
  const toast = useToast();
  const navigate = useNavigate();
  const [tab, setTab] = useState('composition');
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [templateOpen, setTemplateOpen] = useState(false);
  const [templateName, setTemplateName] = useState('');

  const order = state.orders.find((o) => o.id === id);
  const [newDate, setNewDate] = useState(order?.deliveryDate ?? '');
  const [newWindow, setNewWindow] = useState(order?.deliveryWindow ?? '');

  if (!order) return <NotFoundPage />;

  const supplier = state.suppliers.find((s) => s.id === order.supplierId)!;
  const outlet = state.restaurant.outlets.find((o) => o.id === order.outletId);
  const totals = orderTotals(order);
  const act = state.acts.find((a) => a.id === order.actId);
  const thread = state.threads.find((t) => t.orderId === order.id);
  const overdue = isOverdue(order);
  const canCancel = ['draft', 'sent', 'confirmed'].includes(order.status);
  const canMarkDelivered = order.status === 'shipped';
  const canAccept = order.status === 'delivered';

  const openChat = () => {
    chat.ensureThread({
      supplierId: order.supplierId,
      orderId: order.id,
      subject: `Заявка ${order.number}`,
    });
    setTab('chat');
  };

  const cancelOrder = () => {
    dispatch({
      type: 'orders/advance',
      orderId: order.id,
      status: 'cancelled',
      actor: 'buyer',
      comment: cancelReason.trim() || 'Отменено рестораном',
    });
    if (thread) chat.system(thread.id, `Заявка отменена рестораном. ${cancelReason.trim()}`);
    setCancelOpen(false);
    toast.info('Заявка отменена', order.number);
  };

  const repeatOrder = () => {
    cart.addMany(
      order.lines.map((line) => ({ productId: line.productId, qty: line.qty })),
      `${order.lines.length} позиций из заявки ${order.number}`,
    );
    navigate('/cart');
  };

  const saveTemplate = () => {
    dispatch({
      type: 'templates/create',
      template: {
        id: uid('tpl'),
        name: templateName.trim() || `Повтор ${order.number}`,
        createdAt: new Date().toISOString(),
        items: order.lines.map((line) => ({ productId: line.productId, qty: line.qty })),
      },
    });
    setTemplateOpen(false);
    toast.success('Шаблон создан', 'Раздел «Избранное и шаблоны»');
  };

  const reschedule = () => {
    dispatch({
      type: 'orders/patch',
      orderId: order.id,
      patch: { deliveryDate: newDate, deliveryWindow: newWindow },
    });
    if (thread)
      chat.system(
        thread.id,
        `Ресторан просит перенести доставку на ${dateFull(newDate)}, окно ${newWindow}.`,
      );
    setRescheduleOpen(false);
    toast.success('Дата обновлена', `${dateFull(newDate)}, ${newWindow}`);
  };

  const sendDocument = () => {
    toast.info('Документ формируется', 'В демо-режиме печатная форма не выгружается');
  };

  return (
    <div className="page pt-5">
      <button
        type="button"
        onClick={() => navigate('/orders')}
        className="flex cursor-pointer items-center gap-1 text-[13px] text-ink-500 hover:text-brand-600"
      >
        <ChevronLeft className="size-4" />
        Все заявки
      </button>

      <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-[26px]">Заявка {order.number}</h1>
            <StatusBadge status={order.status} />
            {overdue && (
              <Badge tone="danger" icon={<AlertTriangle className="size-3.5" />}>
                Просрочена
              </Badge>
            )}
          </div>
          <p className="mt-1 text-[13px] text-ink-500">
            Создана {dateTime(order.createdAt)} · обновлена {dateTime(order.updatedAt)}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {canMarkDelivered && (
            <MarkDeliveredButton order={order} label="Отметить «Доставлено»" />
          )}
          {canAccept && (
            <LinkButton
              to={`/orders/${order.id}/acceptance`}
              icon={<PackageCheck className="size-4" />}
            >
              Принять поставку
            </LinkButton>
          )}
          <Button
            variant="secondary"
            icon={<MessageSquare className="size-4" />}
            onClick={openChat}
          >
            Чат с поставщиком
          </Button>
          <Button variant="secondary" icon={<RotateCcw className="size-4" />} onClick={repeatOrder}>
            Повторить
          </Button>
          <Button
            variant="ghost"
            icon={<BookmarkPlus className="size-4" />}
            onClick={() => setTemplateOpen(true)}
          >
            В шаблон
          </Button>
          {canCancel && (
            <Button
              variant="ghost"
              className="text-danger-600"
              icon={<XCircle className="size-4" />}
              onClick={() => setCancelOpen(true)}
            >
              Отменить
            </Button>
          )}
        </div>
      </div>

      {order.status === 'rejected' && order.rejectReason && (
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-danger-100 bg-danger-50 p-4 text-[13px] text-danger-600">
          <XCircle className="mt-0.5 size-4 shrink-0" />
          <span>
            <strong>Поставщик отклонил заявку.</strong> {order.rejectReason} Подберите замену в
            каталоге или напишите в чат.
          </span>
        </div>
      )}

      {canAccept && (
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-brand-100 bg-brand-50 p-4">
          <PackageCheck className="size-5 text-brand-600" />
          <p className="flex-1 text-[13px] text-brand-800">
            Поставка доставлена {relativeDay(order.deliveryDate)}. Проведите приёмку: сверьте
            количество, зафиксируйте недовоз или брак.
          </p>
          <LinkButton to={`/orders/${order.id}/acceptance`} size="sm">
            Открыть приёмку
          </LinkButton>
        </div>
      )}

      <DeliveryTracker order={order} className="mt-4" />

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_340px]">
        <div>
          <Tabs
            value={tab}
            onChange={setTab}
            items={[
              { id: 'composition', label: 'Состав', count: order.lines.length },
              { id: 'chat', label: 'Чат', count: thread?.messages.length ?? 0 },
              { id: 'documents', label: 'Документы' },
            ]}
          />

          <div className="mt-4">
            {tab === 'composition' && (
              <div className="card overflow-hidden">
                <Table>
                  <THead>
                    <TR>
                      <TH>Позиция</TH>
                      <TH width="12%" align="right">
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
                      const fact = line.factQty;
                      const short = fact !== undefined && fact < line.qty;
                      return (
                        <TR key={line.id}>
                          <TD>
                            <Link
                              to={`/product/${line.productId}`}
                              className="text-[13px] font-medium text-ink-900 hover:text-brand-700"
                            >
                              {line.name}
                            </Link>
                            <p className="text-xs text-ink-500">
                              {line.packSize} · арт. {line.article}
                            </p>
                            {line.reason && (
                              <p className="mt-1 text-xs text-warn-600">
                                {discrepancyLabels[line.reason]}
                                {line.reasonComment ? `: ${line.reasonComment}` : ''}
                              </p>
                            )}
                          </TD>
                          <TD align="right" className="text-[13px] text-ink-700">
                            {money(line.price)}
                          </TD>
                          <TD align="right" className="text-[13px] font-medium text-ink-900">
                            {formatQty(line.qty, line.unit)}
                          </TD>
                          <TD align="right">
                            {fact === undefined ? (
                              <span className="text-[13px] text-ink-400">—</span>
                            ) : (
                              <span
                                className={
                                  short
                                    ? 'text-[13px] font-semibold text-warn-600'
                                    : 'text-[13px] font-semibold text-success-600'
                                }
                              >
                                {formatQty(fact, line.unit)}
                              </span>
                            )}
                          </TD>
                          <TD align="right" className="text-[13px] font-semibold text-ink-900">
                            {money(line.price * (fact ?? line.qty))}
                          </TD>
                        </TR>
                      );
                    })}
                  </tbody>
                </Table>
                <div className="border-t border-ink-100 bg-ink-50 p-4">
                  <dl className="ml-auto max-w-xs space-y-1.5 text-[13px]">
                    <div className="flex justify-between gap-4">
                      <dt className="text-ink-500">Товары по заявке</dt>
                      <dd className="font-medium text-ink-900">{money(totals.goods)}</dd>
                    </div>
                    {totals.discrepancy > 0 && (
                      <div className="flex justify-between gap-4 text-warn-600">
                        <dt>Расхождение при приёмке</dt>
                        <dd className="font-medium">−{money(totals.discrepancy)}</dd>
                      </div>
                    )}
                    <div className="flex justify-between gap-4">
                      <dt className="text-ink-500">Доставка</dt>
                      <dd className="font-medium text-ink-900">
                        {order.deliveryFee === 0 ? 'бесплатно' : money(order.deliveryFee)}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-4 border-t border-ink-200 pt-1.5">
                      <dt className="font-semibold text-ink-900">Итого к оплате</dt>
                      <dd className="text-[17px] font-bold text-ink-900">
                        {money(totals.factTotal)}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
            )}

            {tab === 'chat' && (
              <div className="card p-4">
                <ChatPanel threadId={thread?.id} role="buyer" />
              </div>
            )}

            {tab === 'documents' && (
              <div className="card divide-y divide-ink-100">
                {[
                  { label: `Заявка ${order.number}`, hint: 'печатная форма заявки' },
                  { label: 'Счёт на оплату', hint: 'счёт-фактура' },
                  ...(act
                    ? [{ label: `Акт расхождений ${act.number}`, hint: verdictLabels[act.verdict] }]
                    : []),
                ].map((doc) => (
                  <div key={doc.label} className="flex items-center gap-3 p-4">
                    <FileText className="size-5 text-ink-400" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-medium text-ink-900">{doc.label}</p>
                      <p className="text-xs text-ink-500">{doc.hint}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="secondary"
                      icon={<Download className="size-3.5" />}
                      onClick={sendDocument}
                    >
                      Скачать
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <aside className="space-y-3">
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <SupplierLogo name={supplier.name} hue={supplier.hue} className="size-11" />
              <div className="min-w-0">
                <Link
                  to={`/suppliers/${supplier.id}`}
                  className="text-sm font-bold text-ink-900 hover:text-brand-700"
                >
                  {supplier.name}
                </Link>
                <p className="text-xs text-ink-500">{supplier.contacts.manager}</p>
              </div>
            </div>
            <dl className="mt-3 space-y-2 border-t border-ink-100 pt-3 text-[13px]">
              <div>
                <dt className="text-ink-500">Телефон</dt>
                <dd className="font-medium text-ink-900">{supplier.contacts.phone}</dd>
              </div>
            </dl>
          </div>

          <div className="card p-4">
            <h2 className="flex items-center gap-2 text-[15px]">
              <Truck className="size-4 text-ink-400" />
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
              {order.comment && (
                <div>
                  <dt className="text-ink-500">Комментарий</dt>
                  <dd className="text-ink-700">{order.comment}</dd>
                </div>
              )}
            </dl>
            {['sent', 'confirmed'].includes(order.status) && (
              <Button
                variant="secondary"
                size="sm"
                block
                className="mt-3"
                onClick={() => setRescheduleOpen(true)}
              >
                Перенести доставку
              </Button>
            )}
          </div>

          {act && (
            <div className="card p-4">
              <h2 className="flex items-center gap-2 text-[15px]">
                <ClipboardCheck className="size-4 text-warn-500" />
                Акт {act.number}
              </h2>
              <p className="mt-1 text-xs text-ink-500">
                {dateFull(act.createdAt)} · {act.acceptedBy}
              </p>
              <dl className="mt-3 space-y-1.5 text-[13px]">
                <div className="flex justify-between gap-2">
                  <dt className="text-ink-500">Принято</dt>
                  <dd className="font-medium text-ink-900">{money(act.acceptedAmount)}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-ink-500">Расхождение</dt>
                  <dd className="font-medium text-warn-600">{money(act.discrepancyAmount)}</dd>
                </div>
              </dl>
              {act.comment && <p className="mt-2 text-[13px] text-ink-600">{act.comment}</p>}
            </div>
          )}
        </aside>
      </div>

      <Modal
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        title="Отменить заявку"
        description={`${order.number} · ${supplier.name}`}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCancelOpen(false)}>
              Не отменять
            </Button>
            <Button variant="danger" onClick={cancelOrder}>
              Отменить заявку
            </Button>
          </>
        }
      >
        <Field label="Причина отмены" hint="Поставщик увидит её в чате заявки">
          <Textarea
            rows={3}
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder="Например: меню изменилось, позиция больше не нужна"
          />
        </Field>
      </Modal>

      <Modal
        open={rescheduleOpen}
        onClose={() => setRescheduleOpen(false)}
        title="Перенести доставку"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setRescheduleOpen(false)}>
              Отмена
            </Button>
            <Button onClick={reschedule}>Сохранить</Button>
          </>
        }
      >
        <Field label="Новая дата">
          <Select value={newDate} onChange={(e) => setNewDate(e.target.value)}>
            {nextDeliveryDates(supplier, 8).map((date) => (
              <option key={date} value={date}>
                {dateFull(date)} ({relativeDay(date)})
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Окно доставки" className="mt-3">
          <Select value={newWindow} onChange={(e) => setNewWindow(e.target.value)}>
            {supplier.deliveryWindows.map((window) => (
              <option key={window} value={window}>
                {window}
              </option>
            ))}
          </Select>
        </Field>
      </Modal>

      <Modal
        open={templateOpen}
        onClose={() => setTemplateOpen(false)}
        title="Сохранить состав как шаблон"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setTemplateOpen(false)}>
              Отмена
            </Button>
            <Button onClick={saveTemplate}>Сохранить</Button>
          </>
        }
      >
        <Field label="Название шаблона">
          <Input
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            placeholder={`Повтор ${order.number}`}
          />
        </Field>
      </Modal>
    </div>
  );
}
