import { cn } from '@/lib/cn';
import type { Product } from '@/types';
import { ProductCard } from './ProductCard';

export function catalogGridClass(columns: 3 | 4 | 5 = 4) {
  return cn(
    'grid grid-cols-2 gap-3 sm:grid-cols-3',
    columns === 4 && 'xl:grid-cols-4',
    columns === 5 && 'xl:grid-cols-5',
  );
}

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
    <div className={cn(catalogGridClass(columns), className)}>
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
  columns = 4,
}: {
  title: string;
  description?: string;
  products: Product[];
  action?: React.ReactNode;
  columns?: 3 | 4 | 5;
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
      <ProductGrid products={products} columns={columns} />
    </section>
  );
}
