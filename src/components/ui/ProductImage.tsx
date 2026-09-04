import {
  Beef,
  Carrot,
  Croissant,
  CupSoda,
  Fish,
  Milk,
  Package,
  Snowflake,
  Soup,
  SprayCan,
  Wheat,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';
import { categoryById } from '@/data/categories';
import type { Product } from '@/types';

const icons: Record<string, LucideIcon> = {
  meat: Beef,
  fish: Fish,
  dairy: Milk,
  vegetables: Carrot,
  grocery: Wheat,
  frozen: Snowflake,
  bakery: Croissant,
  drinks: CupSoda,
  asia: Soup,
  packaging: Package,
  chemistry: SprayCan,
};

/**
 * Детерминированная «фотография» товара: тон берётся из категории,
 * поэтому картинки не зависят от внешних сервисов и не ломаются офлайн.
 */
export function ProductImage({
  product,
  className,
  iconClassName,
  photo,
}: {
  product: Pick<Product, 'categoryId' | 'name' | 'brand'> & { photo?: string };
  className?: string;
  iconClassName?: string;
  photo?: string;
}) {
  const hue = categoryById.get(product.categoryId)?.hue ?? 210;
  const Icon = icons[product.categoryId] ?? Package;
  const src = photo ?? product.photo;

  if (src) {
    return (
      <span
        className={cn('block overflow-hidden rounded-lg bg-ink-100', className)}
        style={{
          backgroundImage: `url(${src})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
        role="img"
        aria-label={product.name}
      />
    );
  }

  return (
    <span
      className={cn(
        'relative flex items-center justify-center overflow-hidden rounded-lg',
        className,
      )}
      style={{
        background: `linear-gradient(140deg, hsl(${hue} 62% 96%), hsl(${hue} 48% 88%))`,
      }}
      aria-hidden
    >
      <Icon
        className={cn('size-1/3 opacity-70', iconClassName)}
        style={{ color: `hsl(${hue} 45% 42%)` }}
        strokeWidth={1.5}
      />
      <span
        className="absolute right-1.5 bottom-1 max-w-[80%] truncate text-[9px] font-semibold tracking-wide uppercase"
        style={{ color: `hsl(${hue} 35% 45%)` }}
      >
        {product.brand}
      </span>
    </span>
  );
}

export function SupplierLogo({
  name,
  hue,
  className,
}: {
  name: string;
  hue: number;
  className?: string;
}) {
  const initials = name
    .replace(/[«»"']/g, '')
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');
  return (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center rounded-lg text-sm font-bold',
        className,
      )}
      style={{
        background: `linear-gradient(140deg, hsl(${hue} 60% 94%), hsl(${hue} 52% 84%))`,
        color: `hsl(${hue} 45% 32%)`,
      }}
    >
      {initials}
    </span>
  );
}
