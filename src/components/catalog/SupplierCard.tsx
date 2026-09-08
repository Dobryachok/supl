import { Link } from 'react-router-dom';
import { BadgeCheck, Clock, Heart, Mail } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button, LinkButton } from '@/components/ui/Button';
import { Rating } from '@/components/ui/Rating';
import { SupplierLogo } from '@/components/ui/ProductImage';
import { cn } from '@/lib/cn';
import { categoryById } from '@/data/categories';
import { money, withCount } from '@/lib/format';
import { useAppState, useDispatch } from '@/store/AppContext';
import { productsOfSupplier } from '@/store/selectors';
import type { Supplier } from '@/types';

const weekdayNames = ['', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс'];

export function deliveryDaysLabel(supplier: Supplier): string {
  if (supplier.deliveryDays.length >= 7) return 'ежедневно';
  return supplier.deliveryDays.map((d) => weekdayNames[d]).join(', ');
}

export function SupplierCard({ supplier }: { supplier: Supplier }) {
  const state = useAppState();
  const dispatch = useDispatch();
  const isFavorite = state.favoriteSuppliers.includes(supplier.id);
  const productCount = productsOfSupplier(state, supplier.id).filter((p) => p.isActive).length;
  const metaLine = [
    deliveryDaysLabel(supplier),
    `${withCount(productCount, 'товар', 'товара', 'товаров')} в каталоге`,
    `бесплатно от ${money(supplier.freeDeliveryFrom)}`,
  ].join(' · ');

  return (
    <div className="card p-3.5 transition-shadow hover:shadow-[var(--shadow-hover)] sm:p-4">
      <div className="flex gap-3.5">
        <SupplierLogo name={supplier.name} hue={supplier.hue} className="size-14 shrink-0 text-base" />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <Link
                to={`/suppliers/${supplier.id}`}
                className="flex items-center gap-1.5 text-base font-bold text-ink-900 hover:text-brand-700"
              >
                <span className="truncate">{supplier.legalName}</span>
                {supplier.verified && <BadgeCheck className="size-4 shrink-0 text-brand-600" />}
              </Link>
              <p className="mt-0.5 text-[13px] text-ink-500">
                {supplier.city}, Россия · с {supplier.since} года
              </p>
            </div>
            <Rating value={supplier.rating} count={supplier.reviewsCount} className="shrink-0" />
          </div>

          <p className="mt-1.5 line-clamp-2 text-[13px] leading-snug text-ink-600">
            {supplier.description}
          </p>

          <div className="mt-1.5 flex flex-wrap gap-1">
            {supplier.isManufacturer && <Badge tone="success">Производитель</Badge>}
            {supplier.categoryIds.slice(0, 3).map((id) => (
              <Badge key={id} tone="neutral">
                {categoryById.get(id)?.name ?? id}
              </Badge>
            ))}
          </div>

          <div className="mt-2.5 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <p className="inline-flex min-w-0 items-start gap-1 text-[12px] leading-snug text-ink-500">
              <Clock className="mt-0.5 size-3.5 shrink-0 text-ink-400" />
              <span>{metaLine}</span>
            </p>

            <div className="flex shrink-0 flex-wrap items-center gap-1.5">
              <Button
                size="sm"
                variant="ghost"
                className={cn(isFavorite && 'text-danger-500')}
                icon={<Heart className={cn('size-3.5', isFavorite && 'fill-current')} />}
                onClick={() => dispatch({ type: 'favorites/toggleSupplier', supplierId: supplier.id })}
              >
                {isFavorite ? 'В избранном' : 'В избранное'}
              </Button>
              <LinkButton
                to={`/suppliers/${supplier.id}#contacts`}
                size="sm"
                variant="secondary"
                icon={<Mail className="size-3.5" />}
              >
                Контакты
              </LinkButton>
              <LinkButton to={`/suppliers/${supplier.id}`} size="sm">
                Подробнее
              </LinkButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
