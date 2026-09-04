import { useNavigate } from 'react-router-dom';
import { Store, UtensilsCrossed } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useAppState, useDispatch } from '@/store/AppContext';

export function RoleSwitcher({ className }: { className?: string }) {
  const { session } = useAppState();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const switchTo = (role: 'buyer' | 'seller') => {
    if (role === session.role) return;
    dispatch({ type: 'session/setRole', role });
    navigate(role === 'buyer' ? '/' : '/seller');
  };

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full bg-ink-100 p-0.5 text-[12px] font-medium',
        className,
      )}
    >
      <button
        type="button"
        onClick={() => switchTo('buyer')}
        className={cn(
          'inline-flex cursor-pointer items-center gap-1.5 rounded-full px-2.5 py-1 transition-colors',
          session.role === 'buyer' ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500',
        )}
      >
        <UtensilsCrossed className="size-3.5" />
        Заказчик
      </button>
      <button
        type="button"
        onClick={() => switchTo('seller')}
        className={cn(
          'inline-flex cursor-pointer items-center gap-1.5 rounded-full px-2.5 py-1 transition-colors',
          session.role === 'seller' ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500',
        )}
      >
        <Store className="size-3.5" />
        Продавец
      </button>
    </div>
  );
}
