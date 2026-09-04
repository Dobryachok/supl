import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BadgePercent,
  ClipboardCheck,
  CreditCard,
  PackageCheck,
  Send,
  Timer,
  Truck,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { LinkButton } from '@/components/ui/Button';
import { ProductGridSkeleton } from '@/components/ui/Skeleton';
import { SupplierLogo } from '@/components/ui/ProductImage';
import { ProductShelf } from '@/components/catalog/ProductGrid';
import { CategoryIcon } from '@/components/layout/CategoryIcon';
import { categories } from '@/data/categories';
import { useSimulatedLoad } from '@/hooks/useSimulatedLoad';
import { cn } from '@/lib/cn';
import { money, withCount } from '@/lib/format';
import { useAppState } from '@/store/AppContext';
import {
  activeProducts,
  frequentlyOrdered,
  ordersKpi,
  sortProducts,
} from '@/store/selectors';

const slides = [
  {
    id: 'promo-1',
    title: 'Заявка поставщику за 2 минуты',
    text: 'Корзина сама разбивается по поставщикам и следит за минимальной суммой заказа.',
    cta: 'Собрать заявку',
    to: '/catalog',
    hue: 214,
  },
  {
    id: 'promo-2',
    title: 'Скидки до 22 % на заморозку',
    text: 'Картофель фри, овощные смеси и ягоды — цены действуют до конца недели.',
    cta: 'Смотреть распродажу',
    to: '/catalog/zamorozhennye-produkty',
    hue: 205,
  },
  {
    id: 'promo-3',
    title: 'Новым ресторанам — отсрочка 14 дней',
    text: 'Работайте по безналу с отсрочкой платежа у проверенных поставщиков.',
    cta: 'Как получить',
    to: '/profile',
    hue: 265,
  },
  {
    id: 'promo-4',
    title: 'Приёмка с актом расхождений',
    text: 'Кладовщик фиксирует недовоз и брак прямо в интерфейсе, акт уходит поставщику.',
    cta: 'Посмотреть приёмку',
    to: '/orders',
    hue: 150,
  },
];

const quickLinks = [
  { icon: CreditCard, label: 'Хочу отсрочку', hint: 'до 21 дня', to: '/profile' },
  { icon: BadgePercent, label: 'Кешбэк 3 %', hint: 'на первые заявки', to: '/catalog' },
  { icon: Send, label: 'Наш Telegram', hint: 'статусы поставок', to: '/chats' },
  { icon: Truck, label: 'Условия доставки', hint: 'по каждому поставщику', to: '/suppliers' },
  { icon: ClipboardCheck, label: 'Акты расхождений', hint: 'история приёмок', to: '/orders' },
];

