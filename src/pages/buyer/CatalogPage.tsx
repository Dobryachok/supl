import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { CategoryIcon } from '@/components/layout/CategoryIcon';
import { categories } from '@/data/categories';
import { withCount } from '@/lib/format';
import { useAppState } from '@/store/AppContext';

export function CatalogPage() {
  const state = useAppState();
  const counts = new Map<string, number>();
  for (const product of state.products) {
    if (!product.isActive) continue;
    counts.set(product.categoryId, (counts.get(product.categoryId) ?? 0) + 1);
    counts.set(product.subcategoryId, (counts.get(product.subcategoryId) ?? 0) + 1);
  }

  return (
    <div className="page pt-5">
      <nav className="flex items-center gap-1.5 text-[13px] text-ink-500">
        <Link to="/" className="hover:text-brand-600">
          Главная
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="text-ink-700">Каталог</span>
      </nav>

      <h1 className="mt-2 text-[28px]">Каталог продуктов и расходников оптом</h1>
      <p className="mt-1.5 max-w-2xl text-sm text-ink-500">
        {withCount(state.products.filter((p) => p.isActive).length, 'товар', 'товара', 'товаров')} от{' '}
        {withCount(state.suppliers.length, 'поставщика', 'поставщиков', 'поставщиков')} с доставкой
        по ресторанным точкам. Цены и остатки обновляются поставщиками.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => (
          <div key={category.id} className="card overflow-hidden">
            <Link
              to={`/catalog/${category.slug}`}
              className="flex items-center gap-4 p-4 transition-colors hover:bg-brand-50/40"
            >
              <span
                className="flex size-16 shrink-0 items-center justify-center rounded-lg"
                style={{
                  background: `linear-gradient(140deg, hsl(${category.hue} 62% 96%), hsl(${category.hue} 48% 88%))`,
                }}
              >
                <CategoryIcon categoryId={category.id} className="size-7" />
              </span>
              <span className="min-w-0">
                <span className="block text-[15px] font-bold text-ink-900">{category.name}</span>
                <span className="mt-0.5 block text-xs text-ink-500">{category.tagline}</span>
                <span className="mt-1 block text-xs text-brand-600">
                  {withCount(counts.get(category.id) ?? 0, 'товар', 'товара', 'товаров')}
                </span>
              </span>
            </Link>
            <ul className="border-t border-ink-100 px-4 py-2.5">
              {category.subcategories.map((sub) => (
                <li key={sub.id}>
                  <Link
                    to={`/catalog/${category.slug}?sub=${sub.slug}`}
                    className="flex items-baseline justify-between gap-2 py-1 text-[13px] text-ink-600 hover:text-brand-600"
                  >
                    <span>{sub.name}</span>
                    <span className="text-xs text-ink-400">{counts.get(sub.id) ?? 0}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
