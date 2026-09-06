import { Link } from 'react-router-dom';
import { BadgeCheck, Clock, Heart, Mail, MapPin } from 'lucide-react';
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

  return (
    <div className="card p-4 transition-shadow hover:shadow-[var(--shadow-hover)]">
      <div className="flex gap-4">
        <SupplierLogo name={supplier.name} hue={supplier.hue} className="size-16 text-lg" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <Link
                to={`/suppliers/${supplier.id}`}
                className="flex items-center gap-1.5 text-[17px] font-bold text-ink-900 hover:text-brand-700"
              >
                {supplier.legalName}
                {supplier.verified && <BadgeCheck className="size-4 text-brand-600" />}
              </Link>
              <p className="mt-0.5 flex items-center gap-1 text-[13px] text-ink-500">
                <MapPin className="size-3.5" />
                {supplier.city}, Россия · с {supplier.since} года
              </p>
            </div>
            <Rating
              value={supplier.rating}
              count={supplier.reviewsCount}
              className="shrink-0"
            />
          </div>

          <p className="mt-2 line-clamp-2 text-[13px] text-ink-600">{supplier.description}</p>

          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {supplier.isManufacturer && <Badge tone="success">Производитель</Badge>}
            {supplier.categoryIds.slice(0, 3).map((id) => (
              <Badge key={id} tone="neutral">
                {categoryById.get(id)?.name ?? id}
              </Badge>
            ))}
          </div>

          <dl className="mt-3 grid gap-x-6 gap-y-1.5 text-[13px] sm:grid-cols-2">
            <div className="flex items-center gap-1.5 text-ink-600">
              <Clock className="size-3.5 text-ink-400" />
              Доставка: {deliveryDaysLabel(supplier)}
            </div>
            <div className="text-ink-600">
              {withCount(productCount, 'товар', 'товара', 'товаров')} в каталоге
            </div>
            <div className="text-ink-600">
              Бесплатно от {money(supplier.freeDeliveryFrom)}
            </div>
          </dl>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-end gap-2 border-t border-ink-100 pt-3">
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
  );
}