export function HomePage() {
  const state = useAppState();
  const loading = useSimulatedLoad([]);
  const [slide, setSlide] = useState(0);
  const kpi = ordersKpi(state);

  useEffect(() => {
    const id = window.setInterval(() => setSlide((s) => (s + 1) % slides.length), 6000);
    return () => window.clearInterval(id);
  }, []);

  const shelves = useMemo(() => {
    const all = activeProducts(state);
    return {
      frequent: frequentlyOrdered(state, 5),
      novelty: sortProducts(all.filter((p) => p.isNew), 'new').slice(0, 5),
      sale: sortProducts(all.filter((p) => p.oldPrice), 'discount').slice(0, 5),
      hits: sortProducts(all, 'popular').slice(0, 5),
    };
  }, [state]);

  const topSuppliers = [...state.suppliers].sort((a, b) => b.rating - a.rating).slice(0, 6);
  const counts = new Map<string, number>();
  for (const product of state.products) {
    if (product.isActive) counts.set(product.categoryId, (counts.get(product.categoryId) ?? 0) + 1);
  }

  return (
    <div className="page pt-5">
      <div className="grid gap-3 lg:grid-cols-[1fr_320px]">
        <div className="relative overflow-hidden rounded-xl">
          <div
            className="flex transition-transform duration-500 ease-out"
            style={{ transform: `translateX(-${slide * 100}%)` }}
          >
            {slides.map((item) => (
              <div
                key={item.id}
                className="flex min-w-full flex-col justify-center gap-3 p-7 sm:p-10"
                style={{
                  background: `linear-gradient(120deg, hsl(${item.hue} 70% 96%), hsl(${item.hue} 60% 88%))`,
                }}
              >
                <Badge tone="info" className="w-fit bg-white/80">
                  SUPL для HoReCa
                </Badge>
                <h1 className="max-w-lg text-[26px] leading-tight sm:text-[32px]">{item.title}</h1>
                <p className="max-w-md text-sm text-ink-700">{item.text}</p>
                <LinkButton to={item.to} className="w-fit" icon={<ArrowRight className="size-4" />}>
                  {item.cta}
                </LinkButton>
              </div>
            ))}
          </div>
          <div className="absolute bottom-4 left-7 flex gap-1.5 sm:left-10">
            {slides.map((item, i) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSlide(i)}
                aria-label={`Слайд ${i + 1}`}
                className={cn(
                  'h-1.5 cursor-pointer rounded-full transition-all',
                  i === slide ? 'w-6 bg-brand-600' : 'w-2.5 bg-ink-900/20',
                )}
              />
            ))}
          </div>
        </div>

        <div className="card flex flex-col gap-3 p-4">
          <p className="text-sm font-bold text-ink-900">Операционная сводка</p>
          <div className="grid grid-cols-2 gap-2">
            <Link to="/orders" className="rounded-lg bg-ink-50 p-3 hover:bg-brand-50">
              <p className="text-[11px] tracking-wide text-ink-500 uppercase">В работе</p>
              <p className="mt-1 text-lg font-bold text-ink-900">{money(kpi.inWorkAmount)}</p>
              <p className="text-[11px] text-ink-500">
                {withCount(kpi.inWorkCount, 'заявка', 'заявки', 'заявок')}
              </p>
            </Link>
            <Link to="/orders?status=shipped" className="rounded-lg bg-ink-50 p-3 hover:bg-brand-50">
              <p className="text-[11px] tracking-wide text-ink-500 uppercase">Сегодня</p>
              <p className="mt-1 text-lg font-bold text-ink-900">{kpi.todayCount}</p>
              <p className="text-[11px] text-ink-500">поставок</p>
            </Link>
            <Link to="/orders?overdue=1" className="rounded-lg bg-danger-50 p-3 hover:bg-danger-100">
              <p className="text-[11px] tracking-wide text-danger-600 uppercase">Просрочено</p>
              <p className="mt-1 text-lg font-bold text-danger-600">{kpi.overdueCount}</p>
              <p className="text-[11px] text-danger-600/80">требуют звонка</p>
            </Link>
            <Link to="/orders?tab=acts" className="rounded-lg bg-warn-50 p-3 hover:bg-warn-100">
              <p className="text-[11px] tracking-wide text-warn-600 uppercase">Расхождения</p>
              <p className="mt-1 text-lg font-bold text-warn-600">{kpi.actsCount}</p>
              <p className="text-[11px] text-warn-600/80">{money(kpi.actsAmount)}</p>
            </Link>
          </div>
          <LinkButton to="/orders" variant="secondary" block size="sm">
            Открыть операционный контур
          </LinkButton>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
        {quickLinks.map((link) => (
          <Link
            key={link.label}
            to={link.to}
            className="card flex items-center gap-3 p-3 transition-shadow hover:shadow-[var(--shadow-hover)]"
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
              <link.icon className="size-4.5" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[13px] font-semibold text-ink-900">
                {link.label}
              </span>
              <span className="block truncate text-[11px] text-ink-500">{link.hint}</span>
            </span>
          </Link>
        ))}
      </div>

      <section className="mt-8">
        <div className="mb-3 flex items-end justify-between gap-2">
          <h2 className="text-[19px]">Каталог по категориям</h2>
          <Link to="/catalog" className="text-[13px] font-medium text-brand-600 hover:underline">
            Все категории
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {categories.slice(0, 8).map((category) => (
            <Link
              key={category.id}
              to={`/catalog/${category.slug}`}
              className="card group overflow-hidden transition-shadow hover:shadow-[var(--shadow-hover)]"
            >
              <span
                className="flex h-32 items-center justify-center"
                style={{
                  background: `linear-gradient(140deg, hsl(${category.hue} 62% 96%), hsl(${category.hue} 48% 88%))`,
                }}
              >
                <CategoryIcon
                  categoryId={category.id}
                  className="size-12 transition-transform group-hover:scale-110"
                />
              </span>
              <span className="block p-3.5">
                <span className="block text-sm font-semibold text-ink-900">{category.name}</span>
                <span className="mt-0.5 block text-xs text-ink-500">{category.tagline}</span>
                <span className="mt-1.5 block text-xs text-brand-600">
                  {withCount(counts.get(category.id) ?? 0, 'товар', 'товара', 'товаров')}
                </span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      {loading ? (
        <div className="mt-8">
          <ProductGridSkeleton count={5} />
        </div>
      ) : (
        <>
          <ProductShelf
            title="Часто заказываете"
            description="Позиции из ваших последних заявок — можно добрать в один клик"
            products={shelves.frequent}
            action={
              <Link to="/favorites" className="text-[13px] font-medium text-brand-600 hover:underline">
                Шаблоны закупок
              </Link>
            }
          />
          <ProductShelf
            title="Распродажа"
            description="Цены с уценкой от поставщиков на этой неделе"
            products={shelves.sale}
          />
          <ProductShelf title="Новинки" products={shelves.novelty} />
          <ProductShelf title="Хиты ресторанных закупок" products={shelves.hits} />
        </>
      )}

      <section className="mt-10">
        <div className="mb-3 flex items-end justify-between gap-2">
          <h2 className="text-[19px]">Проверенные поставщики</h2>
          <Link to="/suppliers" className="text-[13px] font-medium text-brand-600 hover:underline">
            Каталог поставщиков
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {topSuppliers.map((supplier) => (
            <Link
              key={supplier.id}
              to={`/suppliers/${supplier.id}`}
              className="card flex flex-col items-center gap-2 p-3.5 text-center transition-shadow hover:shadow-[var(--shadow-hover)]"
            >
              <SupplierLogo name={supplier.name} hue={supplier.hue} className="size-12" />
              <span className="text-[13px] font-semibold text-ink-900">{supplier.name}</span>
              <span className="text-[11px] text-ink-500">
                {supplier.city} · {supplier.rating}
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-10 rounded-xl bg-ink-800 p-6 text-white sm:p-8">
        <h2 className="text-[21px] text-white">Как работает поставка в SUPL</h2>
        <p className="mt-1 text-sm text-white/70">
          Четыре шага от корзины до принятого на складе товара — с фиксацией расхождений.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: Send,
              title: '1. Заявка',
              text: 'Корзина делится по поставщикам, вы выбираете дату и окно доставки.',
            },
            {
              icon: Timer,
              title: '2. Подтверждение',
              text: 'Поставщик принимает заявку, корректирует состав и назначает машину.',
            },
            {
              icon: Truck,
              title: '3. Трекинг',
              text: 'Статусы «в пути» и «доставлена» видны в операционном контуре.',
            },
            {
              icon: PackageCheck,
              title: '4. Приёмка',
              text: 'Кладовщик сверяет план и факт, недовоз уходит в акт расхождений.',
            },
          ].map((step) => (
            <div key={step.title} className="rounded-lg bg-white/5 p-4">
              <step.icon className="size-5 text-brand-200" />
              <p className="mt-2.5 text-sm font-semibold text-white">{step.title}</p>
              <p className="mt-1 text-[13px] text-white/70">{step.text}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
