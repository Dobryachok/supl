import { useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  Building2,
  FileSpreadsheet,
  LayoutDashboard,
  MessageSquare,
  Package,
  ShoppingBag,
  Truck,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { useAppState, useDispatch } from '@/store/AppContext';
import { sellerOrders } from '@/store/selectors';
import { SupplierLogo } from '@/components/ui/ProductImage';
import { Select } from '@/components/ui/Field';
import { Logo } from './Header';
import { NotificationsMenu } from './NotificationsMenu';
import { RoleSwitcher } from './RoleSwitcher';

const navItems = [
  { to: '/seller', label: 'Дашборд', icon: LayoutDashboard, end: true },
  { to: '/seller/orders', label: 'Заявки', icon: ShoppingBag },
  { to: '/seller/deliveries', label: 'План отгрузок', icon: Truck },
  { to: '/seller/products', label: 'Каталог товаров', icon: Package },
  { to: '/seller/products/import', label: 'Импорт CSV', icon: FileSpreadsheet },
  { to: '/seller/chats', label: 'Чаты', icon: MessageSquare },
  { to: '/seller/profile', label: 'Профиль компании', icon: Building2 },
];

export function SellerLayout() {
  const state = useAppState();
  const dispatch = useDispatch();
  const { pathname } = useLocation();
  const supplier = state.suppliers.find((s) => s.id === state.session.sellerSupplierId);
  const orders = sellerOrders(state);
  const newOrders = orders.filter((o) => o.status === 'sent').length;
  const unread = state.threads.filter(
    (t) => t.supplierId === state.session.sellerSupplierId && t.unreadSeller > 0,
  ).length;

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [pathname]);

  return (
    <div className="min-h-screen bg-ink-50 [--header-offset:calc(4rem+0.75rem)]">
      <header className="sticky top-0 z-40 border-b border-ink-200 bg-white">
        <div className="page flex h-16 items-center gap-4">
          <Logo />
          <span className="hidden rounded-md bg-ink-100 px-2 py-1 text-[11px] font-semibold tracking-wide text-ink-600 uppercase md:block">
            Кабинет поставщика
          </span>
          <div className="ml-auto flex items-center gap-3">
            <Select
              value={state.session.sellerSupplierId}
              onChange={(e) =>
                dispatch({ type: 'session/setSellerSupplier', supplierId: e.target.value })
              }
              className="hidden w-56 md:block"
              aria-label="Компания"
            >
              {state.suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
            <NotificationsMenu />
          </div>
        </div>
      </header>

      <div className="page flex gap-6 py-6">
        <aside className="hidden w-60 shrink-0 lg:block">
          <div className="card sticky-below-header p-3">
            {supplier && (
              <div className="mb-3 flex items-center gap-3 rounded-lg bg-ink-50 p-3">
                <SupplierLogo name={supplier.name} hue={supplier.hue} className="size-10" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink-900">{supplier.name}</p>
                  <p className="truncate text-xs text-ink-500">{supplier.city}</p>
                </div>
              </div>
            )}
            <nav className="space-y-0.5">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors',
                      isActive
                        ? 'bg-brand-50 font-semibold text-brand-700'
                        : 'text-ink-700 hover:bg-ink-50',
                    )
                  }
                >
                  <item.icon className="size-4" />
                  <span className="flex-1">{item.label}</span>
                  {item.to === '/seller/orders' && newOrders > 0 && (
                    <span className="rounded-full bg-danger-500 px-1.5 text-[10px] leading-4 font-bold text-white">
                      {newOrders}
                    </span>
                  )}
                  {item.to === '/seller/chats' && unread > 0 && (
                    <span className="rounded-full bg-danger-500 px-1.5 text-[10px] leading-4 font-bold text-white">
                      {unread}
                    </span>
                  )}
                </NavLink>
              ))}
            </nav>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <div className="no-scrollbar mb-4 flex gap-1.5 overflow-x-auto lg:hidden">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    'shrink-0 rounded-full px-3 py-1.5 text-[13px] font-medium whitespace-nowrap',
                    isActive ? 'bg-brand-600 text-white' : 'bg-white text-ink-600 ring-1 ring-ink-200 ring-inset',
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>
          <Outlet />
        </div>
      </div>

      <div className="border-t border-ink-200 bg-ink-50 py-4">
        <div className="page flex justify-center">
          <RoleSwitcher />
        </div>
      </div>
    </div>
  );
}
