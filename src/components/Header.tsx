'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getCartCount } from '@/lib/cart';
import { getCompareCount } from '@/lib/compare';

interface SearchResult {
  name: string;
  slug: string;
  price: string;
  image: string | null;
  type: string;
}

export default function Header() {
  const [cartCount, setCartCount] = useState(0);
  const [compareCount, setCompareCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    const updateCart = () => setCartCount(getCartCount());
    const updateCompare = () => setCompareCount(getCompareCount());
    updateCart();
    updateCompare();
    window.addEventListener('cart-updated', updateCart);
    window.addEventListener('compare-updated', updateCompare);
    return () => {
      window.removeEventListener('cart-updated', updateCart);
      window.removeEventListener('compare-updated', updateCompare);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchInput = (value: string) => {
    setSearchQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.trim().length < 2) {
      setSearchResults([]);
      setSearchOpen(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(value.trim())}`);
        const data = await res.json();
        setSearchResults(data.products);
        setSearchOpen(true);
      } catch {
        setSearchResults([]);
      }
    }, 250);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSearchOpen(false);
      window.location.href = `/catalog?search=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  return (
    <>
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Левая часть: лого + каталог */}
          <div className="flex items-center gap-3 shrink-0">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">P</span>
              </div>
              <span className="text-lg font-semibold tracking-tight hidden sm:block">PanConnect</span>
            </Link>

            <Link href="/catalog" className="flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-gray-900 text-white text-sm font-semibold rounded-lg hover:bg-black transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.75 6h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
              <span className="hidden sm:inline">Каталог</span>
            </Link>
          </div>

          {/* Центр: поиск */}
          <div className="flex-1 max-w-lg mx-4 sm:mx-8 relative" ref={searchRef}>
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchInput(e.target.value)}
                onFocus={() => searchResults.length > 0 && setSearchOpen(true)}
                placeholder="Найти телефон..."
                className="w-full px-4 py-2 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/10 transition-shadow"
              />
              <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
              </button>
            </form>

            {searchOpen && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden z-50 max-h-[420px] overflow-y-auto">
                {searchResults.map((item) => (
                  <Link
                    key={item.slug}
                    href={`/product/${item.slug}`}
                    onClick={() => { setSearchOpen(false); setSearchQuery(''); }}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-12 h-12 bg-gray-50 rounded-lg overflow-hidden relative shrink-0">
                      {item.image ? (
                        <Image src={item.image} alt={item.name} fill className="object-contain p-1" sizes="48px" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                      <p className="text-sm font-semibold text-gray-600">{item.type === 'variable' ? 'от ' : ''}{item.price} Br</p>
                    </div>
                  </Link>
                ))}
                <Link
                  href={`/catalog?search=${encodeURIComponent(searchQuery)}`}
                  onClick={() => { setSearchOpen(false); setSearchQuery(''); }}
                  className="block px-4 py-3 text-sm text-center text-gray-500 hover:bg-gray-50 border-t border-gray-100 font-medium"
                >
                  Показать все результаты →
                </Link>
              </div>
            )}
          </div>

          {/* Правая часть: телефон + мессенджеры + сравнение + корзина */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <a
              href="tel:+375291594597"
              className="hidden lg:flex items-center gap-1.5 text-sm text-gray-600 hover:text-black transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
              </svg>
              <span className="font-medium whitespace-nowrap">+375 (29) 159-45-97</span>
            </a>

            {/* Мессенджеры */}
            <div className="hidden lg:flex items-center gap-1">
              <a href="https://t.me/+375291594597" target="_blank" rel="noopener noreferrer"
                 className="w-7 h-7 flex items-center justify-center rounded-full text-gray-400 hover:text-[#0088cc] hover:bg-blue-50 transition-colors" title="Telegram">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.568 8.16l-1.832 8.64c-.14.62-.508.78-1.024.48l-2.816-2.072-1.36 1.3c-.152.152-.28.28-.576.28l.2-2.88 5.2-4.7c.224-.2-.048-.312-.344-.12l-6.432 4.04-2.776-.868c-.6-.188-.612-.6.124-.888l10.856-4.192c.504-.184.944.124.776.888z"/></svg>
              </a>
              <a href="https://wa.me/375291594597" target="_blank" rel="noopener noreferrer"
                 className="w-7 h-7 flex items-center justify-center rounded-full text-gray-400 hover:text-[#25D366] hover:bg-green-50 transition-colors" title="WhatsApp">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              </a>
              <a href="https://vibr.cc/375291594597" target="_blank" rel="noopener noreferrer"
                 className="w-7 h-7 flex items-center justify-center rounded-full text-gray-400 hover:text-[#7360F2] hover:bg-purple-50 transition-colors" title="Viber">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M11.4 0C7.224 0 3.818 3.406 3.818 7.582v4.436L.59 14.882c-.388.312-.164.882.336.882h2.891c.276 0 .5.224.5.5v2.891c0 .5.67.724.882.336l2.865-4.244h4.336c4.176 0 7.582-3.406 7.582-7.582S15.576 0 11.4 0zm-2.1 4.4c.828 0 1.5.672 1.5 1.5s-.672 1.5-1.5 1.5-1.5-.672-1.5-1.5.672-1.5 1.5-1.5zm4.2 0c.828 0 1.5.672 1.5 1.5s-.672 1.5-1.5 1.5-1.5-.672-1.5-1.5.672-1.5 1.5-1.5zm4.2 2.1c-.552 0-1-.448-1-1s.448-1 1-1 1 .448 1 1-.448 1-1 1z"/></svg>
              </a>
            </div>

            <Link href="/compare" className="relative flex flex-col items-center gap-0.5 p-2 text-gray-600 hover:text-blue-600 transition-colors">
              <div className="relative">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                </svg>
                {compareCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 text-white text-[10px] font-medium rounded-full flex items-center justify-center">
                    {compareCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium hidden sm:block">Сравнение</span>
            </Link>

            <Link href="/cart" className="relative flex flex-col items-center gap-0.5 p-2 text-gray-600 hover:text-black transition-colors">
              <div className="relative">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
                </svg>
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-black text-white text-[10px] font-medium rounded-full flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium hidden sm:block">Корзина</span>
            </Link>
          </div>
        </div>
      </div>
      {/* Навигационная панель */}
      <div className="border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-center gap-4 sm:gap-6 h-10 overflow-x-auto scrollbar-hide">
            <Link href="/delivery" className="text-xs sm:text-sm text-gray-500 hover:text-black transition-colors whitespace-nowrap">Доставка</Link>
            <Link href="/warranty" className="text-xs sm:text-sm text-gray-500 hover:text-black transition-colors whitespace-nowrap">Гарантия</Link>
            <Link href="/contacts" className="text-xs sm:text-sm text-gray-500 hover:text-black transition-colors whitespace-nowrap">Контакты</Link>
            <Link href="/checkout" className="text-xs sm:text-sm text-gray-500 hover:text-black transition-colors whitespace-nowrap">Оформление заказа</Link>
          </div>
        </div>
      </div>
    </header>
  </>
  );
}
