'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface FilterOptions {
  ram: string[];
  storage: string[];
  color: string[];
  priceMin: number;
  priceMax: number;
}

interface CatalogFiltersProps {
  filterOptions: FilterOptions;
  activeCategory: string;
  categories: { id: number; name: string; slug: string; count: number }[];
  totalProducts: number;
}

export default function CatalogFilters({ filterOptions, activeCategory, categories, totalProducts }: CatalogFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [priceFrom, setPriceFrom] = useState(searchParams.get('price_min') || '');
  const [priceTo, setPriceTo] = useState(searchParams.get('price_max') || '');
  const [selectedRam, setSelectedRam] = useState<string[]>(searchParams.getAll('ram'));
  const [selectedStorage, setSelectedStorage] = useState<string[]>(searchParams.getAll('storage'));
  const [sort, setSort] = useState(searchParams.get('sort') || 'popularity');
  const [mobileOpen, setMobileOpen] = useState(false);

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  useEffect(() => {
    if (!mobileOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMobile();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [mobileOpen, closeMobile]);

  const buildUrl = (overrides: Record<string, string | string[] | undefined | null>) => {
    const p = new URLSearchParams();

    const cat = ('category' in overrides ? overrides.category : searchParams.get('category')) as string | null;
    if (cat) p.set('category', cat);

    const srch = ('search' in overrides ? overrides.search : searchParams.get('search')) as string | null;
    if (srch) p.set('search', srch);

    const s = 'sort' in overrides ? (overrides.sort as string) : sort;
    if (s && s !== 'popularity') p.set('sort', s);

    const pf = 'price_min' in overrides ? (overrides.price_min as string) : priceFrom;
    if (pf) p.set('price_min', pf);

    const pt = 'price_max' in overrides ? (overrides.price_max as string) : priceTo;
    if (pt) p.set('price_max', pt);

    const r = 'ram' in overrides ? (overrides.ram as string[]) : selectedRam;
    if (r && r.length > 0) r.forEach(v => p.append('ram', v));

    const st = 'storage' in overrides ? (overrides.storage as string[]) : selectedStorage;
    if (st && st.length > 0) st.forEach(v => p.append('storage', v));

    return `/catalog?${p.toString()}`;
  };

  const applyFilters = () => {
    setMobileOpen(false);
    router.push(buildUrl({}));
  };

  const clearAll = () => {
    const p = new URLSearchParams();
    const cat = searchParams.get('category');
    const srch = searchParams.get('search');
    if (cat) p.set('category', cat);
    if (srch) p.set('search', srch);
    router.push(`/catalog?${p.toString()}`);
  };

  const hasActiveFilters = priceFrom || priceTo || selectedRam.length > 0 || selectedStorage.length > 0;

  const sidebarContent = (
    <div className="space-y-6">
      {/* Категории */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Категории</h3>
        <div className="space-y-1">
          <button
            onClick={() => router.push(buildUrl({ category: null }))}
            className={`block w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${!activeCategory ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            Все товары
            <span className="ml-1.5 text-xs opacity-50">{totalProducts}</span>
          </button>
          {categories.filter(c => c.count > 0).map((cat) => (
            <button
              key={cat.id}
              onClick={() => router.push(buildUrl({ category: cat.slug }))}
              className={`block w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${activeCategory === cat.slug ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              {cat.name}
              <span className="ml-1.5 text-xs opacity-50">{cat.count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Цена */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Цена, Br</h3>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder={`${filterOptions.priceMin}`}
            value={priceFrom}
            onChange={(e) => setPriceFrom(e.target.value)}
            className="w-full px-3 py-2 bg-gray-50 rounded-lg text-sm border border-gray-200 focus:outline-none focus:border-black"
          />
          <span className="text-gray-400">—</span>
          <input
            type="number"
            placeholder={`${filterOptions.priceMax}`}
            value={priceTo}
            onChange={(e) => setPriceTo(e.target.value)}
            className="w-full px-3 py-2 bg-gray-50 rounded-lg text-sm border border-gray-200 focus:outline-none focus:border-black"
          />
        </div>
      </div>

      {/* Оперативная память */}
      {filterOptions.ram.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Оперативная память</h3>
          <div className="flex flex-wrap gap-2">
            {filterOptions.ram.map((ram) => (
              <button
                key={ram}
                onClick={() => setSelectedRam(prev => prev.includes(ram) ? prev.filter(x => x !== ram) : [...prev, ram])}
                className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                  selectedRam.includes(ram)
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                }`}
              >
                {ram}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Встроенная память */}
      {filterOptions.storage.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Память</h3>
          <div className="flex flex-wrap gap-2">
            {filterOptions.storage.map((st) => (
              <button
                key={st}
                onClick={() => setSelectedStorage(prev => prev.includes(st) ? prev.filter(x => x !== st) : [...prev, st])}
                className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                  selectedStorage.includes(st)
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Кнопки */}
      <div className="flex gap-2 pt-2">
        <button
          onClick={applyFilters}
          className="flex-1 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-black transition-colors"
        >
          Применить
        </button>
        {hasActiveFilters && (
          <button
            onClick={clearAll}
            className="px-4 py-2.5 text-sm text-gray-500 hover:text-red-500 rounded-xl border border-gray-200 hover:border-red-200 transition-colors"
          >
            Сбросить
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Мобильная кнопка фильтров */}
      <div className="lg:hidden mb-4">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="w-full flex items-center justify-center gap-2 py-3 bg-gray-50 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
          </svg>
          Фильтры
          {hasActiveFilters && (
            <span className="w-5 h-5 bg-black text-white text-[10px] font-medium rounded-full flex items-center justify-center">
              {[priceFrom, priceTo, ...selectedRam, ...selectedStorage].filter(Boolean).length}
            </span>
          )}
        </button>
      </div>

      {/* Мобильный оверлей */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-[100]">
          <div className="absolute inset-0 bg-black/40" onClick={closeMobile} />
          <div className="absolute right-0 top-0 bottom-0 w-80 bg-white p-6 overflow-y-auto animate-slide-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Фильтры</h2>
              <button onClick={closeMobile} className="p-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Десктопный сайдбар */}
      <aside className="hidden lg:block w-64 shrink-0">
        <div className="sticky top-24">
          {/* Сортировка */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Сортировка</h3>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              onBlur={applyFilters}
              className="w-full px-3 py-2.5 bg-gray-50 rounded-xl text-sm border border-gray-200 focus:outline-none focus:border-black"
            >
              <option value="popularity">По популярности</option>
              <option value="date">По новизне</option>
              <option value="price">По цене</option>
            </select>
          </div>
          {sidebarContent}
        </div>
      </aside>
    </>
  );
}
