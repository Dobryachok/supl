import { useState } from 'react';
import { MapPin, Plus, Trash2, Users } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Field, Input, Select } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import { Tabs } from '@/components/ui/Tabs';
import { useToast } from '@/components/ui/Toast';
import { uid } from '@/lib/ids';
import { money, withCount } from '@/lib/format';
import { useAppState, useDispatch } from '@/store/AppContext';
import { ordersKpi } from '@/store/selectors';
import type { Outlet } from '@/types';

export function ProfilePage() {
  const state = useAppState();
  const dispatch = useDispatch();
  const toast = useToast();
  const [tab, setTab] = useState('company');
  const [outletOpen, setOutletOpen] = useState(false);
  const [draft, setDraft] = useState<Omit<Outlet, 'id' | 'isDefault'>>({
    name: '',
    address: '',
    city: state.session.city,
    contactName: '',
    phone: '',
  });

  const restaurant = state.restaurant;
  const kpi = ordersKpi(state);

  const patchCompany = (patch: Partial<typeof restaurant>) =>
    dispatch({ type: 'restaurant/update', patch });

  const addOutlet = () => {
    if (!draft.name.trim() || !draft.address.trim()) return;
    patchCompany({
      outlets: [
        ...restaurant.outlets,
        { ...draft, id: uid('out'), isDefault: restaurant.outlets.length === 0 },
      ],
    });
    setDraft({ name: '', address: '', city: state.session.city, contactName: '', phone: '' });
    setOutletOpen(false);
    toast.success('Точка добавлена', draft.name);
  };

  const removeOutlet = (id: string) => {
    patchCompany({ outlets: restaurant.outlets.filter((o) => o.id !== id) });
    toast.info('Точка удалена');
  };

  const makeDefault = (id: string) => {
    patchCompany({
      outlets: restaurant.outlets.map((o) => ({ ...o, isDefault: o.id === id })),
    });
  };

  return (
    <div className="page pt-5">
      <div>
        <h1 className="text-[26px]">{restaurant.name}</h1>
        <p className="mt-1 text-[13px] text-ink-500">
          {restaurant.legalName} · ИНН {restaurant.inn} ·{' '}
          {withCount(restaurant.outlets.length, 'точка', 'точки', 'точек')}
        </p>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Заявок в работе', value: kpi.inWorkCount, hint: money(kpi.inWorkAmount) },
          { label: 'Просрочено', value: kpi.overdueCount, hint: money(kpi.overdueAmount) },
          { label: 'Актов расхождений', value: kpi.actsCount, hint: money(kpi.actsAmount) },
          {
            label: 'Поставщиков в избранном',
            value: state.favoriteSuppliers.length,
            hint: `${state.favoriteProducts.length} товаров`,
          },
        ].map((tile) => (
          <div key={tile.label} className="card p-4">
            <p className="text-[11px] tracking-wide text-ink-500 uppercase">{tile.label}</p>
            <p className="mt-1 text-[22px] font-bold text-ink-900">{tile.value}</p>
            <p className="text-xs text-ink-500">{tile.hint}</p>
          </div>
        ))}
      </div>

      <Tabs
        className="mt-5"
        value={tab}
        onChange={setTab}
        items={[
          { id: 'company', label: 'Реквизиты' },
          { id: 'outlets', label: 'Точки и склады', count: restaurant.outlets.length },
          { id: 'employees', label: 'Сотрудники', count: restaurant.employees.length },
          { id: 'payment', label: 'Документы' },
        ]}
      />

      <div className="mt-4">
        {tab === 'company' && (
          <div className="card grid gap-4 p-4 sm:grid-cols-2">
            <Field label="Название сети">
              <Input
                value={restaurant.name}
                onChange={(e) => patchCompany({ name: e.target.value })}
              />
            </Field>
            <Field label="Юридическое лицо">
              <Input
                value={restaurant.legalName}
                onChange={(e) => patchCompany({ legalName: e.target.value })}
              />
            </Field>
            <Field label="ИНН">
              <Input
                value={restaurant.inn}
                onChange={(e) => patchCompany({ inn: e.target.value.replace(/\D/g, '') })}
              />
            </Field>
            <Field label="КПП">
              <Input
                value={restaurant.kpp}
                onChange={(e) => patchCompany({ kpp: e.target.value.replace(/\D/g, '') })}
              />
            </Field>
            <Field label="Город">
              <Input
                value={restaurant.city}
                onChange={(e) => patchCompany({ city: e.target.value })}
              />
            </Field>
            <Field label="Email для документов">
              <Input
                value={restaurant.email}
                onChange={(e) => patchCompany({ email: e.target.value })}
              />
            </Field>
            <Field label="Телефон">
              <Input
                value={restaurant.phone}
                onChange={(e) => patchCompany({ phone: e.target.value })}
              />
            </Field>
            <div className="flex items-end">
              <p className="text-xs text-ink-500">
                Изменения сохраняются автоматически в браузере — как в реальном кабинете.
              </p>
            </div>
          </div>
        )}

        {tab === 'outlets' && (
          <div className="space-y-3">
            <div className="flex justify-end">
              <Button icon={<Plus className="size-4" />} onClick={() => setOutletOpen(true)}>
                Добавить точку
              </Button>
            </div>
            {restaurant.outlets.map((outlet) => (
              <div key={outlet.id} className="card flex flex-wrap items-center gap-3 p-4">
                <span className="flex size-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                  <MapPin className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 text-sm font-semibold text-ink-900">
                    {outlet.name}
                    {outlet.isDefault && <Badge tone="info">по умолчанию</Badge>}
                  </p>
                  <p className="text-xs text-ink-500">{outlet.address}</p>
                  <p className="text-xs text-ink-500">
                    {outlet.contactName} · {outlet.phone}
                  </p>
                </div>
                {!outlet.isDefault && (
                  <Button size="sm" variant="ghost" onClick={() => makeDefault(outlet.id)}>
                    Сделать основной
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-danger-600"
                  icon={<Trash2 className="size-3.5" />}
                  onClick={() => removeOutlet(outlet.id)}
                >
                  Удалить
                </Button>
              </div>
            ))}
          </div>
        )}

        {tab === 'employees' && (
          <div className="card divide-y divide-ink-100">
            {restaurant.employees.map((employee) => (
              <div key={employee.id} className="flex flex-wrap items-center gap-3 p-4">
                <span className="flex size-10 items-center justify-center rounded-full bg-ink-100 text-ink-600">
                  <Users className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink-900">{employee.name}</p>
                  <p className="text-xs text-ink-500">
                    {employee.position} · {employee.email}
                  </p>
                </div>
                <Badge tone="neutral">{employee.scope}</Badge>
              </div>
            ))}
          </div>
        )}

        {tab === 'payment' && (
          <div className="card max-w-xl p-4">
            <h2 className="text-[15px]">Документооборот</h2>
            <Field label="Формат закрывающих документов" className="mt-3">
              <Select defaultValue="edo">
                <option value="edo">ЭДО (Диадок)</option>
                <option value="paper">Бумажные оригиналы</option>
                <option value="mixed">Смешанный</option>
              </Select>
            </Field>
            <Field label="Email бухгалтерии" className="mt-3">
              <Input defaultValue="buh@teplystol.ru" />
            </Field>
          </div>
        )}
      </div>

      <Modal
        open={outletOpen}
        onClose={() => setOutletOpen(false)}
        title="Новая точка доставки"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOutletOpen(false)}>
              Отмена
            </Button>
            <Button onClick={addOutlet} disabled={!draft.name.trim() || !draft.address.trim()}>
              Добавить
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Field label="Название" required>
            <Input
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              placeholder="Например: Кафе на Тверской"
            />
          </Field>
          <Field label="Адрес" required>
            <Input
              value={draft.address}
              onChange={(e) => setDraft({ ...draft, address: e.target.value })}
              placeholder="Улица, дом, вход"
            />
          </Field>
          <Field label="Контактное лицо">
            <Input
              value={draft.contactName}
              onChange={(e) => setDraft({ ...draft, contactName: e.target.value })}
            />
          </Field>
          <Field label="Телефон">
            <Input
              value={draft.phone}
              onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
              placeholder="+7 ..."
            />
          </Field>
        </div>
      </Modal>

    </div>
  );
}
