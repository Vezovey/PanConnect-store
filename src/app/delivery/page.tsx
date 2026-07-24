import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Доставка',
  description: 'Условия доставки мобильных телефонов по Минску и Беларуси. Быстрая доставка с гарантией.',
};

export default function DeliveryPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      <nav className="flex items-center gap-2 text-sm text-gray-400 mb-8">
        <Link href="/" className="hover:text-black transition-colors">Главная</Link>
        <span>/</span>
        <span className="text-gray-600">Доставка</span>
      </nav>

      <h1 className="text-3xl font-semibold tracking-tight mb-8">Доставка</h1>

      <div className="prose prose-gray max-w-none space-y-8">
        <section>
          <div className="bg-gray-50 rounded-2xl p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="font-medium">Доставка по Минску — бесплатно</p>
                <p className="text-sm text-gray-500">Курьер привезёт заказ прямо по адресу</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                </svg>
              </div>
              <div>
                <p className="font-medium">Доставка по Беларуси — 20 Br</p>
                <p className="text-sm text-gray-500">Курьерской службой в любой город, до 2 дней</p>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">Как происходит доставка</h2>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 bg-gray-900 text-white rounded-full flex items-center justify-center shrink-0 text-xs font-medium">1</div>
              <p className="text-gray-600 pt-0.5">Вы оформляете заказ на сайте или по телефону</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 bg-gray-900 text-white rounded-full flex items-center justify-center shrink-0 text-xs font-medium">2</div>
              <p className="text-gray-600 pt-0.5">Мы подтверждаем наличие товара и согласовываем детали доставки</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 bg-gray-900 text-white rounded-full flex items-center justify-center shrink-0 text-xs font-medium">3</div>
              <p className="text-gray-600 pt-0.5">Курьер доставляет заказ по указанному адресу</p>
            </div>
          </div>
        </section>

        <section>
          <p className="text-sm text-gray-500">
            Оплата — наличные при получении. Бесплатная доставка по Минску. По Беларуси — 20 руб.
          </p>
        </section>
      </div>
    </div>
  );
}
