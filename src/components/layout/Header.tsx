import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Heart,
  LayoutGrid,
  Menu,
  MessageSquare,
  ShoppingCart,
  Truck,
  User,
  X,
} from 'lucide-react';
import { categories } from '@/data/categories';
import { useClickOutside } from '@/hooks/useClickOutside';
import { cn } from '@/lib/cn';
import { moneyShort } from '@/lib/format';
import { useAppState } from '@/store/AppContext';
import { cartCount, cartTotal, ordersKpi, unreadThreads } from '@/store/selectors';
import { CategoryIcon } from './CategoryIcon';
import { MegaMenu } from './MegaMenu';
import { NotificationsMenu } from './NotificationsMenu';
import { SearchBox } from './SearchBox';

export function Logo({ compact }: { compact?: boolean }) {
  return (
    <Link to="/" className="flex shrink-0 items-center gap-2.5">
      <span className="flex size-9 items-center justify-center rounded-lg bg-brand-600 text-base font-black text-white">
        S
      </span>
      {!compact && (
        <span className="leading-none">
          <span className="block text-[17px] font-black tracking-tight text-brand-700">SUPL</span>
          <span className="block text-[9px] font-semibold tracking-[0.14em] text-ink-400 uppercase">
            для HoReCa
          </span>
        </span>
      )}
    </Link>
  );
}

export function Header() {
  const state = useAppState();
  const location = useLocation();
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const catalogRef = useClickOutside<HTMLDivElement>(catalogOpen, () => setCatalogOpen(false));

  const kpi = ordersKpi(state);
  const items = cartCount(state);
  const total = cartTotal(state);
  const chats = unreadThreads(state);
  const deliveries = state.orders.filter((o) =>
    ['confirmed', 'shipped', 'delivered'].includes(o.status),
  ).length;
  const awaitingAcceptance = state.orders.filter((o) => o.status === 'delivered').length;

  useEffect(() => {
    setCatalogOpen(false);
    setMobileOpen(false);
  }, [location.pathname, location.search]);

  return (
    <header className="sticky top-0 z-40 border-b border-ink-200 bg-white">
      <div className="page flex h-16 items-center gap-3">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="flex size-10 cursor-pointer items-center justify-center rounded-lg text-ink-700 hover:bg-ink-100 lg:hidden"
          aria-label="Меню"
        >
          <Menu className="size-5" />
        </button>

        <Logo />

        <div ref={catalogRef} className="relative hidden lg:block">
          <button
            type="button"
            onClick={() => setCatalogOpen((v) => !v)}
            className={cn(
              'inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg px-4 text-sm font-semibold text-white transition-colors',
              catalogOpen ? 'bg-brand-700' : 'bg-brand-600 hover:bg-brand-700',
            )}
          >
            {catalogOpen ? <X className="size-4" /> : <LayoutGrid className="size-4" />}
            Каталог
          </button>
          {catalogOpen && <MegaMenu onNavigate={() => setCatalogOpen(false)} />}
        </div>

        <SearchBox className="min-w-0 flex-1" />

        <div className="flex items-center gap-0.5">
          <NotificationsMenu />
          <HeaderAction to="/chats" icon={<MessageSquare className="size-5" />} label="Чаты" badge={chats} />
          <HeaderAction
            to="/deliveries"
            icon={<Truck className="size-5" />}
            label="Поставки"
            badge={deliveries}
            badgeTone={awaitingAcceptance > 0 ? 'danger' : 'neutral'}
            className="hidden sm:flex"
          />
          <HeaderAction
            to="/orders"
            icon={<ClipboardList className="size-5" />}
            label="Заказы"
            badge={kpi.inWorkCount}
            badgeTone="neutral"
            matchPrefix
          />
          <HeaderAction
            to="/favorites"
            icon={<Heart className="size-5" />}
            label="Избранное"
            badge={state.favoriteProducts.length}
            badgeTone="neutral"
            className="hidden sm:flex"
          />
          <HeaderAction to="/profile" icon={<User className="size-5" />} label="Профиль" className="hidden sm:flex" />
          <NavLink
            to="/cart"
            isActive={(_, location) =>
              location.pathname === '/cart' || location.pathname === '/checkout'
            }
            className={({ isActive }) =>
              cn(
                'ml-1 flex h-11 items-center gap-2.5 rounded-lg px-3 transition-colors',
                isActive
                  ? 'bg-brand-700 text-white ring-2 ring-brand-300 ring-inset'
                  : 'bg-brand-600 text-white hover:bg-brand-700',
              )
            }
          >
            <span className="relative">
              <ShoppingCart className="size-5" />
              {items > 0 && (
                <span className="absolute -top-1.5 -right-2 flex min-w-4 justify-center rounded-full bg-white px-1 text-[10px] leading-4 font-bold text-brand-700">
                  {items}
                </span>
              )}
            </span>
            <span className="hidden text-left leading-tight sm:block">
              <span className="block text-[10px] text-white/75">Корзина</span>
              <span className="block text-[13px] font-semibold">{moneyShort(total)}</span>
            </span>
          </NavLink>
        </div>
      </div>

      <CategoryNavBar />

      {mobileOpen && <MobileMenu onClose={() => setMobileOpen(false)} />}
    </header>
  );
}

