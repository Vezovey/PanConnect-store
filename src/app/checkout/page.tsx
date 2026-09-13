'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getCart, getCartTotal, clearCart } from '@/lib/cart';
import type { CartItem } from '@/types';

interface FormData {
  name: string;
  phone: string;
  city: string;
  address: string;
  comment: string;
}

const DELIVERY_MINSK = 0;
const DELIVERY_OTHER = 20;

const CITIES = [
  'Минск',
  'Брест',
  'Витебск',
  'Гомель',
  'Гродно',
  'Могилёв',
];

export default function CheckoutPage() {
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>([]);
  const [subtotal, setSubtotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState<FormData>({
    name: '',
    phone: '',
    city: 'Минск',
    address: '',
    comment: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  const deliveryCost = form.city === 'Минск' ? DELIVERY_MINSK : DELIVERY_OTHER;
  const total = subtotal + deliveryCost;

  useEffect(() => {
    const cart = getCart();
    if (cart.length === 0) {
      router.push('/cart');
      return;
    }
    setItems(cart);
    setSubtotal(getCartTotal());
  }, [router]);

  const validate = (): boolean => {
    const e: Partial<Record<keyof FormData, string>> = {};
    if (!form.name.trim()) e.name = 'Введите имя';
    if (!form.phone.trim()) e.phone = 'Введите телефон';
    else if (!/^[\d\+\-\(\)\s]{7,}$/.test(form.phone.trim())) e.phone = 'Некорректный телефон';
    if (!form.city) e.city = 'Выберите город';
    if (!form.address.trim()) e.address = 'Введите адрес доставки';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);

    localStorage.setItem('panconnect-last-order', JSON.stringify({
      items,
      total,
      delivery: deliveryCost,
      form: { name: form.name, phone: form.phone, city: form.city, address: form.address },
      date: new Date().toISOString(),
    }));

    try {
      await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map(item => ({
            name: item.product.name,
            variation: item.variation?.name,
            quantity: item.quantity,
            price: item.variation ? parseFloat(item.variation.price) : parseFloat(item.product.price),
            attributes: item.variation?.attributes?.map(a => ({ name: a.name, option: a.option })) || [],
          })),
          subtotal,
          delivery: deliveryCost,
          total,
          customer: { name: form.name, phone: form.phone, city: form.city, address: form.address },
          comment: form.comment || undefined,
        }),
      });
    } catch { /* empty */ }

    clearCart();
    setSubmitted(true);
    setLoading(false);
  };

  if (submitted) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20 text-center">
        <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <h1 className="text-2xl font-semibold mb-2">Заказ оформлен!</h1>
        <p className="text-gray-400 mb-1">Мы перезвоним вам, чтобы подтвердить покупку</p>
        <p className="text-gray-400 mb-2">и уточнить детали доставки.</p>
        <p className="text-sm text-gray-400 mb-6">Сумма: <span className="font-semibold text-gray-900">{total.toFixed(0)} Br</span></p>
        <div className="flex justify-center gap-4">
          <Link href="/catalog" className="px-8 py-3 bg-gray-900 text-white text-sm font-medium rounded-full hover:bg-black transition-colors">
            Продолжить покупки
          </Link>
          <Link href="/" className="px-8 py-3 bg-white text-gray-900 text-sm font-medium rounded-full border border-gray-200 hover:border-gray-300 transition-colors">
            На главную
          </Link>
        </div>
      </div>
    );
  }

  if (items.length === 0) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6 sm:mb-8">
        <Link href="/cart" className="hover:text-black transition-colors">Корзина</Link>
        <span>/</span>
        <span className="text-gray-600">Оформление заказа</span>
      </nav>

      <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-6 sm:mb-8">Оформление заказа</h1>

      <form onSubmit={handleSubmit}>
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-gray-50 rounded-2xl p-6">
              <h2 className="text-lg font-medium mb-4">Контактные данные</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-500 mb-1 block">Имя *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className={`w-full px-4 py-3 bg-white rounded-xl text-sm border ${errors.name ? 'border-red-400' : 'border-gray-200'} focus:outline-none focus:border-black`}
                    placeholder="Ваше имя"
                  />
                  {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                </div>
                <div>
                  <label className="text-sm text-gray-500 mb-1 block">Телефон *</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className={`w-full px-4 py-3 bg-white rounded-xl text-sm border ${errors.phone ? 'border-red-400' : 'border-gray-200'} focus:outline-none focus:border-black`}
                    placeholder="+375 (XX) XXX-XX-XX"
                  />
                  {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-2xl p-6">
              <h2 className="text-lg font-medium mb-4">Доставка</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-500 mb-1 block">Город *</label>
                  <select
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    className={`w-full px-4 py-3 bg-white rounded-xl text-sm border ${errors.city ? 'border-red-400' : 'border-gray-200'} focus:outline-none focus:border-black`}
                  >
                    {CITIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  {errors.city && <p className="text-xs text-red-500 mt-1">{errors.city}</p>}
                </div>
                <div>
                  <label className="text-sm text-gray-500 mb-1 block">Адрес доставки *</label>
                  <input
                    type="text"
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    className={`w-full px-4 py-3 bg-white rounded-xl text-sm border ${errors.address ? 'border-red-400' : 'border-gray-200'} focus:outline-none focus:border-black`}
                    placeholder="ул. ..., д. ..., кв. ..."
                  />
                  {errors.address && <p className="text-xs text-red-500 mt-1">{errors.address}</p>}
                </div>
              </div>
              <div className="mt-4">
                <label className="text-sm text-gray-500 mb-1 block">Комментарий к заказу</label>
                <textarea
                  value={form.comment}
                  onChange={(e) => setForm({ ...form, comment: e.target.value })}
                  className="w-full px-4 py-3 bg-white rounded-xl text-sm border border-gray-200 focus:outline-none focus:border-black resize-none"
                  rows={3}
                  placeholder="Пожелания по доставке, время и т.д."
                />
              </div>

              <div className="mt-4 p-4 bg-white rounded-xl border border-gray-200">
                <div className="flex items-center gap-2 text-sm">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                  </svg>
                  <span className="text-gray-500">Доставка:</span>
                  <span className={`font-medium ${deliveryCost === 0 ? 'text-green-500' : ''}`}>
                    {deliveryCost === 0 ? 'Бесплатно по Минску' : `${deliveryCost} Br по Беларуси`}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-gray-50 rounded-2xl p-6 sticky top-24">
              <h2 className="text-lg font-medium mb-4">Ваш заказ</h2>
              <div className="space-y-3 mb-6 max-h-64 overflow-y-auto">
                {items.map((item) => {
                  const price = item.variation
                    ? parseFloat(item.variation.price)
                    : parseFloat(item.product.price);
                  return (
                    <div key={`${item.product.id}-${item.variation?.id}`} className="flex gap-3">
                      <div className="w-14 h-14 bg-white rounded-lg overflow-hidden relative shrink-0">
                        {item.product.images[0] ? (
                          <Image src={item.product.images[0].src} alt={item.product.name} fill className="object-contain p-1" sizes="56px" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium line-clamp-2">{item.product.name}</p>
                        <p className="text-xs text-gray-400">× {item.quantity}</p>
                      </div>
                      <span className="text-xs font-semibold shrink-0">{(price * item.quantity).toFixed(0)} Br</span>
                    </div>
                  );
                })}
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Товаров</span>
                  <span>{items.reduce((s, i) => s + i.quantity, 0)} шт.</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Товары</span>
                  <span>{subtotal.toFixed(0)} Br</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Доставка</span>
                  <span className={deliveryCost === 0 ? 'text-green-500' : ''}>
                    {deliveryCost === 0 ? 'Бесплатно' : `${deliveryCost} Br`}
                  </span>
                </div>
                <div className="border-t border-gray-200 pt-3 flex justify-between">
                  <span className="font-medium">К оплате</span>
                  <span className="text-xl font-semibold">{total.toFixed(0)} Br</span>
                </div>
              </div>

              <div className="mb-4 p-3 bg-white rounded-xl border border-gray-200">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
                  </svg>
                  Оплата наличными при получении
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-black transition-colors disabled:opacity-50"
              >
                {loading ? 'Отправка...' : 'Подтвердить заказ'}
              </button>
              <Link href="/cart" className="block text-center text-sm text-gray-400 hover:text-black mt-4 transition-colors">
                Вернуться в корзину
              </Link>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
