import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-100 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">P</span>
              </div>
              <span className="text-lg font-semibold tracking-tight">PanConnect</span>
            </div>
            <p className="text-sm text-gray-500">
              Магазин мобильных телефонов и аксессуаров
            </p>
          </div>

          <div>
            <h3 className="text-sm font-medium mb-4">Каталог</h3>
            <ul className="space-y-2">
              <li><Link href="/catalog" className="text-sm text-gray-500 hover:text-black transition-colors">Все товары</Link></li>
              <li><Link href="/catalog?category=apple" className="text-sm text-gray-500 hover:text-black transition-colors">Apple</Link></li>
              <li><Link href="/catalog?category=samsung" className="text-sm text-gray-500 hover:text-black transition-colors">Samsung</Link></li>
              <li><Link href="/catalog?category=xiaomi" className="text-sm text-gray-500 hover:text-black transition-colors">Xiaomi</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-medium mb-4">Покупателям</h3>
            <ul className="space-y-2">
              <li><Link href="/delivery" className="text-sm text-gray-500 hover:text-black transition-colors">Доставка</Link></li>
              <li><Link href="/warranty" className="text-sm text-gray-500 hover:text-black transition-colors">Гарантия</Link></li>
              <li><Link href="/contacts" className="text-sm text-gray-500 hover:text-black transition-colors">Контакты</Link></li>
              <li><Link href="/checkout" className="text-sm text-gray-500 hover:text-black transition-colors">Оформление заказа</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-medium mb-4">Контакты</h3>
            <ul className="space-y-2">
              <li className="text-sm text-gray-500">+375 (29) 159-45-97</li>
              <li className="text-sm text-gray-500">Минск, ул. Тимирязева 127</li>
              <li className="flex gap-3 pt-2">
                <a href="https://t.me/+375291594597" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-black transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.568 8.16l-1.832 8.64c-.14.62-.508.78-1.024.48l-2.816-2.072-1.36 1.3c-.152.152-.28.28-.576.28l.2-2.88 5.2-4.7c.224-.2-.048-.312-.344-.12l-6.432 4.04-2.776-.868c-.6-.188-.612-.6.124-.888l10.856-4.192c.504-.184.944.124.776.888z"/></svg>
                </a>
                <a href="https://wa.me/375291594597" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-black transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                </a>
                <a href="https://vibr.cc/375291594597" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-black transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M11.4 0C7.224 0 3.818 3.406 3.818 7.582v4.436L.59 14.882c-.388.312-.164.882.336.882h2.891c.276 0 .5.224.5.5v2.891c0 .5.67.724.882.336l2.865-4.244h4.336c4.176 0 7.582-3.406 7.582-7.582S15.576 0 11.4 0zm-2.1 4.4c.828 0 1.5.672 1.5 1.5s-.672 1.5-1.5 1.5-1.5-.672-1.5-1.5.672-1.5 1.5-1.5zm4.2 0c.828 0 1.5.672 1.5 1.5s-.672 1.5-1.5 1.5-1.5-.672-1.5-1.5.672-1.5 1.5-1.5zm4.2 2.1c-.552 0-1-.448-1-1s.448-1 1-1 1 .448 1 1-.448 1-1 1z"/></svg>
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-200">
          <p className="text-xs text-gray-400 text-center">
            © 2026 PanConnect.by — Мобильные телефоны с гарантией и доставкой по Минску
          </p>
        </div>
      </div>
    </footer>
  );
}
