import { Link } from 'react-router-dom';
import { Mail, MapPin, Phone } from 'lucide-react';
import { categories } from '@/data/categories';
import { RoleSwitcher } from './RoleSwitcher';

const columns = [
  {
    title: 'Заказчикам',
    links: [
      ['/catalog', 'Каталог товаров'],
      ['/suppliers', 'Каталог поставщиков'],
      ['/orders', 'Мои заказы и трекинг'],
      ['/favorites', 'Шаблоны закупок'],
      ['/profile', 'Точки и склады'],
    ],
  },
  {
    title: 'Поставщикам',
    links: [
      ['/seller', 'Кабинет поставщика'],
      ['/seller/products', 'Управление каталогом'],
      ['/seller/products/import', 'Импорт CSV'],
      ['/seller/orders', 'Обработка заявок'],
      ['/seller/profile', 'Профиль компании'],
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-10 border-t border-ink-200 bg-white">
      <div className="page grid gap-8 py-10 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-lg bg-brand-600 text-base font-black text-white">
              S
            </span>
            <span className="text-[17px] font-black tracking-tight text-brand-700">SUPL</span>
          </div>
          <p className="mt-3 text-[13px] leading-relaxed text-ink-500">
            B2B-маркетплейс поставок для ресторанов: каталог проверенных поставщиков, заявки,
            трекинг доставки и приёмка на складе в одном окне.
          </p>
          <div className="mt-4 space-y-1.5 text-[13px] text-ink-600">
            <p className="flex items-center gap-2">
              <Phone className="size-3.5 text-ink-400" />
              +7 (800) 550-41-83
            </p>
            <p className="flex items-center gap-2">
              <Mail className="size-3.5 text-ink-400" />
              help@supl.ru
            </p>
            <p className="flex items-center gap-2">
              <MapPin className="size-3.5 text-ink-400" />
              Красноярск, ул. Маерчака, 12
            </p>
          </div>
        </div>

        {columns.map((column) => (
          <div key={column.title}>
            <p className="mb-3 text-sm font-bold text-ink-900">{column.title}</p>
            <ul className="space-y-1.5">
              {column.links.map(([to, label]) => (
                <li key={to}>
                  <Link to={to} className="text-[13px] text-ink-600 hover:text-brand-600">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div>
          <p className="mb-3 text-sm font-bold text-ink-900">Категории</p>
          <ul className="space-y-1.5">
            {categories.slice(0, 7).map((category) => (
              <li key={category.id}>
                <Link
                  to={`/catalog/${category.slug}`}
                  className="text-[13px] text-ink-600 hover:text-brand-600"
                >
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-ink-100 py-4">
        <div className="page flex flex-col gap-2 text-xs text-ink-400 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} SUPL. Демонстрационный проект интерфейса.</p>
          <p>Данные хранятся локально в браузере — можно смело нажимать любые кнопки.</p>
        </div>
      </div>
      <div className="border-t border-ink-100 bg-ink-50 py-4">
        <div className="page flex justify-center">
          <RoleSwitcher />
        </div>
      </div>
    </footer>
  );
}
