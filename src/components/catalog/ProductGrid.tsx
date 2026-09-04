import { cn } from '@/lib/cn';
import type { Product } from '@/types';
import { ProductCard } from './ProductCard';

export function ProductGrid({
  products,
  view = 'grid',
  className,
  columns = 4,
}: {
  products: Product[];
  view?: 'grid' | 'list';
  className?: string;
  columns?: 3 | 4 | 5;
}) {
  if (view === 'list') {
    return (
      <div className={cn('flex flex-col gap-2.5', className)}>
        {products.map((product) => (
          <ProductCard key={product.id} product={product} view="list" />
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'grid grid-cols-2 gap-3 sm:grid-cols-3',
        columns === 4 && 'xl:grid-cols-4',
        columns === 5 && 'lg:grid-cols-4 2xl:grid-cols-5',
        className,
      )}
    >
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

export function ProductShelf({
  title,
  description,
  products,
  action,
}: {
  title: string;
  description?: string;
  products: Product[];
  action?: React.ReactNode;
}) {
  if (!products.length) return null;
  return (
    <section className="mt-8">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-[19px]">{title}</h2>
          {description && <p className="mt-0.5 text-[13px] text-ink-500">{description}</p>}
        </div>
        {action}
      </div>
      <div className="scroll-thin -mx-4 flex gap-3 overflow-x-auto px-4 pb-2 lg:mx-0 lg:grid lg:grid-cols-4 lg:overflow-visible lg:px-0 2xl:grid-cols-5">
        {products.map((product) => (
          <div key={product.id} className="w-[220px] shrink-0 lg:w-auto">
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </section>
  );
}
