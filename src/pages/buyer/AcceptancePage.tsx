import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  Camera,
  Check,
  CheckCircle2,
  ChevronLeft,
  ClipboardCheck,
  ThumbsDown,
  Trash2,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Field, Input, Select, Textarea } from '@/components/ui/Field';
import { FileDrop, readFileAsDataUrl } from '@/components/ui/FileDrop';
import { Modal } from '@/components/ui/Modal';
import { QtyStepper } from '@/components/ui/QtyStepper';
import { SupplierLogo } from '@/components/ui/ProductImage';
import { useToast } from '@/components/ui/Toast';
import { useChatActions } from '@/hooks/useChatActions';
import { cn } from '@/lib/cn';
import { actNumber, uid } from '@/lib/ids';
import {
  dateFull,
  discrepancyLabels,
  money,
  qty as formatQty,
  unitLabel,
  verdictLabels,
} from '@/lib/format';
import { useAppState, useDispatch } from '@/store/AppContext';
import type { AcceptanceAct, AcceptanceVerdict, DiscrepancyReason } from '@/types';
import { NotFoundPage } from './NotFoundPage';

interface LineForm {
  acceptedQty: number;
  reason?: DiscrepancyReason;
  comment: string;
  photos: string[];
}

const reasons: DiscrepancyReason[] = ['shortage', 'defect', 'expired', 'wrong_item', 'excess'];

