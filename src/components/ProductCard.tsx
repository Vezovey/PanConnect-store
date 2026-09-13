'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { Product } from '@/types';

import { addToCompare, removeFromCompare, isInCompare } from '@/lib/compare';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const [inCompare, setInCompare] = useState(false);
  const hasDiscount = product.sale_price && product.sale_price !== product.regular_price;
  const image = product.images[0];

  useEffect(() => {
    setInCompare(isInCompare(product.id));
    const handler = () => setInCompare(isInCompare(product.id));
    window.addEventListener('compare-updated', handler);
    return () => window.removeEventListener('compare-updated', handler);
  }, [product.id]);

  const handleCompare = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (inCompare) {
      removeFromCompare(product.id);
    } else {
      addToCompare(product);
    }
  };

  return (
    <Link href={`/shop/${product.slug}`} className="group block grid grid-rows-[1fr_auto] h-full">
      <div className="relative aspect-square bg-gray-50 rounded-2xl overflow-hidden mb-3">
        {/* Изображение */}
        <div className="absolute inset-0 transition-all duration-300 group-hover:brightness-75">
          {image ? (
            <Image
              src={image.src}
              alt={image.alt || product.name}
              fill
              className="object-contain p-4"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
        </div>

        {/* Скидка */}
        {hasDiscount && (
          <span className="absolute top-3 left-3 z-10 bg-red-500 text-white text-[10px] font-medium px-2 py-1 rounded-full">
            -{Math.round(((parseFloat(product.regular_price) - parseFloat(product.sale_price)) / parseFloat(product.regular_price)) * 100)}%
          </span>
        )}

        {/* Под заказ */}
        {product.preorder && (
          <span className="absolute top-3 right-12 z-10 bg-amber-100 text-amber-700 text-[10px] font-medium px-2 py-1 rounded-full">
            Под заказ
          </span>
        )}

        {/* Кнопка сравнения */}
        <button
          onClick={handleCompare}
          className={`absolute top-3 right-3 z-10 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 ${
            inCompare
              ? 'bg-blue-500 text-white shadow-md'
              : 'bg-white text-gray-500 shadow-md hover:bg-blue-500 hover:text-white'
          }`}
          title={inCompare ? 'Убрать из сравнения' : 'Сравнить'}
        >
          <svg className="w-4 h-4" fill={inCompare ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
          </svg>
        </button>
      </div>

      <div className="flex flex-col flex-1">
        <h3 className="text-sm font-medium text-gray-900 line-clamp-2 group-hover:text-black transition-colors">
          {product.name}
        </h3>

        <p className="text-xs text-gray-400 line-clamp-1 mt-1">
          {product.short_description?.replace(/<[^>]*>/g, '').slice(0, 80)}
        </p>

        <div className="flex items-center gap-2 mt-1.5">
          {hasDiscount ? (
            <>
              <span className="text-base font-semibold text-red-500">{product.sale_price} Br</span>
              <span className="text-xs text-gray-400 line-through">{product.regular_price} Br</span>
            </>
          ) : product.price ? (
            <span className="text-base font-semibold">
              {product.type === 'variable' ? `от ${product.price}` : product.price} Br
            </span>
          ) : (
            <span className="text-xs text-gray-400">Цена по запросу</span>
          )}
        </div>

        <button
          className="w-full mt-auto pt-3 py-2.5 bg-gray-900 text-white text-xs font-medium rounded-xl transition-all duration-300 hover:bg-black active:scale-[0.98]"
        >
          Подробнее
        </button>
      </div>
    </Link>
  );
}
