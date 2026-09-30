'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

interface AdminProduct {
  id: number;
  name: string;
  slug: string;
  price: string;
  enabled: boolean;
  local_images: string[];
}

export default function AdminProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 20;

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/admin/products');
      if (res.status === 401) { router.push('/admin'); return; }
      const data = await res.json();
      setProducts(data.products);
      setTotal(data.total);
    } catch { /* empty */ }
    setLoading(false);
  };

  useEffect(() => { fetchProducts(); }, [router]);

  const toggleEnabled = async (id: number) => {
    await fetch('/api/admin/products', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    fetchProducts();
  };

  const deleteProduct = async (id: number, name: string) => {
    if (!confirm(`Удалить «${name}»?`)) return;
    await fetch('/api/admin/products', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    fetchProducts();
  };

  const filtered = search
    ? products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.slug.toLowerCase().includes(search.toLowerCase()))
    : products;
  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-400">Загрузка...</p></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
          <div className="flex items-center gap-6">
            <Link href="/admin/orders" className="flex items-center gap-2">
              <div className="w-7 h-7 bg-black rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xs">M</span>
              </div>
              <span className="font-semibold text-sm">Admin</span>
            </Link>
            <nav className="flex gap-1">
              <Link href="/admin/orders" className="px-3 py-1.5 text-sm font-medium text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">Заказы</Link>
              <Link href="/admin/products" className="px-3 py-1.5 text-sm font-medium bg-gray-900 text-white rounded-lg">Товары</Link>
            </nav>
          </div>
          <Link href="/" className="text-xs text-gray-400 hover:text-black transition-colors">На сайт →</Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Заголовок */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">Товары</h1>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-400">{total} всего</span>
            <a href="/api/export/csv" target="_blank" className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors">
              Экспорт прайс-листа
            </a>
            <Link href="/admin/products/new" className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-black transition-colors">
              + Добавить товар
            </Link>
          </div>
        </div>

        {/* Поиск */}
        <div className="mb-6">
          <input type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                 className="w-full max-w-md px-4 py-2.5 bg-white rounded-xl text-sm border border-gray-200 focus:outline-none focus:border-black"
                 placeholder="Поиск по названию..." />
        </div>

        {/* Таблица */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-4 py-3 font-medium text-gray-400 text-xs">Фото</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-400 text-xs">Название</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-400 text-xs">Цена</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-400 text-xs">Видимость</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-400 text-xs">Действия</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((p) => (
                  <tr key={p.id} className={`border-b border-gray-50 transition-colors ${p.enabled ? 'bg-white' : 'bg-gray-50 opacity-60'}`}>
                    <td className="px-4 py-3">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden relative">
                        <Image src={p.local_images?.[0] || `/images/${p.slug}-1.webp`} alt={p.name} fill className="object-contain p-1" sizes="48px" />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium line-clamp-2 max-w-[250px]">{p.name}</p>
                      <p className="text-xs text-gray-400 font-mono">{p.slug}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium">{p.price} Br</span>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => toggleEnabled(p.id)}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${p.enabled ? 'bg-green-500' : 'bg-gray-300'}`}>
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${p.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                      <span className="text-xs text-gray-400 ml-2">{p.enabled ? 'Виден' : 'Скрыт'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <Link href={`/admin/products/${p.id}/edit`}
                              className="px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors">
                          Изменить
                        </Link>
                        <button onClick={() => deleteProduct(p.id, p.name)}
                                className="px-3 py-1.5 text-xs font-medium bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors">
                          Удалить
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
              <span className="text-xs text-gray-400">
                Показано {(page - 1) * perPage + 1}–{Math.min(page * perPage, filtered.length)} из {filtered.length}
              </span>
              <div className="flex gap-1">
                <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}
                        className="px-3 py-1 text-xs rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-30 transition-colors">←</button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const p = page <= 3 ? i + 1 : page + i - 2;
                  if (p < 1 || p > totalPages) return null;
                  return (
                    <button key={p} onClick={() => setPage(p)}
                            className={`w-8 h-8 text-xs rounded-lg transition-colors ${p === page ? 'bg-gray-900 text-white' : 'border border-gray-200 hover:bg-gray-50'}`}>{p}</button>
                  );
                })}
                <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages}
                        className="px-3 py-1 text-xs rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-30 transition-colors">→</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}