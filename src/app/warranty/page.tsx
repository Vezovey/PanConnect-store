import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Гарантия',
  description: 'Условия гарантии и возврата товаров в магазине PanConnect.',
};

export default function WarrantyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      <nav className="flex items-center gap-2 text-sm text-gray-400 mb-8">
        <Link href="/" className="hover:text-black transition-colors">Главная</Link>
        <span>/</span>
        <span className="text-gray-600">Гарантия</span>
      </nav>

      <h1 className="text-3xl font-semibold tracking-tight mb-8">Гарантия и возврат</h1>

      <div className="prose prose-gray max-w-none space-y-8">
        <section>
          <h2 className="text-xl font-semibold mb-4">Гарантийные обязательства</h2>
          <div className="bg-gray-50 rounded-2xl p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-blue-600 font-bold text-sm">12</span>
              </div>
              <div>
                <p className="font-medium">12 месяцев гарантии</p>
                <p className="text-sm text-gray-500">На все новые смартфоны и планшеты</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
              </div>
              <div>
                <p className="font-medium">Официальная гарантия</p>
                <p className="text-sm text-gray-500">Гарантийный талон предоставляется при покупке</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.42 15.17l-5.1-5.1m0 0L11.42 4.97m-5.1 5.1H21M3 3v18" />
                </svg>
              </div>
              <div>
                <p className="font-medium">Ремонт или замена</p>
                <p className="text-sm text-gray-500">В случае поломки — бесплатный ремонт или замена товара</p>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">Возврат и обмен</h2>
          <p className="text-gray-600 leading-relaxed">
            Вы можете вернуть или обменять товар в течение 14 дней с момента покупки при условии сохранения товарного вида,
            упаковки и наличия чека. Возврат денежных средств осуществляется в течение 3 рабочих дней.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">Гарантия не распространяется на:</h2>
          <ul className="space-y-2 text-gray-600">
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 bg-red-400 rounded-full shrink-0 mt-2" />
              Механические повреждения (после падений, ударов, попадания жидкости)
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 bg-red-400 rounded-full shrink-0 mt-2" />
              Повреждения вследствие неправильной эксплуатации
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 bg-red-400 rounded-full shrink-0 mt-2" />
              Самостоятельный ремонт или модификация устройства
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 bg-red-400 rounded-full shrink-0 mt-2" />
              Повреждения, вызванные стихийными бедствиями или скачками напряжения
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">Как оформить гарантийный случай</h2>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 bg-gray-900 text-white rounded-full flex items-center justify-center shrink-0 text-xs font-medium">1</div>
              <p className="text-gray-600 pt-0.5">Свяжитесь с нами по телефону <a href="tel:+375291594597" className="text-black font-medium hover:underline">+375 (29) 159-45-97</a> или в Telegram</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 bg-gray-900 text-white rounded-full flex items-center justify-center shrink-0 text-xs font-medium">2</div>
              <p className="text-gray-600 pt-0.5">Опишите проблему, предоставьте чек или номер заказа</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 bg-gray-900 text-white rounded-full flex items-center justify-center shrink-0 text-xs font-medium">3</div>
              <p className="text-gray-600 pt-0.5">Мы организуем диагностику и ремонт или замену товара</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
