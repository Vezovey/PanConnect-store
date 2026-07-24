'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getCart, removeFromCart, updateQuantity, getCartTotal, clearCart } from '@/lib/cart';
import type { CartItem } from '@/types';

export default function CartPage() {
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>([]);
  const [total, setTotal] = useState(0);

  const loadCart = () => {
    const cart = getCart();
    setItems(cart);
    setTotal(getCartTotal());
  };

  useEffect(() => {
    const handler = () => loadCart();
    handler();
    window.addEventListener('cart-updated', handler);
    return () => window.removeEventListener('cart-updated', handler);
  }, []);

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20 text-center">
        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
          </svg>
        </div>
        <h1 className="text-2xl font-semibold mb-2">Корзина пуста</h1>
        <p className="text-gray-400 mb-6">Добавьте товары из каталога</p>
        <Link
          href="/catalog"
          className="inline-block px-8 py-3 bg-gray-900 text-white text-sm font-medium rounded-full hover:bg-black transition-colors"
        >
          Перейти в каталог
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <div className="flex items-center justify-between mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Корзина</h1>
        <button
          onClick={() => { clearCart(); loadCart(); }}
          className="text-sm text-gray-400 hover:text-red-500 transition-colors"
        >
          Очистить
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => {
            const price = item.variation
              ? parseFloat(item.variation.price)
              : parseFloat(item.product.price);

            return (
              <div key={`${item.product.id}-${item.variation?.id}`} className="flex gap-4 p-4 bg-gray-50 rounded-2xl">
                <div className="w-24 h-24 bg-white rounded-xl overflow-hidden relative shrink-0">
                  {item.product.images[0] ? (
                    <Image
                      src={item.product.images[0].src}
                      alt={item.product.name}
                      fill
                      className="object-contain p-2"
                      sizes="96px"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <Link href={`/product/${item.product.slug}`} className="text-sm font-medium hover:text-black transition-colors line-clamp-1">
                    {item.product.name}
                  </Link>
                  {item.variation && (
                    <p className="text-xs text-gray-400 mt-1">{item.variation.name}</p>
                  )}
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center bg-white rounded-lg">
                      <button
                        onClick={() => {
                          updateQuantity(item.product.id, item.quantity - 1, item.variation?.id);
                          loadCart();
                        }}
                        className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-black"
                      >
                        −
                      </button>
                      <span className="w-8 text-center text-sm">{item.quantity}</span>
                      <button
                        onClick={() => {
                          updateQuantity(item.product.id, item.quantity + 1, item.variation?.id);
                          loadCart();
                        }}
                        className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-black"
                      >
                        +
                      </button>
                    </div>
                    <span className="text-sm font-semibold">{(price * item.quantity).toFixed(0)} Br</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    removeFromCart(item.product.id, item.variation?.id);
                    loadCart();
                  }}
                  className="self-start p-1 text-gray-300 hover:text-red-500 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            );
          })}
        </div>

        <div className="lg:col-span-1">
          <div className="bg-gray-50 rounded-2xl p-6 sticky top-24">
            <h2 className="text-lg font-medium mb-4">Итого</h2>
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Товаров</span>
                <span>{items.reduce((s, i) => s + i.quantity, 0)} шт.</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Доставка</span>
                <span className="text-green-500">Бесплатно по Минску</span>
              </div>
              <div className="border-t border-gray-200 pt-3 flex justify-between">
                <span className="font-medium">К оплате</span>
                <span className="text-xl font-semibold">{total.toFixed(0)} Br</span>
              </div>
            </div>
            <button
              onClick={() => router.push('/checkout')}
              className="w-full py-3.5 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-black transition-colors"
            >
              Оформить заказ
            </button>
            <Link href="/catalog" className="block text-center text-sm text-gray-400 hover:text-black mt-4 transition-colors">
              Продолжить покупки
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
