import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getProductBySlug, getProductVariations } from '@/lib/woocommerce';
import AddToCartButton from './AddToCartButton';
import BuyInOneClick from './BuyInOneClick';
import CompareButton from './CompareButton';
import ProductGallery from './ProductGallery';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: 'Товар не найден' };

  return {
    title: product.name,
    description: product.short_description?.replace(/<[^>]*>/g, '').slice(0, 160),
    openGraph: {
      title: product.name,
      description: product.short_description?.replace(/<[^>]*>/g, ''),
      images: product.images[0]?.src ? [{ url: product.images[0].src }] : [],
    },
  };
}

function parseSpecs(html: string): { label: string; value: string; isSection?: boolean }[] {
  if (!html) return [];
  // Normalize literal \r\n to real newlines
  const normalized = html.replace(/\\r\\n/g, '\n').replace(/\\n/g, '\n');
  const specs: { label: string; value: string; isSection?: boolean }[] = [];

  // Try div format
  const divBlocks = normalized.split(/<div class="my_div[12]">/i).slice(1);
  for (const block of divBlocks) {
    const item1Match = block.match(/<div class="my_item1">([\s\S]*?)<\/div>/i);
    const item2Match = block.match(/<div class="my_item2">([\s\S]*?)<\/div>/i);
    if (item1Match) {
      const label = item1Match[1].replace(/<[^>]*>/g, '').trim();
      const value = item2Match ? item2Match[1].replace(/<[^>]*>/g, '').trim() : '';
      if (label) {
        const isSection = /<strong>/.test(item1Match[1]) && !value;
        specs.push({ label, value, isSection });
      }
    }
  }

  // Fallback: try table format
  if (specs.length === 0 && normalized.includes('<table')) {
    const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
    const tdRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
    let trMatch;
    while ((trMatch = trRegex.exec(normalized)) !== null) {
      const cells: string[] = [];
      let tdMatch;
      while ((tdMatch = tdRegex.exec(trMatch[1])) !== null) {
        cells.push(tdMatch[1].replace(/<[^>]*>/g, '').trim());
      }
      if (cells.length >= 2 && cells[0] && cells[1]) {
        specs.push({ label: cells[0], value: cells[1] });
      }
    }
  }

  return specs;
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;

  let product;
  try {
    product = await getProductBySlug(slug);
  } catch {
    notFound();
  }
  if (!product) notFound();

  const variations = await getProductVariations(slug);
  const hasDiscount = product.sale_price && product.sale_price !== product.regular_price;
  const hasVariations = variations.length > 0;
  const priceLabel = hasVariations ? `от ${product.price}` : product.price;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 overflow-hidden">
      <nav className="hidden sm:flex items-center gap-2 text-sm text-gray-400 mb-6 sm:mb-8">
        <Link href="/" className="hover:text-black transition-colors">Главная</Link>
        <span>/</span>
        <Link href="/catalog" className="hover:text-black transition-colors">Каталог</Link>
        <span>/</span>
        <span className="text-gray-600 truncate">{product.name}</span>
      </nav>

      <div className="grid md:grid-cols-2 gap-6 lg:gap-12">
        {/* Галерея */}
        <div className="overflow-hidden min-w-0">
          <ProductGallery images={product.images} productName={product.name} />
        </div>

        {/* Информация */}
        <div className="flex flex-col">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-3 sm:mb-4">{product.name}</h1>

          <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-5 flex-wrap">
            {hasDiscount ? (
              <>
                <span className="text-2xl sm:text-3xl font-semibold text-red-500">{product.sale_price} Br</span>
                <span className="text-base sm:text-lg text-gray-400 line-through">{product.regular_price} Br</span>
                <span className="bg-red-50 text-red-500 text-xs font-medium px-2 py-1 rounded-full">
                  -{Math.round(((parseFloat(product.regular_price) - parseFloat(product.sale_price)) / parseFloat(product.regular_price)) * 100)}%
                </span>
              </>
            ) : hasVariations ? (
              <span className="text-2xl sm:text-3xl font-semibold">{priceLabel} Br</span>
            ) : product.price ? (
              <span className="text-2xl sm:text-3xl font-semibold">{product.price} Br</span>
            ) : (
              <span className="text-lg text-gray-400">Цена по запросу</span>
            )}
          </div>

          {product.preorder && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-700 text-sm rounded-lg mb-4 w-fit">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Под заказ
            </div>
          )}

          {product.short_description && (
            <p className="text-sm text-gray-500 mb-5 leading-relaxed">
              {product.short_description.replace(/<[^>]*>/g, '')}
            </p>
          )}

          <div className="mt-auto space-y-2.5">
            <AddToCartButton product={product} variations={variations} />
            <BuyInOneClick product={product} variation={variations[0]} />
            <CompareButton product={product} />
          </div>

          {product.categories.length > 0 && (
            <div className="mt-5 pt-5 border-t border-gray-100 flex items-center gap-2 text-xs text-gray-400">
              <span>Категории:</span>
              {product.categories.map((cat, i) => (
                <span key={cat.id}>
                  <Link href={`/catalog?category=${cat.slug}`} className="text-gray-500 hover:text-black transition-colors">{cat.name}</Link>
                  {i < product.categories.length - 1 && <span>, </span>}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Характеристики */}
      {(() => {
        const allSpecs = product.specs && product.specs.length > 0 ? product.specs : parseSpecs(product.description);
        if (allSpecs.length === 0 && !product.description) return null;
        return (
          <div className="mt-12 sm:mt-16">
            <h2 className="text-xl sm:text-2xl font-semibold tracking-tight mb-4 sm:mb-6">Характеристики</h2>
            {allSpecs.length > 0 ? (
              <div className="bg-gray-50 rounded-2xl overflow-hidden">
                <table className="w-full text-sm">
                  <tbody>
                    {allSpecs.map((row, i) => {
                      if ('isSection' in row && row.isSection) {
                        return (
                          <tr key={i}>
                            <td colSpan={2} className="px-4 sm:px-5 py-3 sm:py-3.5 font-semibold text-gray-900 bg-gray-100">
                              {row.label}
                            </td>
                          </tr>
                        );
                      }
                      return (
                        <tr key={i} className={i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                          <td className="px-4 sm:px-5 py-3 sm:py-3.5 text-gray-500 w-[40%]">{row.label}</td>
                          <td className="px-4 sm:px-5 py-3 sm:py-3.5 font-medium text-gray-900">{row.value}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div
                className="text-sm text-gray-600 leading-relaxed prose prose-sm overflow-hidden break-words"
                dangerouslySetInnerHTML={{ __html: product.description }}
              />
            )}
          </div>
        );
      })()}
    </div>
  );
}
