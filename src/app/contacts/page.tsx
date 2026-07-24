import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Контакты',
  description: 'Контактная информация магазина PanConnect. Телефон, Telegram, WhatsApp, адрес.',
};

export default function ContactsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      <nav className="flex items-center gap-2 text-sm text-gray-400 mb-8">
        <Link href="/" className="hover:text-black transition-colors">Главная</Link>
        <span>/</span>
        <span className="text-gray-600">Контакты</span>
      </nav>

      <h1 className="text-3xl font-semibold tracking-tight mb-8">Контакты</h1>

      <div className="grid sm:grid-cols-2 gap-6 mb-10">
        <div className="bg-gray-50 rounded-2xl p-6">
          <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center mb-4">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
            </svg>
          </div>
          <h3 className="font-medium mb-1">Телефон</h3>
          <a href="tel:+375291594597" className="text-lg font-semibold hover:underline">+375 (29) 159-45-97</a>
          <p className="text-sm text-gray-500 mt-1">Ежедневно с 9:00 до 21:00</p>
        </div>

        <div className="bg-gray-50 rounded-2xl p-6">
          <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center mb-4">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
            </svg>
          </div>
          <h3 className="font-medium mb-3">Мессенджеры</h3>
          <div className="flex gap-3">
            <a href="https://t.me/+375291594597" target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors">
              Telegram
            </a>
            <a href="https://wa.me/375291594597" target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-green-500 text-white text-sm font-medium rounded-lg hover:bg-green-600 transition-colors">
              WhatsApp
            </a>
            <a href="https://vibr.cc/375291594597" target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-purple-500 text-white text-sm font-medium rounded-lg hover:bg-purple-600 transition-colors">
              Viber
            </a>
          </div>
        </div>

        <div className="bg-gray-50 rounded-2xl p-6">
          <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center mb-4">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
            </svg>
          </div>
          <h3 className="font-medium mb-1">Адрес</h3>
          <p className="text-gray-600">г. Минск, ул. Тимирязева 127</p>
          <p className="text-sm text-gray-500 mt-1">Радиомаркет Ждановичи</p>
        </div>

        <div className="bg-gray-50 rounded-2xl p-6">
          <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center mb-4">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="font-medium mb-1">Режим работы</h3>
          <p className="text-gray-600">Пн–Вс: 9:00 – 21:00</p>
          <p className="text-sm text-gray-500 mt-1">Без выходных</p>
        </div>
      </div>

      <div className="bg-gray-900 text-white rounded-2xl p-8 text-center">
        <h2 className="text-xl font-semibold mb-2">Есть вопросы?</h2>
        <p className="text-gray-400 mb-6">Напишите нам — ответим за 5 минут в рабочее время</p>
        <a
          href="https://t.me/+375291594597"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-3 bg-white text-gray-900 text-sm font-medium rounded-full hover:bg-gray-100 transition-colors"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.568 8.16l-1.832 8.64c-.14.62-.508.78-1.024.48l-2.816-2.072-1.36 1.3c-.152.152-.28.28-.576.28l.2-2.88 5.2-4.7c.224-.2-.048-.312-.344-.12l-6.432 4.04-2.776-.868c-.6-.188-.612-.6.124-.888l10.856-4.192c.504-.184.944.124.776.888z"/></svg>
          Написать в Telegram
        </a>
      </div>
    </div>
  );
}
