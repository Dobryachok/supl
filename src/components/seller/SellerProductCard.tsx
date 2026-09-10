import { Link } from 'react-router-dom';
import { Eye } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { LinkButton } from '@/components/ui/Button';
import { ProductImage } from '@/components/ui/ProductImage';
import { money, qty as formatQty } from '@/lib/format';
import { discountPct } from '@/store/selectors';
import type { Product } from '@/types';

export function SellerProductCard({ product }: { product: Product }) {
  const discount = discountPct(product);

  return (
    <article className="overflow-hidden rounded-xl border border-ink-200 bg-white shadow-[var(--shadow-card)]">
      <Link to={`/product/${product.id}`} className="block">
        <div className="relative">
          <ProductImage product={product} className="aspect-square w-full rounded-none" />
          <div className="absolute top-2 left-2 flex flex-col items-start gap-1">
            {discount > 0 && (
              <Badge tone="danger" size="sm">
                −{discount}%
              </Badge>
            )}
            {product.isNew && <Badge tone="success" size="sm">Новинка</Badge>}
          </div>
          {!product.isActive && (
            <span className="absolute top-2 right-2">
              <Badge tone="neutral" size="sm">Скрыт</Badge>
            </span>
          )}
        </div>
      </Link>
      <div className="p-3">
        <Link
          to={`/product/${product.id}`}
          className="line-clamp-2 text-[13px] font-semibold text-ink-900 hover:text-brand-700"
        >
          {product.name}
        </Link>
        <p className="mt-0.5 text-xs text-ink-500">
          арт. {product.article} · {product.packSize}
        </p>
        <p className="mt-0.5 text-xs text-ink-500">
          остаток {formatQty(product.stock, product.unit)}
        </p>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-[17px] font-bold text-ink-900">{money(product.price)}</span>
          {product.oldPrice && (
            <span className="text-xs text-ink-400 line-through">{money(product.oldPrice)}</span>
          )}
        </div>
        <div className="mt-2.5 flex gap-2">
          <LinkButton to={`/seller/products/${product.id}/edit`} size="sm" variant="secondary" block>
            Изменить
          </LinkButton>
          <LinkButton
            to={`/product/${product.id}`}
            size="sm"
            variant="ghost"
            icon={<Eye className="size-3.5" />}
            block
          >
            Витрина
          </LinkButton>
        </div>
      </div>
    </article>
  );
}