function CategoryNavBar() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  }, []);

  useEffect(() => {
    updateScrollState();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', updateScrollState, { passive: true });
    const observer = new ResizeObserver(updateScrollState);
    observer.observe(el);
    return () => {
      el.removeEventListener('scroll', updateScrollState);
      observer.disconnect();
    };
  }, [updateScrollState]);

  const scroll = (direction: 'left' | 'right') => {
    scrollRef.current?.scrollBy({
      left: direction === 'left' ? -280 : 280,
      behavior: 'smooth',
    });
  };

  return (
    <div className="hidden border-t border-ink-100 lg:block">
      <div className="page flex h-10 items-center gap-1">
        <button
          type="button"
          onClick={() => scroll('left')}
          disabled={!canScrollLeft}
          className={cn(
            'flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-ink-500 transition-colors hover:bg-ink-100 hover:text-ink-800',
            !canScrollLeft && 'pointer-events-none opacity-30',
          )}
          aria-label="Прокрутить категории влево"
        >
          <ChevronLeft className="size-4" />
        </button>

        <div
          ref={scrollRef}
          className="no-scrollbar flex min-w-0 flex-1 items-center gap-5 overflow-x-auto text-[13px]"
        >
          {categories.map((category) => (
            <NavLink
              key={category.id}
              to={`/catalog/${category.slug}`}
              className={({ isActive }) =>
                cn(
                  'flex shrink-0 items-center gap-1.5 whitespace-nowrap transition-colors',
                  isActive ? 'font-semibold text-brand-700' : 'text-ink-600 hover:text-brand-700',
                )
              }
            >
              <CategoryIcon categoryId={category.id} className="size-3.5" />
              {category.name}
            </NavLink>
          ))}
          <Link to="/catalog" className="shrink-0 font-medium text-brand-600 hover:underline">
            Все категории
          </Link>
        </div>

        <button
          type="button"
          onClick={() => scroll('right')}
          disabled={!canScrollRight}
          className={cn(
            'flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-ink-500 transition-colors hover:bg-ink-100 hover:text-ink-800',
            !canScrollRight && 'pointer-events-none opacity-30',
          )}
          aria-label="Прокрутить категории вправо"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
    </div>
  );
}

function HeaderAction({
  to,
  icon,
  label,
  badge,
  badgeTone = 'danger',
  className,
  matchPrefix = false,
}: {
  to: string;
  icon: React.ReactNode;
  label: string;
  badge?: number;
  badgeTone?: 'danger' | 'neutral';
  className?: string;
  matchPrefix?: boolean;
}) {
  return (
    <NavLink
      to={to}
      end={!matchPrefix}
      className={({ isActive }) =>
        cn(
          'relative flex flex-col items-center gap-0.5 rounded-lg px-2 py-1 transition-colors',
          isActive
            ? 'bg-brand-50 font-semibold text-brand-700'
            : 'text-ink-600 hover:bg-ink-100 hover:text-ink-900',
          className,
        )
      }
    >
      {icon}
      <span className="hidden text-[11px] lg:block">{label}</span>
      {badge ? (
        <span
          className={cn(
            'absolute top-0 right-1 flex min-w-4 justify-center rounded-full px-1 text-[10px] leading-4 font-bold',
            badgeTone === 'danger' ? 'bg-danger-500 text-white' : 'bg-ink-200 text-ink-700',
          )}
        >
          {badge}
        </span>
      ) : null}
    </NavLink>
  );
}

function MobileMenu({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-ink-900/45 lg:hidden">
      <div className="absolute inset-0" onClick={onClose} aria-hidden />
      <div className="relative flex h-full w-[min(340px,90vw)] flex-col bg-white">
        <div className="flex items-center justify-between border-b border-ink-200 px-4 py-3">
          <Logo />
          <button
            type="button"
            onClick={onClose}
            className="flex size-9 cursor-pointer items-center justify-center rounded-lg text-ink-500 hover:bg-ink-100"
            aria-label="Закрыть меню"
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="scroll-thin flex-1 overflow-y-auto p-4">
          <p className="mb-1.5 text-[11px] font-semibold tracking-wide text-ink-400 uppercase">
            Категории
          </p>
          <ul className="mb-5">
            {categories.map((category) => (
              <li key={category.id}>
                <Link
                  to={`/catalog/${category.slug}`}
                  onClick={onClose}
                  className="flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm text-ink-700 hover:bg-ink-50"
                >
                  <CategoryIcon categoryId={category.id} className="size-4" />
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>
          <p className="mb-1.5 text-[11px] font-semibold tracking-wide text-ink-400 uppercase">
            Кабинет
          </p>
          <ul>
            {[
              ['/orders', 'Мои заказы'],
              ['/deliveries', 'Поставки и трекинг'],
              ['/cart', 'Корзина'],
              ['/suppliers', 'Поставщики'],
              ['/favorites', 'Избранное и шаблоны'],
              ['/chats', 'Чаты'],
              ['/profile', 'Профиль ресторана'],
              ['/seller', 'Кабинет поставщика'],
            ].map(([to, label]) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end={to !== '/orders'}
                  onClick={onClose}
                  className={({ isActive }) =>
                    cn(
                      'block rounded-lg px-2 py-2 text-sm transition-colors',
                      isActive
                        ? 'bg-brand-50 font-semibold text-brand-700'
                        : 'text-ink-700 hover:bg-ink-50',
                    )
                  }
                >
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
