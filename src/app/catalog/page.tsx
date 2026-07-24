import { Suspense } from 'react';
import { getProducts, getCategories, getFilterOptions } from '@/lib/woocommerce';
import ProductCard from '@/components/ProductCard';
import CatalogFilters from '@/components/CatalogFilters';
import type { Metadata } from 'next';
import type { Product } from '@/types';

export const dynamic = 'force-dynamic';

interface CatalogPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({ searchParams }: CatalogPageProps): Promise<Metadata> {
  const params = await searchParams;
  const category = params.category as string;
  const search = params.search as string;

  if (search) return { title: `Поиск: ${search}` };
  if (category) return { title: `Каталог — ${category.charAt(0).toUpperCase() + category.slice(1)}` };
  return { title: 'Каталог телефонов' };
}

export default async function CatalogPage({ searchParams }: CatalogPageProps) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const category = params.category as string;
  const search = params.search as string;
  const sort = (params.sort as string) || 'popularity';

  const toArray = (v: string | string[] | undefined): string[] => {
    if (!v) return [];
    return Array.isArray(v) ? v : [v];
  };

  const priceMin = params.price_min ? Number(params.price_min) : undefined;
  const priceMax = params.price_max ? Number(params.price_max) : undefined;
  const ram = toArray(params.ram);
  const storage = toArray(params.storage);
  const color = toArray(params.color);

  let products: Product[] = [];
  let totalPages = 0;
  let total = 0;
  let categories: { id: number; name: string; slug: string; count: number }[] = [];
  let filterOptions = { ram: [] as string[], storage: [] as string[], color: [] as string[], priceMin: 0, priceMax: 0 };

  try {
    [{ products, totalPages, total }, categories, filterOptions] = await Promise.all([
      getProducts({
        page,
        per_page: 16,
        category,
        search,
        orderby: sort as 'date' | 'price' | 'popularity' | 'title',
        order: sort === 'price' ? 'asc' : 'desc',
        price_min: priceMin,
        price_max: priceMax,
        ram: ram.length > 0 ? ram : undefined,
        storage: storage.length > 0 ? storage : undefined,
        color: color.length > 0 ? color : undefined,
      }),
      getCategories(),
      getFilterOptions(),
    ]);
  } catch {
    // API not configured yet
  }

  const activeCategory = categories.find(c => c.slug === category);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-1">
          {search ? `Результаты: «${search}»` : activeCategory?.name || 'Каталог'}
        </h1>
        <p className="text-sm text-gray-400">{total} товаров</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <Suspense fallback={null}>
          <CatalogFilters
            filterOptions={filterOptions}
            activeCategory={category || ''}
            categories={categories}
            totalProducts={total}
          />
        </Suspense>

        <div className="flex-1 min-w-0">
          {products.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-400 text-lg">Товары не найдены</p>
              <a href="/catalog" className="mt-4 inline-block text-sm text-black underline">
                Показать все товары
              </a>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5 items-stretch">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-10">
                  {page > 1 && (
                    <a href={`/catalog?${new URLSearchParams({
                      ...(category ? { category } : {}),
                      ...(search ? { search } : {}),
                      ...(sort !== 'popularity' ? { sort } : {}),
                      ...(priceMin ? { price_min: String(priceMin) } : {}),
                      ...(priceMax ? { price_max: String(priceMax) } : {}),
                      ...ram.reduce((acc, r) => ({ ...acc, ram: r }), {}),
                      ...storage.reduce((acc, s) => ({ ...acc, storage: s }), {}),
                      ...color.reduce((acc, c) => ({ ...acc, color: c }), {}),
                      page: String(page - 1),
                    }).toString()}`}
                      className="w-10 h-10 flex items-center justify-center text-sm rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                      ←
                    </a>
                  )}

                  {(() => {
                    const maxVisible = 5;
                    let startPage = Math.max(1, page - Math.floor(maxVisible / 2));
                    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
                    if (endPage - startPage + 1 < maxVisible) {
                      startPage = Math.max(1, endPage - maxVisible + 1);
                    }

                    const pages: number[] = [];
                    if (startPage > 1) {
                      pages.push(1);
                      if (startPage > 2) pages.push(-1); // placeholder for ellipsis
                    }
                    for (let i = startPage; i <= endPage; i++) pages.push(i);
                    if (endPage < totalPages) {
                      if (endPage < totalPages - 1) pages.push(-2); // placeholder for ellipsis
                      pages.push(totalPages);
                    }

                    return pages.map((p, idx) => {
                      if (p < 0) {
                        return <span key={`e${idx}`} className="w-10 h-10 flex items-center justify-center text-sm text-gray-400">...</span>;
                      }
                      return (
                        <a
                          key={p}
                          href={`/catalog?${new URLSearchParams({
                            ...(category ? { category } : {}),
                            ...(search ? { search } : {}),
                            ...(sort !== 'popularity' ? { sort } : {}),
                            ...(priceMin ? { price_min: String(priceMin) } : {}),
                            ...(priceMax ? { price_max: String(priceMax) } : {}),
                            ...ram.reduce((acc, r) => ({ ...acc, ram: r }), {}),
                            ...storage.reduce((acc, s) => ({ ...acc, storage: s }), {}),
                            ...color.reduce((acc, c) => ({ ...acc, color: c }), {}),
                            page: String(p),
                          }).toString()}`}
                          className={`w-10 h-10 flex items-center justify-center text-sm rounded-lg transition-colors ${p === page ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                        >
                          {p}
                        </a>
                      );
                    });
                  })()}

                  {page < totalPages && (
                    <a href={`/catalog?${new URLSearchParams({
                      ...(category ? { category } : {}),
                      ...(search ? { search } : {}),
                      ...(sort !== 'popularity' ? { sort } : {}),
                      ...(priceMin ? { price_min: String(priceMin) } : {}),
                      ...(priceMax ? { price_max: String(priceMax) } : {}),
                      ...ram.reduce((acc, r) => ({ ...acc, ram: r }), {}),
                      ...storage.reduce((acc, s) => ({ ...acc, storage: s }), {}),
                      ...color.reduce((acc, c) => ({ ...acc, color: c }), {}),
                      page: String(page + 1),
                    }).toString()}`}
                      className="w-10 h-10 flex items-center justify-center text-sm rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                      →
                    </a>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
