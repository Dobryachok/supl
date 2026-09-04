import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { categories } from '@/data/categories';
import { cn } from '@/lib/cn';
import { useAppState } from '@/store/AppContext';
import { CategoryIcon } from './CategoryIcon';

export function MegaMenu({ onNavigate }: { onNavigate: () => void }) {
  const [activeId, setActiveId] = useState(categories[0].id);
  const state = useAppState();
  const active = categories.find((c) => c.id === activeId) ?? categories[0];
  const counts = new Map<string, number>();
  for (const product of state.products) {
    if (!product.isActive) continue;
    counts.set(product.subcategoryId, (counts.get(product.subcategoryId) ?? 0) + 1);
    counts.set(product.categoryId, (counts.get(product.categoryId) ?? 0) + 1);
  }

  return (
    <div className="animate-fade-in absolute top-full left-0 z-40 mt-1 flex w-[min(980px,calc(100vw-32px))] overflow-hidden rounded-xl border border-ink-200 bg-white shadow-[var(--shadow-pop)]">
      <ul className="scroll-thin max-h-[420px] w-[300px] shrink-0 overflow-y-auto border-r border-ink-100 py-2">
        {categories.map((category) => (
          <li key={category.id}>
            <Link
              to={`/catalog/${category.slug}`}
              onMouseEnter={() => setActiveId(category.id)}
              onClick={onNavigate}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2 text-sm transition-colors',
                activeId === category.id
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-ink-700 hover:bg-ink-50',
              )}
            >
              <CategoryIcon categoryId={category.id} className="size-4 shrink-0" />
              <span className="flex-1 leading-tight">{category.name}</span>
              <span className="text-xs text-ink-400">{counts.get(category.id) ?? 0}</span>
              <ChevronRight className="size-3.5 text-ink-300" />
            </Link>
          </li>
        ))}
      </ul>
      <div className="flex-1 p-5">
        <Link
          to={`/catalog/${active.slug}`}
          onClick={onNavigate}
          className="text-base font-bold text-ink-900 hover:text-brand-600"
        >
          {active.name}
        </Link>
        <p className="mt-0.5 text-xs text-ink-500">{active.tagline}</p>
        <ul className="mt-4 grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
          {active.subcategories.map((sub) => (
            <li key={sub.id}>
              <Link
                to={`/catalog/${active.slug}?sub=${sub.slug}`}
                onClick={onNavigate}
                className="flex items-baseline justify-between gap-2 rounded-md px-2 py-1.5 text-sm text-ink-700 hover:bg-ink-50 hover:text-brand-700"
              >
                <span>{sub.name}</span>
                <span className="text-xs text-ink-400">{counts.get(sub.id) ?? 0}</span>
              </Link>
            </li>
          ))}
        </ul>
        <Link
          to="/suppliers"
          onClick={onNavigate}
          className="mt-5 inline-flex items-center gap-1.5 text-[13px] font-medium text-brand-600 hover:underline"
        >
          Все поставщики категории
          <ChevronRight className="size-3.5" />
        </Link>
      </div>
    </div>
  );
}