export function AcceptancePage() {
  const { id = '' } = useParams();
  const state = useAppState();
  const dispatch = useDispatch();
  const chat = useChatActions();
  const toast = useToast();
  const navigate = useNavigate();

  const order = state.orders.find((o) => o.id === id);
  const [forms, setForms] = useState<Record<string, LineForm>>(() =>
    Object.fromEntries(
      (order?.lines ?? []).map((line) => [
        line.id,
        { acceptedQty: line.qty, comment: '', photos: [] } satisfies LineForm,
      ]),
    ),
  );
  const [acceptedBy, setAcceptedBy] = useState(
    state.restaurant.employees.find((e) => e.position === 'Кладовщик')?.name ?? state.session.buyerName,
  );
  const [comment, setComment] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [refuseOpen, setRefuseOpen] = useState(false);
  const [photoLine, setPhotoLine] = useState<string | null>(null);

  const totals = useMemo(() => {
    if (!order) return { planned: 0, accepted: 0, discrepancy: 0, issues: 0 };
    const planned = order.lines.reduce((sum, l) => sum + l.price * l.qty, 0);
    const accepted = order.lines.reduce(
      (sum, l) => sum + l.price * (forms[l.id]?.acceptedQty ?? l.qty),
      0,
    );
    const issues = order.lines.filter(
      (l) => (forms[l.id]?.acceptedQty ?? l.qty) !== l.qty || forms[l.id]?.reason,
    ).length;
    return { planned, accepted, discrepancy: planned - accepted, issues };
  }, [order, forms]);

  if (!order) return <NotFoundPage />;

  const supplier = state.suppliers.find((s) => s.id === order.supplierId)!;
  const outlet = state.restaurant.outlets.find((o) => o.id === order.outletId);
  const alreadyProcessed = ['accepted', 'partially_accepted', 'refused'].includes(order.status);
  const notDelivered = !['delivered', 'shipped'].includes(order.status) && !alreadyProcessed;

  if (alreadyProcessed) {
    const act = state.acts.find((a) => a.id === order.actId);
    return (
      <div className="page pt-6">
        <EmptyState
          icon={<CheckCircle2 className="size-6" />}
          title="Приёмка уже закрыта"
          text={
            act
              ? `По заявке ${order.number} оформлен акт ${act.number}: ${verdictLabels[act.verdict].toLowerCase()}.`
              : `Заявка ${order.number} принята полностью.`
          }
          action={
            <Button onClick={() => navigate(`/orders/${order.id}`)}>Открыть заявку</Button>
          }
        />
      </div>
    );
  }

  if (notDelivered) {
    return (
      <div className="page pt-6">
        <EmptyState
          icon={<AlertTriangle className="size-6" />}
          title="Поставка ещё не доставлена"
          text="Приёмку можно открыть, когда поставщик отметит заявку как доставленную."
          action={<Button onClick={() => navigate(`/orders/${order.id}`)}>К заявке</Button>}
        />
      </div>
    );
  }

  const patchLine = (lineId: string, part: Partial<LineForm>) =>
    setForms((prev) => ({ ...prev, [lineId]: { ...prev[lineId], ...part } }));

  const acceptAll = () => {
    setForms((prev) =>
      Object.fromEntries(
        order.lines.map((line) => [
          line.id,
          { ...prev[line.id], acceptedQty: line.qty, reason: undefined, comment: '' },
        ]),
      ),
    );
    toast.info('Все позиции приняты полностью');
  };

  const buildAct = (verdict: AcceptanceVerdict): AcceptanceAct => ({
    id: uid('act'),
    number: actNumber(),
    orderId: order.id,
    orderNumber: order.number,
    supplierId: order.supplierId,
    createdAt: new Date().toISOString(),
    acceptedBy,
    lines: order.lines.map((line) => {
      const form = forms[line.id];
      return {
        lineId: line.id,
        productName: line.name,
        article: line.article,
        unit: line.unit,
        price: line.price,
        plannedQty: line.qty,
        acceptedQty: verdict === 'refused' ? 0 : form.acceptedQty,
        reason: verdict === 'refused' ? 'defect' : form.reason,
        comment: form.comment.trim() || undefined,
        photos: form.photos,
      };
    }),
    comment: comment.trim() || undefined,
    plannedAmount: totals.planned,
    acceptedAmount: verdict === 'refused' ? 0 : totals.accepted,
    discrepancyAmount: verdict === 'refused' ? totals.planned : totals.discrepancy,
    verdict,
  });

  const finalize = (verdict: AcceptanceVerdict) => {
    const act = buildAct(verdict);
    dispatch({ type: 'orders/acceptance', act });

    const threadId = chat.ensureThread({
      supplierId: order.supplierId,
      orderId: order.id,
      subject: `Заявка ${order.number}`,
    });
    chat.system(
      threadId,
      verdict === 'accepted'
        ? `Поставка принята полностью, акт не требуется. Принимал: ${acceptedBy}.`
        : `Оформлен акт ${act.number}: ${verdictLabels[verdict].toLowerCase()}, расхождение ${money(
            act.discrepancyAmount,
          )}.`,
    );

    setConfirmOpen(false);
    setRefuseOpen(false);
    toast.success(
      verdict === 'accepted' ? 'Поставка принята' : 'Акт расхождений оформлен',
      `${order.number} · ${verdictLabels[verdict]}`,
    );
    navigate(`/orders/${order.id}`);
  };

  const verdict: AcceptanceVerdict = totals.issues === 0 ? 'accepted' : 'partially_accepted';

  return (
    <div className="page pt-5">
      <button
        type="button"
        onClick={() => navigate(`/orders/${order.id}`)}
        className="flex cursor-pointer items-center gap-1 text-[13px] text-ink-500 hover:text-brand-600"
      >
        <ChevronLeft className="size-4" />
        Заявка {order.number}
      </button>

      <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.14em] text-brand-600 uppercase">
            Приёмка на складе
          </p>
          <h1 className="mt-0.5 text-[26px]">Сверка поставки {order.number}</h1>
          <p className="mt-1 text-[13px] text-ink-500">
            {supplier.name} · {outlet?.name} · доставка {dateFull(order.deliveryDate)},{' '}
            {order.deliveryWindow}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" icon={<Check className="size-4" />} onClick={acceptAll}>
            Принять всё
          </Button>
          <Button
            variant="ghost"
            className="text-danger-600"
            icon={<ThumbsDown className="size-4" />}
            onClick={() => setRefuseOpen(true)}
          >
            Отказаться от поставки
          </Button>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_340px]">
        <div className="space-y-3">
          {order.lines.map((line) => {
            const form = forms[line.id];
            const diff = form.acceptedQty - line.qty;
            const hasIssue = diff !== 0 || Boolean(form.reason);
            return (
              <div
                key={line.id}
                className={cn(
                  'card p-4',
                  hasIssue && (diff > 0 ? 'ring-1 ring-brand-200' : 'ring-1 ring-warn-200'),
                )}
              >
                <div className="flex flex-wrap items-start gap-3">
                  <div className="min-w-[200px] flex-1">
                    <Link
                      to={`/product/${line.productId}`}
                      className="text-sm font-semibold text-ink-900 hover:text-brand-700"
                    >
                      {line.name}
                    </Link>
                    <p className="mt-0.5 text-xs text-ink-500">
                      {line.packSize} · арт. {line.article} · {money(line.price)} за{' '}
                      {unitLabel(line.unit)}
                    </p>
                  </div>

                  <div className="text-center">
                    <p className="text-[11px] tracking-wide text-ink-500 uppercase">План</p>
                    <p className="text-sm font-semibold text-ink-900">
                      {formatQty(line.qty, line.unit)}
                    </p>
                  </div>

                  <div className="text-center">
                    <p className="mb-1 text-[11px] tracking-wide text-ink-500 uppercase">Факт</p>
                    <QtyStepper
                      value={form.acceptedQty}
                      onChange={(next) =>
                        patchLine(line.id, {
                          acceptedQty: next,
                          reason:
                            next === line.qty
                              ? undefined
                              : (form.reason ?? (next > line.qty ? 'excess' : 'shortage')),
                        })
                      }
                      unit={line.unit}
                      min={0}
                      step={line.unit === 'kg' ? 0.5 : 1}
                      size="sm"
                    />
                  </div>

                  <div className="w-24 text-right">
                    <p className="text-[11px] tracking-wide text-ink-500 uppercase">Сумма</p>
                    <p className="text-sm font-semibold text-ink-900">
                      {money(line.price * form.acceptedQty)}
                    </p>
                    {diff !== 0 && (
                      <p
                        className={cn(
                          'text-xs font-medium',
                          diff < 0 ? 'text-warn-600' : 'text-brand-600',
                        )}
                      >
                        {diff < 0 ? '−' : '+'}
                        {money(Math.abs(diff) * line.price)}
                      </p>
                    )}
                  </div>
                </div>

                {hasIssue && (
                  <div className="mt-3 grid gap-2 border-t border-ink-100 pt-3 sm:grid-cols-[200px_1fr]">
                    <Field label="Причина расхождения">
                      <Select
                        value={form.reason ?? ''}
                        onChange={(e) =>
                          patchLine(line.id, {
                            reason: (e.target.value || undefined) as DiscrepancyReason | undefined,
                          })
                        }
                      >
                        <option value="">Не указана</option>
                        {reasons.map((reason) => (
                          <option key={reason} value={reason}>
                            {discrepancyLabels[reason]}
                          </option>
                        ))}
                      </Select>
                    </Field>
                    <Field label="Комментарий кладовщика">
                      <Input
                        value={form.comment}
                        onChange={(e) => patchLine(line.id, { comment: e.target.value })}
                        placeholder="Например: 2 упаковки со следами разморозки"
                      />
                    </Field>
                    <div className="sm:col-span-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          icon={<Camera className="size-3.5" />}
                          onClick={() => setPhotoLine(line.id)}
                        >
                          Добавить фото
                        </Button>
                        {form.photos.map((photo, index) => (
                          <span key={index} className="relative">
                            <img
                              src={photo}
                              alt="Фото расхождения"
                              className="size-14 rounded-lg border border-ink-200 object-cover"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                patchLine(line.id, {
                                  photos: form.photos.filter((_, i) => i !== index),
                                })
                              }
                              className="absolute -top-1.5 -right-1.5 flex size-5 cursor-pointer items-center justify-center rounded-full bg-white text-danger-500 shadow"
                              aria-label="Удалить фото"
                            >
                              <Trash2 className="size-3" />
                            </button>
                          </span>
                        ))}
                        {form.photos.length === 0 && (
                          <span className="text-xs text-ink-400">
                            Фото ускоряет согласование претензии
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <SupplierLogo name={supplier.name} hue={supplier.hue} className="size-10" />
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-ink-900">{supplier.name}</p>
                <p className="text-xs text-ink-500">{supplier.contacts.phone}</p>
              </div>
            </div>

            <dl className="mt-4 space-y-2 border-t border-ink-100 pt-3 text-[13px]">
              <div className="flex justify-between gap-2">
                <dt className="text-ink-500">По заявке</dt>
                <dd className="font-medium text-ink-900">{money(totals.planned)}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-ink-500">Принимается</dt>
                <dd className="font-semibold text-success-600">{money(totals.accepted)}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-ink-500">Расхождение</dt>
                <dd
                  className={cn(
                    'font-semibold',
                    totals.discrepancy > 0 ? 'text-warn-600' : 'text-ink-900',
                  )}
                >
                  {money(totals.discrepancy)}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-ink-500">Позиций с расхождением</dt>
                <dd className="font-medium text-ink-900">
                  {totals.issues} из {order.lines.length}
                </dd>
              </div>
            </dl>

            <div className="mt-3 rounded-lg bg-ink-50 p-3">
              <Badge tone={verdict === 'accepted' ? 'success' : 'warn'} icon={<ClipboardCheck className="size-3.5" />}>
                {verdictLabels[verdict]}
              </Badge>
              <p className="mt-2 text-xs text-ink-500">
                {verdict === 'accepted'
                  ? 'Акт не потребуется — заявка закроется как принятая полностью.'
                  : 'Будет сформирован акт расхождений и отправлен поставщику в чат.'}
              </p>
            </div>

            <Field label="Принимающий сотрудник" className="mt-3">
              <Select value={acceptedBy} onChange={(e) => setAcceptedBy(e.target.value)}>
                {state.restaurant.employees.map((employee) => (
                  <option key={employee.id} value={employee.name}>
                    {employee.name} — {employee.position}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Комментарий к приёмке" className="mt-3">
              <Textarea
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Итоговый комментарий для акта и поставщика"
              />
            </Field>

            <Button block size="lg" className="mt-3" onClick={() => setConfirmOpen(true)}>
              {verdict === 'accepted' ? 'Принять поставку' : 'Оформить акт и закрыть'}
            </Button>
          </div>
        </aside>
      </div>

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title={verdict === 'accepted' ? 'Подтвердить приёмку' : 'Подтвердить акт расхождений'}
        description={`${order.number} · ${supplier.name}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmOpen(false)}>
              Вернуться к сверке
            </Button>
            <Button onClick={() => finalize(verdict)}>Подтвердить</Button>
          </>
        }
      >
        <div className="space-y-2 text-[13px]">
          <p className="text-ink-600">
            Принимает: <strong className="text-ink-900">{acceptedBy}</strong>
          </p>
          <p className="text-ink-600">
            Сумма к оплате: <strong className="text-ink-900">{money(totals.accepted)}</strong>
            {totals.discrepancy > 0 && (
              <span className="text-warn-600"> (минус {money(totals.discrepancy)})</span>
            )}
          </p>
          {totals.issues > 0 && (
            <ul className="mt-2 divide-y divide-ink-100 rounded-lg bg-ink-50 p-3">
              {order.lines
                .filter((line) => forms[line.id].acceptedQty !== line.qty || forms[line.id].reason)
                .map((line) => {
                  const form = forms[line.id];
                  return (
                    <li key={line.id} className="py-1.5 first:pt-0 last:pb-0">
                      <p className="font-medium text-ink-900">{line.name}</p>
                      <p className="text-ink-600">
                        план {formatQty(line.qty, line.unit)} → факт{' '}
                        {formatQty(form.acceptedQty, line.unit)}
                        {form.reason ? ` · ${discrepancyLabels[form.reason]}` : ''}
                      </p>
                    </li>
                  );
                })}
            </ul>
          )}
        </div>
      </Modal>

      <Modal
        open={refuseOpen}
        onClose={() => setRefuseOpen(false)}
        title="Отказ от поставки"
        description="Вся поставка возвращается поставщику"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setRefuseOpen(false)}>
              Отмена
            </Button>
            <Button variant="danger" onClick={() => finalize('refused')}>
              Оформить отказ
            </Button>
          </>
        }
      >
        <Field label="Причина отказа" hint="Попадёт в акт и в чат поставщика">
          <Textarea
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Например: нарушена температура перевозки, товар не принят"
          />
        </Field>
      </Modal>

      <Modal
        open={Boolean(photoLine)}
        onClose={() => setPhotoLine(null)}
        title="Фото расхождения"
        size="sm"
      >
        <FileDrop
          accept="image/*"
          multiple
          label="Загрузите фото товара или упаковки"
          hint="JPG или PNG, до 5 файлов"
          onFiles={async (files) => {
            if (!photoLine) return;
            const urls = await Promise.all(files.slice(0, 5).map(readFileAsDataUrl));
            patchLine(photoLine, { photos: [...forms[photoLine].photos, ...urls].slice(0, 5) });
            setPhotoLine(null);
            toast.success('Фото добавлено к позиции');
          }}
        />
      </Modal>
    </div>
  );
}
