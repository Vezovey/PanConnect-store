'use client';

import { useState } from 'react';
import type { Product, ProductVariation } from '@/types';

interface BuyInOneClickProps {
  product: Product;
  variation?: ProductVariation;
}

export default function BuyInOneClick({ product, variation }: BuyInOneClickProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const price = variation?.price || product.price;
  const variantName = variation?.name || '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) { setError('Введите имя'); return; }
    if (!phone.trim() || phone.replace(/\D/g, '').length < 7) { setError('Введите корректный телефон'); return; }

    setSending(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [{
            name: product.name,
            variation: variantName || undefined,
            quantity: 1,
            price: parseFloat(price),
            attributes: variation?.attributes?.map(a => ({ name: a.name, option: a.option })) || [],
          }],
          subtotal: parseFloat(price),
          delivery: 0,
          total: parseFloat(price),
          customer: {
            name: name.trim(),
            phone: phone.trim(),
            city: 'Минск',
            address: 'Заказ в 1 клик',
          },
          source: '1 клик',
          comment: `Заказ в 1 клик. ${variantName ? 'Вариант: ' + variantName : ''}`,
        }),
      });

      if (res.ok) {
        setSent(true);
      } else {
        setError('Ошибка отправки. Попробуйте ещё раз.');
      }
    } catch {
      setError('Ошибка сети. Попробуйте ещё раз.');
    }
    setSending(false);
  };

  const handleClose = () => {
    setOpen(false);
    setSent(false);
    setName('');
    setPhone('');
    setError('');
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full py-3 rounded-xl text-sm font-medium border border-gray-300 text-gray-700 hover:border-gray-900 hover:text-black transition-all"
      >
        Купить в 1 клик
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={handleClose} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            {sent ? (
              <div className="text-center py-4">
                <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-7 h-7 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-1">Заявка отправлена!</h3>
                <p className="text-sm text-gray-500 mb-1">Мы перезвоним вам, чтобы подтвердить покупку</p>
                <p className="text-sm text-gray-500 mb-4">и уточнить детали доставки</p>
                <button onClick={handleClose} className="px-6 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-black transition-colors">
                  Закрыть
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-lg font-semibold">Купить в 1 клик</h3>
                  <button onClick={handleClose} className="p-1 text-gray-400 hover:text-black">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="bg-gray-50 rounded-xl p-3 mb-5 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{product.name}</p>
                    {variantName && <p className="text-xs text-gray-400 truncate">{variantName}</p>}
                  </div>
                  <span className="text-sm font-semibold shrink-0">{price} Br</span>
                </div>

                <form onSubmit={handleSubmit} className="space-y-3">
                  <div>
                    <input
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="Ваше имя"
                      className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm border border-gray-200 focus:outline-none focus:border-black"
                      autoFocus
                    />
                  </div>
                  <div>
                    <input
                      type="tel"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="+375 (XX) XXX-XX-XX"
                      className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm border border-gray-200 focus:outline-none focus:border-black"
                    />
                  </div>

                  {error && <p className="text-xs text-red-500">{error}</p>}

                  <button
                    type="submit"
                    disabled={sending}
                    className="w-full py-3.5 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-black transition-colors disabled:opacity-50"
                  >
                    {sending ? 'Отправка...' : 'Отправить заявку'}
                  </button>

                  <p className="text-[11px] text-gray-400 text-center">
                    Нажимая кнопку, вы соглашаетесь с обработкой персональных данных
                  </p>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
