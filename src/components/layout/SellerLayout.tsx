import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import {
  Building2,
  FileSpreadsheet,
  LayoutDashboard,
  MessageSquare,
  Package,
  ShoppingBag,
  Truck,
} from 'lucide-react';
import { Select } from '@/components/ui/Field';
import { useAppState, useDispatch } from '@/store/AppContext';
import { sellerOrders } from '@/store/selectors';
import { DemoResetButton } from './DemoResetButton';
import { HeaderAction } from './HeaderAction';
import { Logo } from './Header';
import { NotificationsMenu } from './NotificationsMenu';
import { RoleSwitcher } from './RoleSwitcher';

const navItems = [
  { to: '/seller', label: 'Дашборд', icon: LayoutDashboard, end: true },
  {
    to: '/seller/orders',
    label: 'Заявки',
    icon: ShoppingBag,
    badgeKey: 'orders' as const,
  },
  { to: '/seller/deliveries', label: 'Отгрузки', icon: Truck },
  {
    to: '/seller/products',
    label: 'Каталог',
    icon: Package,
    isActive: (_: boolean, { pathname }: { pathname: string }) =>
      pathname.startsWith('/seller/products') && !pathname.startsWith('/seller/products/import'),
  },
  { to: '/seller/products/import', label: 'Импорт', icon: FileSpreadsheet },
  {
    to: '/seller/chats',
    label: 'Чаты',
    icon: MessageSquare,
    badgeKey: 'chats' as const,
  },
  { to: '/seller/profile', label: 'Профиль', icon: Building2 },
];

export function SellerLayout() {
  const state = useAppState();
  const dispatch = useDispatch();
  const { pathname } = useLocation();
  const orders = sellerOrders(state);
  const newOrders = orders.filter((o) => o.status === 'sent').length;
  const unread = state.threads.filter(
    (t) => t.supplierId === state.session.sellerSupplierId && t.unreadSeller > 0,
  ).length;

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [pathname]);

  const badges = { orders: newOrders, chats: unread };

  return (
    <div className="min-h-screen bg-ink-50 [--header-offset:4rem]">
      <header className="sticky top-0 z-40 border-b border-ink-200 bg-white">
        <div className="page flex h-16 items-center gap-2">
          <Logo />

          <div className="ml-auto flex min-w-0 items-center gap-0.5">
            <nav className="no-scrollbar flex items-center gap-0.5 overflow-x-auto">
              {navItems.map((item) => (
                <HeaderAction
                  key={item.to}
                  to={item.to}
                  icon={<item.icon className="size-5" />}
                  label={item.label}
                  badge={item.badgeKey ? badges[item.badgeKey] : undefined}
                  badgeTone="danger"
                  matchPrefix={item.end !== true && !item.isActive}
                  isActive={item.isActive}
                />
              ))}
            </nav>
            <NotificationsMenu />
          </div>
        </div>
      </header>

      <main className="page py-6">
        <Outlet />
      </main>

      <div className="border-t border-ink-200 bg-ink-50 py-4">
        <div className="page flex flex-wrap items-center justify-center gap-3">
          <RoleSwitcher />
          <Select
            value={state.session.sellerSupplierId}
            onChange={(e) =>
              dispatch({ type: 'session/setSellerSupplier', supplierId: e.target.value })
            }
            className="h-10 w-full max-w-xs text-sm"
            aria-label="Компания поставщика"
          >
            {state.suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
          <DemoResetButton />
        </div>
      </div>
    </div>
  );
}
