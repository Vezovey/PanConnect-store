import Link from 'next/link';
import { getProducts, getCategories } from '@/lib/woocommerce';
import ProductCard from '@/components/ProductCard';
import type { Product } from '@/types';

export const dynamic = 'force-dynamic';

export default async function Home() {
  let featuredData = { products: [] as Product[], totalPages: 0, total: 0 };
  let categories: { id: number; name: string; slug: string; count: number }[] = [];

  try {
    [featuredData, categories] = await Promise.all([
      getProducts({ per_page: 8, orderby: 'popularity' }),
      getCategories(),
    ]);
  } catch {
    // API not configured yet
  }

  const phoneCategories = categories.filter(c => c.count > 0).slice(0, 6);

  return (
    <div>
      <section className="relative overflow-hidden bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-20 md:py-32">
          <div className="max-w-2xl">
            <p className="text-xs sm:text-sm font-medium text-gray-400 mb-3 sm:mb-4 tracking-wide uppercase">Новый смартфон с доставкой и гарантией</p>
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-semibold tracking-tight leading-[1.1] mb-4 sm:mb-6">
              Мобильные телефоны<br />
              <span className="text-gray-400">с доставкой на дом</span>
            </h1>
            <p className="text-base sm:text-lg text-gray-500 mb-6 sm:mb-8 max-w-md">
              Доставка по Минску бесплатно. По Беларуси 20 руб до 2 дней. Гарантия 12 месяцев.
            </p>
            <div className="flex gap-4">
              <Link
                href="/catalog"
                className="px-8 py-3.5 bg-gray-900 text-white text-sm font-medium rounded-full hover:bg-black transition-colors"
              >
                Смотреть каталог
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl font-semibold tracking-tight">Популярные товары</h2>
          <Link href="/catalog" className="text-sm text-gray-500 hover:text-black transition-colors">
            Смотреть все →
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 items-stretch">
          {featuredData.products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {phoneCategories.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16 border-t border-gray-100">
          <h2 className="text-2xl font-semibold tracking-tight mb-8">По брендам</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {phoneCategories.map((cat) => (
              <Link
                key={cat.id}
                href={`/catalog?category=${cat.slug}`}
                className="group flex items-center justify-between p-6 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors"
              >
                <div>
                  <h3 className="text-base font-medium">{cat.name}</h3>
                  <p className="text-sm text-gray-400 mt-1">{cat.count} товаров</p>
                </div>
                <svg className="w-5 h-5 text-gray-400 group-hover:text-black transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="bg-gray-900 text-white mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                </svg>
              </div>
              <h3 className="text-sm font-medium mb-2">Доставка</h3>
              <p className="text-sm text-gray-400">Минск — бесплатно, Беларусь — 20 руб</p>
            </div>
            <div>
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
              </div>
              <h3 className="text-sm font-medium mb-2">Гарантия 12 месяцев</h3>
              <p className="text-sm text-gray-400">На все новые товары</p>
            </div>
            <div>
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
                </svg>
              </div>
              <h3 className="text-sm font-medium mb-2">Лучшая цена</h3>
              <p className="text-sm text-gray-400">Проверьте на всех сайтах — мы дешевле</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
