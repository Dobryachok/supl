import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Heart, ShoppingCart, Snowflake, Truck } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ProductImage } from '@/components/ui/ProductImage';
import { QtyStepper } from '@/components/ui/QtyStepper';
import { useCartActions } from '@/hooks/useCartActions';
import { cn } from '@/lib/cn';
import { money, qty as formatQty, unitLabel } from '@/lib/format';
import { useAppState } from '@/store/AppContext';
import { discountPct } from '@/store/selectors';
import type { Product } from '@/types';

export function StockLabel({ product }: { product: Product }) {
  if (product.stock <= 0) {
    return <span className="text-xs font-medium text-danger-600">Нет в наличии</span>;
  }
  if (product.stock < product.minQty * 3) {
    return (
      <span className="text-xs font-medium text-warn-600">
        Осталось {formatQty(product.stock, product.unit)}
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-xs font-medium text-success-600">
      <Check className="size-3" />В наличии {formatQty(product.stock, product.unit)}
    </span>
  );
}

export function ProductCard({ product, view = 'grid' }: { product: Product; view?: 'grid' | 'list' }) {
  const state = useAppState();
  const cart = useCartActions();
  const [amount, setAmount] = useState(product.minQty);
  const supplier = state.suppliers.find((s) => s.id === product.supplierId);
  const inCart = state.cart.find((i) => i.productId === product.id);
  const isFavorite = state.favoriteProducts.includes(product.id);
  const discount = discountPct(product);

  const priceBlock = (
    <div className="flex items-baseline gap-2">
      <span className="text-[17px] font-bold text-ink-900">{money(product.price)}</span>
      <span className="text-xs text-ink-500">/ {unitLabel(product.unit)}</span>
      {product.oldPrice && (
        <span className="text-xs text-ink-400 line-through">{money(product.oldPrice)}</span>
      )}
    </div>
  );

  const favoriteButton = (
    <button
      type="button"
      onClick={() => cart.toggleFavorite(product, isFavorite)}
      className={cn(
        'flex size-8 cursor-pointer items-center justify-center rounded-lg transition-colors',
        isFavorite ? 'text-danger-500 hover:bg-danger-50' : 'text-ink-300 hover:bg-ink-100 hover:text-ink-500',
      )}
      aria-label={isFavorite ? 'Убрать из избранного' : 'В избранное'}
    >
      <Heart className={cn('size-4', isFavorite && 'fill-current')} />
    </button>
  );

  const addBlock = (
    <div className="flex min-w-0 flex-1 items-center gap-2">
      <QtyStepper
        value={amount}
        onChange={setAmount}
        unit={product.unit}
        min={product.minQty}
        step={product.step}
        max={product.stock || undefined}
        size="sm"
      />
      <Button
        size="sm"
        variant={inCart ? 'success' : 'primary'}
        className="flex-1"
        disabled={product.stock <= 0}
        icon={inCart ? <Check className="size-3.5" /> : <ShoppingCart className="size-3.5" />}
        onClick={() => cart.add(product, amount)}
      >
        {inCart ? 'Ещё' : 'В корзину'}
      </Button>
    </div>
  );

  if (view === 'list') {
    return (
      <div className="card flex flex-col gap-3 p-3 sm:flex-row sm:items-center">
        <Link to={`/product/${product.id}`} className="shrink-0">
          <ProductImage product={product} className="size-24 sm:size-20" />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-1.5">
            {discount > 0 && <Badge tone="danger" size="sm">−{discount}%</Badge>}
            {product.tags.slice(0, 2).map((tag) => (
              <Badge key={tag} tone="info" size="sm">
                {tag}
              </Badge>
            ))}
          </div>
          <Link
            to={`/product/${product.id}`}
            className="text-sm font-medium text-ink-900 hover:text-brand-700"
          >
            {product.name}
          </Link>
          <p className="mt-0.5 text-xs text-ink-500">
            {product.packSize} · арт. {product.article}
            {supplier && (
              <>
                {' · '}
                <Link to={`/suppliers/${supplier.id}`} className="hover:text-brand-600">
                  {supplier.name}
                </Link>
              </>
            )}
          </p>
          <div className="mt-1">
            <StockLabel product={product} />
          </div>
        </div>
        <div className="flex w-full shrink-0 flex-col gap-2 sm:max-w-[17.5rem] sm:items-end">
          {priceBlock}
          <div className="flex w-full min-w-0 items-center gap-2">
            {favoriteButton}
            {addBlock}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card group relative flex h-full flex-col p-3 transition-shadow hover:shadow-[var(--shadow-hover)]">
      <div className="absolute top-3 right-3 z-10">{favoriteButton}</div>
      <Link to={`/product/${product.id}`} className="relative">
        <ProductImage product={product} className="aspect-square w-full" />
        <div className="absolute top-2 left-2 flex flex-col items-start gap-1">
          {discount > 0 && (
            <Badge tone="danger" size="sm">
              −{discount}%
            </Badge>
          )}
          {product.isNew && (
            <Badge tone="success" size="sm">
              Новинка
            </Badge>
          )}
          {product.tempMode === 'frozen' && (
            <Badge tone="progress" size="sm" icon={<Snowflake className="size-3" />}>
              −18 °C
            </Badge>
          )}
        </div>
      </Link>

      <div className="mt-2.5 flex flex-1 flex-col">
        {priceBlock}
        <Link
          to={`/product/${product.id}`}
          className="mt-1.5 line-clamp-2 min-h-[2.5rem] text-[13px] leading-snug text-ink-800 hover:text-brand-700"
          title={product.name}
        >
          {product.name}
        </Link>
        <p className="mt-1 text-xs text-ink-500">{product.packSize}</p>
        {supplier && (
          <Link
            to={`/suppliers/${supplier.id}`}
            className="mt-1.5 flex items-center gap-1 text-xs text-ink-500 hover:text-brand-600"
          >
            <Truck className="size-3" />
            <span className="truncate">{supplier.name}</span>
          </Link>
        )}
        <div className="mt-1.5">
          <StockLabel product={product} />
        </div>
        <p className="mt-1 text-[11px] text-ink-400">
          Минимум {formatQty(product.minQty, product.unit)}
          {product.step > 1 && `, кратно ${formatQty(product.step, product.unit)}`}
        </p>
        <div className="mt-auto pt-2.5">{addBlock}</div>
      </div>
    </div>
  );
}
